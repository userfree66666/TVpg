/**
 * live2cms.js (配置驱动版)
 * 功能：将直播源（TXT/M3U/JSON）转成点播格式，支持分组显示、搜索合并
 * 关键特性：
 *   1. 完全保留原 join 方法：单线路用 "#" 连接，多线路分组用 "$$$" 分隔组、组内 "#" 连接
 *   2. 外部 ext 配置驱动，无需修改核心代码即可适配新源
 *   3. 支持纯文本、M3U、JSON 三种源类型
 *   4. 搜索合并所有源结果，并自动分组缓存
 *   5. 详细中文注释，便于二次开发
 */

// ======================== 工具函数 ========================

/** 去除末尾指定字符 */
String.prototype.rstrip = function (chars) {
  let regex = new RegExp(chars + "$");
  return this.replace(regex, "");
};

// 全局常量
const RKEY = 'live2cms_v2';            // 本地存储的键名前缀
const VERSION = 'live2cms v2.0 (配置驱动)';
const UA = 'Mozilla/5.0';
let DEFAULT_REQUEST_TIMEOUT = 5000;    // 默认超时 ms
let DEFAULT_PIC = 'https://avatars.githubusercontent.com/u/97389433?s=120&v=4';  // 默认封面
const TIPS = `\n道长直播转点播js-当前版本${VERSION}`;

// 运行时数据
let extConfig = { sources: [], global: {} };   // 解析后的 ext 配置
let sourceCache = {};                           // 源文件内容缓存 { url: content }

// 用户配置项（持久化到本地）
let showMode = getItem('showMode', 'groups');   // 'groups' 多线路分组 / 'all' 单线路合并
let groupDict = JSON.parse(getItem('groupDict', '{}')); // 搜索分组字典 { 频道名: [ "标题,url" ] }

// ======================== 本地存储封装 ========================
function setItem(k, v) {
  local.set(RKEY, k, v);
  console.log(`[存储] 设置 ${k} = ${v}`);
}
function getItem(k, v) {
  return local.get(RKEY, k) || v;
}
function clearItem(k) {
  local.delete(RKEY, k);
}

// ======================== 辅助函数 ========================
function print(any) {
  any = any || '';
  if (typeof any === 'object' && Object.keys(any).length > 0) {
    try {
      any = JSON.stringify(any);
      console.log(any);
    } catch (e) {
      console.log(typeof any + ':' + any.length);
    }
  } else if (typeof any === 'object') {
    console.log('null object');
  } else {
    console.log(any);
  }
}

/** 提取 url 的根域名（含协议） */
function getHome(url) {
  if (!url) return '';
  let tmp = url.split('//');
  url = tmp[0] + '//' + tmp[1].split('/')[0];
  try { url = decodeURIComponent(url); } catch (e) {}
  return url;
}

// ======================== 核心解析器 ========================
/**
 * 根据源配置，将原始内容解析为 { title, url } 数组
 * @param {string} content - 源文件内容
 * @param {object} sourceConfig - 该源的配置（如 type, json_path 等）
 * @param {string} baseUrl - 用于相对路径补全（对 JSON 中的相对地址有用）
 * @returns {Array<{title:string, url:string}>}
 */
function parseSource(content, sourceConfig, baseUrl) {
  let items = [];
  let type = sourceConfig.type || 'text';

  // ----- 1. M3U 格式解析 -----
  if (type === 'm3u') {
    const lines = content.split(/\r?\n/);
    let currentTitle = '';
    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('#EXTINF:')) {
        let match = line.match(/#EXTINF:.*?,(.*)/);
        if (match) currentTitle = match[1].trim();
      } else if (line && !line.startsWith('#')) {
        if (line.match(/^https?:\/\//i)) {
          items.push({ title: currentTitle || '直播流', url: line });
          currentTitle = '';
        }
      }
    }
    return items;
  }
  
  // ----- 2. JSON API 解析 -----
  else if (type === 'json') {
    try {
      let json = JSON.parse(content);
      let dataArr = json;
      // 支持点分隔的 json_path，如 "data.list"
      if (sourceConfig.json_path) {
        const parts = sourceConfig.json_path.split('.');
        for (let p of parts) {
          dataArr = dataArr[p];
          if (dataArr === undefined) break;
        }
      }
      if (!Array.isArray(dataArr)) dataArr = dataArr || [];
      for (let item of dataArr) {
        let title = sourceConfig.title_field ? item[sourceConfig.title_field] : (item.title || item.name);
        let url = sourceConfig.url_field ? item[sourceConfig.url_field] : (item.url || item.play_url);
        if (title && url) {
          // 如果 url 是相对路径，尝试补全
          if (!url.match(/^https?:\/\//i) && baseUrl) {
            url = new URL(url, baseUrl).href;
          }
          items.push({ title, url });
        }
      }
    } catch (e) {
      print(`[错误] JSON 解析失败: ${e.message}`);
    }
    return items;
  }
  
  // ----- 3. 纯文本格式（默认）-----
  else {
    const lines = content.split(/\r?\n/);
    const sep = sourceConfig.line_sep || ',';   // 分隔符，默认为逗号
    const regex = new RegExp(`^(.+?)${sep}(https?://\\S+)`);
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;
      let match = line.match(regex);
      if (match) {
        items.push({ title: match[1].trim(), url: match[2].trim() });
      } else if (line.match(/^https?:\/\//i)) {
        // 单独一行的纯 URL
        items.push({ title: '直播流', url: line });
      }
    }
    return items;
  }
}

// ======================== 网络请求（带超时、Referer 等） ========================
/**
 * 通用请求函数，返回 { content, json, text } 兼容对象
 */
function httpRequest(url, options = {}) {
  if (options.method === 'POST' && options.data) {
    options.body = JSON.stringify(options.data);
    options.headers = Object.assign({ 'content-type': 'application/json' }, options.headers);
  }
  options.timeout = options.timeout || DEFAULT_REQUEST_TIMEOUT;
  if (!options.headers) options.headers = {};
  let headersLower = Object.keys(options.headers).map(k => k.toLowerCase());
  if (!headersLower.includes('referer')) {
    options.headers['Referer'] = getHome(url);
  }
  if (!headersLower.includes('user-agent')) {
    options.headers['User-Agent'] = UA;
  }
  try {
    const res = req(url, options);
    // 增强返回对象，方便调用
    res.json = () => (res.content ? JSON.parse(res.content) : null);
    res.text = () => res.content || '';
    return res;
  } catch (e) {
    print(`[网络错误] ${url} - ${e.message}`);
    return { json: () => null, text: () => '', content: '' };
  }
}
// 快捷方法
httpRequest.get = (url, options) => httpRequest(url, Object.assign(options, { method: 'GET' }));
httpRequest.post = (url, options) => httpRequest(url, Object.assign(options, { method: 'POST' }));

/**
 * 获取源内容（带缓存、自动识别 M3U 并转换成普通格式）
 * @param {string} url - 源地址
 * @param {object} sourceConfig - 源的配置
 * @returns {string} 处理后的文本内容
 */
function fetchSource(url, sourceConfig) {
  if (sourceCache[url]) return sourceCache[url];
  let opts = {
    timeout: sourceConfig.timeout || DEFAULT_REQUEST_TIMEOUT,
    headers: sourceConfig.headers || {}
  };
  let resp = httpRequest.get(url, opts);
  let content = resp.text();
  // 如果未指定 type 但内容为 M3U，且配置未强制指定，则自动转换（兼容旧逻辑）
  if (!sourceConfig.type && content.includes('#EXTM3U')) {
    content = convertM3uToNormal(content);
  }
  sourceCache[url] = content;
  return content;
}

/**
 * M3U 格式转成普通标签+地址格式（原版函数，不做改动）
 * 输入 M3U 内容，输出形如：
 *   CCTV1,#genre#
 *   http://xxx/1.ts
 *   CCTV2,#genre#
 *   http://xxx/2.ts
 */
function convertM3uToNormal(m3u) {
  try {
    const lines = m3u.split('\n');
    let result = '';
    let TV = '';
    let flag = '#m3u#';
    let currentGroupTitle = '';
    lines.forEach((line) => {
      if (line.startsWith('#EXTINF:')) {
        const groupTitle = line.split('"')[1].trim();
        TV = line.split('"')[2].substring(1);
        if (currentGroupTitle !== groupTitle) {
          currentGroupTitle = groupTitle;
          result += `\n${currentGroupTitle},${flag}\n`;
        }
      } else if (line.startsWith('http')) {
        const splitLine = line.split(',');
        result += `${TV}\,${splitLine[0]}\n`;
      }
    });
    return result.trim();
  } catch (e) {
    print(`[M3U转换错误] ${e.message}`);
    return m3u;
  }
}

// ======================== 分组算法（原版保留） ========================
/**
 * 根据标题前缀对播放列表进行智能分组（原版 splitArray，完全保留）
 * 例如：[ "CCTV1$url1", "CCTV2$url2", "CCTV1$url3" ] 会被分成两组：同前缀的在一起
 */
function splitArray(arr, parse) {
  parse = parse && typeof parse === 'function' ? parse : '';
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

/**
 * 根据频道名生成分组字典（用于搜索）
 * @param {Array<string>} arr - 形如 ["CCTV1,http://...", ...] 的数组
 * @param {Function} parse - 可选，从字符串中提取组名的函数
 * @returns {Object} 字典 { 组名: [原始行, ...] }
 */
function genGroupDict(arr, parse) {
  let dict = {};
  arr.forEach((line) => {
    let key = line.split(',')[0];
    if (parse && typeof parse === 'function') key = parse(key);
    if (!dict[key]) dict[key] = [line];
    else dict[key].push(line);
  });
  return dict;
}

// ======================== ext 初始化 ========================
/**
 * 入口函数，解析 ext 参数（可以是 JSON 字符串、对象或 URL）
 * @param {string|object} extend - 配置数据
 */
function init(extend) {
  console.log(`当前版本: ${VERSION}`);
  let rawConfig = null;
  if (typeof extend === 'object') {
    rawConfig = extend;
    print('ext 类型: object');
  } else if (typeof extend === 'string') {
    if (extend.startsWith('http')) {
      // ext 是一个远程 JSON 文件 URL
      const dataUrl = extend.split(';')[0];
      print(`加载远程配置: ${dataUrl}`);
      rawConfig = httpRequest.get(dataUrl).json();
    } else {
      try {
        rawConfig = JSON.parse(extend);
      } catch (e) {
        print(`ext JSON 解析失败: ${e.message}`);
      }
    }
  }
  // 标准化配置：支持两种格式
  // 格式1: 直接数组 [ {name, url, ...} ]
  // 格式2: 对象 { sources: [...], global: {...} }
  if (Array.isArray(rawConfig) && rawConfig.length > 0 && rawConfig[0].name && rawConfig[0].url) {
    extConfig.sources = rawConfig;
  } else if (rawConfig && rawConfig.sources) {
    extConfig = rawConfig;
  } else {
    extConfig.sources = [];
    print('[警告] 未检测到有效源配置');
  }
  // 应用全局设置
  if (extConfig.global) {
    if (extConfig.global.defaultPic) DEFAULT_PIC = extConfig.global.defaultPic;
    if (extConfig.global.request_timeout) DEFAULT_REQUEST_TIMEOUT = extConfig.global.request_timeout;
  }
  print(`初始化完成，共加载 ${extConfig.sources.length} 个直播源`);
}

// ======================== 首页：分类列表 ========================
function home(filter) {
  let classes = extConfig.sources.map(src => ({
    type_id: src.url,
    type_name: src.name,
  }));
  // 定义全局筛选器（用于切换显示模式）
  let filters = {
    show: {
      key: 'show',
      name: '播放展示',
      value: [
        { n: '多线路分组', v: 'groups' },
        { n: '单线路合并', v: 'all' }
      ]
    }
  };
  let filterDict = {};
  classes.forEach(c => { filterDict[c.type_id] = filters; });
  return JSON.stringify({ class: classes, filters: filterDict });
}

// ======================== 首页推荐（取第一个源的频道分组） ========================
function homeVod(params) {
  if (!extConfig.sources.length) return JSON.stringify({ list: [] });
  const firstSrc = extConfig.sources[0];
  const content = fetchSource(firstSrc.url, firstSrc);
  // 提取格式为 "频道名,#标签#" 的行
  let genreMatches = content.match(/.*?[,，]#[\s\S].*?#/g) || [];
  let list = [];
  genreMatches.forEach(line => {
    let vname = line.split(/[,，]/)[0];
    let vtab = line.match(/#(.*?)#/)[0];
    list.push({
      vod_name: vname,
      vod_id: firstSrc.url + '$' + vname,
      vod_pic: DEFAULT_PIC,
      vod_remarks: vtab,
    });
  });
  return JSON.stringify({ list });
}

// ======================== 分类页（展示某个源的所有频道分组） ========================
function category(tid, pg, filter, extendParams) {
  // 处理筛选器（切换显示模式）
  let fl = filter ? extendParams : {};
  if (fl.show) {
    showMode = fl.show;
    setItem('showMode', showMode);
  }
  if (parseInt(pg) > 1) {
    return JSON.stringify({ list: [] }); // 不分页，只返回第一页
  }
  const source = extConfig.sources.find(s => s.url === tid);
  if (!source) return JSON.stringify({ list: [] });
  const content = fetchSource(tid, source);
  const genreMatches = content.match(/.*?[,，]#[\s\S].*?#/g) || [];
  let list = [];
  genreMatches.forEach(line => {
    let vname = line.split(/[,，]/)[0];
    let vtab = line.match(/#(.*?)#/)[0];
    list.push({
      vod_name: vname,
      vod_id: tid + '$' + vname,
      vod_pic: DEFAULT_PIC,
      vod_remarks: vtab,
    });
  });
  return JSON.stringify({
    page: 1,
    pagecount: 1,
    limit: list.length,
    total: list.length,
    list,
  });
}

// ======================== 详情页（核心：生成播放列表，join 方法完全不变） ========================
function detail(tid) {
  const parts = tid.split('$');
  const sourceUrl = parts[0];
  const selectedTab = parts[1];   // 选中的分组名，如 "央视"

  // 处理搜索跳转的特殊 id（格式: "频道名$关键词#search#"）
  if (tid.includes('#search#')) {
    const keyword = selectedTab.replace('#search#', '');
    const vodPlayFrom = `来自搜索:${sourceUrl}`;
    // 从 groupDict 中取出该频道名对应的所有线路，并拼接成 "标题$url" 格式，用 # 连接
    const playUrl = groupDict[sourceUrl].map(x => x.replace(',', '$')).join('#');
    return JSON.stringify({
      list: [{
        vod_id: tid,
        vod_name: `搜索:${keyword}`,
        type_name: "直播列表",
        vod_pic: DEFAULT_PIC,
        vod_content: tid,
        vod_play_from: vodPlayFrom,
        vod_play_url: playUrl,
        vod_director: TIPS,
        vod_remarks: `当前版本 ${VERSION}`,
      }]
    });
  }

  // 正常详情：根据 sourceUrl 和 selectedTab 提取该分组下的所有直播地址
  const source = extConfig.sources.find(s => s.url === sourceUrl);
  if (!source) return JSON.stringify({ list: [] });
  const fullContent = fetchSource(sourceUrl, source);
  
  // 构建正则：匹配 "分组名, #标签#" 后面的所有直播行，直到遇到下一个分组或文件结束
  const safeTab = selectedTab.replace('(', '\\(').replace(')', '\\)');
  const regex = new RegExp(`.*?${safeTab}[,，]#[\\s\\S].*?#`);
  const matchBlock = fullContent.match(regex);
  if (!matchBlock) return JSON.stringify({ list: [] });
  const block = matchBlock[0];
  let afterBlock = fullContent.split(block)[1];
  // 如果后面还有另一个分组，则截断
  const nextGroupMatch = afterBlock.match(/.*?[,，]#[\s\S].*?#/);
  if (nextGroupMatch) {
    afterBlock = afterBlock.split(nextGroupMatch[0])[0];
  }
  const lines = afterBlock.trim().split('\n');
  let playItems = [];   // 格式: ["标题$url", ...]
  lines.forEach(line => {
    if (line.trim()) {
      let partsLine = line.trim().split(',');
      if (partsLine.length >= 2) {
        let title = partsLine[0];
        let url = partsLine[1];
        playItems.push(`${title}$${url}`);
      }
    }
  });

  const sourceName = source.name;
  let vodPlayUrl, vodPlayFrom;

  // 根据 showMode 决定播放列表的组装方式（完全保留原 join 逻辑）
  if (showMode === 'groups') {
    // 多线路分组模式：先按标题前缀分组，组内用 # 连接，组间用 $$$ 连接
    const groups = splitArray(playItems, x => x.split('$')[0]);
    const tabs = [];
    for (let i = 0; i < groups.length; i++) {
      if (i === 0) tabs.push(sourceName + '1');
      else tabs.push(` ${i + 1} `);
    }
    vodPlayUrl = groups.map(group => group.join('#')).join('$$$');
    vodPlayFrom = tabs.join('$$$');
  } else {
    // 单线路模式：所有频道直接用 # 连接
    vodPlayUrl = playItems.join('#');
    vodPlayFrom = sourceName;
  }

  const vod = {
    vod_id: tid,
    vod_name: `${sourceName}|${selectedTab}`,
    type_name: "直播列表",
    vod_pic: DEFAULT_PIC,
    vod_content: tid,
    vod_play_from: vodPlayFrom,
    vod_play_url: vodPlayUrl,
    vod_director: TIPS,
    vod_remarks: `当前版本 ${VERSION}`,
  };
  return JSON.stringify({ list: [vod] });
}

// ======================== 播放接口（直接返回地址） ========================
function play(flag, id, flags) {
  // 如果 url 是 m3u8 则 parse=0（不解析），否则 parse=1（解析重定向）
  let vod = { parse: /m3u8/.test(id) ? 0 : 1, playUrl: '', url: id };
  return JSON.stringify(vod);
}

// ======================== 搜索（合并所有源，按频道名分组） ========================
function search(wd, quick) {
  if (!extConfig.sources.length) return JSON.stringify({ list: [] });
  let allRawLines = [];
  // 遍历所有源，收集所有 "频道,http://..." 行
  for (let src of extConfig.sources) {
    const content = fetchSource(src.url, src);
    const lines = content.split('\n').filter(line => {
      line = line.trim();
      return line && line.includes(',') && line.split(',')[1] && line.split(',')[1].trim().startsWith('http');
    });
    allRawLines.push(...lines);
  }
  // 去重（基于 URL 去重，保留第一个）
  const uniqueMap = new Map();
  for (let line of allRawLines) {
    const url = line.split(',')[1].trim();
    if (!uniqueMap.has(url)) uniqueMap.set(url, line);
  }
  let uniqueLines = Array.from(uniqueMap.values());
  // 按关键词过滤
  let filtered = uniqueLines.filter(line => line.includes(wd));
  // 生成新的分组字典（按频道名）
  const newGroupDict = genGroupDict(filtered);
  // 合并到全局字典（用于搜索详情跳转）
  Object.assign(groupDict, newGroupDict);
  setItem('groupDict', JSON.stringify(groupDict));
  
  // 构建搜索结果列表（每个频道名作为一个条目）
  let resultList = [];
  for (let groupName of Object.keys(newGroupDict)) {
    resultList.push({
      vod_name: groupName,
      vod_id: groupName + '$' + wd + '#search#',
      vod_pic: DEFAULT_PIC,
    });
  }
  return JSON.stringify({ list: resultList });
}

// ======================== 导出所有接口 ========================
export default {
  init,
  home,
  homeVod,
  category,
  detail,
  play,
  search
};