# Anime-Media-Log

A static anime & manga log for GitHub Pages — plain HTML, CSS and JavaScript, no build step.

- `index.html` – page markup
- `styles.css` – styles (light and dark themes)
- `app.js` – loads `data.json` and renders stats, filters and entry cards
- `data.json` – your log (currently **sample data**; replace it with your own)

## Data format

`data.json` can be a bare array of entries, or an object with an `entries` array
(or separate `anime` and `manga` arrays). Each entry:

```json
{
  "title": "Frieren: Beyond Journey's End",
  "type": "anime",              // "anime" or "manga"
  "status": "completed",        // watching | reading | completed | on-hold | planned | dropped
  "score": 10,                  // optional, any numeric scale
  "progress": 28,               // episodes/chapters done
  "total": 28,                  // total episodes/chapters (null if unknown/ongoing)
  "unit": "episodes",           // optional, e.g. "volumes"
  "year": 2023,
  "genres": ["Fantasy", "Drama"],
  "started": "2024-01-05",
  "finished": "2024-03-22",
  "notes": "Optional notes",
  "url": "https://…"            // optional link
}
```

Common alternative names (`name`, `rating`, `episodes`, `chapters`, `genre`, etc.) are also recognised.

## Run locally

Browsers block `fetch` on `file://`, so serve the folder:

```bash
python3 -m http.server
```

Then open http://localhost:8000.

## Publish

In the repository's **Settings → Pages**, set the source to deploy from the branch and `/ (root)` folder.
