// ==================== 通用动态爬虫 ====================
// 版本: 9.0.0 - 自动处理相对路径

const header = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
};

// ==================== 全局变量 ====================
let dynamicClasses = [];
let extBasePath = "";      // ext文件所在的基础路径
let defaultBasePath = "https://raw.githubusercontent.com/mannys888/frist/refs/heads/main/";

// ==================== 工具函数 ====================

function fetchSync(url) {
    try {
        console.log("[fetchSync] 请求: " + url);
        let response = req(url, { 'method': 'GET', 'headers': header });
        if (typeof response === 'string') return response;
        if (response && response.content) return response.content;
        return null;
    } catch (e) {
        console.log("[fetchSync] 错误: " + e.message);
        return null;
    }
}

function getMusicCover(title) {
    let hash = 0;
    for (let i = 0; i < (title || "").length; i++) {
        hash = ((hash << 5) - hash) + title.charCodeAt(i);
    }
    return "https://picsum.photos/200/300?random=" + (Math.abs(hash) % 20);
}

function getFileType(url) {
    if (!url) return "🎵 音乐";
    if (url.indexOf('.mp3') > 0) return "🎵 音频";
    if (url.indexOf('.mp4') > 0) return "🎬 视频";
    if (url.indexOf('.m3u8') > 0) return "📺 直播";
    return "🎵 音乐";
}

/**
 * 🔥 通用路径转换函数
 * 将相对路径转换为基于 basePath 的完整URL
 * 支持: ./xxx, ../xxx, xxx, /xxx 等格式
 */
function resolvePath(path, basePath) {
    if (!path) return "";
    
    // 已经是完整URL，直接返回
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    
    // 确保 basePath 以 / 结尾
    let base = basePath;
    if (!base.endsWith('/')) {
        base = base + '/';
    }
    
    // 处理 ./ 开头
    if (path.startsWith('./')) {
        return base + path.substring(2);
    }
    
    // 处理 ../ 开头
    if (path.startsWith('../')) {
        let parts = base.split('/');
        let upCount = (path.match(/\.\.\//g) || []).length;
        for (let i = 0; i < upCount && parts.length > 0; i++) {
            parts.pop();
        }
        let newBase = parts.join('/') + '/';
        return newBase + path.replace(/\.\.\//g, '');
    }
    
    // 处理以 / 开头（绝对路径）
    if (path.startsWith('/')) {
        // 提取协议和域名
        let match = base.match(/^(https?:\/\/[^/]+)/);
        if (match) {
            return match[1] + path;
        }
        return base + path.substring(1);
    }
    
    // 普通相对路径
    return base + path;
}

// ==================== 解析 ext 配置 ====================
function parseExtConfig(extParam, basePath) {
    let classes = [];
    try {
        let configData = null;
        
        // 1. 判断 ext 是 URL 还是 JSON 字符串
        if (extParam && (extParam.startsWith('http://') || extParam.startsWith('https://'))) {
            console.log("[init] ext 是 URL，开始下载: " + extParam);
            let content = fetchSync(extParam);
            if (content) {
                configData = JSON.parse(content);
                console.log("[init] 下载并解析 JSON 成功");
            }
        } else if (extParam) {
            configData = JSON.parse(extParam);
            console.log("[init] 解析传入的 JSON 字符串成功");
        }
        
        // 2. 根据 JSON 结构生成分类
        if (configData) {
            // 情况1: 数组格式 [{"name": "分类1", "url": "url1"}, ...]
            if (Array.isArray(configData)) {
                for (let item of configData) {
                    if (item.name) {
                        let typeId = item.url || item.name;
                        // 🔥 自动转换相对路径
                        if (typeId && !typeId.startsWith('http')) {
                            typeId = resolvePath(typeId, basePath);
                        }
                        classes.push({
                            type_name: item.name,
                            type_id: typeId
                        });
                    }
                }
            }
            // 情况2: 对象格式，有 sites 字段
            else if (configData.sites && Array.isArray(configData.sites)) {
                for (let site of configData.sites) {
                    if (site.name) {
                        let typeId = site.url || site.api || site.name;
                        if (typeId && !typeId.startsWith('http')) {
                            typeId = resolvePath(typeId, basePath);
                        }
                        classes.push({
                            type_name: site.name,
                            type_id: typeId
                        });
                    }
                }
            }
            // 情况3: 直接遍历对象
            else {
                for (let key in configData) {
                    let item = configData[key];
                    if (item && typeof item === 'object' && item.name) {
                        let typeId = item.url || key;
                        if (typeId && !typeId.startsWith('http')) {
                            typeId = resolvePath(typeId, basePath);
                        }
                        classes.push({
                            type_name: item.name,
                            type_id: typeId
                        });
                    }
                }
            }
        }
    } catch(e) {
        console.log("[init] 解析 ext 失败: " + e.message);
    }
    
    // 如果没有解析到任何分类，使用默认分类
    if (classes.length === 0) {
        console.log("[init] 未从 ext 解析到分类，使用默认分类");
        classes = [
            { type_name: "📖🟣内🟣迦南诗歌", type_id: resolvePath("迦南诗歌.txt", defaultBasePath) },
            { type_name: "🎵 音乐排行", type_id: resolvePath("yypy.txt", defaultBasePath) },
            { type_name: "🙏 赞美诗歌", type_id: resolvePath("zm.txt", defaultBasePath) },
            { type_name: "📺 央视栏目", type_id: "cctv" }
        ];
    }
    
    return classes;
}

// ==================== 核心功能 ====================

function init(extend) {
    console.log("[init] 爬虫初始化，extend: " + (extend ? extend.substring(0, 100) : "null"));
    
    // 🔥 关键：提取 ext 文件的基础路径
    extBasePath = defaultBasePath;
    if (extend) {
        if (extend.startsWith('http')) {
            // 传入的是 URL，提取目录路径
            extBasePath = extend.substring(0, extend.lastIndexOf('/') + 1);
        } else if (extend.trim().startsWith('{')) {
            // 传入的是 JSON 内容，尝试从内容中提取路径？保持默认
            console.log("[init] ext 是 JSON 内容，使用默认基础路径: " + extBasePath);
        }
    }
    console.log("[init] extBasePath: " + extBasePath);
    
    // 解析 ext，生成动态分类
    dynamicClasses = parseExtConfig(extend, extBasePath);
    console.log("[init] 生成分类数量: " + dynamicClasses.length);
    console.log("[init] 分类列表: " + JSON.stringify(dynamicClasses));
}

function home() {
    return JSON.stringify({
        class: dynamicClasses,
        filters: null
    });
}

function homeVod() {
    return JSON.stringify({ list: [] });
}

/**
 * 🔥 通用 category 函数
 * 自动从分类ID中提取文件路径，支持完整URL和相对路径
 */
function category(tid, pg, filter, extend) {
    try {
        pg = parseInt(pg) || 1;
        console.log("[category] tid: " + tid + ", pg: " + pg);
        
        if (pg >= 2) {
            return JSON.stringify({ list: [], page: pg, pagecount: 1, limit: 90, total: 0 });
        }
        
        let videos = [];
        
        // 🔥 央视栏目特殊处理
        if (tid === "cctv" || tid === "央视栏目") {
            let channels = [
                "CCTV-1 综合", "CCTV-2 财经", "CCTV-3 综艺", "CCTV-4 中文国际",
                "CCTV-5 体育", "CCTV-6 电影", "CCTV-7 国防军事", "CCTV-8 电视剧",
                "CCTV-9 纪录", "CCTV-10 科教", "CCTV-11 戏曲", "CCTV-12 社会与法",
                "CCTV-13 新闻", "CCTV-14 少儿", "CCTV-15 音乐"
            ];
            for (let i = 0; i < channels.length; i++) {
                videos.push({
                    vod_id: "cctv" + (i+1) + "###cctv",
                    vod_name: channels[i],
                    vod_pic: getMusicCover(channels[i]),
                    vod_remarks: "📺 直播"
                });
            }
        } 
        else {
            // 🔥 通用处理：tid 可能是完整URL或相对路径
            let fileUrl = tid;
            
            // 如果不是完整URL，使用 extBasePath 拼接
            if (!tid.startsWith('http://') && !tid.startsWith('https://')) {
                fileUrl = resolvePath(tid, extBasePath);
                // 如果还不是完整URL，尝试添加默认域名
                if (!fileUrl.startsWith('http')) {
                    fileUrl = defaultBasePath + tid;
                }
            }
            
            console.log("[category] 请求文件: " + fileUrl);
            let content = fetchSync(fileUrl);
            
            if (content && content.length > 0) {
                let lines = content.split(/\r?\n/);
                console.log("[category] 文件行数: " + lines.length);
                
                for (let line of lines) {
                    if (!line || line.trim() === "") continue;
                    
                    // 支持多种分隔符: 逗号 或 美元符号
                    let separator = line.indexOf(',') > 0 ? ',' : '$';
                    let idx = line.indexOf(separator);
                    
                    if (idx > 0) {
                        let title = line.substring(0, idx).trim();
                        let link = line.substring(idx + 1).trim();
                        
                        // 🔥 修复相对路径（基于文件所在目录）
                        if (link && !link.startsWith('http')) {
                            let fileBasePath = fileUrl.substring(0, fileUrl.lastIndexOf('/') + 1);
                            link = resolvePath(link, fileBasePath);
                        }
                        
                        if (link && (link.startsWith('http') || link.startsWith('https'))) {
                            videos.push({
                                vod_id: link + "###music",
                                vod_name: title,
                                vod_pic: getMusicCover(title),
                                vod_remarks: getFileType(link)
                            });
                        }
                    }
                }
                console.log("[category] 获取到 " + videos.length + " 条数据");
            } else {
                console.log("[category] 文件请求失败或为空: " + fileUrl);
                // 返回提示信息
                videos.push({
                    vod_id: "error###test",
                    vod_name: "⚠️ 无法加载数据: " + (tid.length > 50 ? tid.substring(0, 50) + "..." : tid),
                    vod_pic: "",
                    vod_remarks: "请检查文件是否存在"
                });
            }
        }
        
        return JSON.stringify({
            list: videos,
            page: pg,
            pagecount: 1,
            limit: 90,
            total: videos.length
        });
    } catch(e) {
        console.log("[category] 错误: " + e.message);
        return JSON.stringify({ list: [], page: pg, pagecount: 0, limit: 90, total: 0 });
    }
}

function detail(vodId) {
    try {
        let parts = vodId.split('###');
        if (parts.length < 2) return JSON.stringify({ list: [] });
        
        let videoId = parts[0];
        let type = parts[1];
        
        if (type === "cctv") {
            let streamUrls = {
                "cctv1": "https://cctv1h5cctv.aikan.miguvideo.com/cctv1_2/index.m3u8",
                "cctv2": "https://cctv2h5cctv.aikan.miguvideo.com/cctv2_2/index.m3u8",
                "cctv3": "https://cctv3h5cctv.aikan.miguvideo.com/cctv3_2/index.m3u8",
                "cctv4": "https://cctv4h5cctv.aikan.miguvideo.com/cctv4_2/index.m3u8",
                "cctv5": "https://cctv5h5cctv.aikan.miguvideo.com/cctv5_2/index.m3u8"
            };
            let streamUrl = streamUrls[videoId] || streamUrls["cctv1"];
            let vod = {
                vod_id: videoId,
                vod_name: "央视直播",
                vod_play_from: "央视直播",
                vod_play_url: "直播流$" + streamUrl
            };
            return JSON.stringify({ list: [vod] });
        } else {
            let title = videoId.split('/').pop().split('.')[0] || "音乐";
            let vod = {
                vod_id: videoId,
                vod_name: title,
                vod_pic: getMusicCover(title),
                vod_play_from: "音乐",
                vod_play_url: title + "$" + videoId
            };
            return JSON.stringify({ list: [vod] });
        }
    } catch(e) {
        console.log("[detail] 错误: " + e.message);
        return JSON.stringify({ list: [] });
    }
}

function play(flag, id, vipFlags) {
    console.log("[play] " + id);
    return JSON.stringify({ parse: 0, url: id });
}

function search(keyword, page) {
    return JSON.stringify({ list: [] });
}

// ==================== 导出 ====================
__JS_SPIDER__ = {
    'init': init,
    'home': home,
    'homeVod': homeVod,
    'category': category,
    'detail': detail,
    'play': play,
    'search': search
};