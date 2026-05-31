import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { runCrawler } from "./crawler.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));
const dataFile = fileURLToPath(new URL("./data/products.json", import.meta.url));
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4174);
const mime = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".json":"application/json; charset=utf-8" };
const sendJson = (res, data, status = 200) => { res.writeHead(status, { "content-type": mime[".json"] }); res.end(JSON.stringify(data)); };

createServer(async (req, res) => {
  try {
    if (req.url === "/health" && req.method === "GET") return sendJson(res, { status: "ok", service: "product-radar" });
    if ((req.url === "/api/ranking" || req.url === "/api/radar/ranking") && req.method === "GET") return sendJson(res, JSON.parse(await readFile(dataFile, "utf8")));
    if ((req.url === "/api/crawl" || req.url === "/api/radar/crawl") && req.method === "POST") return sendJson(res, await runCrawler());
    if (!["GET", "HEAD"].includes(req.method)) return sendJson(res, { error: "Method not allowed" }, 405);
    const requestPath = req.url.split("?")[0];
    if (requestPath === "/radar") {
      res.writeHead(302, { location: "/radar/" });
      return res.end();
    }
    const publicPath = requestPath.startsWith("/radar/") ? requestPath.slice("/radar".length) : requestPath;
    const pathname = decodeURIComponent(publicPath === "/" ? "/index.html" : publicPath.endsWith("/") ? `${publicPath}index.html` : publicPath);
    const file = normalize(join(root, pathname));
    const rel = relative(root, file);
    if (rel.startsWith("..")) return sendJson(res, { error: "Not found" }, 404);
    const body = await readFile(file);
    res.writeHead(200, { "content-type": mime[extname(file)] || "application/octet-stream" });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch (error) {
    sendJson(res, { error: error.code === "ENOENT" ? "Not found" : error.message }, error.code === "ENOENT" ? 404 : 500);
  }
}).listen(port, host, () => console.log(`选品雷达已启动：http://${host}:${port}`));
