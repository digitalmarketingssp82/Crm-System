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
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Fallback: directly read bundled file if /tmp was empty
    const bundledPath = path.join(__dirname, '..', 'call_logs.json');
    if (fs.existsSync(bundledPath)) {
      const bContent = fs.readFileSync(bundledPath, 'utf8');
      const bParsed = JSON.parse(bContent);
      if (Array.isArray(bParsed)) return bParsed;
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
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

  // 1. Process actual audio via Gemini API if API key is provided
  if (geminiApiKey && audioUrl && audioUrl.length > 100) {
    try {
      console.log('[AI Worker] Calling Gemini API for audio transcription and summary...');
      const promptText = `You are an expert sales conversation analyst for Sri Sri Plywoods CRM.
Listen to this real customer phone call recording and transcribe the actual conversation.
Generate a concise, factual 3-bullet summary based strictly on what was spoken in this recording:
• Key Discussion: Summary of the real conversation between staff and caller
• Customer Requirement: Specific products mentioned (e.g. 19mm Gurjan plywood, flush doors, laminates, quantities, thickness, budget)
• Next Action Item: Follow-up required (quotation, site measurement, sample dispatch)
Strict Rule: Zero-Hallucination. Do NOT invent, assume, or hallucinate any details not spoken in the audio.`;

      let mimeType = 'audio/mp4';
      let b64Data = '';
      if (audioUrl.startsWith('data:')) {
        const parts = audioUrl.split(';base64,');
        mimeType = parts[0].replace('data:', '') || 'audio/mp4';
        b64Data = parts[1] || '';
      } else {
        b64Data = audioUrl;
      }

      const requestBody = JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: b64Data
                }
              },
              {
                text: promptText
              }
            ]
          }
        ]
      });

      const geminiResult = await new Promise((resolve) => {
        const req = https.request({
          hostname: 'generativelanguage.googleapis.com',
          path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
          },
          timeout: 25000
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              resolve(text || null);
            } catch (e) {
              resolve(null);
            }
          });
        });

        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.write(requestBody);
        req.end();
      });

      if (geminiResult && geminiResult.trim().length > 20) {
        return geminiResult.trim();
      }
    } catch (err) {
      console.warn('[AI Worker Gemini Exception]:', err.message);
    }
  }

  // 2. Strict Zero-Hallucination: If no audio recording was supplied, NEVER fabricate fake discussions!
  return 'Call connected with ' + (callerNumber || 'customer') + '. (Discussion complete / Awaiting phone voice recording)';
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
        call_outcome: { stringValue: String(callLogRecord.call_outcome || 'Baat Hui (Connected)') },
        staff_name: { stringValue: String(callLogRecord.staff_name || 'Staff') },
        device_name: { stringValue: String(callLogRecord.device_name || 'Android Phone') },
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
    https.get('https://firestore.googleapis.com/v1/projects/crm-f4bf7/databases/(default)/documents/call_logs', (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(d);
          if (!parsed.documents) return resolve([]);
          const logs = parsed.documents.map(doc => {
            const f = doc.fields || {};
            return {
              id: f.id?.stringValue || '',
              lead_id: f.lead_id?.stringValue || '',
              caller_number: f.caller_number?.stringValue || '',
              receiver_number: f.receiver_number?.stringValue || '',
              call_duration: parseInt(f.call_duration?.integerValue || 0, 10),
              recording_url: f.recording_url?.stringValue || '',
              ai_summary: f.ai_summary?.stringValue || '',
              direction: f.direction?.stringValue || 'INBOUND',
              call_outcome: f.call_outcome?.stringValue || 'Baat Hui (Connected)',
              staff_name: f.staff_name?.stringValue || 'Staff',
              device_name: f.device_name?.stringValue || 'Android Phone',
              created_at: f.created_at?.stringValue || ''
            };
          });
          resolve(logs);
        } catch(e) { resolve([]); }
      });
    }).on('error', () => resolve([]));
  });
}

// ==================== MAIN WEBHOOK HANDLER ====================
module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-webhook-token');

  if (req.method === 'OPTIONS') {
    if (res.status && typeof res.status === 'function') {
      return res.status(200).end();
    }
    res.writeHead(200);
    res.end();
    return;
  }

  // 1. GET: Webhook Probe & Status / Query Endpoint
  if (req.method === 'GET') {
    const query = req.query || {};
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

  // 2. POST: Inbound Call Recording Webhook Handler
  if (req.method === 'POST') {
    try {
      // 1. Collect full body buffer if not already parsed (supports direct binary and multipart uploads from Android)
      let rawBuffer = null;
      if (Buffer.isBuffer(req.body)) {
        rawBuffer = req.body;
      } else if (typeof req.body === 'string') {
        rawBuffer = Buffer.from(req.body);
      } else if (!req.body && req.readable) {
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
      if (typeof req.body === 'object' && !Buffer.isBuffer(req.body) && req.body !== null) {
        body = req.body;
      } else if (rawBuffer && rawBuffer.length > 0 && (cType.includes('application/json') || (!cType.includes('multipart') && !cType.includes('audio')))) {
        try { body = JSON.parse(rawBuffer.toString('utf8')); } catch(e){}
      }

      // Merge query parameters into body/data (e.g. from MacroDroid HTTP Request URL params)
      const query = req.query || {};
      for (const k of ['customer_number', 'caller_number', 'call_duration', 'staff_name', 'device_name', 'call_type', 'call_outcome', 'recording_url']) {
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

      // If audio sent as direct binary or multipart/form-data from Android phone
      if (!recording_url && rawBuffer && rawBuffer.length > 500) {
        if (cType.includes('audio') || cType.includes('octet-stream')) {
          recording_url = 'data:audio/mp4;base64,' + rawBuffer.toString('base64');
        } else if (cType.includes('multipart')) {
          const bufStr = rawBuffer.toString('binary');
          const fileMatch = bufStr.match(/filename="([^"]+)"[\r\n]+Content-Type: ([^\r\n]+)[\r\n]+[\r\n]+([\s\S]+?)(\r?\n--)/);
          if (fileMatch) {
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
      const rawCallerName = String(data.caller_name || data.callerName || data.contact_name || data.name || data.company || '').trim();
      const validCallerName = (rawCallerName && rawCallerName !== '{call_name}' && rawCallerName !== 'null' && rawCallerName !== 'undefined') ? rawCallerName : '';

      // Determine customer phone & handle spam / unknown / unsaved numbers cleanly
      let effectiveCustomerPhone = customer_number || caller_number || receiver_number || '';
      if (effectiveCustomerPhone === '{call_number}' || effectiveCustomerPhone === '?' || effectiveCustomerPhone.toLowerCase() === 'unknown') {
        effectiveCustomerPhone = '';
      }
      const cleanCustomer = cleanPhone(effectiveCustomerPhone);
      let displayCustomerPhone = '';
      if (cleanCustomer && cleanCustomer.length >= 10) {
        displayCustomerPhone = '+91' + cleanCustomer + (validCallerName ? (' (' + validCallerName + ')') : '');
      } else if (validCallerName) {
        displayCustomerPhone = validCallerName + (effectiveCustomerPhone ? (' (' + effectiveCustomerPhone + ')') : '');
      } else if (effectiveCustomerPhone) {
        displayCustomerPhone = effectiveCustomerPhone;
      } else {
        displayCustomerPhone = 'Spam / Unknown Incoming Caller';
      }

      // Extract Duration (in seconds)
      const rawDuration = data.call_duration || data.duration || data.CallDuration || data.duration_seconds || 0;
      const call_duration = parseInt(rawDuration, 10) || 0;

      // Extract Call Type & Direction (Inbound vs Outbound vs Missed)
      let rawType = String(data.call_type || data.type || data.direction || data.call_direction || '').toUpperCase();
      let isMissed = (data.is_missed === true || data.is_missed === 'true' || rawType.includes('MISSED') || String(data.call_outcome || '').toLowerCase().includes('missed'));

      // If duration > 0, the parties actually talked, so it cannot be missed
      if (call_duration > 0) {
        isMissed = false;
      }

      // Inbound is the universal default for phone companion sync
      let direction = 'INBOUND';
      if (rawType.includes('OUTBOUND') || rawType.includes('DIALED') || rawType.includes('OUTGOING')) {
        direction = 'OUTBOUND';
      }

      // Determine Call Outcome (Baat Hui vs Missed Call vs Call Not Picked)
      let call_outcome = data.call_outcome || data.outcome || data.status || '';
      if (!call_outcome) {
        if (isMissed || (call_duration === 0 && rawType.includes('MISSED'))) {
          call_outcome = 'Missed Call';
        } else if (direction === 'OUTBOUND' && call_duration === 0) {
          call_outcome = 'Call Not Picked / User Busy';
        } else if (call_duration > 0) {
          call_outcome = 'Baat Hui (Connected)';
        } else {
          call_outcome = isMissed ? 'Missed Call' : 'Baat Hui (Connected)';
        }
      }

      // Multi-Phone Staff & Device Identification (Supports 3-4 phones)
      const staff_name = String(data.staff_name || data.agent_name || data.staff || data.user_name || 'Sri Sri Staff').trim();
      const device_name = String(data.device_name || data.device || data.phone_name || 'Staff Android').trim();

      // Check if lead_id was explicitly supplied in payload
      let lead_id = data.lead_id || data.leadId || '';

      // Find relevant lead by phone number if lead_id not supplied
      if (!lead_id && cleanCustomer) {
        lead_id = 'lead-phone-' + cleanCustomer;
      }

      // If still no lead_id, generate fallback
      if (!lead_id) {
        lead_id = 'lead-incoming-' + Date.now();
      }

      // Speech-to-Text & AI Summary / Note Generation based on outcome
      let ai_summary = data.ai_summary || data.summary || '';
      if (!ai_summary || ai_summary.trim().length === 0) {
        if (call_outcome.includes('Missed')) {
          ai_summary = `🚨 Inbound Missed Call from customer ${displayCustomerPhone} on ${staff_name} (${device_name}). Customer wait kiya par call attend nahi ho payi — callback required.`;
        } else if (call_outcome.includes('Not Picked') || call_outcome.includes('Busy')) {
          ai_summary = `📞 Outbound call dialed by ${staff_name} (${device_name}) to ${effectiveCustomerPhone}. Customer did not pick up / phone busy.`;
        } else if (recording_url) {
          ai_summary = await generateAiCallSummary(recording_url, effectiveCustomerPhone, call_duration);
        } else {
          ai_summary = `Call connected (${formatCallDuration(call_duration)}) between ${staff_name} (${device_name}) and customer ${effectiveCustomerPhone}. (Discussion notes pending / Attach audio recording)`;
        }
      }

      // Unique Call Log Record adhering strictly to requested call_logs table schema:
      // (id, lead_id, caller_number, receiver_number, call_duration, recording_url, ai_summary, created_at)
      const callLogId = 'call-log-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      const nowIso = new Date().toISOString();

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
        created_at: nowIso
      };

      // 1. Persist to independent call_logs table / store
      const allLogs = getStoredCallLogs();
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
