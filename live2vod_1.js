// ==================== 动态爬虫（修复category路径） ====================
// 版本: 8.0.0

const header = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
};

// ==================== 全局变量 ====================
let dynamicClasses = [];
let extBasePath = "";  // 🔥 保存ext文件的基础路径

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

// 🔥 修复相对路径为完整URL
function fixUrl(url, basePath) {
    if (!url) return "";
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    if (url.startsWith('./')) {
        return basePath + url.substring(2);
    }
    if (url.startsWith('../')) {
        let parts = basePath.split('/');
        let upCount = (url.match(/\.\.\//g) || []).length;
        for (let i = 0; i < upCount && parts.length > 0; i++) parts.pop();
        let base = parts.join('/') + '/';
        return base + url.replace(/\.\.\//g, '');
    }
    return basePath + url;
}

// ==================== 解析 ext 配置 ====================
function parseExtConfig(extParam, basePath) {
    let classes = [];
    try {
        let configData = null;
        
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
        
        if (configData) {
            if (Array.isArray(configData)) {
                for (let item of configData) {
                    if (item.name) {
                        // 🔥 修复URL
                        let typeId = item.url || item.name;
                        if (typeId && !typeId.startsWith('http') && basePath) {
                            typeId = fixUrl(typeId, basePath);
                        }
                        classes.push({
                            type_name: item.name,
                            type_id: typeId
                        });
                    }
                }
            } else if (configData.sites && Array.isArray(configData.sites)) {
                for (let site of configData.sites) {
                    if (site.name) {
                        let typeId = site.url || site.api || site.name;
                        if (typeId && !typeId.startsWith('http') && basePath) {
                            typeId = fixUrl(typeId, basePath);
                        }
                        classes.push({
                            type_name: site.name,
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
            { type_name: "📖 迦南诗歌", type_id: "迦南诗歌.txt" },
            { type_name: "🎵 音乐排行", type_id: "yypy.txt" },
            { type_name: "🙏 赞美诗歌", type_id: "zm.txt" },
            { type_name: "📺 央视栏目", type_id: "cctv" }
        ];
    }
    
    return classes;
}

// ==================== 核心功能 ====================

function init(extend) {
    console.log("[init] 爬虫初始化，extend: " + (extend ? extend.substring(0, 100) : "null"));
    
    // 🔥 保存ext文件的基础路径（用于解析相对路径）
    extBasePath = "";
    if (extend && extend.startsWith('http')) {
        // 如果传入的是URL，提取目录路径
        extBasePath = extend.substring(0, extend.lastIndexOf('/') + 1);
    } else if (extend && extend.trim().startsWith('{')) {
        // 如果传入的是JSON内容，尝试从内容中推断？暂时留空
        extBasePath = "https://raw.githubusercontent.com/mannys888/frist/refs/heads/main/";
    }
    console.log("[init] extBasePath: " + extBasePath);
    
    // 解析 ext，生成动态分类
    dynamicClasses = parseExtConfig(extend, extBasePath);
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

// 🔥 核心修复：category 函数 - 使用正确的路径
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
        else {
            // 🔥 其他分类：tid 可能是完整URL或文件名
            let fileUrl = tid;
            
            // 如果tid不是完整URL，使用extBasePath拼接
            if (!tid.startsWith('http://') && !tid.startsWith('https://')) {
                // 使用extBasePath或默认baseUrl
                let baseUrl = extBasePath || "https://raw.githubusercontent.com/mannys888/frist/refs/heads/main/";
                fileUrl = baseUrl + tid;
                // 确保有.txt后缀
                if (!fileUrl.endsWith('.txt')) {
                    fileUrl = fileUrl + '.txt';
                }
            }
            
            console.log("[category] 请求文件: " + fileUrl);
            let content = fetchSync(fileUrl);
            
            if (content && content.length > 0) {
                let lines = content.split(/\r?\n/);
                console.log("[category] 文件行数: " + lines.length);
                
                for (let line of lines) {
                    if (!line || line.trim() === "") continue;
                    
                    // 支持两种格式: "标题,URL" 或 "标题$URL"
                    let separator = line.indexOf(',') > 0 ? ',' : '$';
                    let idx = line.indexOf(separator);
                    
                    if (idx > 0) {
                        let title = line.substring(0, idx).trim();
                        let link = line.substring(idx + 1).trim();
                        
                        // 🔥 修复相对路径
                        if (link && !link.startsWith('http')) {
                            let baseUrl = fileUrl.substring(0, fileUrl.lastIndexOf('/') + 1);
                            link = fixUrl(link, baseUrl);
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
                videos.push({
                    vod_id: "error###test",
                    vod_name: "⚠️ 无法加载数据: " + tid,
                    vod_pic: "",
                    vod_remarks: "错误"
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