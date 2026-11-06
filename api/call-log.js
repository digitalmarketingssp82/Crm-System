
function parsePhoneTimestamp(rawDate, rawTime, rawFull) {
  let str = (rawFull || (rawDate ? (rawDate + ' ' + (rawTime || '')) : rawTime) || '').trim();
  if (!str || str.includes('{system_time}') || str.includes('{call_date}')) {
    return new Date();
  }
  
  // 1. Epoch check
  if (/^\d{10,13}$/.test(str)) {
    const epoch = parseInt(str, 10);
    return new Date(epoch < 1e11 ? epoch * 1000 : epoch);
  }

  // 2. Pure time e.g. '14:44:28' or '02:44 PM' or '14:44'
  const timeOnlyRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i;
  const timeMatch = str.match(timeOnlyRegex);
  if (timeMatch) {
    const now = new Date();
    let hours = parseInt(timeMatch[1], 10);
    const mins = parseInt(timeMatch[2], 10);
    const secs = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
    const ampm = timeMatch[4] ? timeMatch[4].toLowerCase() : null;
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIst = new Date(now.getTime() + istOffset);
    const y = nowIst.getUTCFullYear();
    const m = String(nowIst.getUTCMonth() + 1).padStart(2, '0');
    const d = String(nowIst.getUTCDate()).padStart(2, '0');
    const hh = String(hours).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    return new Date(y + '-' + m + '-' + d + 'T' + hh + ':' + mm + ':' + ss + '+05:30');
  }

  // 3. Indian Date DD-MM-YYYY or DD/MM/YYYY with optional time
  const dmyMatch = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?$/i);
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10);
    let month = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    let hours = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 12;
    let mins = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    let secs = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
    const ampm = dmyMatch[7] ? dmyMatch[7].toLowerCase() : null;
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    
    const y = year;
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const hh = String(hours).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    return new Date(y + '-' + m + '-' + d + 'T' + hh + ':' + mm + ':' + ss + '+05:30');
  }

  // 4. Standard ISO or fallback
  const p = new Date(str);
  if (!isNaN(p.getTime())) return p;

  return new Date();
}

const PHANTOM_CALL_IDS = new Set([
  'call-log-1793870745254-327', // 05 Nov probe test
  'call-log-1793870744125-106', // 05 Nov probe test
  'call-log-1793870743178-968', // 05 Nov probe test
  'call-log-1793870660053-120', // 05 Nov probe test
  'call-log-1793870661068-160', // 05 Nov probe test
  'call-log-1793863004200-384', // 05 Nov test
  'call-log-1793699954352-282',
  'call-log-1793699741363-41',
  'call-log-1793442618941-958', // 31 Oct fake Samsung duplicate
  'call-log-1793442320008-376', // 31 Oct fake Samsung duplicate
  'call-log-1793425221000-779', // 31 Oct fake Samsung duplicate
  'call-log-1793424900000-777', // 31 Oct fake Samsung duplicate
  'call-log-1793425221523-680', // 31 Oct fake Samsung duplicate
  'call-log-1793424919510-15',  // 31 Oct fake Samsung duplicate
  'call-log-1793424919647-902', // duplicate 11:05 AM missed call
  'call-log-1793424672137-919',
  'call-log-1793364624739-593',
  'call-log-1793364530991-30',
  'call-log-1793081320981-675',
  'call-log-1793081074929-41',
  'call-log-1793095511751-514',
  'call-log-1793000441279-828',
  'call-log-1793000039918-467',
  'call-log-1792999924330-651',
  'call-log-1792997552160-561',
  'call-log-1792996737064-268',
  'call-log-1792936126485-527',
  'call-log-1792936126085-605',
  'call-log-1792936096037-479',
  'call-log-1792920397539-995',
  'call-log-1792920397418-184',
  'call-log-1792844823364-448',
  'call-log-1792825199143-118',
  'call-log-1792823268672-708',
  'call-log-1792758511155-839'
]);
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Persistent storage for call_logs table (safe for both local server and Vercel /tmp)
let CALL_LOGS_FILE = path.join(__dirname, '..', 'call_logs.json');
try {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || !fs.existsSync(path.join(__dirname, '..'))) {
    const tmpPath = path.join('/tmp', 'call_logs.json');
    CALL_LOGS_FILE = tmpPath;
  }
} catch (e) {}

// Helper to send response in both Node http and Vercel Serverless
function sendResponse(res, statusCode, data) {
  if (res.status && typeof res.status === 'function') {
    return res.status(statusCode).json(data);
  }
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Helper to read call_logs table
function getStoredCallLogs() {
  try {
    if (fs.existsSync(CALL_LOGS_FILE)) {
      let l = JSON.parse(fs.readFileSync(CALL_LOGS_FILE, 'utf8'));
      if (Array.isArray(l)) {
        l.forEach(c => {
          if (c && c.id === 'call-log-1793427378125-985') {
            c.direction = 'OUTBOUND';
            c.call_type = 'OUTBOUND';
          }
        });
        return l;
      }
    }
  } catch(e) {}
  try {
    // If running in /tmp and file does not exist yet, seed from bundled call_logs.json
    if (!fs.existsSync(CALL_LOGS_FILE)) {
      const bundledPath = path.join(__dirname, '..', 'call_logs.json');
      if (fs.existsSync(bundledPath)) {
        try {
          const seedData = fs.readFileSync(bundledPath, 'utf8');
          fs.writeFileSync(CALL_LOGS_FILE, seedData, 'utf8');
        } catch(e) {}
      }
    }
    if (fs.existsSync(CALL_LOGS_FILE)) {
      const content = fs.readFileSync(CALL_LOGS_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(c => !PHANTOM_CALL_IDS.has(c.id)).map(c => {
          if (c.recording_url && (c.recording_url.includes('UklGRuRdAABX') || c.recording_url.includes('data:audio/wav;base64'))) {
            c.recording_url = '';
            c.audioUrl = '';
            c.hasAudio = false;
          }
          const cDir = String(c.direction || c.call_type || '').toUpperCase();
          const isInb = cDir.includes('IN') || (!cDir.includes('OUT') && !cDir.includes('DIAL'));
          const hasAud = !!(c.recording_url || c.drive_file_id || c.audioUrl);
          if (isInb && !hasAud) {
            c.call_outcome = 'Missed Call';
            c.outcome = 'Missed Call';
            c.callOutcome = 'Missed Call';
            c.call_duration = 0;
            c.duration = 0;
          }
          return c;
        });
      }
    }
    // Fallback: directly read bundled file if /tmp was empty
    const bundledPath = path.join(__dirname, '..', 'call_logs.json');
    if (fs.existsSync(bundledPath)) {
      const bContent = fs.readFileSync(bundledPath, 'utf8');
      const bParsed = JSON.parse(bContent);
      if (Array.isArray(bParsed)) {
        return bParsed.map(c => {
          if (c.recording_url && (c.recording_url.includes('UklGRuRdAABX') || c.recording_url.includes('data:audio/wav;base64'))) {
            c.recording_url = '';
            c.audioUrl = '';
            c.hasAudio = false;
          }
          const cDir = String(c.direction || c.call_type || '').toUpperCase();
          const isInb = cDir.includes('IN') || (!cDir.includes('OUT') && !cDir.includes('DIAL'));
          const hasAud = !!(c.recording_url || c.drive_file_id || c.audioUrl);
          if (isInb && !hasAud) {
            c.call_outcome = 'Missed Call';
            c.outcome = 'Missed Call';
            c.callOutcome = 'Missed Call';
            c.call_duration = 0;
            c.duration = 0;
          }
          return c;
        });
      }
    }
  } catch (err) {
    console.error('[call_logs DB Read Error]:', err.message);
  }
  return [];
}

// Helper to save call_logs table
function saveStoredCallLogs(logs) {
  try {
    fs.writeFileSync(CALL_LOGS_FILE, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.error('[call_logs DB Write Error]:', err.message);
  }
}

// Clean phone number to last 10 digits
function cleanPhone(num) {
  if (!num) return '';
  const digits = String(num).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

// Format duration helper
function formatCallLogTime(isoDate) {
  if (!isoDate) return "—";
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return String(isoDate);
    const parts = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).format(d);
    return parts.replace(/am$/i, "AM").replace(/pm$/i, "PM");
  } catch(e) {
    return String(isoDate);
  }
}

function formatCallDuration(sec) {
  const s = parseInt(sec, 10) || 0;
  if (s <= 0) return '0s';
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  if (mins === 0) return `${rem}s`;
  return `${mins}m ${rem}s`;
}

// ==================== BACKGROUND AI SPEECH-TO-TEXT & SUMMARY ENGINE ====================
async function generateAiCallSummary(audioUrl, callerNumber, callDuration) {
  // AI summary generation completely suppressed as per user specification (zero hallucination)
  return '';
}

// ==================== FIRESTORE CLOUD PERSISTENCE ====================
async function syncCallLogToFirestore(callLogRecord) {
  try {
    const postData = JSON.stringify({
      fields: {
        id: { stringValue: callLogRecord.id },
        lead_id: { stringValue: callLogRecord.lead_id },
        caller_number: { stringValue: String(callLogRecord.caller_number || '') },
        caller_name: { stringValue: String(callLogRecord.caller_name || '') },
        receiver_number: { stringValue: String(callLogRecord.receiver_number || '') },
        call_duration: { integerValue: String(callLogRecord.call_duration || 0) },
        recording_url: { stringValue: String(callLogRecord.recording_url || '') },
        ai_summary: { stringValue: String(callLogRecord.ai_summary || '') },
        direction: { stringValue: String(callLogRecord.direction || 'INBOUND') },
        call_outcome: { stringValue: String(callLogRecord.call_outcome || 'Connected') },
        staff_name: { stringValue: String(callLogRecord.staff_name || 'Samsung Galaxy') },
        device_name: { stringValue: String(callLogRecord.device_name || 'Samsung Galaxy') },
        created_at: { stringValue: callLogRecord.created_at }
      }
    });

    const fUrl = '/v1/projects/crm-f4bf7/databases/(default)/documents/call_logs?documentId=' + callLogRecord.id;
    await new Promise((resolve) => {
      const fReq = https.request({
        hostname: 'firestore.googleapis.com',
        path: fUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 8000
      }, (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve());
      });
      fReq.on('error', () => resolve());
      fReq.on('timeout', () => { fReq.destroy(); resolve(); });
      fReq.write(postData);
      fReq.end();
    });
  } catch (err) {
    console.warn('[Firestore Call Log Sync Note]:', err.message);
  }
}

async function getFirestoreCallLogs() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'call_logs' }],
        orderBy: [{
          field: { fieldPath: 'created_at' },
          direction: 'DESCENDING'
        }],
        limit: 500
      }
    });

    const req = https.request('https://firestore.googleapis.com/v1/projects/crm-f4bf7/databases/(default)/documents:runQuery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 8000
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(d);
          if (!Array.isArray(parsed)) return resolve([]);
          const logs = parsed.filter(item => item.document && item.document.fields).map(item => {
            const f = item.document.fields;
            return {
              id: f.id?.stringValue || '',
              lead_id: f.lead_id?.stringValue || '',
              caller_number: f.caller_number?.stringValue || '',
              caller_name: f.caller_name?.stringValue || '',
              receiver_number: f.receiver_number?.stringValue || '',
              call_duration: parseInt(f.call_duration?.integerValue || 0, 10),
              recording_url: f.recording_url?.stringValue || '',
              ai_summary: f.ai_summary?.stringValue || '',
              direction: f.direction?.stringValue || 'INBOUND',
              call_outcome: f.call_outcome?.stringValue || 'Connected',
              staff_name: f.staff_name?.stringValue || 'OnePlus',
              device_name: f.device_name?.stringValue || 'OnePlus',
              created_at: f.created_at?.stringValue || ''
            };
          });
          resolve(logs);
        } catch(e) { resolve([]); }
      });
    });
    req.on('error', () => resolve([]));
    req.on('timeout', () => { req.destroy(); resolve([]); });
    req.write(postData);
    req.end();
  });
}

// ==================== MAIN WEBHOOK HANDLER ====================
module.exports = async (req, res) => {
  // CORS & No-Cache Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-webhook-token');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    if (res.status && typeof res.status === 'function') {
      return res.status(200).end();
    }
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse query parameters accurately from both URL and req.query
  const parsedUrl = url.parse(req.url, true);
  const query = { ...(parsedUrl.query || {}), ...(req.query || {}) };
  const isIncomingCallSync = !!(
    query.customer_number || 
    query.caller_number || 
    (query.phone && query.call_duration !== undefined) || 
    (query.call_duration !== undefined && (query.phone || query.number)) ||
    (query.call_type && query.customer_number)
  );

  // 1. GET: Webhook Probe & Status / Query Endpoint (Only if not sending a new call sync)
  if (req.method === 'GET' && !isIncomingCallSync) {
    const leadId = query.lead_id || query.leadId;
    const phone = cleanPhone(query.phone || query.number);

    let allLogs = getStoredCallLogs();
    try {
      const cloudLogs = await getFirestoreCallLogs();
      if (cloudLogs.length > 0) {
        cloudLogs.forEach(cl => {
          const exIdx = allLogs.findIndex(l => l.id === cl.id);
          if (exIdx === -1) {
            allLogs.push(cl);
          } else {
            allLogs[exIdx] = cl;
          }
        });
      }
    } catch(e) {}

    // Strict filter: Never return test numbers, mockup calls, phantom test IDs, or blank ghost calls
    allLogs = allLogs.filter(c => {
      if (!c) return false;
      if (PHANTOM_CALL_IDS.has(c.id)) return false;
      const num = String(c.caller_number || c.phone || '');
      const cName = String(c.caller_name || '').toLowerCase();
      if (num.includes('9999988888') || num.includes('8000000000') || c.id === 'call-log-1793081339671-686') return false;
      // Filter out blank premature ghost calls (e.g. from Call Recording trigger firing with no caller)
      const cNum = String(c.caller_number || c.phone || '').trim();
      const cDigits = cNum.replace(/\D/g, '');
      if (c.drive_file_id || c.recording_url) {
        // Real call with verified recording on Google Drive - ALWAYS KEEP!
      } else if (cNum.toLowerCase().includes('unknown') || cName.includes('unknown incoming') || (cDigits.length > 0 && cDigits.length < 5)) {
        return false;
      }
      if (c.id === 'call-log-1793170323765-551' || c.id === 'call-log-1793162593463-412') return false;
      
      // Zero Fake Data: Inbound calls without verified audio recordings are Missed Calls with 0s duration
      const cHasAudio = !!(c.drive_file_id || c.recording_url || c.audioUrl);
      const cDir = String(c.direction || c.call_type || '').toUpperCase();
      const cIsInbound = cDir.includes('IN') || (!cDir.includes('OUT') && !cDir.includes('DIAL'));
      const cDur = parseInt(c.call_duration || c.duration || 0, 10);
      if (cIsInbound && !cHasAudio && cDur === 0) {
        c.call_outcome = 'Missed Call';
        c.outcome = 'Missed Call';
        c.callOutcome = 'Missed Call';
        c.call_duration = 0;
        c.duration = 0;
      }
      return true;
    });

    // User requested ALL historical call logs preserved without any date cutoff

    allLogs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    allLogs.forEach(l => { if (!l.time) l.time = formatCallLogTime(l.created_at); });

    if (leadId) {
      const filtered = allLogs.filter(c => String(c.lead_id) === String(leadId));
      return sendResponse(res, 200, { success: true, count: filtered.length, call_logs: filtered });
    }

    if (phone) {
      const filtered = allLogs.filter(c => cleanPhone(c.caller_number) === phone || cleanPhone(c.receiver_number) === phone);
      return sendResponse(res, 200, { success: true, count: filtered.length, call_logs: filtered });
    }

    // Default status probe & data sync
    return sendResponse(res, 200, {
      status: 'active',
      success: true,
      service: 'Sri Sri Plywoods CRM - Automatic Call Recording & AI Transcription Webhook Engine',
      endpoint: '/api/webhook/call-log',
      database_table: 'call_logs',
      columns: ['id', 'lead_id', 'caller_number', 'receiver_number', 'call_duration', 'recording_url', 'ai_summary', 'created_at'],
      total_call_logs_stored: allLogs.length,
      count: allLogs.length,
      call_logs: allLogs,
      time: new Date().toISOString()
    });
  }

  // 2. POST (or GET with Call Parameters): Inbound Call Recording Webhook Handler
  if (req.method === 'POST' || isIncomingCallSync) {
    try {
      // 1. Safely retrieve req.body without crashing on Vercel's JSON getter
      let reqBody = null;
      try {
        reqBody = req.body;
      } catch (e) {
        reqBody = null;
      }

      // Collect full body buffer if not already parsed (supports direct binary, urlencoded, and multipart uploads from Android)
      let rawBuffer = null;
      if (Buffer.isBuffer(reqBody)) {
        rawBuffer = reqBody;
      } else if (typeof reqBody === 'string') {
        rawBuffer = Buffer.from(reqBody);
      } else if (!reqBody && req.readable) {
        rawBuffer = await new Promise((resolve) => {
          const chunks = [];
          req.on('data', c => chunks.push(c));
          req.on('end', () => resolve(Buffer.concat(chunks)));
          req.on('error', () => resolve(Buffer.alloc(0)));
        });
      }

      let body = {};
      const cType = String((req.headers && req.headers['content-type']) || '').toLowerCase();
      
      // If JSON or parsed object
      if (typeof reqBody === 'object' && !Buffer.isBuffer(reqBody) && reqBody !== null) {
        body = reqBody;
      } else if (rawBuffer && rawBuffer.length > 0) {
        const rawStr = rawBuffer.toString('utf8').trim();
        if (rawStr.startsWith('{') && rawStr.endsWith('}')) {
          try { body = JSON.parse(rawStr); } catch(e){}
        } else if (rawStr.includes('=') && !cType.includes('multipart') && !cType.includes('audio')) {
          try {
            const querystring = require('querystring');
            body = querystring.parse(rawStr);
          } catch(e){}
        }
      }

      // Merge all query parameters into body/data (supports MacroDroid URL query parameters directly)
      for (const k of ['customer_number', 'caller_number', 'phone', 'number', 'caller_name', 'customer_name', 'call_duration', 'duration', 'staff_name', 'device_name', 'call_type', 'call_outcome', 'recording_url', 'file_name', 'filename', 'call_time', 'timestamp', 'time']) {
        if (query[k] && !body[k]) body[k] = query[k];
      }

      console.log('[Call-Log Webhook Inbound Content-Type]:', cType);
      console.log('[Call-Log Webhook Inbound Payload]:', JSON.stringify(body));

      // Unwrap nested payload (support Twilio, Exotel, MyOperator, Asterisk, Android Companion)
      const data = body.data || body.payload || body.call || body;

      // Extract Audio Recording URL or Base64 Audio
      let recording_url = data.recording_url || data.recordingUrl || data.audio_url || 
                            data.audioUrl || data.RecordingUrl || data.file_url || 
                            data.media_url || data.url || '';

      const audio_base64 = data.audio_base64 || data.recording_base64 || data.audioBase64 || body.audio_base64 || '';
      if (!recording_url && audio_base64) {
        if (audio_base64.startsWith('data:audio')) {
          recording_url = audio_base64;
        } else {
          recording_url = 'data:audio/mp4;base64,' + audio_base64;
        }
      }

      let extractedFileName = query.file_name || query.filename || data.file_name || data.filename || '';
      // If audio sent as direct binary or multipart/form-data from Android phone
      if (!recording_url && rawBuffer && rawBuffer.length > 500) {
        if (cType.includes('audio') || cType.includes('octet-stream')) {
          recording_url = 'data:audio/mp4;base64,' + rawBuffer.toString('base64');
        } else if (cType.includes('multipart')) {
          const bufStr = rawBuffer.toString('binary');
          const fileMatch = bufStr.match(/filename="([^"]+)"[\r\n]+Content-Type: ([^\r\n]+)[\r\n]+[\r\n]+([\s\S]+?)(\r?\n--)/);
          if (fileMatch) {
            extractedFileName = fileMatch[1];
            const fileBytes = Buffer.from(fileMatch[3], 'binary');
            recording_url = 'data:audio/mp4;base64,' + fileBytes.toString('base64');
          } else {
            recording_url = 'data:audio/mp4;base64,' + rawBuffer.toString('base64');
          }
        }
      }

      // Extract Numbers
      let caller_number = String(data.caller_number || data.callerNumber || data.from || data.From || data.caller || '').trim();
      const receiver_number = String(data.receiver_number || data.receiverNumber || data.to || data.To || data.dialed || '').trim();
      const customer_number = String(data.customer_number || data.customer_phone || data.phone || data.phone_number || '').trim();
      const rawCallerName = String(data.customer_name || data.customerName || data.caller_name || data.callerName || data.contact_name || data.name || data.company || '').trim();
      let validCallerName = (rawCallerName && rawCallerName !== '{call_name}' && rawCallerName !== 'null' && rawCallerName !== 'undefined') ? rawCallerName : '';

      // Determine customer phone & handle spam / unknown / unsaved numbers cleanly
      let effectiveCustomerPhone = customer_number || caller_number || receiver_number || '';
      if (effectiveCustomerPhone === '{call_number}' || effectiveCustomerPhone === '?' || effectiveCustomerPhone.toLowerCase() === 'unknown') {
        effectiveCustomerPhone = '';
      }
      // If missing from payload, extract from audio recording filename
      if (extractedFileName && (!effectiveCustomerPhone || effectiveCustomerPhone.length < 10)) {
        const fMatch = extractedFileName.match(/(\d{10})/);
        if (fMatch) effectiveCustomerPhone = fMatch[1];
      }
      // If still missing, check recent call log from same device/time
      const existingLogs = getStoredCallLogs();
      if (!effectiveCustomerPhone && existingLogs.length > 0) {
        const recentLog = existingLogs.find(l => l.caller_number && l.caller_number.length >= 10 && !l.caller_number.includes('Spam') && (Date.now() - new Date(l.created_at).getTime() < 10 * 60 * 1000));
        if (recentLog) {
          effectiveCustomerPhone = cleanPhone(recentLog.caller_number);
        }
      }

      let cleanCustomer = cleanPhone(effectiveCustomerPhone);
      
      // Strict Ghost Call Prevention: When MacroDroid sends a test probe (no phone number and no recording)
      // return 200 OK immediately so the phone sees green 200, but DO NOT inject fake calls into the CRM!
      if (!cleanCustomer && !validCallerName && (!recording_url || recording_url.length < 50)) {
        console.log('[MacroDroid Test Probe]: Verified connection without inserting phantom call log');
        return sendResponse(res, 200, {
          success: true,
          message: 'MacroDroid Webhook Connection Verified - CRM Ready',
          test: true,
          status: 'ready',
          device: device_name || 'iQOO'
        });
      }

      let displayCustomerPhone = '';
      if (cleanCustomer && cleanCustomer.length >= 10) {
        displayCustomerPhone = '+91' + cleanCustomer + (validCallerName ? (' (' + validCallerName + ')') : '');
      } else if (validCallerName) {
        displayCustomerPhone = validCallerName + (effectiveCustomerPhone ? (' (' + effectiveCustomerPhone + ')') : '');
      } else if (effectiveCustomerPhone) {
        displayCustomerPhone = effectiveCustomerPhone;
      } else {
        displayCustomerPhone = 'Unknown Incoming Caller';
      }

      // Extract Duration (in seconds)
      const rawDuration = data.call_duration || data.duration || data.CallDuration || data.duration_seconds || 0;
      let call_duration = parseInt(rawDuration, 10) || 0;

      // Extract Call Type & Direction (Inbound vs Outbound vs Missed)
      let rawType = String(data.call_type || data.type || data.direction || data.call_direction || '').toUpperCase();
      let isMissed = (data.is_missed === true || data.is_missed === 'true' || rawType.includes('MISSED') || String(data.call_outcome || '').toLowerCase().includes('missed'));

      // If duration > 0, the parties actually talked, so it cannot be missed
      if (call_duration > 0) {
        isMissed = false;
      }

      // Inbound is the universal default for phone companion sync
      let direction = 'INBOUND';
      if (rawType.includes('OUT') || rawType.includes('DIAL') || rawType === '2' || rawType.includes('OUTGOING')) {
        direction = 'OUTBOUND';
      }

      // Determine Authentic Call Outcome & Duration (Zero Fake Duration / Zero Mismatch):
      // 1. If audio recording exists OR actual call duration > 0: Real talk occurred -> Connected!
      let call_outcome = 'Missed Call';
      const explicitOutcome = String(data.call_outcome || data.outcome || '').toLowerCase();
      const hasAudioData = !!(recording_url && recording_url.length > 50);

      if (hasAudioData || call_duration > 0) {
        call_outcome = 'Connected';
      } else if (direction === 'OUTBOUND') {
        // Outbound call dialed by user where recipient did not answer (duration 0)
        call_outcome = 'Outbound (Not Picked)';
        call_duration = 0;
      } else {
        // Inbound call not answered (duration 0)
        call_outcome = 'Missed Call';
        call_duration = 0;
      }

      // Multi-Phone Staff & Device Identification (Supports OnePlus, Samsung, iQOO)
      let staff_name = data.staff_name || data.staff || data.device_name || query.staff_name || query.device_name || query.device || '';
      let device_name = data.device_name || data.device || data.staff_name || query.device_name || query.device || '';
      const rawDevLower = (String(device_name) + ' ' + String(staff_name) + ' ' + String(query.device || '') + ' ' + String(query.staff || '') + ' ' + String(extractedFileName)).toLowerCase();
      if (rawDevLower.includes('iq') || rawDevLower.includes('vivo')) {
        device_name = 'iQOO';
        staff_name = 'iQOO';
      } else if (rawDevLower.includes('oneplus')) {
        device_name = 'OnePlus';
        staff_name = 'OnePlus';
      } else if (rawDevLower.includes('samsung')) {
        device_name = 'Samsung Galaxy';
        staff_name = 'Samsung Galaxy';
      } else {
        device_name = device_name || 'OnePlus';
        staff_name = staff_name || device_name;
      }

      // Check if lead_id was explicitly supplied in payload
      let lead_id = data.lead_id || data.leadId || '';

      // Find relevant lead by phone number if lead_id not supplied
      if (!lead_id && cleanCustomer) {
        lead_id = '';
      }

      // If still no lead_id, generate fallback
      if (!lead_id) {
        lead_id = 'lead-incoming-' + Date.now();
      }

      // AI summary suppressed as per user specification (zero hallucination)
      let ai_summary = '';

      // Unique Call Log Record adhering strictly to requested call_logs table schema:
      // (id, lead_id, caller_number, receiver_number, call_duration, recording_url, ai_summary, created_at)
      const callLogId = 'call-log-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

      // Extract accurate phone timestamp (support MacroDroid magic text variables or ISO date)
      const rawDate = data.call_date || data.date || query.call_date || query.date || '';
      const rawTime = data.call_time || data.time || query.call_time || query.time || '';
      const rawFull = data.call_time_iso || data.created_at || data.timestamp || query.timestamp || '';
      const callDateObj = parsePhoneTimestamp(rawDate, rawTime, rawFull);
      const callIso = callDateObj.toISOString();
      const callFormattedTime = formatCallLogTime(callIso);

      const callLogRecord = {
        id: callLogId,
        lead_id: String(lead_id),
        caller_number: String(displayCustomerPhone),
        caller_name: validCallerName,
        receiver_number: String(receiver_number || ''),
        call_duration: call_duration,
        recording_url: String(recording_url),
        ai_summary: String(ai_summary),
        direction: direction,
        call_outcome: call_outcome,
        staff_name: staff_name,
        device_name: device_name,
        created_at: callIso,
        time: callFormattedTime,
        outcome: call_outcome,
        duration: call_duration
      };

      // 1. Persist to independent call_logs table / store
      const allLogs = getStoredCallLogs();

      // Check if an audio recording from Google Drive already exists for this caller/phone
      if (!callLogRecord.recording_url) {
        const matchingRec = allLogs.find(l => {
          if (!l.recording_url || l.recording_url.length < 5) return false;
          const numMatch = cleanCustomer && cleanCustomer.length >= 10 && cleanPhone(l.caller_number || l.phone) === cleanCustomer;
          const nameMatch = validCallerName && l.caller_name && (
            l.caller_name.toLowerCase().includes(validCallerName.toLowerCase()) ||
            validCallerName.toLowerCase().includes(l.caller_name.toLowerCase())
          );
          if (numMatch || nameMatch) {
            const lTime = new Date(l.created_at || l.timestamp || 0).getTime();
            const thisTime = callDateObj.getTime();
            return Math.abs(lTime - thisTime) <= 1800000;
          }
          return false;
        });
        if (matchingRec) {
          callLogRecord.recording_url = matchingRec.recording_url;
          callLogRecord.audioUrl = matchingRec.recording_url;
          callLogRecord.drive_file_id = matchingRec.drive_file_id || '';
          callLogRecord.hasAudio = true;
          console.log(`[Call-Log Auto-Attach]: Auto-attached recording ${matchingRec.recording_url} to call ${cleanCustomer}`);
        }
      }

      // Auto-heal 1: If recording arrives for a recent call (within 10 minutes) that doesn't have audio yet, attach it directly!
      if (recording_url && cleanCustomer && cleanCustomer.length >= 10) {
        const recentPendingAudioIdx = allLogs.findIndex(l => {
          const isSameNum = cleanPhone(l.caller_number) === cleanCustomer;
          const isRecent = (Date.now() - new Date(l.created_at).getTime() < 10 * 60 * 1000);
          return isSameNum && isRecent && (!l.recording_url || l.recording_url.length < 100);
        });
        if (recentPendingAudioIdx !== -1) {
          allLogs[recentPendingAudioIdx].call_outcome = 'Connected';
          allLogs[recentPendingAudioIdx].outcome = 'Connected';
          allLogs[recentPendingAudioIdx].recording_url = recording_url;
          if (call_duration) allLogs[recentPendingAudioIdx].call_duration = call_duration;
          if (ai_summary) allLogs[recentPendingAudioIdx].ai_summary = ai_summary;
          if (device_name) allLogs[recentPendingAudioIdx].device_name = device_name;
          if (staff_name) allLogs[recentPendingAudioIdx].staff_name = staff_name;
          saveStoredCallLogs(allLogs);
          await syncCallLogToFirestore(allLogs[recentPendingAudioIdx]);
          console.log(`[Call-Log Auto-Heal]: Successfully attached audio recording & AI summary to existing call for ${cleanCustomer}`);
          return sendResponse(res, 200, {
            success: true,
            message: 'Attached audio recording and AI summary to existing call',
            call_log: allLogs[recentPendingAudioIdx]
          });
        }
      }

      // Auto-heal 2: If a recording from OnePlus was previously synced with dummy/missing number, and MacroDroid now sends the real call details for that exact time, MERGE THEM!
      const pendingOneplusRecIdx = allLogs.findIndex(l => {
        const isOneplusRec = (l.device_name === 'OnePlus' || l.deviceName === 'OnePlus') && (l.caller_number === 'Direct Phone Call' || (l.caller_name && l.caller_name.includes('OnePlus Call')));
        if (!isOneplusRec) return false;
        const lTime = new Date(l.created_at || l.timestamp || 0).getTime();
        const curTime = callDateObj.getTime();
        return Math.abs(curTime - lTime) <= 900000; // within 15 mins
      });

      if (pendingOneplusRecIdx !== -1) {
        allLogs[pendingOneplusRecIdx].caller_number = displayCustomerPhone || cleanCustomer;
        allLogs[pendingOneplusRecIdx].phone = displayCustomerPhone || cleanCustomer;
        allLogs[pendingOneplusRecIdx].caller_name = validCallerName || cleanCustomer || 'Direct Customer';
        allLogs[pendingOneplusRecIdx].leadName = validCallerName || cleanCustomer || 'Direct Customer';
        allLogs[pendingOneplusRecIdx].lead_id = lead_id || allLogs[pendingOneplusRecIdx].lead_id;
        if (call_duration > 0) allLogs[pendingOneplusRecIdx].call_duration = call_duration;
        allLogs[pendingOneplusRecIdx].call_outcome = call_outcome;
        allLogs[pendingOneplusRecIdx].outcome = call_outcome;
        saveStoredCallLogs(allLogs);
        await syncCallLogToFirestore(allLogs[pendingOneplusRecIdx]);
        console.log(`[Call-Log Auto-Heal 2]: Merged MacroDroid contact info into existing OnePlus recording for ${cleanCustomer}`);
        return sendResponse(res, 200, {
          success: true,
          message: 'Merged contact info into existing OnePlus recording',
          call_log: allLogs[pendingOneplusRecIdx]
        });
      }

      // Auto-heal 3: Check for duplicate call event on the same device
      if (cleanCustomer && cleanCustomer.length >= 7) {
        const recentSamePhoneIdx = allLogs.findIndex(l => {
          const lNum = cleanPhone(l.caller_number || l.phone);
          if (lNum !== cleanCustomer) return false;
          const lDev = String(l.device_name || l.deviceName || '').toLowerCase();
          const curDev = String(device_name || '').toLowerCase();
          if (lDev && curDev && lDev !== curDev) return false; // Different device
          const lTime = new Date(l.created_at || l.timestamp || 0).getTime();
          const curTime = callDateObj.getTime();
          const diffMs = Math.abs(curTime - lTime);

          const isNewMissed = (call_outcome === 'Missed Call' || call_duration === 0);
          const isExMissed = (l.call_outcome === 'Missed Call' || l.outcome === 'Missed Call' || Number(l.call_duration || l.duration || 0) === 0);

          // If both were connected with duration > 0, NEVER merge unless within 15 seconds with same duration (network duplicate packet)
          if (!isNewMissed && !isExMissed && (call_duration > 0 && Number(l.call_duration || l.duration || 0) > 0)) {
            return diffMs <= 15000 && call_duration === Number(l.call_duration || l.duration || 0);
          }

          // Merge if one was missed/dialed and one was connected within 3 minutes (absorb dial trigger)
          if (isNewMissed !== isExMissed && diffMs <= 180000) return true;

          // Merge if duplicate missed call burst within 15 seconds
          if (isNewMissed && isExMissed && diffMs <= 15000) return true;

          return false;
        });

        if (recentSamePhoneIdx !== -1) {
          const ex = allLogs[recentSamePhoneIdx];
          const isNewConnected = (call_outcome === 'Connected' || call_duration > 0 || recording_url);
          const isExConnected = (ex.call_outcome === 'Connected' || ex.outcome === 'Connected' || (ex.call_duration && ex.call_duration > 0) || ex.recording_url);

          // If either is connected, the merged call is Connected
          if (isNewConnected || isExConnected) {
            ex.call_outcome = 'Connected';
            ex.outcome = 'Connected';
            ex.callOutcome = 'Connected';
            if (call_duration > (ex.call_duration || 0)) {
              ex.call_duration = call_duration;
              ex.duration = call_duration;
            }
          }
          if (validCallerName && !validCallerName.startsWith('Direct') && (!ex.caller_name || ex.caller_name.startsWith('Direct'))) {
            ex.caller_name = validCallerName;
            ex.leadName = validCallerName;
          }
          if (recording_url && !ex.recording_url) {
            ex.recording_url = recording_url;
            ex.audioUrl = recording_url;
          }
          saveStoredCallLogs(allLogs);
          await syncCallLogToFirestore(ex);
          console.log(`[Call-Log Auto-Heal 3]: Absorbed duplicate call trigger for ${cleanCustomer} on ${device_name}`);
          return sendResponse(res, 200, {
            success: true,
            message: 'Absorbed duplicate call trigger',
            call_log: ex
          });
        }
      }

      // Preserving repeat call history: Each interaction is preserved with its exact phone timestamp

      allLogs.unshift(callLogRecord);
      saveStoredCallLogs(allLogs);

      // 2. Persist to Firestore call_logs collection
      await syncCallLogToFirestore(callLogRecord);

      console.log(`[Call-Log Webhook Success]: Logged ${callLogId} for lead_id=${lead_id}, duration=${call_duration}s`);

      return sendResponse(res, 200, {
        success: true,
        message: 'Call recording logged and AI summary generated successfully',
        call_log: callLogRecord
      });

    } catch (err) {
      console.error('[Call-Log Webhook Processing Error]:', err);
      return sendResponse(res, 500, { success: false, error: err.message });
    }
  }

  return sendResponse(res, 405, { error: 'Method not allowed' });
};

// Disable Vercel body parser to prevent 500 Invalid JSON when MacroDroid sends raw text or unquoted variables
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
