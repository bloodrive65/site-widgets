# site-widgets

Self-updating widgets for [bloodrive65.com](https://bloodrive65.com) (Wix).

## github-projects.js

Shows my GitHub profile README and a live card for every public repo. It sizes itself to its content.

**Wix setup (one time):** Add Elements → Embed Code → Custom Element → Choose Source → **Server URL**
- URL: `https://bloodrive65.github.io/site-widgets/github-projects.js`
- Tag name: `github-projects`

## How the page decides what to show

- **Featured:** any public repo with a Website link or a Release (or the `featured` topic).
- **More projects:** every other public repo.
- **Hide a repo:** add the `hidden` topic to it on GitHub.
- **Tools I use:** the badges under "Tools I use" in the profile README.

Edits pushed to this repo show up on the website automatically (GitHub Pages caches for about 10 minutes).
