const KNOWN_DRIVE_MAPPINGS = {
  '18b2Go-z_qanzXkPWAHpeKNbbMKQCHZLT': { name: 'Mohan BNI ID 17', phone: '+919803353372', leadId: 'lead-phone-9803353372', dur: 52, time: '31 Oct, 11:08 AM', device: 'OnePlus' },
  '1pHrefV3hsT18KiCr7yQEUFNMciTzlM4u': { name: 'PARMINDER SINGH', phone: '+918558055750', leadId: 'lead-phone-8558055750', dur: 10, time: '31 Oct, 11:01 AM', device: 'OnePlus' },
  '1PRKLkiAhqwHzPnSOXeVPvd7diZvZD-bx': { name: 'Mohan BNI ID 17', phone: '+919803353372', leadId: 'lead-phone-9803353372', dur: 37, time: '31 Oct, 11:00 AM', device: 'OnePlus' },
  '1126LoXtRStX_9ufSI706211rPfl4ExvI': { name: 'sanju test', phone: '+917814435761', leadId: 'lead-csv-1278', dur: 45, time: '30 Oct, 06:18 PM', device: 'OnePlus' },
  '1cAxD72uVBTt5N8MmZ4ut07C8nIY7C6Aa': { name: 'sanju test', phone: '+917814435761', leadId: 'lead-csv-1278', dur: 10, time: '30 Oct, 04:35 PM', device: 'OnePlus' },
  '1GRtR0L6KNxrMdnXKFSdLg45wBHUzkGb0': { name: 'Shiv Charan', phone: '+917508648100', dur: 74, time: '30 Oct, 03:00 PM', device: 'Samsung Galaxy' },
  '1L5vY7owRBqycDyDAG4EX0ZY6MfNdc6Ep': { name: 'Rupinder Singh', phone: '+917508648100', dur: 44, time: '29 Oct, 02:28 PM', device: 'Samsung Galaxy' },
  '1O6fS7CAbXXrhPprP147yrfuOpW94_ryU': { name: 'Potential Fraud', phone: 'Incoming Call', dur: 20, time: '28 Oct, 05:23 PM', device: 'Samsung Galaxy' },
  '1UFFzLBXEki9Nm4HZFJoyrB1ib26PxzaM': { name: 'sanju test', phone: '+917814435761', leadId: 'lead-csv-1278', dur: 25, time: '28 Oct, 12:22 PM', device: 'Samsung Galaxy' },
  '1ddCOcitOO4UwdCdmmKI1F5YiyiofqiZq': { name: 'Suspected Spam', phone: 'Incoming Call', dur: 18, time: '28 Oct, 10:13 AM', device: 'Samsung Galaxy' },
  '1vS9HBD2OEZi5mhyBoJTkDedgoVonNQGr': { name: 'Manga Khan', phone: '+919878685521', dur: 55, time: '26 Oct, 01:01 PM', device: 'Samsung Galaxy' },
  '1OCBSUwITJbqJEHj0Won27gt7ocIAuOLR': { name: 'Rajender', phone: '+918745036534', dur: 32, time: '26 Oct, 12:22 PM', device: 'Samsung Galaxy' },
  '1i_uyCGQ9iEJJIXNA9tEnO5ruWGPmFI7p': { name: 'Manga Khan', phone: '+919878685521', dur: 81, time: '26 Oct, 12:07 PM', device: 'Samsung Galaxy' },
  '1BWn0twXbTBk5ORoaadD8JaX7EHdw4ude': { name: 'KAMLESH JASWAL', phone: '+919779947870', dur: 100, time: '24 Oct, 12:28 PM', device: 'Samsung Galaxy' },
  '1WAtnBpjljm3tf4OgySDzOLNVZQ6h7gzF': { name: 'Direct Customer Call', phone: '+919530895341', dur: 23, time: '24 Oct, 11:57 AM', device: 'Samsung Galaxy' },
  '1l0W36bjGKFAeWcfwJ_X9XnKFxJ-aq6Hw': { name: 'sanju test', phone: '+917814435761', leadId: 'lead-csv-1278', dur: 46, time: '23 Oct, 05:57 PM', device: 'Samsung Galaxy' },
  '1gJ4DdglwBLPOM4iARsIVoC_N2UURkALg': { name: 'sanju test', phone: '+917814435761', leadId: 'lead-csv-1278', dur: 45, time: '23 Oct, 04:37 PM', device: 'Samsung Galaxy' },
  '13t35tqFyFD_xzxUL-OwY6vDK0W5z7myL': { name: 'Jaimal Singh', phone: '+919814804390', dur: 15, time: '22 Oct, 05:00 PM', device: 'Samsung Galaxy' },
  '1KKglqh6ymYD8dPbvL1Pxkf0F_4TO3_Jp': { name: 'SHWETA MALIK', phone: '+919814804391', dur: 237, time: '22 Oct, 02:35 PM', device: 'Samsung Galaxy' },
  '1HIoQoPGfks-8YEzEgnTvEeOb97hDW4j7': { name: 'GURPREET SINGH', phone: '+919814804392', dur: 72, time: '22 Oct, 11:51 AM', device: 'Samsung Galaxy' },
  '1nlDS6IbcQktOvyS1P9SdweLKv18aTMGe': { name: 'Harpreet Singh', phone: '+919814804393', dur: 87, time: '22 Oct, 10:30 AM', device: 'Samsung Galaxy' },
  '14wUfhihCj66V_BnF37bJD6S_uVzDDLbJ': { name: 'Suspected Spam', phone: 'Incoming Call', dur: 15, time: '20 Oct, 12:34 PM', device: 'Samsung Galaxy' }
};

function isSamePhysicalCall(a, b) {
  if (!a || !b) return false;
  if (a.id && b.id && a.id === b.id) return true;
  if (a.drive_file_id && b.drive_file_id && a.drive_file_id === b.drive_file_id) return true;

  // Extract device names
  const devA = String(a.deviceName || a.device_name || a.staff_name || '').toLowerCase();
  const devB = String(b.deviceName || b.device_name || b.staff_name || '').toLowerCase();
  const isDevAOnePlus = devA.includes('oneplus') || devA.includes('one plus');
  const isDevBOnePlus = devB.includes('oneplus') || devB.includes('one plus');
  
  // If calls are from different physical devices (e.g. OnePlus vs Samsung Galaxy),
  // they are strictly DIFFERENT calls on different phones! NEVER MERGE ACROSS DEVICES!
  if (isDevAOnePlus !== isDevBOnePlus) {
    return false;
  }

  // If one is Missed Call (0s duration) and the other is Connected (dur > 0 or has audio),
  // they are strictly DIFFERENT calls! NEVER MERGE MISSED CALL WITH CONNECTED CALL!
  const outA = String(a.call_outcome || a.outcome || a.callOutcome || '').toLowerCase();
  const outB = String(b.call_outcome || b.outcome || b.callOutcome || '').toLowerCase();
  const isMissedA = outA.includes('missed') || ((a.duration === 0 || a.call_duration === 0) && !a.recording_url && !a.audioUrl);
  const isMissedB = outB.includes('missed') || ((b.duration === 0 || b.call_duration === 0) && !b.recording_url && !b.audioUrl);
  if (isMissedA !== isMissedB) {
    return false;
  }

  const pA = String(a.caller_number || a.phone || '').replace(/\D/g, '').slice(-10);
  const pB = String(b.caller_number || b.phone || '').replace(/\D/g, '').slice(-10);

  const tA = new Date(a.created_at || a.timestamp || a.time || 0).getTime();
  const tB = new Date(b.created_at || b.timestamp || b.time || 0).getTime();

  // On the SAME device, if duplicate webhook fired for same phone within 2 minutes:
  if (pA && pB && pA.length >= 7 && pA === pB) {
    if (tA > 0 && tB > 0 && Math.abs(tA - tB) <= 120000) return true;
  }

  // On the SAME device, merge audio recording with pending MacroDroid call record within 3 minutes
  const aHasAudio = !!(a.recording_url || a.audioUrl || a.drive_file_id);
  const bHasAudio = !!(b.recording_url || b.audioUrl || b.drive_file_id);
  if (aHasAudio !== bHasAudio && tA > 0 && tB > 0 && Math.abs(tA - tB) <= 180000) {
    if (!pA || !pB || pA === pB) return true;
  }

  return false;
}

function deduplicateCalls(callsList) {
  if (!Array.isArray(callsList)) return [];
  const deduped = [];
  const seenIds = new Set();
  const sorted = callsList.slice().sort((a, b) => {
    const aHas = !!(a.recording_url || a.audioUrl || a.drive_file_id);
    const bHas = !!(b.recording_url || b.audioUrl || b.drive_file_id);
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    return new Date(b.created_at || b.timestamp || 0).getTime() - new Date(a.created_at || a.timestamp || 0).getTime();
  });
  for (const c of sorted) {
    if (!c || seenIds.has(c.id)) continue;
    const exIdx = deduped.findIndex(ex => isSamePhysicalCall(ex, c));
    if (exIdx !== -1) {
      if ((c.recording_url || c.audioUrl) && !deduped[exIdx].recording_url) {
        deduped[exIdx].recording_url = c.recording_url || c.audioUrl;
        deduped[exIdx].audioUrl = c.recording_url || c.audioUrl;
        deduped[exIdx].drive_file_id = c.drive_file_id || deduped[exIdx].drive_file_id;
      }
      // Merge real customer number & name from c if deduped[exIdx] lacks it
      const cNum = String(c.caller_number || c.phone || '').replace(/\D/g, '').slice(-10);
      const exNum = String(deduped[exIdx].caller_number || deduped[exIdx].phone || '').replace(/\D/g, '').slice(-10);
      if (cNum && cNum.length === 10 && (!exNum || exNum.length < 10)) {
        deduped[exIdx].caller_number = c.caller_number || c.phone;
        deduped[exIdx].phone = c.phone || c.caller_number;
        if (c.caller_name && !c.caller_name.includes('Direct Call') && !c.caller_name.includes('Interview-')) {
          deduped[exIdx].caller_name = c.caller_name;
          deduped[exIdx].leadName = c.leadName || c.caller_name;
        }
      }
      if (c.lead_id && !deduped[exIdx].lead_id) deduped[exIdx].lead_id = c.lead_id;
      if (c.leadId && !deduped[exIdx].leadId) deduped[exIdx].leadId = c.leadId;
      if (c.deviceName && !deduped[exIdx].deviceName) deduped[exIdx].deviceName = c.deviceName;
      if (c.device_name && !deduped[exIdx].device_name) deduped[exIdx].device_name = c.device_name;
      seenIds.add(c.id);
    } else {
      seenIds.add(c.id);
      deduped.push(c);
    }
  }
  return deduped;
}

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
    // sort=14&direction=d sorts by Last Modified date descending to always get the newest call recordings first
    const fetchUrl = `https://drive.google.com/drive/folders/${folderId}?sort=14&direction=d`;
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
      if (!name.endsWith('.m4a') && !name.endsWith('.mp3') && !name.endsWith('.wav') && !name.endsWith('.aac')) return;

      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      let isoTimestamp = null;
      let yymmdd = '';
      let formattedTime = '';
      let phoneDigits = '';
      let contactName = '';
      let isOnePlus = false;

      // Pattern 1: Samsung Galaxy call recording format
      // Examples: "Call recording +917508648100_261029_142818.m4a", "Call recording Shiv Charan_261030_150035.m4a"
      const samsungMatch = name.match(/_(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\.(m4a|mp3)$/i);

      // Pattern 2: OnePlus / ODialer call recording format
      // Examples: "2610301635.mp3" (YYMMDDHHMM), "Kamla Devi_2610301635.mp3", "9814400123_2610301635.mp3"
      const oneplusMatch = name.match(/^(?:(.+?)[_-])?(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?\.(mp3|m4a|wav|aac)$/i);

      if (samsungMatch) {
        const [_, yy, mm, dd, hh, min, ss] = samsungMatch;
        yymmdd = `20${yy}-${mm}-${dd}`;
        const d = new Date(`20${yy}-${mm}-${dd}T${hh}:${min}:${ss}+05:30`);
        if (!isNaN(d.getTime())) isoTimestamp = d.toISOString();
        const mIdx = parseInt(mm, 10) - 1;
        const hInt = parseInt(hh, 10);
        const ampm = hInt >= 12 ? 'PM' : 'AM';
        const h12 = hInt % 12 || 12;
        formattedTime = `${parseInt(dd, 10)} ${months[mIdx]}, ${h12 < 10 ? '0' + h12 : h12}:${min} ${ampm}`;
        isOnePlus = false;

        const nameMatch = name.match(/^Call recording\s+(.+?)_(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\.(m4a|mp3)$/i);
        if (nameMatch) {
          contactName = nameMatch[1].trim();
        }
      } else if (oneplusMatch) {
        const [_, prefix, yy, mm, dd, hh, min, ss] = oneplusMatch;
        yymmdd = `20${yy}-${mm}-${dd}`;
        const sec = ss || '00';
        const d = new Date(`20${yy}-${mm}-${dd}T${hh}:${min}:${sec}+05:30`);
        if (!isNaN(d.getTime())) isoTimestamp = d.toISOString();
        const mIdx = parseInt(mm, 10) - 1;
        const hInt = parseInt(hh, 10);
        const ampm = hInt >= 12 ? 'PM' : 'AM';
        const h12 = hInt % 12 || 12;
        formattedTime = `${parseInt(dd, 10)} ${months[mIdx]}, ${h12 < 10 ? '0' + h12 : h12}:${min} ${ampm}`;
        isOnePlus = true;

        if (prefix) {
          const pMatch = prefix.match(/(?:\+?91)?([6-9]\d{9})/);
          if (pMatch) {
            phoneDigits = pMatch[1];
          } else {
            contactName = prefix.replace(/^Call recording\s+/i, '').trim();
          }
        }
      }

      // Extract valid 10-digit mobile number if not extracted yet
      if (!phoneDigits) {
        const phoneMatch = name.match(/(?:\+?91)?([6-9]\d{9})/);
        if (phoneMatch) {
          phoneDigits = phoneMatch[1];
        }
      }

      // If known mapping exists, use it!
      if (KNOWN_DRIVE_MAPPINGS[id]) {
        const km = KNOWN_DRIVE_MAPPINGS[id];
        contactName = km.name;
        phoneDigits = km.phone.replace(/\D/g, '').slice(-10);
        if (km.time) formattedTime = km.time;
        if (km.device) isOnePlus = (km.device === 'OnePlus');
      }

      // Approximate duration based on audio file size (typically ~16-24 KB per second for m4a/mp3)
      const approxDuration = Math.max(10, Math.min(600, Math.round(size / 18000)));

      recordings.push({
        id,
        name,
        size,
        dateStr: yymmdd,
        formattedTime,
        phone: phoneDigits ? ('+91' + phoneDigits) : (contactName || 'Direct Phone Call'),
        phoneDigits,
        contactName: contactName || (phoneDigits ? ('+91' + phoneDigits) : ''),
        timestamp: isoTimestamp,
        audioUrl: `/api/call-audio?id=${id}`,
        approxDuration,
        deviceName: isOnePlus ? 'OnePlus' : 'Samsung Galaxy'
      });
    });
  } catch(e) {
    console.error('Error parsing drive HTML:', e);
  }

  return recordings;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  let folderId = parsedUrl.query.folderId || DEFAULT_FOLDER_ID;

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

      if (!matchedCall) {
        // Also match by saved contact name in Samsung filename (e.g. "Call recording Manga khan meta_...")
        const cleanRecName = rec.name.toLowerCase().replace(/call recording|\.m4a|\.mp3|_\d+_\d+/gi, '').trim();
        if (cleanRecName.length >= 3) {
          matchedCall = calls.find(c => {
            const nameC = (c.caller_name || c.leadName || '').toLowerCase();
            if (!nameC || nameC === 'direct phone call' || nameC.includes('customer call') || nameC.includes('suspected spam')) return false;
            const words = cleanRecName.split(/\s+/).filter(w => w.length > 2);
            const matchesWord = words.some(w => nameC.includes(w));
            if (!matchesWord) return false;
            if (rec.timestamp && (c.created_at || c.timestamp || c.time)) {
              const recTime = new Date(rec.timestamp).getTime();
              const callTime = new Date(c.created_at || c.timestamp || c.time).getTime();
              return Math.abs(recTime - callTime) < 86400000;
            }
            return true;
          });
        }
      }

      if (!matchedCall && rec.timestamp) {
        // Match by device and timestamp (within 10 minutes)
        // Crucial for OnePlus / ODialer filenames (e.g. 2610301635.mp3) which only contain timestamp
        const recTime = new Date(rec.timestamp).getTime();
        matchedCall = calls.find(c => {
          if (c.recording_url && !c.recording_url.includes('UklGRuRdAABX')) return false; // already has recording
          const cDev = (c.device_name || c.deviceName || c.staff_name || '').toLowerCase();
          const rDev = (rec.deviceName || '').toLowerCase();
          const devMatch = (cDev.includes('oneplus') && rDev.includes('oneplus')) || 
                           (cDev.includes('samsung') && rDev.includes('samsung')) ||
                           (!cDev || cDev === 'all');
          if (!devMatch) return false;
          const cTime = new Date(c.created_at || c.timestamp || c.time).getTime();
          return !isNaN(cTime) && Math.abs(recTime - cTime) <= 600000; // within 10 minutes
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
          if (rec.deviceName) {
            matchedCall.deviceName = rec.deviceName;
            matchedCall.device_name = rec.deviceName;
            matchedCall.staff_name = rec.deviceName;
          }
          attachedCount++;
        }
      } else if (rec.timestamp) {
        // If it's a new call from >= 20 Oct 2026, add to call logs
        const recTime = new Date(rec.timestamp).getTime();
        if (recTime >= CUTOFF_DATE) {
          const isOnePlus = rec.deviceName === 'OnePlus';
          const cName = (rec.id === '1GRtR0L6KNxrMdnXKFSdLg45wBHUzkGb0' || rec.contactName === 'Shiv Charan')
            ? 'Shiv Charan'
            : (rec.contactName || (rec.phoneDigits ? ('Direct Phone Call') : (isOnePlus ? 'OnePlus Call (' + (rec.formattedTime || 'Recent') + ')' : 'Direct Customer Call')));
          const cNum = rec.phone || (rec.contactName ? (rec.contactName + ' (Direct Call)') : 'Direct Phone Call');
          const devName = rec.deviceName || (isOnePlus ? 'OnePlus' : 'Samsung Galaxy');
          const newCall = {
            id: `call-rec-${rec.id}`,
            caller_number: cNum,
            phone: cNum,
            caller_name: cName,
            leadName: cName,
            call_type: 'INCOMING',
            direction: 'INBOUND',
            outcome: 'Connected',
            call_outcome: 'Connected',
            callOutcome: 'Connected',
            duration: rec.approxDuration,
            call_duration: rec.approxDuration,
            created_at: rec.timestamp,
            timestamp: rec.timestamp,
            time: rec.formattedTime || rec.timestamp,
            recording_url: rec.audioUrl,
            audioUrl: rec.audioUrl,
            drive_file_id: rec.id,
            deviceName: devName,
            device_name: devName,
            staff_name: devName
          };
          calls.unshift(newCall);
          attachedCount++;
        }
      }
    });

    // Save updated call logs
    try {
      calls = deduplicateCalls(calls);
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
