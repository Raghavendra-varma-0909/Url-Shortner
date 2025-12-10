const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'urls.db');

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NULL
    );
  `);
});

// Insert new short URL
function insertUrl(code, url, expiresAt = null) {
  return new Promise((resolve, reject) => {
    const stmt = `INSERT INTO urls (code, url, expires_at) VALUES (?, ?, ?)`;
    db.run(stmt, [code, url, expiresAt], function (err) {
      if (err) return reject(err);
      resolve({
        id: this.lastID,
        code,
        url,
        expires_at: expiresAt
      });
    });
  });
}

// Get URL by short code
function getUrlByCode(code) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM urls WHERE code = ?`, [code], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

// List links
function listUrls(limit = 100, q = '') {
  return new Promise((resolve, reject) => {
    if (q) {
      const like = `%${q}%`;
      db.all(
        `SELECT * FROM urls 
         WHERE url LIKE ? OR code LIKE ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [like, like, limit],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    } else {
      db.all(
        `SELECT * FROM urls 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    }
  });
}

module.exports = {
  db,
  insertUrl,
  getUrlByCode,
  listUrls
};
