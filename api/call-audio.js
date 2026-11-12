const https = require('https');
const url = require('url');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const fileId = parsedUrl.query.id || (req.query && req.query.id);

  if (!fileId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Missing audio file ID' }));
  }

  const driveUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`;

  const headers = { 'User-Agent': 'Mozilla/5.0' };
  if (req.headers && req.headers.range) {
    headers['Range'] = req.headers.range;
  }

  function fetchWithRedirects(targetUrl, depth = 0) {
    https.get(targetUrl, { headers }, (driveRes) => {
      if (driveRes.statusCode >= 300 && driveRes.statusCode < 400 && driveRes.headers.location && depth < 4) {
        driveRes.resume();
        let nextUrl = driveRes.headers.location;
        try { nextUrl = new URL(nextUrl, targetUrl).toString(); } catch(e) {}
        fetchWithRedirects(nextUrl, depth + 1);
        return;
      }
      forwardAudio(driveRes, res);
    }).on('error', (err) => {
      if (!res.headersSent) res.writeHead(502);
      res.end(err.message);
    });
  }

  fetchWithRedirects(driveUrl, 0);
};

function forwardAudio(sourceRes, targetRes) {
  const status = sourceRes.statusCode || 200;
  const contentType = sourceRes.headers['content-type'] || 'audio/mpeg';
  const outHeaders = {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
  };

  if (sourceRes.headers['content-range']) {
    outHeaders['Content-Range'] = sourceRes.headers['content-range'];
  }
  if (sourceRes.headers['content-length']) {
    outHeaders['Content-Length'] = sourceRes.headers['content-length'];
  }

  targetRes.writeHead(status, outHeaders);
  sourceRes.pipe(targetRes);
}
