import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(root, "data/products.json");
const sourcesFile = path.join(root, "data/sources.json");
const browserDataFile = path.join(root, "data/demo-data.js");
const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));

function normalizeProduct(item, source, index) {
  const name = item.name || item.title || "未命名商品";
  const reviews = Number(item.reviews || item.reviewCount || item.aggregateRating?.reviewCount || 0);
  const favorites = Number(item.favorites || item.likes || 0);
  const growth = Number(item.growth || item.growthRate || 0);
  const rating = Number(item.rating || item.aggregateRating?.ratingValue || 0);
  const price = Number(item.price || item.offers?.price || 0);
  const score = Math.min(100, Math.round(45 + Math.log10(reviews + 1) * 6 + Math.log10(favorites + 1) * 4 + growth * .45 + rating * 2));
  return {
    id: item.id || `${source.name}-${index}-${name}`.replace(/\W+/g, "-"),
    name, category: item.category || "其他家居", source: source.name, price, score, growth,
    reviews, favorites, rating, icon: item.icon || "◈", tags: item.tags || ["公开来源"],
    url: item.url || source.url
  };
}

function collectJsonLd(html) {
  const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  return matches.flatMap((match) => {
    try {
      const value = JSON.parse(match[1]);
      const list = Array.isArray(value) ? value : value["@graph"] || [value];
      return list.filter((item) => item["@type"] === "Product");
    } catch { return []; }
  });
}

async function crawlSource(source) {
  if (!source.enabled || source.type === "seed") return [];
  const response = await fetch(source.url, { headers: { "user-agent": "HomeTrendRadar/1.0 (+public-pages-only)" }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const items = source.type === "json" ? (await response.json()).products : collectJsonLd(await response.text());
  return items.map((item, index) => normalizeProduct(item, source, index));
}

export async function runCrawler() {
  const existing = await readJson(dataFile);
  const sources = await readJson(sourcesFile);
  const sourceByName = new Map(sources.map((source) => [source.name, source]));
  const remoteSourceNames = new Set(sources.filter((item) => item.enabled && item.type !== "seed").map((item) => item.name));
  const products = existing.products.filter((item) => !remoteSourceNames.has(item.source));
  const statuses = [...new Set(products.map((item) => item.source))].map((name) => {
    const source = sourceByName.get(name) || {};
    return { name, type: source.type || "seed", basisType: source.basisType, enabled: true, url: source.url, note: source.note, items: products.filter((item) => item.source === name).length };
  });
  for (const source of sources.filter((item) => item.type !== "seed")) {
    try {
      const items = await crawlSource(source);
      products.push(...items);
      statuses.push({ name: source.name, type: source.type, enabled: source.enabled, items: items.length });
    } catch (error) {
      statuses.push({ name: source.name, type: source.type, enabled: false, items: 0, error: error.message });
    }
  }
  const output = { updatedAt: new Date().toISOString(), taxonomy: existing.taxonomy, sources: statuses, products: products.sort((a, b) => b.score - a.score) };
  await writeFile(dataFile, `${JSON.stringify(output, null, 2)}\n`);
  await writeFile(browserDataFile, `window.HOME_TREND_DATA = ${JSON.stringify(output, null, 2)};\n`);
  return output;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCrawler().then((data) => console.log(`Updated ${data.products.length} products from ${data.sources.length} sources.`));
}
