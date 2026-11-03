"""Assemble media-log.html (repo root) from the template and the catalog.

Run after build_db.py:  python3 tracker/build_db.py && python3 tracker/build_page.py
"""
import os

here = os.path.dirname(os.path.abspath(__file__))
template = open(os.path.join(here, "media-log.template.html"), encoding="utf-8").read()
lib = open(os.path.join(here, "lib.json"), encoding="utf-8").read()
assert "/*__LIB__*/" in template, "template is missing the data placeholder"
body = template.replace("/*__LIB__*/", lib)

# The published Claude artifact supplies its own <!doctype>/<head>; GitHub Pages needs a full document.
page = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '</head>\n<body>\n' + body + '\n</body>\n</html>\n')
out = os.path.join(here, "..", "media-log.html")
open(out, "w", encoding="utf-8").write(page)
print("wrote", os.path.normpath(out), len(page), "bytes")
