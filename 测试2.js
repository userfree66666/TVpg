// ==================== 完整版爬虫 - 可读取GitHub文件 ====================
// 版本: 10.0.0

const header = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
};

// ==================== 工具函数 ====================

/**
 * 网络请求 - 兼容你的应用中心
 */
function fetchSync(url) {
    try {
        console.log("请求URL: " + url);
        let response = req(url, {
            'method': 'GET',
            'headers': header
        });
        
        // 兼容多种返回格式
        let content = null;
        if (typeof response === 'string') {
            content = response;
        } else if (response && typeof response.content === 'string') {
            content = response.content;
        } else if (response && typeof response.body === 'string') {
            content = response.body;
        } else if (response && typeof response.text === 'string') {
            content = response.text;
        }
        
        if (content) {
            console.log("获取内容成功，长度: " + content.length);
        } else {
            console.log("获取内容失败");
        }
        return content;
    } catch (error) {
        console.log("请求异常: " + error);
        return null;
    }
}

function getMusicCover(title) {
    let hash = 0;
    for (let i = 0; i < (title || "").length; i++) {
        hash = ((hash << 5) - hash) + title.charCodeAt(i);
    }
    let index = Math.abs(hash) % 10;
    return "https://picsum.photos/200/300?random=" + index;
}

function getFileType(url) {
    if (!url) return "🎵 音乐";
    if (url.indexOf('.mp3') > 0) return "🎵 音频";
    if (url.indexOf('.mp4') > 0) return "🎬 视频";
    if (url.indexOf('.m3u8') > 0) return "📺 直播";
    return "🎵 音乐";
}

// ==================== 核心功能 ====================

function init(extend) {
    console.log("爬虫初始化成功");
    if (extend) {
        console.log("extend参数: " + extend.substring(0, 100));
    }
}

function home() {
    return JSON.stringify({
        class: [
            { type_name: "📖 🟣迦南诗歌", type_id: "迦南诗歌.txt" },
            { type_name: "🎵 音乐排行", type_id: "yypy.txt" },
            { type_name: "🙏 赞美诗歌", type_id: "zm.txt" },
            { type_name: "📺 央视栏目", type_id: "cctv" }
        ],
        filters: null
    });
}

function homeVod() {
    return JSON.stringify({ list: [] });
}

/**
 * 分类页面 - 读取GitHub文件
 */
function category(tid, pg, filter, extend) {
    try {
        pg = parseInt(pg) || 1;
        
        console.log("========================================");
        console.log("分类ID: " + tid);
        
        if (pg >= 2) {
            return JSON.stringify({ list: [], page: pg, pagecount: 1, limit: 90, total: 0 });
        }
        
        let baseUrl = "https://raw.githubusercontent.com/mannys888/frist/refs/heads/main/";
        let videos = [];
        
        // 处理央视栏目（不需要请求文件）
        if (tid === "cctv") {
            console.log("加载央视栏目数据");
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
        // 处理其他分类（需要读取TXT文件）
        else {
            let fileName = tid;
            // 确保文件名有.txt后缀
            if (!fileName.endsWith('.txt')) {
                fileName = fileName + '.txt';
            }
            
            let fileUrl = baseUrl + fileName;
            console.log("文件URL: " + fileUrl);
            
            let content = fetchSync(fileUrl);
            
            if (content) {
                let lines = content.split(/\r?\n/);
                console.log("文件行数: " + lines.length);
                
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
                console.log("解析到 " + videos.length + " 条数据");
            } else {
                console.log("文件请求失败，使用模拟数据");
                // 如果文件请求失败，使用模拟数据
                for (let i = 1; i <= 5; i++) {
                    videos.push({
                        vod_id: "test" + i + "###music",
                        vod_name: "测试歌曲 " + i + " - " + fileName,
                        vod_pic: getMusicCover("test"),
                        vod_remarks: "🎵 测试数据"
                    });
                }
            }
        }
        
        console.log("返回数据条数: " + videos.length);
        
        return JSON.stringify({
            list: videos,
            page: pg,
            pagecount: 1,
            limit: 90,
            total: videos.length
        });
    } catch (error) {
        console.log("category错误: " + error);
        return JSON.stringify({ list: [], page: pg, pagecount: 0, limit: 90, total: 0 });
    }
}

/**
 * 详情页面
 */
function detail(vodId) {
    try {
        console.log("detail: " + vodId);
        
        let parts = vodId.split('###');
        if (parts.length < 2) {
            return JSON.stringify({ list: [] });
        }
        
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
            let playUrl = streamUrls[videoId] || streamUrls["cctv1"];
            
            let vod = {
                vod_id: videoId,
                vod_name: "央视直播",
                vod_play_from: "央视直播",
                vod_play_url: "直播流$" + playUrl
            };
            return JSON.stringify({ list: [vod] });
            
        } else if (type === "music") {
            let title = "音乐播放";
            let urlParts = videoId.split('/');
            if (urlParts.length > 0) {
                title = urlParts[urlParts.length - 1].split('.')[0] || "音乐";
            }
            
            let vod = {
                vod_id: videoId,
                vod_name: title,
                vod_pic: getMusicCover(title),
                vod_play_from: "音乐",
                vod_play_url: title + "$" + videoId
            };
            return JSON.stringify({ list: [vod] });
        }
        
        return JSON.stringify({ list: [] });
    } catch (error) {
        console.log("detail错误: " + error);
        return JSON.stringify({ list: [] });
    }
}

function play(flag, id, vipFlags) {
    console.log("play: " + id);
    return JSON.stringify({ parse: 0, playUrl: '', url: id });
}

function search(keyword, page) {
    return JSON.stringify({ list: [] });
}

// 导出
__JS_SPIDER__ = {
    'init': init,
    'home': home,
    'homeVod': homeVod,
    'category': category,
    'detail': detail,
    'play': play,
    'search': search
};