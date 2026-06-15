const BASE_URL = "http://polskakatolicka.org";

export interface PKArticle {
  id: string;      // slug
  slug: string;
  title: string;
  excerpt: string;
  content: string;        // plain text (for TTS)
  banners_html?: string;  // tylko wizualne elementy (bannery, linki z obrazkami)
  image_url: string;
  author: string;
  published_at: string;
  category: string;
  source_url: string;
}

export interface PKPetition {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  banners_html?: string;
  image_url: string;
  signature_count: number;
  source_url: string;
  active: boolean;
  donation_url: string;   // full wplata-na-kampanie URL, empty if not found
  donation_amounts: number[]; // e.g. [60, 90, 120, 250, 500, 1200]
}

function sanitizeHtmlSnippet(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/\s+on\w+='[^']*'/gi, "")
    // Linki wewnętrzne → trasy aplikacji (relative i absolutne)
    .replace(/href="https?:\/\/polskakatolicka\.org\/pl\/artykuly\/([^"?#]+)[^"]*"/g, 'href="/articles/$1"')
    .replace(/href="https?:\/\/polskakatolicka\.org\/pl\/petycje\/([^"?#]+)[^"]*"/g, 'href="/petitions/$1"')
    .replace(/href="\/pl\/artykuly\/([^"?#]+)[^"]*"/g, 'href="/articles/$1"')
    .replace(/href="\/pl\/petycje\/([^"?#]+)[^"]*"/g, 'href="/petitions/$1"')
    // Pozostałe linki polskakatolicka.org → przez proxy (uzupełnia dane usera)
    .replace(/href="(https?:\/\/polskakatolicka\.org[^"]*)"/g, (_, url) =>
      `href="/api/proxy/external?redirect=${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer"`)
    // Relative → absolutne z nową kartą
    .replace(/href="\/([^"]+)"/g, `href="${BASE_URL}/$1" target="_blank" rel="noopener noreferrer"`)
    .replace(/src="\/([^"]+)"/g, `src="${BASE_URL}/$1"`)
    .replace(/<img /g, '<img loading="lazy" ')
    .replace(/\s+width="\d+"/gi, "")
    .replace(/\s+height="\d+"/gi, "");
}

/** Wyciąga z HTML artykułu wszystkie linki (obrazkowe i tekstowe),
 *  z deduplikacją po href. Pomija trywialne kotwice i bardzo krótkie linki inline. */
function extractEnrichments(rawHtml: string): string {
  const found: string[] = [];
  const seenHrefs = new Set<string>();

  const aRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = aRe.exec(rawHtml)) !== null) {
    const attrs = m[1];
    const inner = m[2];
    const full  = m[0];

    const hrefM = attrs.match(/href="([^"]+)"/);
    if (!hrefM) continue;
    const href = hrefM[1];
    if (!href || href === "#" || href.startsWith("javascript:")) continue;
    if (seenHrefs.has(href)) continue;
    seenHrefs.add(href);

    const hasImg = /<img\b/i.test(inner);
    const text   = inner.replace(/<[^>]+>/g, "").trim();
    // Pomiń bardzo krótkie linki tekstowe bez obrazka (np. "tu", "więcej")
    if (!hasImg && text.length < 8) continue;

    found.push(full);
  }

  if (!found.length) return "";
  return sanitizeHtmlSnippet(found.join("\n"));
}

function stripTags(html: string): string {
  return html
    // Block-level tags become paragraph breaks
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    // Inline tags (span, a, strong, em, b, i) — just remove, no newline
    .replace(/<span[^>]*>/gi, "")
    .replace(/<\/span>/gi, "")
    .replace(/<a[^>]*>/gi, "")
    .replace(/<\/a>/gi, "")
    .replace(/<strong>|<\/strong>|<b>|<\/b>|<em>|<\/em>|<i>|<\/i>/gi, "")
    // All remaining tags
    .replace(/<[^>]+>/g, "")
    // Entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, "")
    // Cleanup whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/ \n/g, "\n")
    .replace(/\n /g, "\n")
    // Collapse single newlines (Word wrap artifacts) into space, keep double newlines as paragraph breaks
    .replace(/([^\n])\n([^\n])/g, "$1 $2")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Extract the inner HTML of the first div with a given class, handling nested divs */
function extractDivContent(html: string, className: string): string {
  const startIdx = html.indexOf(`${className}"`);
  if (startIdx === -1) return "";

  // Find the opening > of that div
  const divStart = html.lastIndexOf("<div", startIdx);
  const openEnd = html.indexOf(">", divStart);
  if (openEnd === -1) return "";

  // Walk forward counting open/close divs to find the matching close
  let depth = 1;
  let pos = openEnd + 1;
  while (pos < html.length && depth > 0) {
    const nextOpen = html.indexOf("<div", pos);
    const nextClose = html.indexOf("</div>", pos);

    if (nextClose === -1) break;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + 4;
    } else {
      depth--;
      if (depth === 0) return html.slice(openEnd + 1, nextClose);
      pos = nextClose + 6;
    }
  }
  return "";
}

function parseAuthorDate(firstLine: string): { author: string; published_at: string } {
  // Format: "Redakcja | 30/05/2024" or "Jan Kowalski | 2024-05-30"
  const parts = firstLine.split("|").map((s) => s.trim());
  const author = parts[0] || "Redakcja";
  const dateStr = parts[1] || "";

  let published_at = new Date().toISOString();
  const dmyMatch = dateStr.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    published_at = new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`).toISOString();
  } else {
    const iso = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
    if (iso) published_at = new Date(iso[1]).toISOString();
  }

  return { author, published_at };
}

export async function fetchArticleList(): Promise<PKArticle[]> {
  const res = await fetch(`${BASE_URL}/pl/artykuly`, {
    next: { revalidate: 3600 },
  });
  const html = await res.text();

  // Parse all article cards directly from the listing page — no per-article requests needed
  const articles: PKArticle[] = [];
  const seen = new Set<string>();

  // Each article link appears as <a href="/pl/artykuly/SLUG" ...>...</a>
  // We find each unique slug and extract surrounding context (image, title, excerpt)
  const linkRe = /href=["']\/pl\/artykuly\/([^"'?#\s]+)["'][^>]*>([\s\S]{0,1200}?)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) !== null) {
    const slug = m[1];
    if (seen.has(slug)) continue;
    seen.add(slug);

    const block = m[2];

    // Title: from <h2>, <h3>, <strong>, or link title="..." attribute
    const titleAttr = html.slice(Math.max(0, m.index - 20), m.index + 60).match(/title=["']([^"']{4,})["']/);
    const hTag = block.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);
    const strongTag = block.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
    const rawTitle = hTag ? stripTags(hTag[1]) : strongTag ? stripTags(strongTag[1]) : titleAttr?.[1] ?? slug.replace(/-/g, " ");
    const title = rawTitle.replace(/&[a-z]+;/g, " ").replace(/&#\d+;/g, "").trim();
    if (!title || title.length < 4) continue;

    // Image
    const imgM = block.match(/src=["']([^"']+(?:jpg|jpeg|png|webp)[^"']*?)["']/i);
    const raw_img = imgM?.[1] ?? "";
    const image_url = raw_img.startsWith("http") ? raw_img : raw_img ? `${BASE_URL}${raw_img}` : "";

    // Excerpt: from <div><span>, <p>, or any text content
    const spanM = block.match(/<span[^>]*>([\s\S]*?)<\/span>/i);
    const pM = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    const rawExcerpt = spanM?.[1] ?? pM?.[1] ?? "";
    const excerpt = stripTags(rawExcerpt).replace(/\s+/g, " ").trim().slice(0, 220);

    articles.push({
      id: slug,
      slug,
      title,
      excerpt,
      content: "",
      image_url,
      author: "Redakcja",
      published_at: new Date().toISOString(),
      category: "Artykuły",
      source_url: `${BASE_URL}/pl/artykuly/${slug}`,
    });
  }

  return articles;
}

export async function fetchArticle(slug: string): Promise<PKArticle | null> {
  try {
    const res = await fetch(`${BASE_URL}/pl/artykuly/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Title
    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const title = titleMatch ? stripTags(titleMatch[1]) : slug.replace(/-/g, " ");

    // Image
    const ogImg = html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/);
    const localImg = html.match(/article-page-image[\s\S]{0,200}?<img[^>]+src=["']([^"']+)["']/);
    const image_url =
      ogImg?.at(1) ||
      (localImg?.at(1)
        ? localImg[1].startsWith("http")
          ? localImg[1]
          : `${BASE_URL}${localImg[1]}`
        : "");

    // Content — extract the full article-page-text div, handling nested tags
    const rawContent = extractDivContent(html, "article-page-text");
    const contentLines = stripTags(rawContent)
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    // First line often contains "Author | date"
    let author = "Redakcja";
    let published_at = new Date().toISOString();
    let contentStart = 0;

    if (contentLines[0]?.includes("|")) {
      const parsed = parseAuthorDate(contentLines[0]);
      author = parsed.author;
      published_at = parsed.published_at;
      contentStart = 1;
    }

    const content = contentLines.slice(contentStart).join("\n\n");

    const banners_html = rawContent ? extractEnrichments(rawContent) : "";

    // Excerpt — og:description or first 200 chars of content
    const ogDesc = html.match(/property=["']og:description["'][^>]+content=["']([^"']+)["']/);
    const excerpt = ogDesc?.at(1)?.trim() || content.slice(0, 200);

    return {
      id: slug,
      slug,
      title,
      excerpt,
      content,
      banners_html,
      image_url,
      author,
      published_at,
      category: "Artykuły",
      source_url: `${BASE_URL}/pl/artykuly/${slug}`,
    };
  } catch {
    return null;
  }
}

export async function fetchPetitionList(): Promise<PKPetition[]> {
  const res = await fetch(`${BASE_URL}/pl/petycje`, {
    next: { revalidate: 1800 },
  });
  const html = await res.text();

  // Extract petition-item blocks
  const itemPattern = /<div[^>]+class=["'][^"']*petition-item[^"']*["'][^>]*>([\s\S]*?)(?=<div[^>]+class=["'][^"']*petition-item|<\/div>\s*<\/div>\s*<\/div>\s*(?:<!--|\s*<div[^>]+class=["'][^"']*(?:footer|bottom|widget)))/g;
  const slugPattern = /href=["']\/pl\/petycje\/([^"'?#]+)["']/g;
  const slugs = [...new Set([...html.matchAll(slugPattern)].map((m) => m[1]))].filter(Boolean);

  // Parse cards directly from listing page (faster than per-slug fetches)
  const items: PKPetition[] = [];
  const cardRegex = /<div[^>]+class=["'][^"']*petition-item[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
  let match;
  while ((match = cardRegex.exec(html)) !== null) {
    const card = match[1];
    const slugM = card.match(/href=["']\/pl\/petycje\/([^"'?#]+)["']/);
    if (!slugM) continue;
    const slug = slugM[1];

    // Title is in <h2> or <a title="..."> attribute inside the card
    const h2M = card.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
    const aTitleM = card.match(/<a[^>]+title=["']([^"']+)["']/);
    const rawTitle = h2M ? stripTags(h2M[1]) : aTitleM?.[1] ?? slug.replace(/-/g, " ");
    const title = rawTitle
      .replace(/&ndash;/g, "–").replace(/&mdash;/g, "—").replace(/&amp;/g, "&")
      .replace(/&oacute;/g, "ó").replace(/&oacute;/g, "ó").replace(/&#\d+;/g, "").trim();

    const imgM = card.match(/src=["']([^"']+(?:jpg|png|webp)[^"']*?)["']/i);
    const raw_img = imgM?.[1] ?? "";
    const image_url = raw_img.startsWith("http") ? raw_img : raw_img ? `${BASE_URL}${raw_img}` : "";

    const countM = card.match(/(\d[\d\s]{2,10})\s*podpisan/) || card.match(/petition-count[^>]*>\s*(\d[\d\s]*)/);
    const signature_count = countM ? parseInt(countM[1].replace(/\s/g, ""), 10) : 0;

    const excerptM = card.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    const excerpt = excerptM ? stripTags(excerptM[1]).slice(0, 220) : "";

    items.push({
      id: slug,
      slug,
      title,
      excerpt,
      content: "",
      image_url,
      signature_count,
      source_url: `${BASE_URL}/pl/petycje/${slug}`,
      active: true,
      donation_url: "",
      donation_amounts: [60, 90, 120, 250, 500, 1200],
    });
  }

  // Fallback: use slugs if card parsing yielded nothing
  if (items.length === 0) {
    for (const slug of slugs) {
      const p = await fetchPetition(slug);
      if (p) items.push(p);
    }
  }

  return items;
}

export async function fetchPetition(slug: string): Promise<PKPetition | null> {
  try {
    const res = await fetch(`${BASE_URL}/pl/petycje/${slug}`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const titleM = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const title = titleM ? stripTags(titleM[1]).trim() : slug.replace(/-/g, " ");

    const ogImg = html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/);
    const image_url = ogImg?.[1] ?? "";

    const countM = html.match(/(\d[\d\s]{0,10})\s*podpisan/);
    const signature_count = countM ? parseInt(countM[1].replace(/\s/g, ""), 10) : 0;

    const rawContent = extractDivContent(html, "article-page-text") ||
                       extractDivContent(html, "petition-content") ||
                       extractDivContent(html, "petition-body");
    const content = rawContent ? stripTags(rawContent) : "";
    const banners_html = rawContent ? extractEnrichments(rawContent) : "";

    const ogDesc = html.match(/property=["']og:description["'][^>]+content=["']([^"']+)["']/);
    const excerpt = ogDesc?.[1]?.trim() || content.slice(0, 220);

    // Donation URL — stable per-campaign token embedded in page
    const donationMatches = [...html.matchAll(/href=["'](https?:\/\/[^"']*wplata-na-kampanie\?payment=[^"']+)["']/g)];
    const donation_url = donationMatches[0]?.[1] ?? "";

    // Donation amounts from the donation page (default set, fetched lazily if needed)
    const donation_amounts = [60, 90, 120, 250, 500, 1200];

    return {
      id: slug,
      slug,
      title,
      excerpt,
      content,
      banners_html,
      image_url,
      signature_count,
      source_url: `${BASE_URL}/pl/petycje/${slug}`,
      active: true,
      donation_url,
      donation_amounts,
    };
  } catch {
    return null;
  }
}
