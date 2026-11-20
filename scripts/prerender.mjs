// Build step 3 of 3 (see package.json "build"): turns the client build in
// dist/ into real HTML pages.
//   - Each public page in src/seo.ts PAGES is rendered to static HTML with its
//     own title, description, canonical URL, Open Graph tags and JSON-LD, and
//     React hydrates it in the browser.
//   - dist/404.html is the rendered not-found page; Vercel serves it with a
//     real 404 status for any URL that isn't a file, redirect or rewrite.
//   - dist/app-shell.html is the empty client shell for /admin (noindex).
//   - dist/sitemap.xml lists the canonical URL of every public page.
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const server = join(root, "dist-ssr");

const { render, supportFaqJsonLd, PAGES, NOT_FOUND, SITE, OG_IMAGE } = await import(
  pathToFileURL(join(server, "entry-server.js")).href
);

const template = readFileSync(join(dist, "index.html"), "utf8");

const between = (html, name, replacement) => {
  const re = new RegExp(`<!--${name}:start-->[\\s\\S]*?<!--${name}:end-->`);
  if (!re.test(html)) throw new Error(`index.html is missing the ${name} markers`);
  return html.replace(re, replacement);
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// JSON-LD inside <script>: stop "</script>" from closing the tag early.
const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

// Preload the one font file the public pages use, so text paints in Archivo sooner.
const assets = readdirSync(join(dist, "assets"));
const font = assets.find((f) => /^archivo-latin-wdth-normal-.*\.woff2$/.test(f));
const fontPreload = font ? `<link rel="preload" href="/assets/${font}" as="font" type="font/woff2" crossorigin />` : "";

function head(page) {
  const url = `${SITE}${page.path === "/" ? "/" : page.path}`;
  const tags = [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
  ];
  if (page.noindex) {
    tags.push(`<meta name="robots" content="noindex" />`);
  } else {
    tags.push(
      `<link rel="canonical" href="${url}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="iCOPEDIA" />`,
      `<meta property="og:url" content="${url}" />`,
      `<meta property="og:title" content="${esc(page.title)}" />`,
      `<meta property="og:description" content="${esc(page.description)}" />`,
      `<meta property="og:image" content="${OG_IMAGE}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${esc(page.title)}" />`,
      `<meta name="twitter:description" content="${esc(page.description)}" />`,
      `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    );
  }
  const jsonLd = [...page.jsonLd];
  if (page.path === "/support") jsonLd.push(supportFaqJsonLd());
  tags.push(...jsonLd.map(ld));
  if (fontPreload) tags.push(fontPreload);
  return tags.join("\n    ");
}

function page(seo, url) {
  let html = between(template, "seo", head(seo));
  html = between(html, "admin-fonts", "");
  html = between(html, "editor", "");
  const body = render(url);
  if (!body) throw new Error(`Rendered nothing for ${url}`);
  return html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

// The empty shell for /admin, written before index.html is replaced.
const shell = between(template, "seo", `<title>iCOPEDIA Admin</title>\n    <meta name="robots" content="noindex, nofollow" />`);
writeFileSync(join(dist, "app-shell.html"), shell);

for (const p of PAGES) {
  writeFileSync(join(dist, p.file), page(p, p.path));
  console.log(`prerendered ${p.path.padEnd(16)} -> dist/${p.file}`);
}
writeFileSync(join(dist, NOT_FOUND.file), page(NOT_FOUND, "/this-page-does-not-exist"));
console.log(`prerendered 404              -> dist/${NOT_FOUND.file}`);

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map((p) => `  <url><loc>${SITE}${p.path}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`;
writeFileSync(join(dist, "sitemap.xml"), sitemap);
console.log(`wrote sitemap.xml with ${PAGES.length} URLs`);

if (existsSync(server)) rmSync(server, { recursive: true, force: true });
