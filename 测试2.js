// ==================== 兼容应用中心的爬虫 ====================
// 版本: 8.0.0

const header = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
};

// ==================== 工具函数 ====================

/**
 * 网络请求 - 兼容应用中心的 req 函数
 */
function fetchSync(url) {
    try {
        console.log("请求URL: " + url);
        // 应用中心环境下的 req 函数
        let response = req(url, {
            'method': 'GET',
            'headers': header
        });
        
        // 兼容不同的返回格式
        let content = null;
        if (typeof response === 'string') {
            content = response;
        } else if (response && typeof response.content === 'string') {
            content = response.content;
        } else if (response && typeof response.body === 'string') {
            content = response.body;
        } else if (response && typeof response.text === 'string') {
            content = response.text;
        } else if (response && typeof response.data === 'string') {
            content = response.data;
        }
        
        console.log("获取到内容长度: " + (content ? content.length : 0));
        return content;
    } catch (error) {
        console.log("请求失败: " + error);
        return null;
    }
}

function getMusicCover(title) {
    return "https://picsum.photos/200/300?random=" + Math.floor(Math.random() * 10);
}

// ==================== 直接返回数据（不请求外部文件） ====================

function init(extend) {
    console.log("爬虫初始化成功");
}

function home() {
    return JSON.stringify({
        class: [
            { type_name: "📖 888迦南诗歌", type_id: "jiana" },
            { type_name: "🎵 音乐排行", type_id: "yypy" },
            { type_name: "🙏 赞美诗歌", type_id: "zanmei" },
            { type_name: "📺 央视栏目", type_id: "cctv" }
        ],
        filters: null
    });
}

function homeVod() {
    return JSON.stringify({ list: [] });
}

/**
 * 分类页面 - 直接返回内置数据
 */
function category(tid, pg, filter, extend) {
    try {
        pg = parseInt(pg) || 1;
        
        console.log("分类ID: " + tid);
        
        let videos = [];
        
        // 迦南诗歌数据
        if (tid === "jiana") {
            videos = [
                { vod_id: "song1###music", vod_name: "迦南诗歌 - 主啊我来到你面前", vod_pic: getMusicCover("song1"), vod_remarks: "🎵 诗歌" },
                { vod_id: "song2###music", vod_name: "迦南诗歌 - 耶和华是我的牧者", vod_pic: getMusicCover("song2"), vod_remarks: "🎵 诗歌" },
                { vod_id: "song3###music", vod_name: "迦南诗歌 - 何等恩典", vod_pic: getMusicCover("song3"), vod_remarks: "🎵 诗歌" },
                { vod_id: "song4###music", vod_name: "迦南诗歌 - 每一天", vod_pic: getMusicCover("song4"), vod_remarks: "🎵 诗歌" },
                { vod_id: "song5###music", vod_name: "迦南诗歌 - 最知心的朋友", vod_pic: getMusicCover("song5"), vod_remarks: "🎵 诗歌" }
            ];
        }
        // 音乐排行数据
        else if (tid === "yypy") {
            videos = [
                { vod_id: "music1###music", vod_name: "孤勇者 - 陈奕迅", vod_pic: getMusicCover("music1"), vod_remarks: "🎵 热门" },
                { vod_id: "music2###music", vod_name: "起风了 - 买辣椒也用券", vod_pic: getMusicCover("music2"), vod_remarks: "🎵 热门" },
                { vod_id: "music3###music", vod_name: "人世间 - 雷佳", vod_pic: getMusicCover("music3"), vod_remarks: "🎵 热门" },
                { vod_id: "music4###music", vod_name: "光年之外 - 邓紫棋", vod_pic: getMusicCover("music4"), vod_remarks: "🎵 热门" },
                { vod_id: "music5###music", vod_name: "少年 - 梦然", vod_pic: getMusicCover("music5"), vod_remarks: "🎵 热门" }
            ];
        }
        // 赞美诗歌数据
        else if (tid === "zanmei") {
            videos = [
                { vod_id: "zm1###music", vod_name: "赞美诗 - 献上感恩", vod_pic: getMusicCover("zm1"), vod_remarks: "🎵 赞美诗" },
                { vod_id: "zm2###music", vod_name: "赞美诗 - 恩典之路", vod_pic: getMusicCover("zm2"), vod_remarks: "🎵 赞美诗" },
                { vod_id: "zm3###music", vod_name: "赞美诗 - 祢的爱不离不弃", vod_pic: getMusicCover("zm3"), vod_remarks: "🎵 赞美诗" },
                { vod_id: "zm4###music", vod_name: "赞美诗 - 轻轻听", vod_pic: getMusicCover("zm4"), vod_remarks: "🎵 赞美诗" }
            ];
        }
        // 央视栏目数据
        else if (tid === "cctv") {
            videos = [
                { vod_id: "cctv1###cctv", vod_name: "CCTV-1 综合", vod_pic: getMusicCover("cctv1"), vod_remarks: "📺 直播" },
                { vod_id: "cctv2###cctv", vod_name: "CCTV-2 财经", vod_pic: getMusicCover("cctv2"), vod_remarks: "📺 直播" },
                { vod_id: "cctv3###cctv", vod_name: "CCTV-3 综艺", vod_pic: getMusicCover("cctv3"), vod_remarks: "📺 直播" },
                { vod_id: "cctv4###cctv", vod_name: "CCTV-4 中文国际", vod_pic: getMusicCover("cctv4"), vod_remarks: "📺 直播" },
                { vod_id: "cctv5###cctv", vod_name: "CCTV-5 体育", vod_pic: getMusicCover("cctv5"), vod_remarks: "📺 直播" }
            ];
        }
        
        console.log("返回 " + videos.length + " 条数据");
        
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
        
        let playUrl = "";
        
        if (type === "cctv") {
            // 央视直播流地址
            let streamUrls = {
                "cctv1": "https://cctv1h5cctv.aikan.miguvideo.com/cctv1_2/index.m3u8",
                "cctv2": "https://cctv2h5cctv.aikan.miguvideo.com/cctv2_2/index.m3u8",
                "cctv3": "https://cctv3h5cctv.aikan.miguvideo.com/cctv3_2/index.m3u8",
                "cctv4": "https://cctv4h5cctv.aikan.miguvideo.com/cctv4_2/index.m3u8",
                "cctv5": "https://cctv5h5cctv.aikan.miguvideo.com/cctv5_2/index.m3u8"
            };
            playUrl = streamUrls[videoId] || streamUrls["cctv1"];
        } else if (type === "music") {
            // 音乐播放 - 使用测试地址
            playUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
        }
        
        let vod = {
            vod_id: videoId,
            vod_name: "播放",
            vod_play_from: "播放源",
            vod_play_url: "播放$" + playUrl
        };
        
        return JSON.stringify({ list: [vod] });
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