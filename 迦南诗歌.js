// ==================== 正式版爬虫 - 可读取GitHub文件 ====================
// 版本: 6.0.0

// ==================== 全局配置 ====================
const header = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
};

// ==================== 工具函数 ====================

/**
 * 安全的网络请求 - 修复版
 */
function fetchSync(url) {
    try {
        console.log("请求URL: " + url);
        let response = req(url, {
            'method': 'GET',
            'headers': header
        });
        // 确保返回正确的格式
        if (response && response.content) {
            return response.content;
        }
        return null;
    } catch (error) {
        console.log("请求失败: " + url + ", 错误: " + error);
        return null;
    }
}

/**
 * 获取音乐封面
 */
function getMusicCover(title) {
    let defaultCovers = [
        "https://picsum.photos/200/300?random=1",
        "https://picsum.photos/200/300?random=2",
        "https://picsum.photos/200/300?random=3",
        "https://picsum.photos/200/300?random=4",
        "https://picsum.photos/200/300?random=5"
    ];
    
    let hash = 0;
    for (let i = 0; i < (title || "").length; i++) {
        hash = ((hash << 5) - hash) + title.charCodeAt(i);
        hash = hash & hash;
    }
    let index = Math.abs(hash) % defaultCovers.length;
    return defaultCovers[index];
}

/**
 * 获取文件扩展名判断类型
 */
function getFileType(url) {
    if (!url) return "点播";
    if (url.indexOf('.mp3') > 0) return "🎵 音频";
    if (url.indexOf('.mp4') > 0) return "🎬 视频";
    if (url.indexOf('.m3u8') > 0) return "📺 直播";
    return "🎵 音乐";
}

// ==================== 核心功能 ====================

function init(extend) {
    console.log("爬虫初始化成功");
}

function home() {
    return JSON.stringify({
        class: [
            { type_name: "📖⑥⑥⑥迦南诗歌", type_id: "迦南诗歌" },
            { type_name: "🎵 音乐排行", type_id: "yypy" },
            { type_name: "🙏 赞美诗歌", type_id: "zm" },
            { type_name: "📺 央视栏目", type_id: "cctv" }
        ],
        filters: null
    });
}

function homeVod() {
    return JSON.stringify({ list: [] });
}

/**
 * 分类页面 - 正式版
 */
function category(tid, pg, filter, extend) {
    try {
        pg = parseInt(pg) || 1;
        
        if (pg >= 2) {
            return JSON.stringify({ list: [], page: pg, pagecount: 1, limit: 90, total: 0 });
        }
        
        console.log("分类ID: " + tid);
        
        let result = { list: [], page: pg, pagecount: 1, limit: 90, total: 0 };
        
        // 基础URL
        let baseUrl = "https://raw.githubusercontent.com/mannys888/frist/refs/heads/main/";
        
        // 根据分类ID获取对应的文件名
        let fileName = "";
        if (tid === "迦南诗歌" || tid === "迦南诗歌.txt" || tid.indexOf("迦南") !== -1) {
            fileName = "迦南诗歌.txt";
        } else if (tid === "yypy" || tid === "音乐排行") {
            fileName = "yypy.txt";
        } else if (tid === "zm" || tid === "赞美诗歌") {
            fileName = "zm.txt";
        } else if (tid === "cctv" || tid === "央视栏目") {
            return JSON.stringify(getCCTVList());
        }
        
        if (fileName) {
            let fileUrl = baseUrl + fileName;
            let content = fetchSync(fileUrl);
            
            if (content) {
                let lines = content.split(/\r?\n/);
                let videos = [];
                
                for (let i = 0; i < lines.length; i++) {
                    let line = lines[i];
                    if (!line || line.trim() === "") continue;
                    
                    // 解析格式: 标题,URL
                    if (line.indexOf(',') > 0) {
                        let parts = line.split(',');
                        if (parts.length >= 2) {
                            let title = parts[0].trim();
                            let link = parts[1].trim();
                            
                            if (link && (link.indexOf('http') === 0 || link.indexOf('https') === 0)) {
                                videos.push({
                                    vod_id: link + "###music",
                                    vod_name: title,
                                    vod_pic: getMusicCover(title),
                                    vod_remarks: getFileType(link)
                                });
                            }
                        }
                    }
                }
                
                result.list = videos;
                result.total = videos.length;
                console.log("获取到 " + videos.length + " 条数据");
            } else {
                console.log("文件请求失败: " + fileUrl);
            }
        }
        
        return JSON.stringify(result);
    } catch (error) {
        console.log("category error: " + error);
        return JSON.stringify({ list: [], page: pg, pagecount: 0, limit: 90, total: 0 });
    }
}

/**
 * 央视栏目列表
 */
function getCCTVList() {
    let videos = [];
    let cctvChannels = [
        { name: "CCTV-1 综合", id: "cctv1" },
        { name: "CCTV-2 财经", id: "cctv2" },
        { name: "CCTV-3 综艺", id: "cctv3" },
        { name: "CCTV-4 中文国际", id: "cctv4" },
        { name: "CCTV-5 体育", id: "cctv5" },
        { name: "CCTV-6 电影", id: "cctv6" },
        { name: "CCTV-7 国防军事", id: "cctv7" },
        { name: "CCTV-8 电视剧", id: "cctv8" },
        { name: "CCTV-9 纪录", id: "cctv9" },
        { name: "CCTV-10 科教", id: "cctv10" },
        { name: "CCTV-11 戏曲", id: "cctv11" },
        { name: "CCTV-12 社会与法", id: "cctv12" },
        { name: "CCTV-13 新闻", id: "cctv13" },
        { name: "CCTV-14 少儿", id: "cctv14" },
        { name: "CCTV-15 音乐", id: "cctv15" }
    ];
    
    for (let i = 0; i < cctvChannels.length; i++) {
        let channel = cctvChannels[i];
        videos.push({
            vod_id: channel.id + "###cctv",
            vod_name: channel.name,
            vod_pic: "https://picsum.photos/200/300?random=" + i,
            vod_remarks: "📺 央视直播"
        });
    }
    
    return { list: videos, page: 1, pagecount: 1, limit: 90, total: videos.length };
}

/**
 * 央视直播流地址
 */
function getStreamUrl(channelId) {
    let streamUrls = {
        "cctv1": "https://cctv1h5cctv.aikan.miguvideo.com/cctv1_2/index.m3u8",
        "cctv2": "https://cctv2h5cctv.aikan.miguvideo.com/cctv2_2/index.m3u8",
        "cctv3": "https://cctv3h5cctv.aikan.miguvideo.com/cctv3_2/index.m3u8",
        "cctv4": "https://cctv4h5cctv.aikan.miguvideo.com/cctv4_2/index.m3u8",
        "cctv5": "https://cctv5h5cctv.aikan.miguvideo.com/cctv5_2/index.m3u8"
    };
    return streamUrls[channelId] || streamUrls["cctv1"];
}

/**
 * 详情页面
 */
function detail(vodId) {
    try {
        if (!vodId) return JSON.stringify({ list: [] });
        
        let parts = vodId.split('###');
        if (parts.length < 2) return JSON.stringify({ list: [] });
        
        let videoId = parts[0];
        let type = parts[1];
        
        let videoList = [];
        
        if (type === "cctv") {
            let streamUrl = getStreamUrl(videoId);
            videoList.push("直播流$" + streamUrl);
            
            let vod = {
                vod_id: videoId,
                vod_name: "央视直播",
                vod_pic: "",
                type_name: '直播',
                vod_remarks: '高清直播',
                vod_play_from: "央视直播",
                vod_play_url: videoList.join('#')
            };
            return JSON.stringify({ list: [vod] });
            
        } else if (type === "music") {
            let title = "音乐播放";
            let urlParts = videoId.split('/');
            if (urlParts.length > 0) {
                let fileName = urlParts[urlParts.length - 1];
                title = fileName.split('.')[0] || "音乐";
            }
            videoList.push(title + "$" + videoId);
            
            let vod = {
                vod_id: videoId,
                vod_name: title,
                vod_pic: getMusicCover(title),
                type_name: '音频',
                vod_remarks: '点击播放',
                vod_play_from: "音乐",
                vod_play_url: videoList.join('#')
            };
            return JSON.stringify({ list: [vod] });
        }
        
        return JSON.stringify({ list: [] });
    } catch (error) {
        console.log("detail error: " + error);
        return JSON.stringify({ list: [] });
    }
}

/**
 * 播放函数
 */
function play(flag, id, vipFlags) {
    console.log("播放地址: " + id);
    return JSON.stringify({ parse: 0, playUrl: '', url: id });
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