// ==================== 支持 ext 配置的动态爬虫 ====================
// 版本: 6.0.0

const header = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
};

// ==================== 工具函数 ====================

/**
 * 智能网络请求 (同步)
 */
function fetchSync(url) {
    try {
        console.log("[fetchSync] 请求: " + url);
        let response = req(url, { 'method': 'GET', 'headers': header });
        // 兼容不同的返回格式
        if (typeof response === 'string') return response;
        if (response && response.content) return response.content;
        return null;
    } catch (e) {
        console.log("[fetchSync] 错误: " + e.message);
        return null;
    }
}

/**
 * 解析 ext 配置，生成分类列表
 */
function parseExtConfig(extParam) {
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
            // 直接是 JSON 字符串
            configData = JSON.parse(extParam);
            console.log("[init] 解析传入的 JSON 字符串成功");
        }
        
        // 2. 根据 JSON 结构生成分类
        if (configData) {
            // 情况1: 数组格式，如 [{"name": "分类1", "url": "url1"}, ...]
            if (Array.isArray(configData)) {
                for (let item of configData) {
                    if (item.name) {
                        classes.push({
                            type_name: item.name,
                            type_id: item.url || item.name
                        });
                    }
                }
            }
            // 情况2: 对象格式，可能有 sites 或 list 字段
            else if (configData.sites && Array.isArray(configData.sites)) {
                for (let site of configData.sites) {
                    if (site.name) {
                        classes.push({
                            type_name: site.name,
                            type_id: site.url || site.api || site.name
                        });
                    }
                }
            }
            // 情况3: 对象格式，直接遍历
            else {
                for (let key in configData) {
                    if (configData[key] && typeof configData[key] === 'object') {
                        if (configData[key].name) {
                            classes.push({
                                type_name: configData[key].name,
                                type_id: configData[key].url || key
                            });
                        }
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
            { type_name: "📖 迦南诗歌", type_id: "迦南诗歌.txt" },
            { type_name: "🎵 音乐排行", type_id: "yypy.txt" },
            { type_name: "🙏 赞美诗歌", type_id: "zm.txt" },
            { type_name: "📺 央视栏目", type_id: "cctv" }
        ];
    }
    
    return classes;
}

/**
 * 获取音乐封面
 */
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

// ==================== 全局变量 ====================
let dynamicClasses = [];

// ==================== 核心功能 ====================

function init(extend) {
    console.log("[init] 爬虫初始化，extend: " + (extend ? extend.substring(0, 100) : "null"));
    // 🔥 关键：解析 ext，生成动态分类
    dynamicClasses = parseExtConfig(extend);
    console.log("[init] 生成分类数量: " + dynamicClasses.length);
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

function category(tid, pg, filter, extend) {
    try {
        pg = parseInt(pg) || 1;
        console.log("[category] tid: " + tid + ", pg: " + pg);
        
        if (pg >= 2) {
            return JSON.stringify({ list: [], page: pg, pagecount: 1, limit: 90, total: 0 });
        }
        
        let videos = [];
        let baseUrl = "https://raw.githubusercontent.com/mannys888/frist/refs/heads/main/";
        
        // 央视栏目（特殊处理）
        if (tid === "cctv" || tid === "央视栏目") {
            let channels = [
                "CCTV-1 综合", "CCTV-2 财经", "CCTV-3 综艺", "CCTV-4 中文国际",
                "CCTV-5 体育", "CCTV-6 电影", "CCTV-7 国防军事", "CCTV-8 电视剧"
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
        // 其他分类：请求 TXT 文件
        else {
            let fileName = tid;
            if (!fileName.endsWith('.txt')) {
                fileName = fileName + '.txt';
            }
            let fileUrl = baseUrl + fileName;
            console.log("[category] 请求文件: " + fileUrl);
            
            let content = fetchSync(fileUrl);
            if (content) {
                let lines = content.split(/\r?\n/);
                for (let line of lines) {
                    if (!line || line.trim() === "") continue;
                    let commaIndex = line.indexOf(',');
                    if (commaIndex > 0) {
                        let title = line.substring(0, commaIndex).trim();
                        let link = line.substring(commaIndex + 1).trim();
                        if (link && link.startsWith('http')) {
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
            let streamUrl = "https://cctv1h5cctv.aikan.miguvideo.com/cctv1_2/index.m3u8";
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