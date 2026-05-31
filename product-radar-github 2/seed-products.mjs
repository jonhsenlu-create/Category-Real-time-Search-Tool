import { writeFile } from "node:fs/promises";
import { taxonomy } from "./taobao-taxonomy.mjs";

const modifiers = ["热销款", "升级款", "家用款", "精选款", "大容量款", "轻量款", "组合装", "耐用款", "便携款", "高颜值款"];
const sources = [
  { name: "京东公开搜索", type: "商品搜索依据", url: "https://search.jd.com/Search?keyword=", buildUrl: (query) => `https://search.jd.com/Search?keyword=${query}` },
  { name: "淘宝公开搜索", type: "商品搜索依据", url: "https://s.taobao.com/search?q=", buildUrl: (query) => `https://s.taobao.com/search?q=${query}` },
  { name: "天猫公开搜索", type: "商品搜索依据", url: "https://list.tmall.com/search_product.htm?q=", buildUrl: (query) => `https://list.tmall.com/search_product.htm?q=${query}` },
  { name: "苏宁公开搜索", type: "商品搜索依据", url: "https://search.suning.com/", buildUrl: (query) => `https://search.suning.com/${query}/` },
  { name: "抖音内容搜索", type: "内容搜索依据", url: "https://www.douyin.com/search/", buildUrl: (query) => `https://www.douyin.com/search/${query}` },
  { name: "小红书内容搜索", type: "内容搜索依据", url: "https://www.xiaohongshu.com/search_result?keyword=", buildUrl: (query) => `https://www.xiaohongshu.com/search_result?keyword=${query}&source=web_explore_feed` }
];
const icons = ["✦", "◌", "▤", "∿", "▱", "⌁", "▦", "◒"];
const products = [];
let sequence = 0;

Object.entries(taxonomy).forEach(([department, categories], departmentIndex) => {
  Object.entries(categories).forEach(([category, baseNames], categoryIndex) => {
    for (let index = 0; index < 100; index += 1) {
      const baseName = baseNames[index % baseNames.length];
      const modifier = modifiers[Math.floor(index / baseNames.length) % modifiers.length];
      const name = index < baseNames.length ? baseName : `${baseName} ${modifier}`;
      const source = sources[sequence % sources.length];
      products.push({
        id: `${departmentIndex + 1}-${categoryIndex + 1}-${String(index + 1).padStart(3, "0")}`,
        name, department, category, source: source.name,
        price: Number((16 + ((index * 13 + departmentIndex * 17 + categoryIndex * 7) % 246) + (index % 3) * .9).toFixed(1)),
        score: Math.max(1, 100 - index), growth: Math.max(1, 42 - (index % 39)),
        reviews: 12800 + (100 - index) * 930, favorites: 4200 + (100 - index) * 410,
        rating: Number((4.5 + (index % 5) * .1).toFixed(1)), icon: icons[(index + categoryIndex) % icons.length],
        tags: [category, index < 10 ? "高热" : "持续关注"], url: source.buildUrl(encodeURIComponent(name))
      });
      sequence += 1;
    }
  });
});

const output = {
  updatedAt: new Date().toISOString(),
  taxonomy: {
    basis: "参考淘宝开放平台标准商品类目层级",
    api: "taobao.itemcats.get",
    note: "正式同步淘宝标准类目需要淘宝开放平台授权。"
  },
  sources: sources.map(({ buildUrl, ...source }) => ({ ...source, enabled: true, items: products.filter((product) => product.source === source.name).length })),
  products
};
await writeFile(new URL("./data/products.json", import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
await writeFile(new URL("./data/demo-data.js", import.meta.url), `window.HOME_TREND_DATA = ${JSON.stringify(output, null, 2)};\n`);
console.log(`Seeded ${products.length} products across ${Object.keys(taxonomy).length} Taobao-style departments.`);
