// ==================== 调试版爬虫 - 查看文件请求详情 ====================
// 版本: 7.0.0

const header = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
};

// ==================== 工具函数 ====================

/**
 * 网络请求 - 带详细日志
 */
function fetchSync(url) {
    try {
        console.log("========== 开始请求 ==========");
        console.log("请求URL: " + url);
        
        let response = req(url, {
            'method': 'GET',
            'headers': header
        });
        
        console.log("响应对象类型: " + typeof response);
        console.log("响应对象内容: " + JSON.stringify(response).substring(0, 200));
        
        if (response && response.content) {
            console.log("内容长度: " + response.content.length);
            console.log("内容前200字符: " + response.content.substring(0, 200));
            return response.content;
        } else {
            console.log("响应中没有content字段或content为空");
            return null;
        }
    } catch (error) {
        console.log("请求异常: " + error);
        return null;
    }
}

function getMusicCover(title) {
    let defaultCovers = [
        "https://picsum.photos/200/300?random=1",
        "https://picsum.photos/200/300?random=2",
        "https://picsum.photos/200/300?random=3"
    ];
    let hash = 0;
    for (let i = 0; i < (title || "").length; i++) {
        hash = ((hash << 5) - hash) + title.charCodeAt(i);
    }
    return defaultCovers[Math.abs(hash) % defaultCovers.length];
}

// ==================== 核心功能 ====================

function init(extend) {
    console.log("爬虫初始化成功");
}

function home() {
    return JSON.stringify({
        class: [
            { type_name: "📖 777迦南诗歌", type_id: "迦南诗歌" },
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
 * 分类页面 - 调试版
 */
function category(tid, pg, filter, extend) {
    try {
        pg = parseInt(pg) || 1;
        
        console.log("========================================");
        console.log("分类ID: " + tid);
        console.log("页码: " + pg);
        
        if (pg >= 2) {
            return JSON.stringify({ list: [], page: pg, pagecount: 1, limit: 90, total: 0 });
        }
        
        let baseUrl = "https://raw.githubusercontent.com/mannys888/frist/refs/heads/main/";
        
        // 处理央视栏目
        if (tid === "cctv" || tid === "央视栏目") {
            console.log("进入央视栏目");
            return JSON.stringify(getCCTVList());
        }
        
        // 确定文件名
        let fileName = "";
        if (tid === "迦南诗歌" || tid.indexOf("迦南") !== -1) {
            fileName = "迦南诗歌.txt";
        } else if (tid === "yypy" || tid === "音乐排行") {
            fileName = "yypy.txt";
        } else if (tid === "zm" || tid === "赞美诗歌") {
            fileName = "zm.txt";
        }
        
        if (!fileName) {
            console.log("未匹配到文件名");
            return JSON.stringify({ list: [], page: pg, pagecount: 0, limit: 90, total: 0 });
        }
        
        let fileUrl = baseUrl + fileName;
        console.log("文件URL: " + fileUrl);
        
        let content = fetchSync(fileUrl);
        
        if (!content) {
            console.log("❌ 文件内容为空，请求失败！");
            console.log("请检查文件是否存在: " + fileUrl);
            return JSON.stringify({ 
                list: [], 
                page: pg, 
                pagecount: 0, 
                limit: 90, 
                total: 0,
                error: "文件请求失败"
            });
        }
        
        console.log("✅ 文件内容获取成功，长度: " + content.length);
        
        let lines = content.split(/\r?\n/);
        console.log("总行数: " + lines.length);
        
        let videos = [];
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (!line || line.trim() === "") continue;
            
            console.log("处理第" + (i+1) + "行: " + line.substring(0, 100));
            
            // 解析格式: 标题,URL
            if (line.indexOf(',') > 0) {
                let parts = line.split(',');
                if (parts.length >= 2) {
                    let title = parts[0].trim();
                    let link = parts[1].trim();
                    
                    console.log("  标题: " + title);
                    console.log("  链接: " + link);
                    
                    if (link && (link.indexOf('http') === 0 || link.indexOf('https') === 0)) {
                        videos.push({
                            vod_id: link + "###music",
                            vod_name: title,
                            vod_pic: getMusicCover(title),
                            vod_remarks: "🎵 音乐"
                        });
                        console.log("  ✅ 已添加");
                    } else {
                        console.log("  ❌ 链接无效: " + link);
                    }
                }
            } else {
                console.log("  行格式不正确，缺少逗号");
            }
        }
        
        console.log("========================================");
        console.log("最终获取到 " + videos.length + " 条数据");
        
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
 * 央视栏目列表
 */
function getCCTVList() {
    let videos = [];
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
            vod_pic: "https://picsum.photos/200/300?random=" + i,
            vod_remarks: "📺 央视直播"
        });
    }
    return { list: videos, page: 1, pagecount: 1, limit: 90, total: videos.length };
}

function getStreamUrl(channelId) {
    return "https://cctv1h5cctv.aikan.miguvideo.com/cctv1_2/index.m3u8";
}

function detail(vodId) {
    try {
        let parts = vodId.split('###');
        if (parts.length < 2) return JSON.stringify({ list: [] });
        
        let videoId = parts[0];
        let type = parts[1];
        
        if (type === "cctv") {
            let vod = {
                vod_id: videoId,
                vod_name: "央视直播",
                vod_play_from: "央视直播",
                vod_play_url: "直播流$" + getStreamUrl(videoId)
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
    } catch(e) {
        return JSON.stringify({ list: [] });
    }
}

function play(flag, id, vipFlags) {
    console.log("播放: " + id);
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