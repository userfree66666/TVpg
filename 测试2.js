// ==================== TVBox兼容版爬虫 ====================
// 版本: 12.0.0 - 完全兼容TVBox和应用中心

const header = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
};

// ==================== 工具函数 ====================

/**
 * 网络请求 - 完全兼容TVBox格式
 */
function fetchSync(url) {
    try {
        console.log("请求URL: " + url);
        
        // 直接使用TVBox风格的req调用
        let response = req(url, {
            'method': 'GET',
            'headers': header
        });
        
        console.log("response类型: " + typeof response);
        
        // TVBox的req返回的就是content字符串
        if (typeof response === 'string') {
            console.log("直接返回字符串，长度: " + response.length);
            return response;
        }
        
        // 如果是对象，尝试获取content
        if (response && typeof response === 'object') {
            if (response.content) {
                console.log("返回response.content，长度: " + response.content.length);
                return response.content;
            }
            if (response.body) {
                console.log("返回response.body，长度: " + response.body.length);
                return response.body;
            }
            if (response.text) {
                console.log("返回response.text，长度: " + response.text.length);
                return response.text;
            }
        }
        
        console.log("无法解析response: " + JSON.stringify(response));
        return null;
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
    console.log("爬虫初始化成功 - TVBox兼容版");
    if (extend) {
        console.log("extend: " + extend);
    }
}

function home() {
    return JSON.stringify({
        class: [
            { type_name: "📖 12迦南诗歌", type_id: "迦南诗歌.txt" },
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
 * 分类页面 - 完全兼容TVBox
 */
function category(tid, pg, filter, extend) {
    try {
        pg = parseInt(pg) || 1;
        
        console.log("========== category ==========");
        console.log("tid: " + tid);
        console.log("pg: " + pg);
        
        if (pg >= 2) {
            return JSON.stringify({ list: [], page: pg, pagecount: 1, limit: 90, total: 0 });
        }
        
        let baseUrl = "https://raw.githubusercontent.com/mannys888/frist/refs/heads/main/";
        let videos = [];
        
        // 央视栏目（不需要请求文件）
        if (tid === "cctv") {
            console.log("加载央视栏目");
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
            // 其他分类：请求TXT文件
            let fileName = tid;
            if (!fileName.endsWith('.txt')) {
                fileName = fileName + '.txt';
            }
            
            let fileUrl = baseUrl + fileName;
            console.log("请求文件: " + fileUrl);
            
            let content = fetchSync(fileUrl);
            
            if (content && content.length > 0) {
                console.log("获取到内容，长度: " + content.length);
                
                let lines = content.split(/\r?\n/);
                console.log("总行数: " + lines.length);
                
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
                                vod_pic: getMusicCover(title),
                                vod_remarks: getFileType(link)
                            });
                            console.log("添加: " + title);
                        }
                    }
                }
                console.log("解析到 " + videos.length + " 条数据");
            } else {
                console.log("文件内容为空或请求失败");
                // 使用模拟数据
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
                vod_pic: getMusicCover("cctv"),
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