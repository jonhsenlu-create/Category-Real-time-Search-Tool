const state = { products: [], sources: [], department: "居家日用", category: "拖把/拖布", source: "全部", search: "", sort: "score" };
const $ = (selector) => document.querySelector(selector);
const compact = (number) => new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 }).format(number);
const money = (number) => `¥${Number(number).toFixed(Number(number) % 1 ? 1 : 0)}`;
const text = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const href = (value) => /^https?:\/\//.test(value || "") ? value : "#";
const currentUser = localStorage.getItem("radarUser");

async function load() {
  try {
    const response = await fetch("/api/radar/ranking");
    if (!response.ok) throw new Error("API unavailable");
    return response.json();
  } catch {
    return window.HOME_TREND_DATA;
  }
}

function categoryCounts() {
  return state.products.reduce((counts, product) => {
    if (product.department === state.department) counts[product.category] = (counts[product.category] || 0) + 1;
    return counts;
  }, {});
}

function departmentCounts() {
  return state.products.reduce((counts, product) => {
    counts[product.department] = (counts[product.department] || 0) + 1;
    return counts;
  }, {});
}

function renderButtons(element, items, active, key) {
  element.innerHTML = items.map((item) => `<button class="${item === active ? "active" : ""}" data-${key}="${text(item)}"><i></i>${text(item)}</button>`).join("");
}

function renderFilters() {
  const categories = Object.keys(categoryCounts());
  renderButtons($("#categories"), categories, state.category, "category");
  renderButtons($("#sourceFilters"), ["全部", ...new Set(state.products.map((product) => product.source))], state.source, "source");
}

function renderCategoryStrip() {
  const counts = categoryCounts();
  $("#categoryStrip").innerHTML = Object.entries(counts).map(([category, count]) => `
    <button class="${category === state.category ? "active" : ""}" data-category="${text(category)}">
      ${text(category)}<b>${count} 款</b>
    </button>`).join("");
}

function renderDepartmentStrip() {
  const counts = departmentCounts();
  $("#departmentStrip").innerHTML = Object.entries(counts).map(([department, count]) => `
    <button class="${department === state.department ? "active" : ""}" data-department="${text(department)}">
      ${text(department)}<b>${count} 款</b>
    </button>`).join("");
}

function list() {
  const query = state.search.trim().toLowerCase();
  return state.products
    .filter((product) => product.category === state.category)
    .filter((product) => product.department === state.department)
    .filter((product) => state.source === "全部" || product.source === state.source)
    .filter((product) => !query || `${product.name}${product.category}${product.tags.join("")}`.toLowerCase().includes(query))
    .sort((a, b) => state.sort === "price" ? a.price - b.price : b[state.sort] - a[state.sort])
    .slice(0, 100);
}

function renderProducts() {
  const products = list();
  $("#rankingTitle").textContent = `${state.category} TOP100`;
  $("#result").textContent = `当前显示 ${products.length} 款 · ${state.department} / ${state.category} 单品热度榜`;
  $("#products").innerHTML = products.map((product, index) => `
    <article class="row" data-id="${text(product.id)}">
      <div class="product">
        <b class="rank">${String(index + 1).padStart(2, "0")}</b>
        <div class="icon">${text(product.icon)}</div>
        <div><h3>${text(product.name)}</h3><p>${text(product.department)} / ${text(product.category)}</p></div>
      </div>
      <div><b>${text(product.source)}</b><small>${compact(product.reviews)} 条公开信号</small></div>
      <b>${money(product.price)}</b><b class="up">+${product.growth}%</b><b class="score">${product.score}</b>
    </article>`).join("");
}

function render(data) {
  state.products = data.products;
  state.sources = data.sources;
  const hottest = [...state.products].sort((a, b) => b.growth - a.growth)[0];
  const counts = departmentCounts();
  const hottestCategory = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "--";
  const average = Math.round(state.products.reduce((sum, product) => sum + product.score, 0) / state.products.length);
  $("#total").textContent = state.products.length;
  $("#metricTotal").textContent = new Set(state.products.map((product) => `${product.department}/${product.category}`)).size;
  $("#sourceTotal").textContent = state.sources.filter((source) => source.enabled).length;
  $("#updated").textContent = new Date(data.updatedAt).toLocaleString("zh-CN");
  $("#average").textContent = average;
  $("#growth").textContent = `+${hottest.growth}%`;
  $("#growthName").textContent = hottest.name;
  $("#category").textContent = hottest.category;
  renderFilters();
  renderDepartmentStrip();
  renderCategoryStrip();
  renderProducts();
  $("#sourceCards").innerHTML = state.sources.map((source) => `
    <article>
      <span class="${source.enabled ? "on" : "off"}"><i></i>${source.enabled ? "可访问" : "待配置"}</span>
      <b>${text(source.name)}</b><small>${text(source.basisType || (source.type === "seed" ? "公开检索依据" : source.type.toUpperCase()))} · ${source.items || 0} 款商品</small>
      ${source.note ? `<p>${text(source.note)}</p>` : ""}
      ${source.url ? `<a class="source-link" href="${href(source.url)}" target="_blank" rel="noopener">打开来源 ↗</a>` : ""}
    </article>`).join("");
}

function openDrawer(product) {
  $("#drawerContent").innerHTML = `
    <p class="eyebrow">PRODUCT SIGNAL</p><div class="drawer-icon">${text(product.icon)}</div>
    <h2>${text(product.name)}</h2><p>${text(product.department)} / ${text(product.category)} · ${text(product.source)}</p>
    <div class="drawer-score"><span>趋势指数</span><strong>${product.score}</strong><small>公开信号变化 +${product.growth}%</small></div>
    <div class="drawer-grid"><div>参考价格<b>${money(product.price)}</b></div><div>公开信号<b>${compact(product.reviews)}</b></div><div>收藏信号<b>${compact(product.favorites)}</b></div><div>评分<b>${product.rating}</b></div></div>
    <a href="${href(product.url)}" target="_blank" rel="noopener">打开商品来源 ↗</a>`;
  $("#drawer").classList.add("open");
  $("#drawerBg").classList.add("open");
}

function closeDrawer() {
  $("#drawer").classList.remove("open");
  $("#drawerBg").classList.remove("open");
}

document.addEventListener("click", (event) => {
  const department = event.target.closest("[data-department]");
  const category = event.target.closest("[data-category]");
  const source = event.target.closest("[data-source]");
  const row = event.target.closest("[data-id]");
  if (department) {
    state.department = department.dataset.department;
    const first = state.products.find((product) => product.department === state.department);
    state.category = first?.category || "";
  }
  if (category) {
    state.category = category.dataset.category;
  }
  if (source) state.source = source.dataset.source;
  if (department || category || source) { renderFilters(); renderDepartmentStrip(); renderCategoryStrip(); renderProducts(); }
  if (row) openDrawer(state.products.find((product) => product.id === row.dataset.id));
});
$("#search").oninput = (event) => { state.search = event.target.value; renderProducts(); };
$("#sort").onchange = (event) => { state.sort = event.target.value; renderProducts(); };
$("#close").onclick = $("#drawerBg").onclick = closeDrawer;
$("#reset").onclick = () => {
  Object.assign(state, { department: "居家日用", category: "拖把/拖布", source: "全部", search: "", sort: "score" });
  $("#search").value = "";
  $("#sort").value = "score";
  renderFilters();
  renderDepartmentStrip();
  renderCategoryStrip();
  renderProducts();
};
$("#refresh").onclick = async () => {
  const button = $("#refresh");
  button.disabled = true;
  button.textContent = "正在更新...";
  try {
    const response = await fetch("/api/radar/crawl", { method: "POST" });
    if (!response.ok) throw new Error("API unavailable");
    render(await response.json());
    $("#toast").textContent = "榜单已更新";
  } catch {
    $("#toast").textContent = window.HOME_TREND_DATA ? "静态分享版展示最近生成榜单" : "更新失败，请检查服务状态";
  } finally {
    $("#toast").classList.add("show");
    setTimeout(() => $("#toast").classList.remove("show"), 1800);
    button.disabled = false;
    button.textContent = "立即更新";
  }
};
load().then(render).catch(() => { $("#result").textContent = "数据加载失败，请启动本地服务"; });
if (currentUser) {
  $("#loginLink").textContent = currentUser;
  $("#loginLink").href = "login.html";
  $("#logout").hidden = false;
}
$("#logout").onclick = () => {
  localStorage.removeItem("radarUser");
  window.location.reload();
};
