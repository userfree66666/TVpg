// ==================== 零硬编码通用动态爬虫 v22 ====================
// 特性：支持 vod / live 类型，完全 ext 配置驱动，保留原 join 逻辑 (# 和 $$$)
// 兼容已有 live2cms 配置格式，同时支持复杂点播站点（如央视大全）

// ---------- 全局变量 ----------
let extConfig = { global: {}, sites: [] };
let cache = {};
let requestTimeout = 5000;
let defaultPic = 'https://avatars.githubusercontent.com/u/97389433?s=120&v=4';
let userAgent = 'Mozilla/5.0';

// 持久化存储 key
const STORAGE_KEY = 'universal_spider';

// 运行时状态
let showMode = 'groups';      // groups / all
let groupDict = {};           // 搜索结果分组

// ---------- 辅助函数 ----------
function getItem(k, def) {
  let val = local.get(STORAGE_KEY, k);
  return val !== undefined ? val : def;
}
function setItem(k, v) {
  local.set(STORAGE_KEY, k, v);
}
function log(msg, level = 'INFO') {
  console.log(`[${level}] ${msg}`);
}

function fetchSync(url, options = {}) {
  if (cache[url]) return cache[url];
  let opts = {
    method: options.method || 'GET',
    timeout: options.timeout || requestTimeout,
    headers: { 'User-Agent': userAgent, ...(options.headers || {}) }
  };
  if (opts.method === 'POST' && options.data) {
    opts.body = JSON.stringify(options.data);
    opts.headers['Content-Type'] = 'application/json';
  }
  try {
    let resp = req(url, opts);
    let content = resp.content || '';
    if (options.json) {
      let json = JSON.parse(content);
      if (options.cache !== false) cache[url] = json;
      return json;
    }
    if (options.cache !== false) cache[url] = content;
    return content;
  } catch (e) {
    log(`请求失败 ${url}: ${e.message}`, 'ERROR');
    return options.json ? null : '';
  }
}

// ---------- 解析器：根据配置提取 { title, url } 列表 ----------
function parseItems(content, parseConfig, baseUrl) {
  let items = [];
  let type = parseConfig.type || 'text';
  if (type === 'json') {
    try {
      let json = typeof content === 'string' ? JSON.parse(content) : content;
      let data = json;
      if (parseConfig.dataPath) {
        let parts = parseConfig.dataPath.split('.');
        for (let p of parts) data = data[p];
      }
      if (!Array.isArray(data)) data = data || [];
      for (let item of data) {
        let title = parseConfig.titleField ? item[parseConfig.titleField] : (item.title || item.name);
        let url = parseConfig.urlField ? item[parseConfig.urlField] : (item.url || item.link);
        if (title && url) {
          if (!url.match(/^https?:\/\//i) && baseUrl) url = new URL(url, baseUrl).href;
          items.push({ title, url, raw: item });
        }
      }
    } catch (e) { log(`JSON解析失败: ${e.message}`, 'ERROR'); }
  } 
  else if (type === 'm3u') {
    let lines = content.split(/\r?\n/);
    let currentTitle = '';
    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('#EXTINF:')) {
        let m = line.match(/#EXTINF:.*?,(.*)/);
        if (m) currentTitle = m[1].trim();
      } else if (line && !line.startsWith('#')) {
        if (line.match(/^https?:\/\//i)) {
          items.push({ title: currentTitle || '直播流', url: line });
          currentTitle = '';
        }
      }
    }
  }
  else if (type === 'regex') {
    let re = new RegExp(parseConfig.pattern, parseConfig.flags || 'g');
    let match;
    while ((match = re.exec(content)) !== null) {
      let title = match[parseConfig.titleGroup || 1] || '未命名';
      let url = match[parseConfig.urlGroup || 2];
      if (url) items.push({ title, url });
    }
  }
  else { // text 模式
    let lines = content.split(/\r?\n/);
    let sep = parseConfig.separator || ',';
    let regex = new RegExp(`^(.+?)${sep}(https?://\\S+)`);
    let hasGroup = parseConfig.hasGroup === true;
    let groupPattern = parseConfig.groupPattern || '#(.*?)#';
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      if (hasGroup && line.match(groupPattern)) continue; // 分组行跳过，留待上层处理
      let match = line.match(regex);
      if (match) {
        items.push({ title: match[1].trim(), url: match[2].trim() });
      } else if (line.match(/^https?:\/\//i)) {
        items.push({ title: '直播流', url: line });
      }
    }
  }
  return items;
}

// ---------- 分组算法（原版保留） ----------
function splitArray(arr, parse) {
  parse = parse && typeof parse === 'function' ? parse : '';
  if (!arr.length) return [];
  let result = [[arr[0]]];
  for (let i = 1; i < arr.length; i++) {
    let index = -1;
    for (let j = 0; j < result.length; j++) {
      if (parse && result[j].map(parse).includes(parse(arr[i]))) {
        index = j;
      } else if (!parse && result[j].includes(arr[i])) {
        index = j;
      }
    }
    if (index >= result.length - 1) {
      result.push([]);
      result[result.length - 1].push(arr[i]);
    } else {
      result[index + 1].push(arr[i]);
    }
  }
  return result;
}

// ---------- 后处理 ----------
function applyPostProcess(items, postProcess) {
  if (!postProcess) return items;
  if (typeof postProcess === 'function') return postProcess(items);
  if (postProcess.filter) {
    let re = new RegExp(postProcess.filter.regex || '.*');
    items = items.filter(item => re.test(item[postProcess.filter.field || 'title']));
  }
  if (postProcess.sort) {
    let field = postProcess.sort.field || 'title';
    let order = postProcess.sort.order === 'desc' ? -1 : 1;
    items.sort((a, b) => order * (a[field] > b[field] ? 1 : -1));
  }
  if (postProcess.limit) items = items.slice(0, postProcess.limit);
  return items;
}

// ---------- 获取源内容（支持缓存、自动转换M3U） ----------
function fetchSource(url, sourceConfig) {
  if (cache[url]) return cache[url];
  let opts = { headers: sourceConfig.headers || {} };
  let content = fetchSync(url, opts);
  if (!sourceConfig.type && content && content.includes('#EXTM3U')) {
    content = convertM3uToNormal(content);
  }
  cache[url] = content;
  return content;
}

function convertM3uToNormal(m3u) {
  try {
    const lines = m3u.split('\n');
    let result = '', TV = '', flag = '#m3u#', currentGroup = '';
    for (let line of lines) {
      if (line.startsWith('#EXTINF:')) {
        let group = line.split('"')[1]?.trim() || '';
        TV = line.split('"')[2]?.substring(1) || '';
        if (currentGroup !== group) {
          currentGroup = group;
          result += `\n${currentGroup},${flag}\n`;
        }
      } else if (line.startsWith('http')) {
        let splitLine = line.split(',');
        result += `${TV}\,${splitLine[0]}\n`;
      }
    }
    return result.trim();
  } catch(e) { return m3u; }
}

// ---------- 处理直播类型详情 ----------
function handleLiveDetail(source, tid, selectedTab, showMode) {
  let html = fetchSource(source.url, source);
  let regex = new RegExp(`.*?${selectedTab.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[,，]#[\\s\\S].*?#`);
  let match = html.match(regex);
  if (!match) return null;
  let block = match[0];
  let after = html.split(block)[1];
  let nextMatch = after.match(/.*?[,，]#[\s\S].*?#/);
  if (nextMatch) after = after.split(nextMatch[0])[0];
  let lines = after.trim().split('\n');
  let playItems = [];
  for (let line of lines) {
    if (line.trim()) {
      let parts = line.trim().split(',');
      if (parts.length >= 2) playItems.push(`${parts[0]}$${parts[1]}`);
    }
  }
  let sourceName = source.name;
  let vodPlayUrl, vodPlayFrom;
  if (showMode === 'groups') {
    let groups = splitArray(playItems, x => x.split('$')[0]);
    let tabs = groups.map((_, i) => i === 0 ? sourceName + '1' : ` ${i+1} `);
    vodPlayUrl = groups.map(g => g.join('#')).join('$$$');
    vodPlayFrom = tabs.join('$$$');
  } else {
    vodPlayUrl = playItems.join('#');
    vodPlayFrom = sourceName;
  }
  return {
    vod_name: `${sourceName}|${selectedTab}`,
    vod_play_from: vodPlayFrom,
    vod_play_url: vodPlayUrl
  };
}

// ---------- 处理点播类型详情（支持API链式调用） ----------
async function handleVodDetail(source, vodId) {
  // vodId 格式由分类页定义，这里假设存储在 extra 字段中（JSON字符串）
  let extra;
  try {
    extra = JSON.parse(vodId);
  } catch(e) {
    // 兼容旧格式：直接传参
    extra = { id: vodId };
  }
  let detailConf = source.detail;
  if (!detailConf) return null;
  
  // 1. 获取信息API（可选）
  let infoData = null;
  if (detailConf.infoApi) {
    let infoUrl = detailConf.infoApi.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(extra[key] || ''));
    infoData = fetchSync(infoUrl, { json: true, cache: false });
    if (!infoData) return null;
  }
  
  // 2. 获取剧集列表API
  let listUrl = detailConf.listApi;
  // 替换变量
  let replaceMap = { ...extra, ...(infoData || {}) };
  listUrl = listUrl.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(replaceMap[key] || ''));
  let listJson = fetchSync(listUrl, { json: true });
  if (!listJson) return null;
  
  let listParse = detailConf.listParse || { type: 'json', dataPath: 'data.list', titleField: 'title', urlField: 'guid' };
  let items = parseItems(listJson, listParse, '');
  if (!items.length) return null;
  
  let videoList = items.map(item => `${item.title}$${item.url}`);
  let vod = {
    vod_name: extra.name || source.name,
    vod_pic: extra.pic || defaultPic,
    type_name: infoData?.channel || '',
    vod_year: extra.year || '',
    vod_remarks: extra.date || '',
    vod_director: extra.topicId || '',
    vod_content: detailConf.content || '详情页面默认只展示最新内容',
    vod_play_from: detailConf.playFrom || source.name,
    vod_play_url: videoList.join('#')
  };
  return vod;
}

// ---------- 分类页处理（支持分页、筛选） ----------
function handleCategory(source, pg, filterParams) {
  pg = parseInt(pg) || 1;
  let homeUrl = source.homeUrl;
  let params = { ...(source.homeParams || {}), p: pg, ...filterParams };
  let url = homeUrl + '?' + Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  let listParse = source.listParse;
  let json = fetchSync(url, { json: true });
  if (!json) return { list: [], total: 0, pagecount: 1 };
  
  let items = parseItems(json, listParse, '');
  items = applyPostProcess(items, source.postProcess);
  
  let videos = [];
  for (let item of items) {
    // 构造 vod_id：可存储足够恢复详情的数据
    let extra = {};
    if (source.detail && source.detail.idFields) {
      for (let field of source.detail.idFields) {
        extra[field] = item.raw[field] || '';
      }
    } else {
      extra = { id: item.url, name: item.title, pic: item.raw?.pic || defaultPic };
    }
    let vodId = JSON.stringify(extra);
    videos.push({
      vod_id: vodId,
      vod_name: item.title,
      vod_pic: item.raw?.pic || defaultPic,
      vod_remarks: ''
    });
  }
  let total = json.total || json.response?.numFound || videos.length;
  let pagecount = Math.ceil(total / (source.homeParams?.n || 20));
  return { list: videos, page: pg, pagecount, total };
}

// ========== CMS 导出接口 ==========
function init(extend) {
  log('零硬编码通用爬虫 v22 初始化');
  let configData = null;
  if (typeof extend === 'object') {
    configData = extend;
  } else if (typeof extend === 'string') {
    if (extend.startsWith('http')) {
      configData = fetchSync(extend, { json: true });
    } else {
      try { configData = JSON.parse(extend); } catch(e) {}
    }
  }
  if (configData && configData.sites) {
    extConfig = configData;
  } else if (Array.isArray(configData)) {
    extConfig.sites = configData.map(s => ({ ...s, type: s.type || 'live' }));
  } else {
    extConfig.sites = [];
  }
  if (extConfig.global) {
    if (extConfig.global.defaultPic) defaultPic = extConfig.global.defaultPic;
    if (extConfig.global.request_timeout) requestTimeout = extConfig.global.request_timeout;
    if (extConfig.global.userAgent) userAgent = extConfig.global.userAgent;
  }
  showMode = getItem('showMode', 'groups');
  groupDict = JSON.parse(getItem('groupDict', '{}'));
  log(`加载 ${extConfig.sites.length} 个站点`);
}

function home() {
  let classes = extConfig.sites.map(site => ({
    type_id: site.name,
    type_name: site.name
  }));
  // 构建筛选器（从每个站点的 filters 字段）
  let filters = {};
  for (let site of extConfig.sites) {
    if (site.filters) {
      filters[site.name] = site.filters;
    }
  }
  // 全局添加展示模式筛选
  let globalFilter = [{
    key: 'show', name: '播放展示', value: [
      { n: '多线路分组', v: 'groups' },
      { n: '单线路合并', v: 'all' }
    ]
  }];
  for (let c of classes) {
    if (!filters[c.type_id]) filters[c.type_id] = [];
    filters[c.type_id].push(...globalFilter);
  }
  return JSON.stringify({ class: classes, filters });
}

function homeVod() {
  return JSON.stringify({ list: [] });
}

function category(tid, pg, filter, extend) {
  let site = extConfig.sites.find(s => s.name === tid);
  if (!site) return JSON.stringify({ list: [] });
  // 合并 filter（筛选器值）和 extend（通常分页、额外参数）
  let filterParams = { ...(filter || {}), ...(extend || {}) };
  // 处理展示模式筛选
  if (filterParams.show) {
    showMode = filterParams.show;
    setItem('showMode', showMode);
    delete filterParams.show;
  }
  let result = handleCategory(site, pg, filterParams);
  return JSON.stringify(result);
}

function detail(vodId) {
  // 先尝试解析 vodId 为 JSON（点播模式）
  let siteName = null;
  let extra = null;
  try {
    extra = JSON.parse(vodId);
    // 通过 extra 中的某个字段判断属于哪个站点（可自定义）
    // 这里简单遍历所有站点，找到第一个有 detail 配置且能处理的
    for (let site of extConfig.sites) {
      if (site.type === 'vod' && site.detail) {
        siteName = site.name;
        break;
      }
    }
    if (!siteName) siteName = extConfig.sites[0]?.name;
  } catch(e) {
    // 兼容直播模式：vodId格式为 "url$tab"
    let parts = vodId.split('$');
    if (parts.length >= 2) {
      let sourceUrl = parts[0];
      let tab = parts[1];
      let site = extConfig.sites.find(s => s.url === sourceUrl);
      if (!site) return JSON.stringify({ list: [] });
      let vod = handleLiveDetail(site, sourceUrl, tab, showMode);
      if (!vod) return JSON.stringify({ list: [] });
      let resultVod = {
        vod_id: vodId,
        vod_name: vod.vod_name,
        vod_pic: defaultPic,
        type_name: '直播',
        vod_play_from: vod.vod_play_from,
        vod_play_url: vod.vod_play_url,
        vod_director: '零硬编码爬虫 v22',
        vod_remarks: '直播列表'
      };
      return JSON.stringify({ list: [resultVod] });
    }
    return JSON.stringify({ list: [] });
  }
  
  // 点播模式
  let site = extConfig.sites.find(s => s.name === siteName);
  if (!site || site.type !== 'vod') return JSON.stringify({ list: [] });
  let vod = await handleVodDetail(site, extra);
  if (!vod) return JSON.stringify({ list: [] });
  vod.vod_id = vodId;
  return JSON.stringify({ list: [vod] });
}

function play(flag, id, vipFlags) {
  // 简单返回，如需智能码率可在此扩展
  return JSON.stringify({ parse: 0, playUrl: '', url: id });
}

function search(wd, quick) {
  // 可扩展搜索逻辑，这里简单返回空
  return JSON.stringify({ list: [] });
}

// 导出
__JS_SPIDER__ = { init, home, homeVod, category, detail, play, search };