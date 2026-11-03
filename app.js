(function () {
  "use strict";

  var DATA_URL = "data.json";
  var STORAGE_KEY = "anime-media-log:user-edits:v1";

  var DEFAULT_STATUSES = ["planned", "in_progress", "completed", "on_hold", "dropped"];
  var STATUS_ORDER = ["in_progress", "planned", "on_hold", "completed", "dropped"];
  var TYPE_LABELS = {
    manga: "Manga",
    anime_series: "Anime series",
    anime_film: "Anime film",
    light_novel: "Light novel",
    video_game: "Video game"
  };
  var PUB_LABELS = { ongoing: "Ongoing", completed: "Completed", hiatus: "On hiatus", cancelled: "Cancelled" };
  var EMPTY_USER = { status: null, rating: null, progress: null, started: null, finished: null, favorite: false, notes: "" };

  var doc = null;          // the parsed data.json
  var items = [];          // doc.items
  var edits = loadEdits(); // { [id]: user } overrides saved in this browser
  var editingId = null;

  var DEFAULT_STATE = { q: "", status: "all", type: "all", demo: "all", genre: "all", pub: "all", sort: "rank" };
  var state = Object.assign({}, DEFAULT_STATE);

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    tagline: $("tagline"), stats: $("stats"), grid: $("grid"), count: $("result-count"), message: $("message"),
    search: $("search"), status: $("f-status"), type: $("f-type"), demo: $("f-demo"), genre: $("f-genre"),
    pub: $("f-pub"), sort: $("sort"), clear: $("clear-btn"), exportBtn: $("export-btn"), resetBtn: $("reset-btn"),
    sources: $("sources"), dialog: $("editor"), form: $("editor-form")
  };

  // ---------- Persistence ----------
  function loadEdits() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveEdits() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(edits)); } catch (e) { /* storage unavailable */ }
    el.resetBtn.hidden = Object.keys(edits).length === 0;
  }

  function userOf(item) {
    return Object.assign({}, EMPTY_USER, item.user || {}, edits[item.id] || {});
  }
  function isLogged(u) {
    return !!(u.status || u.rating != null || u.progress != null || u.favorite || u.notes || u.started || u.finished);
  }
  function setUser(item, u) {
    var base = Object.assign({}, EMPTY_USER, item.user || {});
    var same = Object.keys(EMPTY_USER).every(function (k) { return (base[k] ?? null) === (u[k] ?? null); });
    if (same) delete edits[item.id]; else edits[item.id] = u;
    saveEdits();
  }

  // ---------- Labels & formatting ----------
  function typeLabel(t) { return TYPE_LABELS[t] || humanize(t); }
  function humanize(s) {
    s = String(s || "").replace(/[_-]+/g, " ");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function statusLabel(s, type) {
    if (s === "in_progress") {
      if (/^anime/.test(type)) return "Watching";
      if (type === "video_game") return "Playing";
      if (type === "manga" || type === "light_novel") return "Reading";
      return "In progress";
    }
    return humanize(s);
  }
  function unitOf(item) {
    if (item.media_type === "anime_series") return "episodes";
    if (item.media_type === "manga" || item.media_type === "light_novel") return "volumes";
    return null;
  }
  function totalOf(item) {
    if (item.media_type === "anime_series") return item.episodes ?? null;
    return item.volumes ?? null;
  }
  function fmtMillions(n) {
    if (n == null) return null;
    return (Number.isInteger(n) ? String(n) : String(+n.toFixed(2))) + "M";
  }
  function salesNote(p) {
    var bits = [p.figure_is_circulation ? "in circulation" : "copies sold"];
    if (p.includes_digital) bits.push("incl. digital");
    return bits.join(", ");
  }

  function h(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "text") node.textContent = v;
      else if (k === "class") node.className = v;
      else node.setAttribute(k, v === true ? "" : v);
    });
    (children || []).forEach(function (c) {
      if (c == null || c === false) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  // ---------- Stats ----------
  function renderStats() {
    var users = items.map(userOf);
    var logged = users.filter(isLogged).length;
    var count = function (s) { return users.filter(function (u) { return u.status === s; }).length; };
    var favs = users.filter(function (u) { return u.favorite; }).length;
    var vols = items.reduce(function (sum, it, i) {
      return sum + (unitOf(it) === "volumes" ? (users[i].progress || 0) : 0);
    }, 0);
    var rated = users.filter(function (u) { return u.rating != null; });
    var mean = rated.length ? rated.reduce(function (s, u) { return s + Number(u.rating); }, 0) / rated.length : null;

    var tiles = [
      [items.length, "Titles in catalog"],
      [logged, "In my log"],
      [count("in_progress"), "In progress"],
      [count("completed"), "Completed"],
      [vols.toLocaleString(), "Volumes read"],
      [favs, "Favorites"],
      [mean == null ? "–" : mean.toFixed(1), "Mean rating"]
    ];
    el.stats.replaceChildren.apply(el.stats, tiles.map(function (t) {
      return h("div", { class: "stat" }, [h("div", { class: "value", text: String(t[0]) }), h("div", { class: "label", text: t[1] })]);
    }));
  }

  // ---------- Cards ----------
  function renderCard(item) {
    var u = userOf(item);
    var ser = item.serialization || {};
    var pop = item.popularity || {};
    var unit = unitOf(item);
    var total = totalOf(item);

    var top = h("div", { class: "card-top" }, [
      pop.sales_rank != null ? h("div", { class: "rank", title: "Sales rank" }, [h("small", { text: "rank" }), "#" + pop.sales_rank]) : null,
      h("div", { class: "title-wrap" }, [
        h("h2", { text: item.title }),
        h("p", { class: "meta", text: (item.creators || []).join(", ") })
      ]),
      h("button", {
        type: "button", class: "fav", "data-action": "fav", "aria-pressed": String(!!u.favorite),
        "aria-label": (u.favorite ? "Remove " : "Add ") + item.title + (u.favorite ? " from" : " to") + " favorites",
        text: "★"
      })
    ]);

    var facts = h("div", { class: "facts" }, [
      h("span", null, [typeLabel(item.media_type)]),
      ser.display ? h("span", null, [ser.display]) : null,
      total != null && unit ? h("span", null, [h("b", { text: String(total) }), " " + unit]) : null,
      pop.approx_sales_millions != null ? h("span", { title: salesNote(pop) }, [h("b", { text: "~" + fmtMillions(pop.approx_sales_millions) }), " " + salesNote(pop)]) : null
    ]);

    var sub = [].concat(item.publishers || [], item.demographics || []).join(" · ");

    var badges = h("div", { class: "badges" }, [
      ser.publication_status && ser.publication_status !== "completed"
        ? h("span", { class: "badge pub-" + ser.publication_status, text: PUB_LABELS[ser.publication_status] || humanize(ser.publication_status) })
        : null
    ].concat((item.genres || []).map(function (g) {
      return h("button", { type: "button", class: "badge", "data-action": "genre", "data-genre": g, title: "Filter by " + humanize(g), text: humanize(g) });
    })));

    var logBits = [];
    logBits.push(u.status
      ? h("span", { class: "pill", text: statusLabel(u.status, item.media_type) })
      : h("span", { class: "pill none", text: "Not logged" }));
    if (u.rating != null) logBits.push(h("span", { class: "score", title: "My rating", text: "★ " + u.rating }));
    if (u.progress != null && unit) {
      var pct = total ? Math.min(100, Math.round((u.progress / total) * 100)) : null;
      if (pct != null) logBits.push(h("div", { class: "bar", role: "progressbar", "aria-label": "Progress", "aria-valuemin": "0", "aria-valuemax": String(total), "aria-valuenow": String(u.progress) }, [h("span", { style: "width:" + pct + "%" })]));
      logBits.push(h("span", { class: "count", text: u.progress + " / " + (total ?? "?") + " " + unit.replace(/s$/, (total === 1 ? "" : "s")) }));
    } else {
      logBits.push(h("span", { class: "spacer" }));
    }
    logBits.push(h("button", { type: "button", class: "btn ghost", "data-action": "edit", text: isLogged(u) ? "Edit" : "Log" }));

    return h("article", { class: "card" + (u.status ? " status-" + u.status : ""), "data-id": item.id }, [
      top,
      sub ? h("p", { class: "meta", text: sub }) : null,
      facts,
      badges,
      u.notes ? h("p", { class: "notes", text: u.notes }) : null,
      h("div", { class: "log" }, logBits)
    ]);
  }

  // ---------- Filtering & sorting ----------
  function haystack(item) {
    return [item.title, (item.creators || []).join(" "), (item.publishers || []).join(" "),
      (item.genres || []).join(" "), (item.demographics || []).join(" "), userOf(item).notes]
      .join(" ").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  function normQuery(q) { return q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim(); }

  function matches(item) {
    var u = userOf(item);
    if (state.status === "logged" && !isLogged(u)) return false;
    if (state.status === "unlogged" && isLogged(u)) return false;
    if (state.status === "favorite" && !u.favorite) return false;
    if (!/^(all|logged|unlogged|favorite)$/.test(state.status) && u.status !== state.status) return false;
    if (state.type !== "all" && item.media_type !== state.type) return false;
    if (state.demo !== "all" && (item.demographics || []).indexOf(state.demo) === -1) return false;
    if (state.genre !== "all" && (item.genres || []).indexOf(state.genre) === -1) return false;
    if (state.pub !== "all" && (item.serialization || {}).publication_status !== state.pub) return false;
    if (state.q) {
      var words = normQuery(state.q).split(/\s+/);
      var hay = haystack(item);
      if (!words.every(function (w) { return hay.indexOf(w) !== -1; })) return false;
    }
    return true;
  }

  var rankOf = function (it) { var r = (it.popularity || {}).sales_rank; return r == null ? Infinity : r; };
  var byRank = function (a, b) { return rankOf(a) - rankOf(b); };
  var startOf = function (it) { return (it.serialization || {}).start_year || 0; };
  var sorters = {
    rank: byRank,
    title: function (a, b) { return a.title.localeCompare(b.title); },
    newest: function (a, b) { return startOf(b) - startOf(a) || byRank(a, b); },
    oldest: function (a, b) { return (startOf(a) || 9999) - (startOf(b) || 9999) || byRank(a, b); },
    volumes: function (a, b) { return (totalOf(b) || 0) - (totalOf(a) || 0) || byRank(a, b); },
    rating: function (a, b) {
      var ra = userOf(a).rating, rb = userOf(b).rating;
      return (rb ?? -1) - (ra ?? -1) || byRank(a, b);
    }
  };

  function render() {
    var list = items.filter(matches).sort(sorters[state.sort] || byRank);
    el.grid.replaceChildren.apply(el.grid, list.map(renderCard));
    el.count.textContent = list.length === items.length
      ? items.length + " titles"
      : list.length + " of " + items.length + " titles";
    el.message.hidden = list.length > 0;
    if (!list.length) el.message.textContent = "Nothing matches these filters.";
    renderStats();
  }

  // ---------- Controls ----------
  function fill(select, values, label) {
    values.forEach(function (v) { select.appendChild(h("option", { value: v, text: label ? label(v) : v })); });
  }
  function uniq(arr) { return Array.from(new Set(arr)).filter(function (v) { return v != null && v !== ""; }); }

  function buildFilters() {
    var enumStatuses = (doc.enums && doc.enums["user.status"]) || DEFAULT_STATUSES;
    var statuses = STATUS_ORDER.filter(function (s) { return enumStatuses.indexOf(s) !== -1; })
      .concat(enumStatuses.filter(function (s) { return STATUS_ORDER.indexOf(s) === -1; }));
    fill(el.status, ["logged", "unlogged", "favorite"], function (v) {
      return { logged: "In my log", unlogged: "Not logged", favorite: "Favorites" }[v];
    });
    fill(el.status, statuses, function (s) { return statusLabel(s); });

    var types = uniq(items.map(function (i) { return i.media_type; }));
    fill(el.type, types, typeLabel);
    el.type.parentNode.hidden = types.length < 2;

    fill(el.demo, uniq([].concat.apply([], items.map(function (i) { return i.demographics || []; }))).sort());
    fill(el.genre, uniq([].concat.apply([], items.map(function (i) { return i.genres || []; }))).sort(), humanize);
    fill(el.pub, uniq(items.map(function (i) { return (i.serialization || {}).publication_status; })), function (p) { return PUB_LABELS[p] || humanize(p); });

    // Rating and status options in the editor.
    var rating = el.form.elements.rating;
    for (var r = 10; r >= 1; r--) rating.appendChild(h("option", { value: String(r), text: String(r) }));
    fill(el.form.elements.status, enumStatuses, function (s) { return statusLabel(s); });
  }

  var controlMap = { q: "search", status: "status", type: "type", demo: "demo", genre: "genre", pub: "pub", sort: "sort" };

  function syncControls() {
    Object.keys(controlMap).forEach(function (k) {
      var c = el[controlMap[k]];
      c.value = state[k];
      if (c.tagName === "SELECT" && c.value !== state[k]) state[k] = c.value = DEFAULT_STATE[k];
    });
  }

  function readHash() {
    var p = new URLSearchParams(location.hash.slice(1));
    Object.keys(DEFAULT_STATE).forEach(function (k) { if (p.has(k)) state[k] = p.get(k); });
  }
  function writeHash() {
    var p = new URLSearchParams();
    Object.keys(DEFAULT_STATE).forEach(function (k) { if (state[k] !== DEFAULT_STATE[k]) p.set(k, state[k]); });
    var s = p.toString();
    history.replaceState(null, "", s ? "#" + s : location.pathname + location.search);
  }
  function update() { writeHash(); render(); }

  function bindControls() {
    el.search.addEventListener("input", function () { state.q = el.search.value; update(); });
    ["status", "type", "demo", "genre", "pub", "sort"].forEach(function (k) {
      el[k].addEventListener("change", function () { state[k] = el[k].value; update(); });
    });
    el.clear.addEventListener("click", function () {
      state = Object.assign({}, DEFAULT_STATE, { sort: state.sort });
      syncControls(); update();
    });

    el.grid.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]");
      if (!btn) return;
      var card = btn.closest(".card");
      var item = card && findItem(card.dataset.id);
      if (btn.dataset.action === "genre") {
        state.genre = btn.dataset.genre; syncControls(); update();
        el.genre.scrollIntoView({ block: "nearest" });
      } else if (btn.dataset.action === "fav" && item) {
        var u = userOf(item); u.favorite = !u.favorite; setUser(item, u); rerenderCard(item);
      } else if (btn.dataset.action === "edit" && item) {
        openEditor(item);
      }
    });

    el.exportBtn.addEventListener("click", exportJson);
    el.resetBtn.addEventListener("click", function () {
      var n = Object.keys(edits).length;
      if (!confirm("Discard " + n + " unsaved log edit" + (n === 1 ? "" : "s") + " stored in this browser?")) return;
      edits = {}; saveEdits(); render();
    });
  }

  function findItem(id) { for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i]; return null; }

  function rerenderCard(item) {
    var old = el.grid.querySelector('.card[data-id="' + CSS.escape(item.id) + '"]');
    if (old && matches(item)) {
      var fresh = renderCard(item);
      old.replaceWith(fresh);
      renderStats();
      return fresh;
    }
    render();
    return null;
  }

  // ---------- Editor ----------
  function openEditor(item) {
    editingId = item.id;
    var u = userOf(item);
    var f = el.form.elements;
    var unit = unitOf(item), total = totalOf(item);
    $("editor-title").textContent = item.title;
    $("editor-sub").textContent = [typeLabel(item.media_type), (item.serialization || {}).display].filter(Boolean).join(" · ");
    f.status.value = u.status || "";
    f.rating.value = u.rating == null ? "" : String(u.rating);
    f.progress.value = u.progress == null ? "" : String(u.progress);
    f.progress.disabled = !unit;
    $("progress-hint").textContent = unit ? "(" + unit + (total != null ? " of " + total : "") + ")" : "";
    f.favorite.checked = !!u.favorite;
    f.started.value = u.started || "";
    f.finished.value = u.finished || "";
    f.notes.value = u.notes || "";
    el.dialog.showModal();
    f.status.focus();
  }

  function readEditor(item) {
    var f = el.form.elements;
    var total = totalOf(item);
    var prog = f.progress.value === "" ? null : Math.max(0, Math.floor(Number(f.progress.value)));
    if (prog != null && !isFinite(prog)) prog = null;
    var u = Object.assign({}, userOf(item), {
      status: f.status.value || null,
      rating: f.rating.value === "" ? null : Number(f.rating.value),
      progress: prog,
      favorite: f.favorite.checked,
      started: f.started.value || null,
      finished: f.finished.value || null,
      notes: f.notes.value.trim()
    });
    if (u.status === "completed" && u.progress == null && total != null && unitOf(item)) u.progress = total;
    return u;
  }

  function closeEditor() { el.dialog.close(); editingId = null; }

  function bindEditor() {
    el.form.addEventListener("submit", function (e) {
      e.preventDefault();
      var item = findItem(editingId);
      if (item) { setUser(item, readEditor(item)); rerenderCard(item); }
      closeEditor();
    });
    $("editor-cancel").addEventListener("click", closeEditor);
    $("editor-close").addEventListener("click", closeEditor);
    $("editor-clear").addEventListener("click", function () {
      var item = findItem(editingId);
      if (item) { setUser(item, Object.assign({}, EMPTY_USER)); rerenderCard(item); }
      closeEditor();
    });
    el.dialog.addEventListener("click", function (e) { if (e.target === el.dialog) closeEditor(); });
  }

  // ---------- Export ----------
  function exportJson() {
    var out = Object.assign({}, doc, {
      items: items.map(function (it) { return Object.assign({}, it, { user: userOf(it) }); })
    });
    var blob = new Blob([JSON.stringify(out, null, 2) + "\n"], { type: "application/json" });
    var a = h("a", { href: URL.createObjectURL(blob), download: "data.json" });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  // ---------- Footer ----------
  function renderSources() {
    var parts = [];
    (doc.sources || []).forEach(function (s) {
      parts.push(h("p", null, [
        "Source: ",
        s.url ? h("a", { href: s.url, target: "_blank", rel: "noopener", text: s.name || s.url }) : (s.name || ""),
        s.retrieved ? " (retrieved " + s.retrieved + ")" : "",
        s.notes ? ". " + s.notes : ""
      ]));
    });
    parts.push(h("p", null, [
      "Catalog generated " + (doc.generated || "—") + ". Log edits are saved in this browser; use ",
      h("b", { text: "Export JSON" }), " and commit the file to publish them."
    ]));
    el.sources.replaceChildren.apply(el.sources, parts);
  }

  // ---------- Boot ----------
  fetch(DATA_URL, { cache: "no-cache" })
    .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(function (data) {
      doc = data;
      items = Array.isArray(data.items) ? data.items : [];
      // Drop stored edits for titles no longer in the catalog.
      Object.keys(edits).forEach(function (id) { if (!findItem(id)) delete edits[id]; });
      saveEdits();

      el.tagline.textContent = items.length + " titles in the catalog. Track what you've read and watched.";
      buildFilters();
      readHash();
      syncControls();
      bindControls();
      bindEditor();
      renderSources();
      if (!items.length) {
        el.message.hidden = false;
        el.message.innerHTML = "No items found in <code>data.json</code>.";
        renderStats();
        return;
      }
      render();
    })
    .catch(function (err) {
      console.error(err);
      el.message.hidden = false;
      el.message.innerHTML = location.protocol === "file:"
        ? "Couldn't load <code>data.json</code> from a local file. Serve the folder instead, e.g. <code>python3 -m http.server</code>, then open <code>http://localhost:8000</code>."
        : "Couldn't load <code>data.json</code>.";
    });
})();
