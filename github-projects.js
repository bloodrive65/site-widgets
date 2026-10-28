// bloodrive65 GitHub Projects — Wix Custom Element
// Tag name in Wix: github-projects
// Mirrors your GitHub profile README + lists every public repo, live.
// Grows/shrinks with its content, so the Wix page never needs resizing.

const USER = "bloodrive65";
const HIDE = [USER]; // repos you don't want listed
const CACHE_MINUTES = 15;
const LANG_COLORS = { JavaScript: "#f1e05a", Python: "#3572A5", "C#": "#178600", HTML: "#e34c26", CSS: "#663399", TypeScript: "#3178c6" };

const STYLE = `
  :host { display: block; width: 100%;
    --card: #1e1e22; --border: #4a4a52; --text: #e6edf3; --muted: #a0a0aa; --link: #58a6ff;
    color: var(--text); font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .wrap { max-width: 900px; margin: 0 auto; padding: 24px 16px; box-sizing: border-box; }
  .markdown-body { background: var(--card) !important; border: 1px solid var(--border); border-radius: 8px; padding: 28px; }
  h2.section { margin: 32px 0 12px; font-size: 22px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
  .repo { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 16px;
    display: flex; flex-direction: column; gap: 8px; text-decoration: none; color: var(--text); transition: border-color .15s; }
  .repo:hover { border-color: var(--link); }
  .repo .name { color: var(--link); font-weight: 600; font-size: 16px; }
  .repo .desc { color: var(--muted); font-size: 14px; line-height: 1.45; flex: 1; }
  .repo .meta { display: flex; gap: 14px; font-size: 12px; color: var(--muted); flex-wrap: wrap; }
  .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; vertical-align: -1px; }
  .live { color: #38b764; }
  .status { color: var(--muted); font-size: 14px; }
  .status a { color: var(--link); }
  @media (max-width: 600px) { .markdown-body { padding: 18px; } }
`;

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

class GithubProjects extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown-dark.min.css">
      <style>${STYLE}</style>
      <div class="wrap">
        <article id="readme" class="markdown-body"><p class="status">Loading profile…</p></article>
        <h2 class="section">All projects</h2>
        <div id="repos" class="grid"><p class="status">Loading projects…</p></div>
      </div>`;
    this.loadReadme(root.getElementById("readme"));
    this.loadRepos(root.getElementById("repos"));
  }

  async loadReadme(el) {
    try {
      const [{ marked }, res] = await Promise.all([
        import("https://cdn.jsdelivr.net/npm/marked@12/+esm"),
        fetch(`https://raw.githubusercontent.com/${USER}/${USER}/HEAD/README.md`, { cache: "no-cache" })
      ]);
      if (!res.ok) throw new Error(res.status);
      el.innerHTML = marked.parse(await res.text());
      el.querySelectorAll("a").forEach(a => { a.target = "_blank"; a.rel = "noopener"; });
      // Remove the README's "Other projects" table; the live list below replaces it
      [...el.querySelectorAll("h2")].forEach(h => {
        if (!/other projects/i.test(h.textContent)) return;
        let n = h.nextElementSibling;
        while (n && n.tagName !== "H2") { const next = n.nextElementSibling; n.remove(); n = next; }
        h.remove();
      });
    } catch (e) {
      el.innerHTML = `<p class="status">Couldn't load the GitHub profile right now. <a href="https://github.com/${USER}" target="_blank">View it on GitHub</a>.</p>`;
    }
  }

  async loadRepos(el) {
    try {
      const KEY = "gh-repos-" + USER;
      let cached = null;
      try { cached = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
      let data;
      if (cached && Date.now() - cached.t < CACHE_MINUTES * 60000) data = cached.d;
      else {
        const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`);
        if (res.ok) {
          data = await res.json();
          try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d: data })); } catch (e) {}
        } else if (cached) data = cached.d;
        else throw new Error(res.status);
      }
      const repos = data.filter(r => !r.fork && !r.archived && !HIDE.includes(r.name));
      el.innerHTML = repos.map(r => `
        <a class="repo" href="${esc(r.homepage || r.html_url)}" target="_blank" rel="noopener">
          <span class="name">${esc(r.name)}</span>
          <span class="desc">${r.description ? esc(r.description) : "No description yet."}</span>
          <span class="meta">
            ${r.language ? `<span><span class="dot" style="background:${LANG_COLORS[r.language] || "#8b949e"}"></span>${esc(r.language)}</span>` : ""}
            ${r.stargazers_count ? `<span>★ ${r.stargazers_count}</span>` : ""}
            ${r.homepage ? `<span class="live">● Live site</span>` : ""}
            <span>Updated ${new Date(r.pushed_at).toLocaleDateString()}</span>
          </span>
        </a>`).join("");
    } catch (e) {
      el.innerHTML = `<p class="status">Couldn't load projects right now. <a href="https://github.com/${USER}?tab=repositories" target="_blank">View them on GitHub</a>.</p>`;
    }
  }
}

if (!customElements.get("github-projects")) customElements.define("github-projects", GithubProjects);
