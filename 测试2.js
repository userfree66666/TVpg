// ==================== 最终适配版爬虫 ====================
// 版本: 15.0.0 - 自动适配不同返回格式

// 基础配置
const header = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
};

// ==================== 核心工具函数 ====================

/**
 * 智能网络请求 - 自动适配不同返回格式
 */
function fetchUrl(url) {
    try {
        console.log("请求URL: " + url);
        
        // 调用环境提供的req函数
        let response = req(url, {
            'method': 'GET',
            'headers': header
        });
        
        console.log("response类型: " + typeof response);
        
        // 情况1: 直接返回字符串
        if (typeof response === 'string') {
            console.log("✅ 返回字符串，长度: " + response.length);
            return response;
        }
        
        // 情况2: 返回对象，尝试提取内容
        if (response && typeof response === 'object') {
            // TVBox风格: response.content
            if (response.content && typeof response.content === 'string') {
                console.log("✅ 返回response.content，长度: " + response.content.length);
                return response.content;
            }
            // 其他可能的格式
            if (response.body && typeof response.body === 'string') {
                console.log("✅ 返回response.body，长度: " + response.body.length);
                return response.body;
            }
            if (response.text && typeof response.text === 'string') {
                console.log("✅ 返回response.text，长度: " + response.text.length);
                return response.text;
            }
            if (response.data && typeof response.data === 'string') {
                console.log("✅ 返回response.data，长度: " + response.data.length);
                return response.data;
            }
            // 如果是对象，尝试JSON序列化
            try {
                let jsonStr = JSON.stringify(response);
                console.log("✅ 返回JSON字符串，长度: " + jsonStr.length);
                return jsonStr;
            } catch(e) {}
        }
        
        console.log("❌ 无法解析response");
        return null;
    } catch (error) {
        console.log("❌ 请求异常: " + error.message);
        return null;
    }
}

/**
 * 解析TXT文件内容
 */
function parseTxtContent(content, fileName) {
    let videos = [];
    if (!content) return videos;
    
    let lines = content.split(/\r?\n/);
    console.log("文件行数: " + lines.length);
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (!line || line.trim() === "") continue;
        
        // 解析格式: 标题,URL
        let commaIndex = line.indexOf(',');
        if (commaIndex > 0) {
            let title = line.substring(0, commaIndex).trim();
            let link = line.substring(commaIndex + 1).trim();
            
            if (link && (link.indexOf('http') === 0 || link.indexOf('https') === 0)) {
                videos.push({
                    vod_id: link + "###music",
                    vod_name: title,
                    vod_pic: getRandomPic(title),
                    vod_remarks: getFileType(link)
                });
            }
        }
    }
    
    console.log("解析到 " + videos.length + " 条数据");
    return videos;
}

function getRandomPic(title) {
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

// ==================== 爬虫核心函数 ====================

function init(extend) {
    console.log("爬虫初始化成功 - 最终适配版");
}

function home() {
    return JSON.stringify({
        class: [
            { type_name: "📖 迦南诗歌", type_id: "迦南诗歌.txt" },
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
 * 分类页面
 */
function category(tid, pg, filter, extend) {
    try {
        pg = parseInt(pg) || 1;
        
        console.log("========== category ==========");
        console.log("tid: " + tid);
        
        if (pg >= 2) {
            return JSON.stringify({ list: [], page: pg, pagecount: 1, limit: 90, total: 0 });
        }
        
        let videos = [];
        
        // 央视栏目（不需要网络请求）
        if (tid === "cctv") {
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
                    vod_pic: getRandomPic(channels[i]),
                    vod_remarks: "📺 直播"
                });
            }
        } 
        else {
            // 其他分类：请求GitHub上的TXT文件
            let baseUrl = "https://raw.githubusercontent.com/mannys888/frist/refs/heads/main/";
            let fileName = tid;
            if (!fileName.endsWith('.txt')) {
                fileName = fileName + '.txt';
            }
            
            let fileUrl = baseUrl + fileName;
            console.log("请求文件: " + fileUrl);
            
            let content = fetchUrl(fileUrl);
            
            if (content && content.length > 0) {
                videos = parseTxtContent(content, fileName);
            }
            
            // 如果没有获取到数据，显示提示
            if (videos.length === 0) {
                videos.push({
                    vod_id: "no_data###test",
                    vod_name: "⚠️ 未能获取到数据，请检查网络",
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
                vod_pic: getRandomPic("cctv"),
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
                vod_pic: getRandomPic(title),
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