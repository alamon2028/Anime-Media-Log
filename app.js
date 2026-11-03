(function () {
  "use strict";

  var DATA_URL = "data.json";

  var STATUS_ORDER = ["watching", "reading", "completed", "on-hold", "planned", "dropped"];
  var STATUS_LABELS = {
    watching: "Watching",
    reading: "Reading",
    completed: "Completed",
    "on-hold": "On hold",
    planned: "Planned",
    dropped: "Dropped"
  };

  var state = { entries: [], type: "all", status: "all", genre: "all", query: "", sort: "recent" };

  var el = {
    stats: document.getElementById("stats"),
    grid: document.getElementById("grid"),
    message: document.getElementById("message"),
    count: document.getElementById("result-count"),
    search: document.getElementById("search"),
    status: document.getElementById("status-filter"),
    genre: document.getElementById("genre-filter"),
    sort: document.getElementById("sort"),
    typeButtons: document.querySelectorAll("#type-filter button")
  };

  // ---------- Data normalisation ----------
  // Accepts a bare array, or an object holding the list under a common key,
  // or separate "anime" / "manga" arrays.
  function extractList(data) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== "object") return [];
    var keys = ["entries", "items", "media", "log", "list", "data"];
    for (var i = 0; i < keys.length; i++) {
      if (Array.isArray(data[keys[i]])) return data[keys[i]];
    }
    var out = [];
    ["anime", "manga"].forEach(function (t) {
      if (Array.isArray(data[t])) {
        data[t].forEach(function (e) { out.push(Object.assign({ type: t }, e)); });
      }
    });
    return out;
  }

  function pick(obj, names) {
    for (var i = 0; i < names.length; i++) {
      var v = obj[names[i]];
      if (v !== undefined && v !== null && v !== "") return v;
    }
    return null;
  }

  function toNumber(v) {
    if (v === null || v === undefined || v === "") return null;
    var n = Number(v);
    return isFinite(n) ? n : null;
  }

  function normaliseType(raw) {
    var t = String(raw || "").toLowerCase();
    if (/manga|manhwa|manhua|light novel|novel|book|comic|read/.test(t)) return "manga";
    return "anime";
  }

  function normaliseStatus(raw, type) {
    var s = String(raw || "").toLowerCase().replace(/[_\s]+/g, "-");
    if (/^(completed?|finished|done|watched|read)$/.test(s)) return "completed";
    if (/^(watching|reading|in-progress|current(ly)?(-watching|-reading)?|ongoing)$/.test(s)) {
      return type === "manga" ? "reading" : "watching";
    }
    if (/hold|paused/.test(s)) return "on-hold";
    if (/drop/.test(s)) return "dropped";
    if (/plan|want|backlog|ptw|ptr|to-(watch|read)|queue/.test(s)) return "planned";
    return s || "planned";
  }

  function toList(v) {
    if (Array.isArray(v)) return v.map(String).filter(Boolean);
    if (typeof v === "string") return v.split(/[,;|]/).map(function (s) { return s.trim(); }).filter(Boolean);
    return [];
  }

  function parseDate(v) {
    if (!v) return null;
    var d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  function normalise(raw, index) {
    var type = normaliseType(pick(raw, ["type", "media", "mediaType", "media_type", "format", "kind"]));
    var status = normaliseStatus(pick(raw, ["status", "state", "list", "watchStatus"]), type);
    var score = toNumber(pick(raw, ["score", "rating", "myScore", "my_score", "stars"]));
    var progress = toNumber(pick(raw, ["progress", "episodesWatched", "episodes_watched", "chaptersRead", "chapters_read", "watched", "read", "current"]));
    var total = toNumber(pick(raw, ["total", "episodes", "chapters", "volumes", "totalEpisodes", "total_episodes", "totalChapters", "total_chapters", "length"]));
    if (status === "completed" && progress === null && total !== null) progress = total;
    var unit = pick(raw, ["unit"]) || (type === "manga" ? "chapters" : "episodes");

    return {
      id: index,
      title: String(pick(raw, ["title", "name", "englishTitle", "title_english", "romaji"]) || "Untitled"),
      altTitle: pick(raw, ["altTitle", "japaneseTitle", "title_japanese", "native"]),
      type: type,
      status: status,
      score: score,
      progress: progress,
      total: total,
      unit: String(unit),
      year: toNumber(pick(raw, ["year", "releaseYear", "release_year", "aired", "published"])),
      genres: toList(pick(raw, ["genres", "genre", "tags"])),
      started: parseDate(pick(raw, ["started", "startDate", "start_date", "start", "dateStarted"])),
      finished: parseDate(pick(raw, ["finished", "finishDate", "finish_date", "end", "completed", "dateFinished"])),
      notes: pick(raw, ["notes", "note", "review", "comment", "comments"]),
      url: pick(raw, ["url", "link", "mal", "anilist"])
    };
  }

  // ---------- Rendering helpers ----------
  function h(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") node.textContent = attrs[k];
        else if (k === "class") node.className = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function fmtDate(d) {
    return d ? d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
  }

  function fmtScore(n) {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }

  function statusLabel(s) {
    return STATUS_LABELS[s] || s.replace(/-/g, " ").replace(/^\w/, function (c) { return c.toUpperCase(); });
  }

  function renderStats(entries) {
    var anime = entries.filter(function (e) { return e.type === "anime"; });
    var manga = entries.filter(function (e) { return e.type === "manga"; });
    var completed = entries.filter(function (e) { return e.status === "completed"; }).length;
    var episodes = anime.reduce(function (sum, e) { return sum + (e.progress || 0); }, 0);
    var chapters = manga.reduce(function (sum, e) { return sum + (e.unit === "volumes" ? 0 : (e.progress || 0)); }, 0);
    var scored = entries.filter(function (e) { return e.score !== null; });
    var mean = scored.length ? scored.reduce(function (s, e) { return s + e.score; }, 0) / scored.length : null;

    var items = [
      [anime.length, "Anime"],
      [manga.length, "Manga"],
      [completed, "Completed"],
      [episodes.toLocaleString(), "Episodes watched"],
      [chapters.toLocaleString(), "Chapters read"],
      [mean === null ? "–" : mean.toFixed(1), "Mean score"]
    ];

    el.stats.replaceChildren.apply(el.stats, items.map(function (it) {
      return h("div", { class: "stat" }, [
        h("div", { class: "value", text: String(it[0]) }),
        h("div", { class: "label", text: it[1] })
      ]);
    }));
  }

  function renderCard(e) {
    var titleNode = e.url
      ? h("a", { href: e.url, target: "_blank", rel: "noopener", text: e.title })
      : document.createTextNode(e.title);

    var metaParts = [e.type === "anime" ? "Anime" : "Manga"];
    if (e.year) metaParts.push(String(e.year));
    if (e.total) metaParts.push(e.total + " " + e.unit);

    var top = h("div", { class: "card-top" }, [
      h("div", null, [
        h("h2", null, [titleNode]),
        e.altTitle ? h("div", { class: "meta", text: e.altTitle }) : null,
        h("div", { class: "meta", text: metaParts.join(" · ") })
      ]),
      e.score !== null
        ? h("span", { class: "score", title: "Score", text: "★ " + fmtScore(e.score) })
        : h("span", { class: "score none", text: "unscored" })
    ]);

    var badges = h("div", { class: "badges" }, [
      h("span", { class: "badge status", "data-status": e.status, text: statusLabel(e.status) })
    ].concat(e.genres.map(function (g) { return h("span", { class: "badge", text: g }); })));

    var progress = null;
    if (e.progress !== null || (e.total && e.status !== "planned")) {
      var done = e.progress || 0;
      var pct = e.total ? Math.min(100, Math.round((done / e.total) * 100)) : null;
      var bar = h("div", { class: "bar", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(e.total || done), "aria-valuenow": String(done), "aria-label": "Progress" }, [
        h("span", { style: "width:" + (pct === null ? 100 : pct) + "%;" + (pct === null ? "opacity:.35" : "") })
      ]);
      progress = h("div", { class: "progress" }, [
        bar,
        h("span", { class: "count", text: done + " / " + (e.total || "?") + " " + e.unit })
      ]);
    }

    var dateText = [];
    if (e.started) dateText.push("Started " + fmtDate(e.started));
    if (e.finished) dateText.push("Finished " + fmtDate(e.finished));

    return h("article", { class: "card", "data-type": e.type }, [
      top,
      badges,
      progress,
      e.notes ? h("p", { class: "notes", text: e.notes }) : null,
      dateText.length ? h("div", { class: "dates", text: dateText.join(" · ") }) : null
    ]);
  }

  // ---------- Filtering & sorting ----------
  function activity(e) {
    var d = e.finished || e.started;
    return d ? d.getTime() : 0;
  }

  var sorters = {
    recent: function (a, b) {
      var rank = function (e) { return e.status === "watching" || e.status === "reading" ? 0 : 1; };
      return rank(a) - rank(b) || activity(b) - activity(a) || a.title.localeCompare(b.title);
    },
    score: function (a, b) { return (b.score ?? -1) - (a.score ?? -1) || a.title.localeCompare(b.title); },
    title: function (a, b) { return a.title.localeCompare(b.title); },
    year: function (a, b) { return (b.year || 0) - (a.year || 0) || a.title.localeCompare(b.title); },
    progress: function (a, b) {
      var p = function (e) { return e.total ? (e.progress || 0) / e.total : -1; };
      return p(b) - p(a) || a.title.localeCompare(b.title);
    }
  };

  function matches(e) {
    if (state.type !== "all" && e.type !== state.type) return false;
    if (state.status !== "all" && e.status !== state.status) return false;
    if (state.genre !== "all" && e.genres.indexOf(state.genre) === -1) return false;
    if (state.query) {
      var hay = [e.title, e.altTitle, e.notes, e.genres.join(" ")].join(" ").toLowerCase();
      if (hay.indexOf(state.query) === -1) return false;
    }
    return true;
  }

  function render() {
    var list = state.entries.filter(matches).sort(sorters[state.sort] || sorters.recent);
    el.grid.replaceChildren.apply(el.grid, list.map(renderCard));
    el.count.textContent = list.length + " of " + state.entries.length + " entries";
    if (!list.length) showMessage("Nothing matches these filters.");
    else el.message.hidden = true;
  }

  function showMessage(text, html) {
    el.message.hidden = false;
    if (html) el.message.innerHTML = html;
    else el.message.textContent = text;
  }

  function fillSelect(select, values, labeler) {
    values.forEach(function (v) {
      select.appendChild(h("option", { value: v, text: labeler ? labeler(v) : v }));
    });
  }

  // ---------- URL state (shareable filters) ----------
  function readHash() {
    var params = new URLSearchParams(location.hash.slice(1));
    ["type", "status", "genre", "sort"].forEach(function (k) { if (params.get(k)) state[k] = params.get(k); });
    if (params.get("q")) state.query = params.get("q").toLowerCase();
  }

  function writeHash() {
    var params = new URLSearchParams();
    if (state.type !== "all") params.set("type", state.type);
    if (state.status !== "all") params.set("status", state.status);
    if (state.genre !== "all") params.set("genre", state.genre);
    if (state.sort !== "recent") params.set("sort", state.sort);
    if (state.query) params.set("q", state.query);
    var str = params.toString();
    history.replaceState(null, "", str ? "#" + str : location.pathname + location.search);
  }

  function syncControls() {
    el.typeButtons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.type === state.type)); });
    el.status.value = state.status;
    el.genre.value = state.genre;
    el.sort.value = state.sort;
    el.search.value = state.query;
    // Fall back if the hash referenced a value that doesn't exist.
    if (el.status.value !== state.status) state.status = el.status.value = "all";
    if (el.genre.value !== state.genre) state.genre = el.genre.value = "all";
    if (el.sort.value !== state.sort) state.sort = el.sort.value = "recent";
  }

  function update() { writeHash(); render(); }

  function bind() {
    el.typeButtons.forEach(function (b) {
      b.addEventListener("click", function () {
        state.type = b.dataset.type;
        syncControls();
        update();
      });
    });
    el.search.addEventListener("input", function () { state.query = el.search.value.trim().toLowerCase(); update(); });
    el.status.addEventListener("change", function () { state.status = el.status.value; update(); });
    el.genre.addEventListener("change", function () { state.genre = el.genre.value; update(); });
    el.sort.addEventListener("change", function () { state.sort = el.sort.value; update(); });
  }

  // ---------- Boot ----------
  fetch(DATA_URL, { cache: "no-cache" })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      state.entries = extractList(data).map(normalise);

      var statuses = Array.from(new Set(state.entries.map(function (e) { return e.status; })))
        .sort(function (a, b) {
          var ia = STATUS_ORDER.indexOf(a), ib = STATUS_ORDER.indexOf(b);
          return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
        });
      var genres = Array.from(new Set([].concat.apply([], state.entries.map(function (e) { return e.genres; })))).sort();
      fillSelect(el.status, statuses, statusLabel);
      fillSelect(el.genre, genres);

      readHash();
      syncControls();
      bind();
      renderStats(state.entries);
      if (!state.entries.length) {
        showMessage("", "No entries found in <code>data.json</code>.");
        return;
      }
      render();
    })
    .catch(function (err) {
      var local = location.protocol === "file:";
      showMessage("", local
        ? "Couldn't load <code>data.json</code> from a local file. Serve the folder instead, e.g. <code>python3 -m http.server</code>, then open <code>http://localhost:8000</code>."
        : "Couldn't load <code>data.json</code> (" + String(err.message).replace(/[<>&]/g, "") + ").");
      console.error(err);
    });
})();
