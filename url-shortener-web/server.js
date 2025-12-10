const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const { nanoid } = require('nanoid');
const QRCode = require('qrcode');
const { insertUrl, getUrlByCode, listUrls } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: shorten URL
app.post('/api/shorten', async (req, res) => {
  try {
    const { url, alias, expire_days } = req.body;
    if (!url) return res.status(400).json({ error: 'Invalid url' });

    let code = alias ? alias : nanoid(7);

    const expires_at = expire_days
      ? new Date(Date.now() + expire_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    await insertUrl(code, url, expires_at);

    const short = `${BASE}/${code}`;
    const qrData = await QRCode.toDataURL(short);

    res.json({ code, short, qr: qrData });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Redirect short links
app.get('/:code', async (req, res) => {
  try {
    const row = await getUrlByCode(req.params.code);
    if (!row) return res.status(404).send('Not found');
    res.redirect(row.url);
  } catch (err) {
    res.status(500).send('Error');
  }
});

// Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at ${BASE}`);
});
