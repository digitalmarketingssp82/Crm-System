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

  const driveUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;

  const headers = {};
  if (req.headers && req.headers.range) {
    headers['Range'] = req.headers.range;
  }

  https.get(driveUrl, { headers }, (driveRes) => {
    // Follow redirect if Google Drive redirects
    if (driveRes.statusCode >= 300 && driveRes.statusCode < 400 && driveRes.headers.location) {
      https.get(driveRes.headers.location, { headers }, (redirectRes) => {
        forwardAudio(redirectRes, res);
      }).on('error', (err) => {
        if (!res.headersSent) res.writeHead(502);
        res.end(err.message);
      });
      return;
    }

    forwardAudio(driveRes, res);
  }).on('error', (err) => {
    if (!res.headersSent) res.writeHead(502);
    res.end(err.message);
  });
};

function forwardAudio(sourceRes, targetRes) {
  const status = sourceRes.statusCode || 200;
  const outHeaders = {
    'Content-Type': 'audio/mp4',
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
