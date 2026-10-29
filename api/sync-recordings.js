const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const DEFAULT_FOLDER_ID = '1OHR3g8GWBaVNAa7kB6aRdk-WYmCngWh_';

let CALL_LOGS_FILE = path.join(__dirname, '..', 'call_logs.json');
try {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || !fs.existsSync(path.join(__dirname, '..'))) {
    CALL_LOGS_FILE = path.join('/tmp', 'call_logs.json');
  }
} catch(e) {}

function fetchDriveFolderHTML(folderId) {
  return new Promise((resolve, reject) => {
    const fetchUrl = `https://drive.google.com/drive/folders/${folderId}?usp=sharing`;
    https.get(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseDriveRecordings(html) {
  const recordings = [];
  const ivdMatch = html.match(/_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  if (!ivdMatch) return recordings;

  try {
    const unescaped = ivdMatch[1].replace(/\\x([0-9A-Fa-f]{2})/g, (m, hex) => String.fromCharCode(parseInt(hex, 16)));
    const parsed = JSON.parse(unescaped);
    if (!Array.isArray(parsed[0])) return recordings;

    parsed[0].forEach(it => {
      const id = it[0];
      const name = it[2] || '';
      const size = it[13] || 0;
      if (!name.endsWith('.m4a') && !name.endsWith('.mp3')) return;

      // Extract phone number and timestamp from Samsung call recording format
      // Example: "Call recording +917508648100_261029_142818.m4a"
      // Or: "Call recording Manga khan meta_261026_130000.m4a"
      const dateMatch = name.match(/_(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\.m4a$/i);
      let isoTimestamp = null;
      let yymmdd = '';
      if (dateMatch) {
        const [_, yy, mm, dd, hh, min, ss] = dateMatch;
        yymmdd = `20${yy}-${mm}-${dd}`;
        // Approximate IST timestamp (UTC+5:30)
        const d = new Date(`20${yy}-${mm}-${dd}T${hh}:${min}:${ss}+05:30`);
        if (!isNaN(d.getTime())) isoTimestamp = d.toISOString();
      }

      // Phone number extraction
      let phoneDigits = '';
      const phoneMatch = name.match(/(\+?91)?(\d{10})/);
      if (phoneMatch) {
        phoneDigits = phoneMatch[2];
      }

      recordings.push({
        id,
        name,
        size,
        phone: phoneDigits ? `+91${phoneDigits}` : '',
        phoneDigits,
        timestamp: isoTimestamp,
        yymmdd,
        audioUrl: `/api/call-audio?id=${id}`,
        approxDuration: Math.max(10, Math.round(size / 13000))
      });
    });
  } catch(e) {
    console.error('Error parsing _DRIVE_ivd:', e);
  }
  return recordings;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  let folderId = parsedUrl.query.folderId || parsedUrl.query.folder_id || (req.body && req.body.folderId) || DEFAULT_FOLDER_ID;

  // Clean folder ID if full drive URL was passed
  const folderMatch = folderId.match(/folders\/([A-Za-z0-9_-]{20,})/);
  if (folderMatch) folderId = folderMatch[1];

  try {
    const html = await fetchDriveFolderHTML(folderId);
    const driveRecs = parseDriveRecordings(html);

    // Read stored calls
    let calls = [];
    try {
      if (fs.existsSync(CALL_LOGS_FILE)) {
        calls = JSON.parse(fs.readFileSync(CALL_LOGS_FILE, 'utf8'));
      }
    } catch(e) {
      calls = [];
    }

    let attachedCount = 0;
    const CUTOFF_DATE = new Date('2026-10-20T00:00:00.000Z').getTime();

    driveRecs.forEach(rec => {
      // Find matching call by phone or time
      let matchedCall = null;

      if (rec.phoneDigits && rec.phoneDigits.length === 10) {
        matchedCall = calls.find(c => {
          const cNum = String(c.caller_number || c.phone || '').replace(/\D/g, '').slice(-10);
          if (cNum !== rec.phoneDigits) return false;
          // If timestamp exists, compare within 24 hours or date
          if (rec.timestamp && (c.created_at || c.timestamp || c.time)) {
            const recTime = new Date(rec.timestamp).getTime();
            const callTime = new Date(c.created_at || c.timestamp || c.time).getTime();
            return Math.abs(recTime - callTime) < 86400000; // within 24 hrs
          }
          return true;
        });
      }

      if (matchedCall) {
        if (!matchedCall.recording_url || matchedCall.recording_url.includes('UklGRuRdAABX')) {
          matchedCall.recording_url = rec.audioUrl;
          matchedCall.audioUrl = rec.audioUrl;
          matchedCall.drive_file_id = rec.id;
          if (!matchedCall.duration || matchedCall.duration === 0) {
            matchedCall.duration = rec.approxDuration;
          }
          attachedCount++;
        }
      } else if (rec.timestamp) {
        // If it's a new call from >= 20 Oct 2026, add to call logs
        const recTime = new Date(rec.timestamp).getTime();
        if (recTime >= CUTOFF_DATE) {
          const newCall = {
            id: `call-rec-${rec.id}`,
            caller_number: rec.phone || '+91' + rec.phoneDigits,
            phone: rec.phone || '+91' + rec.phoneDigits,
            caller_name: `Customer Call (${rec.phone || rec.phoneDigits})`,
            leadName: `Customer Call`,
            call_type: 'INCOMING',
            outcome: 'Connected',
            callOutcome: 'Connected',
            duration: rec.approxDuration,
            created_at: rec.timestamp,
            timestamp: rec.timestamp,
            time: rec.timestamp,
            recording_url: rec.audioUrl,
            audioUrl: rec.audioUrl,
            drive_file_id: rec.id,
            deviceName: 'Samsung Galaxy'
          };
          calls.unshift(newCall);
          attachedCount++;
        }
      }
    });

    // Save updated call logs
    try {
      fs.writeFileSync(CALL_LOGS_FILE, JSON.stringify(calls, null, 2));
    } catch(e) {}

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      folderId,
      driveFilesCount: driveRecs.length,
      attachedCount,
      calls
    }));
  } catch(err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
};
