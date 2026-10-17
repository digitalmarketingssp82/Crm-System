const https = require('https');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Handle Meta & Xilot Webhook Verification (GET request)
  if (req.method === 'GET') {
    const mode = req.query ? req.query['hub.mode'] : '';
    const token = req.query ? (req.query['hub.verify_token'] || req.query['token']) : '';
    const challenge = req.query ? req.query['hub.challenge'] : '';

    if (mode === 'subscribe' && (token === 'sri_sri_ply_meta_verify_2026' || token === 'sri_xilot_live_sync_2026' || token === 'sri_web_inbound_key_99')) {
      console.log('[Webhook] Verification challenge accepted');
      return res.status(200).send(challenge);
    }
    return res.status(200).json({
      status: 'active',
      service: 'Sri Sri Plywoods CRM - Xilot & Meta Live Lead Ingestion Engine',
      supportedPipelines: ['p-walkin (Walkin-Sheet)', 'p-fb (Facebook Leads)', 'p-google (Google Leads)', 'p-whatsapp (WhatsApp Leads)'],
      time: new Date().toISOString()
    });
  }

  // 2. Handle Incoming Lead Data (POST request from Xilot, Meta Ads, or Zapier)
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch(e){}
      }
      body = body || {};

      console.log('[Webhook Inbound Payload]:', JSON.stringify(body));

      // Unwrap nested payloads (e.g. body.data, body.lead, body.payload, or Meta entry)
      let data = body.data || body.lead || body.payload || body;
      if (body.entry && Array.isArray(body.entry) && body.entry[0]) {
        data = body.entry[0].changes?.[0]?.value || body.entry[0];
      }

      // Extract Name
      const name = data.name || data.full_name || data.contact_name || 
                   (data.first_name ? (data.first_name + ' ' + (data.last_name || '')).trim() : '') || 
                   data.customer_name || 'New Inbound Client';

      // Extract Phone
      let phone = data.phone || data.mobile || data.phone_number || data.contact_phone || data.mobile_number || '';
      phone = String(phone).replace(/[^\d+]/g, '');

      // Extract Other Fields
      const email = data.email || data.contact_email || '';
      const city = data.city || data.location || '';
      const address = data.address || data.street_address || data.customerAddress || '';
      const material = data.material || data.materialType || data.requirement || '';
      const rawDealVal = data.dealValue || data.budget || data.deal_value || '';
      const dealValue = rawDealVal ? String(rawDealVal) : 'Not set';
      const budget = rawDealVal ? String(rawDealVal) : 'Not set';
      const notes = data.notes || data.message || data.requirement || '';

      // ==================== INTELLIGENT PIPELINE & SOURCE AUTO-ROUTING ====================
      const rawCheck = (
        (data.pipeline || '') + ' ' +
        (data.pipeline_name || '') + ' ' +
        (data.pipelineName || '') + ' ' +
        (data.pipelineId || '') + ' ' +
        (data.source || '') + ' ' +
        (data.lead_type || '') + ' ' +
        (data.leadType || '') + ' ' +
        (data.type || '') + ' ' +
        (data.form || '') + ' ' +
        (data.form_name || '') + ' ' +
        (data.campaign || '') + ' ' +
        (data.campaign_name || '') + ' ' +
        notes + ' ' + material
      ).toLowerCase();

      let pipelineId = 'p-walkin';
      let pipelineName = 'Walkin-Sheet';
      let source = 'Walk-in';
      let sourceDetails = '';
      let adPlatform = '';
      let campaignName = data.campaign || data.campaign_name || '';
      let adsetName = data.adset || data.adset_name || '';
      let adName = data.ad || data.ad_name || '';
      let formName = data.form || data.form_name || '';

      // 1. Check if Walk-in
      if (rawCheck.includes('walk') || rawCheck.includes('counter') || rawCheck.includes('store') || rawCheck.includes('showroom') || rawCheck.includes('offline') || rawCheck.includes('p-walkin')) {
        pipelineId = 'p-walkin';
        pipelineName = 'Walkin-Sheet';
        source = 'Walk-in';
      }
      // 2. Check if Google Ads
      else if (rawCheck.includes('google') || rawCheck.includes('gmb') || rawCheck.includes('adwords') || rawCheck.includes('p-google')) {
        pipelineId = 'p-google';
        pipelineName = 'Google Leads';
        source = 'Google Ads';
        adPlatform = 'Google';
      }
      // 3. Check if WhatsApp
      else if (rawCheck.includes('whatsapp') || /\bwa\b/.test(rawCheck) || rawCheck.includes('p-whatsapp')) {
        pipelineId = 'p-whatsapp';
        pipelineName = 'WhatsApp Leads';
        source = 'WhatsApp';
        adPlatform = 'WhatsApp';
      }
      // 4. Default: Meta / Facebook Ads (Instagram, Lead Forms, Ads Campaigns)
      else {
        pipelineId = 'p-fb';
        pipelineName = 'Facebook Leads';
        source = 'Facebook Ads';
        adPlatform = 'Meta Ads';
      }

      const leadId = 'lead-xilot-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      const nowIso = new Date().toISOString();

      // Firestore REST Document Schema
      const docFields = {
        id: { stringValue: leadId },
        name: { stringValue: String(name) },
        phone: { stringValue: String(phone) },
        email: { stringValue: String(email) },
        city: { stringValue: String(city) },
        address: { stringValue: String(address) },
        customerAddress: { stringValue: String(address) },
        materialType: { stringValue: String(material) },
        dealValue: { stringValue: String(dealValue) },
        budget: { stringValue: String(budget) },
        priority: { stringValue: 'medium' },
        stage: { stringValue: 'New Lead' },
        stageId: { stringValue: 'stg-1' },
        pipelineId: { stringValue: pipelineId },
        pipelineName: { stringValue: pipelineName },
        source: { stringValue: source },
        sourceDetails: { stringValue: String(sourceDetails) },
        campaignName: { stringValue: String(campaignName) },
        adsetName: { stringValue: String(adsetName) },
        adName: { stringValue: String(adName) },
        formName: { stringValue: String(formName) },
        adPlatform: { stringValue: String(adPlatform) },
        notes: { stringValue: String(notes) },
        status: { stringValue: 'New' },
        assignedToName: { stringValue: 'Sri Sri Admin' },
        assignedToEmail: { stringValue: 'sales.ssply@gmail.com' },
        tags: { stringValue: String(data.tags || '') },
        createdAt: { stringValue: nowIso },
        updatedAt: { stringValue: nowIso },
        lastActivityAt: { stringValue: nowIso },
        activities: {
          arrayValue: {
            values: [
              {
                mapValue: {
                  fields: {
                    id: { stringValue: 'act-' + Date.now() },
                    type: { stringValue: 'lead_created' },
                    note: { stringValue: `Lead ingested real-time from Xilot (${source}) into "${pipelineName}" pipeline.` },
                    author: { stringValue: 'Xilot Webhook Bridge' },
                    timestamp: { stringValue: nowIso }
                  }
                }
              }
            ]
          }
        }
      };

      // Check for test mode to prevent test data from polluting production Firestore
      if (req.isTest || (req.headers && req.headers['x-test-mode'] === 'true') || (req.body && req.body._isTest)) {
        return res.status(200).json({
          success: true,
          message: `Verified pipeline routing: ${pipelineName}`,
          leadId: leadId,
          pipelineId: pipelineId,
          pipelineName: pipelineName,
          source: source,
          name: name,
          phone: phone
        });
      }

      // Push to Firestore REST API
      const postData = JSON.stringify({ fields: docFields });
      const fUrl = '/v1/projects/crm-f4bf7/databases/(default)/documents/crm_leads?documentId=' + leadId;

      await new Promise((resolve) => {
        const firestoreReq = https.request({
          hostname: 'firestore.googleapis.com',
          path: fUrl,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        }, (fRes) => {
          let fData = '';
          fRes.on('data', chunk => fData += chunk);
          fRes.on('end', () => {
            console.log(`[Webhook Firestore Write]: status=${fRes.statusCode}, pipeline=${pipelineName}, lead=${name}`);
            resolve();
          });
        });

        firestoreReq.on('error', (err) => {
          console.error('[Webhook Firestore Error]:', err);
          resolve(); // Resolve to avoid hanging webhook caller
        });

        firestoreReq.write(postData);
        firestoreReq.end();
      });

      return res.status(200).json({
        success: true,
        message: `Lead successfully received from Xilot and entered into "${pipelineName}" pipeline!`,
        leadId: leadId,
        pipelineId: pipelineId,
        pipelineName: pipelineName,
        source: source,
        name: name,
        phone: phone
      });
    } catch (err) {
      console.error('[Webhook Handler Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
