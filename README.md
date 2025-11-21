# IMDbSearch mentalism helper

A tiny Express app that looks like a generic search field for IMDb, then
quietly records the last few movie titles that people type. Send your subject
to the deployed page, tell them to search for their movie, and use the hidden
"backstage" link to see every recent query.

## How it works

- The landing page lives at `/` and posts the movie title to `/search`.
- `/search` stores the title (timestamp + IP + UA) in `data/search-log.json`
  and immediately redirects the visitor to the official IMDb results for that
  query.
- `/backstage` is a plain HTML table that lists the recorded searches with the
  newest entry first. The footer contains a barely-visible "." character that
  links there.

No external database is used—Render will simply write the log file onto the
instance disk. If the instance is restarted you start with a clean slate, which
is often desirable for a performance day.

## Getting started locally

```bash
npm install
npm run dev
```

The server defaults to `http://localhost:3000`. Visit the root page, enter a
movie, and you should be redirected to IMDb. Afterwards, refresh `/backstage`
(or click the hidden dot in the footer) to see your log.

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | Port Express listens on. Render injects its own value. |
| `MAX_LOG_ENTRIES` | `50` | Max number of search rows stored in the log file. |

## Deploying to Render

1. Create a new **Web Service** and connect this repo.
2. Build command: `npm install`
3. Start command: `npm start`
4. Select the default Node runtime (Render detects from `package.json`).

Render will expose the `PORT` variable automatically. The service stores
`data/search-log.json` on the instance's ephemeral disk; no extra storage add-on
is required. If you later purchase the `imdbsearch.com` domain, just point the
DNS to your Render service.

## Operational tips

- Bookmark `https://your-app.onrender.com/backstage` or just remember to click
  the discreet dot in the footer to reveal the control panel.
- Clear the log quickly by deleting `data/search-log.json` (or redeploying).
- The log includes the visitor IP/UA so you can confirm the request really came
  from the participant.
