# Anime-Media-Log

A static anime & manga log for GitHub Pages — plain HTML, CSS and JavaScript, no build step.

- `index.html` – page markup
- `styles.css` – styles (light and dark themes)
- `app.js` – loads `data.json`, renders the catalog, filters and the log editor
- `data.json` – the catalog plus your personal log fields

## Using the log

Every title has a **Log** button. Set a status, rating (1–10), progress, start/finish dates, notes,
or star it as a favorite. Edits are saved in your browser (`localStorage`) right away.

GitHub Pages can't write to the repository, so to publish your log:

1. Click **Export JSON** to download an updated `data.json` with your edits merged in.
2. Replace `data.json` in the repository with it and commit.

**Discard local edits** clears anything saved in the browser that hasn't been exported yet.

Filters (log status, media type, demographic, genre, publication status, sort, search) are kept in the
URL, so a filtered view can be bookmarked or shared.

## Data format

`data.json` (`schema_version: 1`) has `sources`, `enums` and an `items` array. Each item:

| Field | Meaning |
| --- | --- |
| `id`, `title` | Unique slug and display title |
| `media_type` | One of `enums.media_type`: `manga`, `anime_series`, `anime_film`, `light_novel`, `video_game` |
| `creators`, `publishers`, `demographics`, `genres` | String arrays |
| `volumes` | Total collected volumes (used as the progress total for manga and light novels) |
| `serialization` | `display`, `start_year`, `end_year`, `publication_status` (`ongoing`, `completed`, `hiatus`) |
| `popularity` | `sales_rank`, `approx_sales_millions`, `figure_is_circulation`, `includes_digital` |
| `related` | Related item ids |
| `user` | Your log: `status` (one of `enums["user.status"]` or `null`), `rating`, `progress`, `started`, `finished` (`YYYY-MM-DD`), `favorite`, `notes` |

For `anime_series` items, an optional `episodes` field is used as the progress total.

## Run locally

Browsers block `fetch` on `file://`, so serve the folder:

```bash
python3 -m http.server
```

Then open http://localhost:8000.

## Publish

In the repository's **Settings → Pages**, set the source to deploy from a branch, choose the branch and the `/ (root)` folder.
