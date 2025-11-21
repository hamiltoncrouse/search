const express = require('express');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_LOG_ENTRIES = Number(process.env.MAX_LOG_ENTRIES || 50);
const LOG_PATH = path.join(__dirname, '..', 'data', 'search-log.json');

app.use(morgan('tiny'));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/search', async (req, res, next) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  if (!query) {
    return res.redirect('/');
  }

  try {
    await appendSearchEntry(query, req);
  } catch (error) {
    return next(error);
  }

  const imdbSearchUrl = new URL('https://www.imdb.com/find/');
  imdbSearchUrl.searchParams.set('s', 'tt');
  imdbSearchUrl.searchParams.set('q', query);

  res.redirect(imdbSearchUrl.toString());
});

app.get('/backstage', async (_req, res, next) => {
  try {
    const entries = await readLogEntries();
    res.send(renderBackstage(entries));
  } catch (error) {
    next(error);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).send('Something went sideways. Please try again.');
});

async function ensureLogFile() {
  try {
    await fs.access(LOG_PATH);
  } catch (_err) {
    await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
    await fs.writeFile(LOG_PATH, '[]', 'utf8');
  }
}

async function readLogEntries() {
  await ensureLogFile();
  const contents = await fs.readFile(LOG_PATH, 'utf8');
  try {
    const parsed = JSON.parse(contents);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

async function appendSearchEntry(query, req) {
  const entries = await readLogEntries();
  const entry = {
    query,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.headers['user-agent'] || 'unknown'
  };

  const updated = [entry, ...entries].slice(0, MAX_LOG_ENTRIES);
  await fs.writeFile(LOG_PATH, JSON.stringify(updated, null, 2));
}

function renderBackstage(entries) {
  const rows = entries
    .map((entry) => {
      const safeQuery = escapeHtml(entry.query);
      const safeTime = escapeHtml(new Date(entry.timestamp).toLocaleString());
      const safeIp = escapeHtml(entry.ip || '');
      const safeUa = escapeHtml(entry.userAgent || '');
      return `
        <tr>
          <td>${safeTime}</td>
          <td>${safeQuery}</td>
          <td>${safeIp}</td>
          <td>${safeUa}</td>
        </tr>
      `;
    })
    .join('') || '<tr><td colspan="4">No searches yet.</td></tr>';

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Backstage | IMDb Search Monitor</title>
        <style>
          :root {
            color-scheme: light dark;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          body {
            margin: 2rem;
            background: #0f172a;
            color: #f1f5f9;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1.5rem;
            font-size: 0.95rem;
          }
          th, td {
            border-bottom: 1px solid rgba(255, 255, 255, 0.15);
            padding: 0.5rem 0.75rem;
            text-align: left;
          }
          th {
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.08em;
            color: #38bdf8;
          }
        </style>
      </head>
      <body>
        <h1>Backstage</h1>
        <p>Newest searches are at the top. Reload to refresh.</p>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Query</th>
              <th>IP</th>
              <th>User Agent</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
