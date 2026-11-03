# Anime-Media-Log
## Media Log tracker (`media-log.html`)

A standalone tracker for 200 best-selling manga series, next to the main page:

- **Library**: search and filter by theme, audience, or your status.
- **My Ranking**: everything you've scored, best first.
- **Next Up**: untracked titles that share themes with what you rated highly.

Your log is saved in the browser you use.

To rebuild after editing the data or tags:

```
python3 tracker/build_db.py      # writes tracker/anime_media_db.json
python3 tracker/build_page.py    # writes media-log.html
```

Data comes from Wikipedia's [List of best-selling manga](https://en.wikipedia.org/wiki/List_of_best-selling_manga). The genre tags in `tracker/tags.py` were written by Claude, not taken from Wikipedia.
