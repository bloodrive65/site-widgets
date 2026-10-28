// bloodrive65 Projects — Wix Custom Element  (tag name: github-projects)
// Hosted at https://bloodrive65.github.io/site-widgets/github-projects.js
//
// Everything on this page comes from GitHub automatically:
//  - Featured: any public repo that has a Website link or a Release (or the "featured" topic)
//  - More projects: every other public repo
//  - Hide a repo: give it the "hidden" topic on GitHub (or add it to HIDE below)
//  - Tools I use: the badges under "## Tools I use" in the profile README
// The element sizes itself to its content, so the Wix page never needs resizing.

(() => {
const USER = "bloodrive65";
const HIDE = [USER, "PS4-Game-Saves-Database"];
const CACHE_MINUTES = 15;
const LANG_COLORS = { JavaScript: "#f1e05a", Python: "#3572A5", "C#": "#178600", HTML: "#e34c26", CSS: "#663399", TypeScript: "#3178c6" };
const API = "https://api.github.com";

const STYLE = `
:host { display:block; width:100%;
  --bg:#1e1e22; --bg2:#26262b; --border:#3d3d45; --text:#f0f0f3; --muted:#a8a8b3;
  --accent:#e0502a; --accent2:#ff7a45; --link:#6cb6ff; --green:#3fb950;
  color:var(--text); font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; line-height:1.5; }
* { box-sizing:border-box; }
a { color:inherit; }
.wrap { max-width:960px; margin:0 auto; padding:24px 16px 32px; }

.hero { display:flex; align-items:center; gap:20px; background:var(--bg); border:1px solid var(--border);
  border-radius:14px; padding:24px; }
.hero img { width:84px; height:84px; border-radius:50%; border:2px solid var(--border); background:#111; flex:none; }
.hero h1 { margin:0; font-size:26px; }
.hero p { margin:4px 0 10px; color:var(--muted); }
.hero .facts { display:flex; flex-wrap:wrap; gap:8px; font-size:13px; }
.chip { background:var(--bg2); border:1px solid var(--border); border-radius:999px; padding:3px 10px; color:var(--muted); white-space:nowrap; }
.chip b { color:var(--text); font-weight:600; }

h2 { font-size:20px; margin:36px 0 6px; }
.sub { color:var(--muted); font-size:14px; margin:0 0 14px; }

.featured { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:16px; }
.fcard { background:var(--bg); border:1px solid var(--border); border-radius:14px; padding:22px;
  display:flex; flex-direction:column; gap:12px; border-top:3px solid var(--accent); }
.fcard h3 { margin:0; font-size:20px; }
.fcard p { margin:0; color:var(--muted); font-size:15px; flex:1; }
.stats { display:flex; flex-wrap:wrap; gap:8px; font-size:13px; }
.btns { display:flex; flex-wrap:wrap; gap:10px; margin-top:4px; }
.btn { display:inline-block; text-decoration:none; font-weight:600; font-size:14px; padding:9px 16px; border-radius:8px;
  border:1px solid var(--border); background:var(--bg2); color:var(--text); transition:filter .15s, border-color .15s; }
.btn:hover { border-color:var(--muted); }
.btn.primary { background:var(--accent); border-color:var(--accent); color:#fff; }
.btn.primary:hover { filter:brightness(1.12); }

.grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px; }
.card { background:var(--bg); border:1px solid var(--border); border-radius:12px; padding:16px; text-decoration:none;
  display:flex; flex-direction:column; gap:8px; transition:border-color .15s, transform .15s; }
.card:hover { border-color:var(--link); transform:translateY(-2px); }
.card h4 { margin:0; font-size:16px; color:var(--link); }
.card p { margin:0; color:var(--muted); font-size:14px; flex:1; }
.meta { display:flex; flex-wrap:wrap; gap:12px; font-size:12px; color:var(--muted); align-items:center; }
.dot { display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:5px; vertical-align:-1px; }

.tools { display:flex; flex-wrap:wrap; gap:6px; }
.tools img { height:22px; }
.activity { display:flex; flex-wrap:wrap; gap:12px; justify-content:center; }
.activity img { height:165px; max-width:100%; }

.foot { margin-top:32px; text-align:center; font-size:13px; color:var(--muted); }
.foot a { color:var(--link); }
.status { color:var(--muted); }

@media (max-width:600px) {
  .hero { flex-direction:column; text-align:center; padding:20px; }
  .hero .facts { justify-content:center; }
  .featured { grid-template-columns:1fr; }
  .btn { flex:1 1 auto; text-align:center; white-space:nowrap; }
  .btn.primary { flex-basis:100%; }
}`;

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));

// "live-recording-analyzer" -> "Live Recording Analyzer"; leaves "confetti.min.js" alone
const prettyName = n => n.includes(".") ? n
  : n.split(/[-_]+/).map(w => /^[A-Z0-9]+$/.test(w) || w.length <= 2 && w !== w.toLowerCase() ? w : w[0].toUpperCase() + w.slice(1)).join(" ")
     .replace(/\bAi\b/, "AI");

function ago(iso) {
  const days = Math.floor((Date.now() - new Date(iso)) / 864e5);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const m = Math.floor(days / 30.4);
  if (m < 12) return m === 1 ? "1 month ago" : `${m} months ago`;
  const y = Math.floor(days / 365);
  return y === 1 ? "1 year ago" : `${y} years ago`;
}

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status + " " + url);
  return r.json();
}

async function loadData() {
  const KEY = "gh-site-" + USER;
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  if (cached && Date.now() - cached.t < CACHE_MINUTES * 60000) return cached.d;
  try {
    const [user, repos, readme] = await Promise.all([
      getJSON(`${API}/users/${USER}`),
      getJSON(`${API}/users/${USER}/repos?per_page=100&sort=pushed`),
      fetch(`https://raw.githubusercontent.com/${USER}/${USER}/HEAD/README.md`).then(r => r.ok ? r.text() : "").catch(() => "")
    ]);
    const visible = repos.filter(r => !r.fork && !r.archived && !HIDE.includes(r.name) && !(r.topics || []).includes("hidden"));
    // Releases for each repo with a website or "featured" topic, plus any repo that might have releases
    const releases = {};
    await Promise.all(visible.slice(0, 12).map(async r => {
      try {
        const list = await getJSON(`${API}/repos/${USER}/${r.name}/releases?per_page=100`);
        if (list.length) releases[r.name] = {
          tag: list[0].tag_name,
          url: list[0].html_url,
          downloads: list.reduce((s, rel) => s + rel.assets.reduce((a, x) => a + x.download_count, 0), 0)
        };
      } catch (e) {}
    }));
    const d = { user, repos: visible, readme, releases };
    try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d })); } catch (e) {}
    return d;
  } catch (e) {
    if (cached) return cached.d;
    throw e;
  }
}

function toolsFromReadme(md) {
  const sec = md.split(/^##\s+/m).find(s => /^tools i use/i.test(s));
  if (!sec) return [];
  return [...sec.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)].map(m => ({ alt: m[1], src: m[2] }));
}

function langChip(lang) {
  return lang ? `<span><span class="dot" style="background:${LANG_COLORS[lang] || "#8b949e"}"></span>${esc(lang)}</span>` : "";
}

function render(root, { user, repos, readme, releases }) {
  const isFeatured = r => r.homepage || releases[r.name] || (r.topics || []).includes("featured");
  const featured = repos.filter(isFeatured);
  const others = repos.filter(r => !isFeatured(r));
  const tools = toolsFromReadme(readme);

  const featuredHTML = featured.map(r => {
    const rel = releases[r.name];
    const playable = /\b(play|game)\b/i.test(r.description || "");
    const btns = [];
    if (r.homepage) btns.push(`<a class="btn primary" href="${esc(r.homepage)}">${playable ? "Play now" : "Visit website"}</a>`);
    if (rel) btns.push(`<a class="btn ${btns.length ? "" : "primary"}" href="https://github.com/${USER}/${esc(r.name)}/releases/latest">Download ${esc(rel.tag)}</a>`);
    btns.push(`<a class="btn" href="${esc(r.html_url)}">View code</a>`);
    return `<div class="fcard">
      <h3>${esc(prettyName(r.name))}</h3>
      <p>${esc(r.description || "No description yet.")}</p>
      <div class="stats">
        ${r.language ? `<span class="chip">${langChip(r.language)}</span>` : ""}
        ${rel ? `<span class="chip">Version <b>${esc(rel.tag)}</b></span>` : ""}
        ${rel && rel.downloads ? `<span class="chip"><b>${rel.downloads}</b> downloads</span>` : ""}
        <span class="chip">Updated <b>${ago(r.pushed_at)}</b></span>
      </div>
      <div class="btns">${btns.join("")}</div>
    </div>`;
  }).join("");

  const othersHTML = others.map(r => `
    <a class="card" href="${esc(r.html_url)}">
      <h4>${esc(prettyName(r.name))}</h4>
      <p>${esc(r.description || "No description yet.")}</p>
      <div class="meta">${langChip(r.language)}<span>Updated ${ago(r.pushed_at)}</span></div>
    </a>`).join("");

  root.querySelector(".wrap").innerHTML = `
    <section class="hero">
      <img src="${esc(user.avatar_url)}" alt="${esc(user.login)} avatar">
      <div>
        <h1>${esc(user.name || user.login)}</h1>
        <p>${esc(user.bio || "")}</p>
        <div class="facts">
          <span class="chip"><b>${repos.length}</b> projects</span>
          ${user.location ? `<span class="chip">${esc(user.location)}</span>` : ""}
          <a class="chip" href="${esc(user.html_url)}" style="text-decoration:none">GitHub profile →</a>
        </div>
      </div>
    </section>

    ${featured.length ? `<h2>Featured projects</h2>
    <p class="sub">Finished apps and games you can use or play right now.</p>
    <div class="featured">${featuredHTML}</div>` : ""}

    ${others.length ? `<h2>More projects</h2>
    <p class="sub">Smaller tools, experiments and works in progress. Click any card to see it on GitHub.</p>
    <div class="grid">${othersHTML}</div>` : ""}

    ${tools.length ? `<h2>Tools I use</h2>
    <div class="tools">${tools.map(t => `<img src="${esc(t.src)}" alt="${esc(t.alt)}" title="${esc(t.alt)}" loading="lazy">`).join("")}</div>` : ""}

    <h2>Activity</h2>
    <div class="activity">
      <img src="https://github-profile-summary-cards.vercel.app/api/cards/stats?username=${USER}&theme=github_dark" alt="GitHub stats" loading="lazy">
      <img src="https://github-profile-summary-cards.vercel.app/api/cards/repos-per-language?username=${USER}&theme=github_dark" alt="Top languages" loading="lazy">
    </div>

    <p class="foot">This page updates itself from <a href="${esc(user.html_url)}">my GitHub</a>. New projects appear here automatically.</p>`;

  root.querySelectorAll("a").forEach(a => { a.target = "_blank"; a.rel = "noopener"; });
}

class GithubProjects extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${STYLE}</style><div class="wrap"><p class="status">Loading projects…</p></div>`;
    loadData().then(d => render(root, d)).catch(() => {
      root.querySelector(".wrap").innerHTML = `<p class="status">Projects couldn't load right now. <a style="color:var(--link)" href="https://github.com/${USER}?tab=repositories" target="_blank" rel="noopener">See them on GitHub</a>.</p>`;
    });
  }
}

if (!customElements.get("github-projects")) customElements.define("github-projects", GithubProjects);
})();
