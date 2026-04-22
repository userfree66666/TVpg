// ==================== 修复分类匹配的爬虫 ====================
// 版本: 9.0.0

const header = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
};

function getMusicCover(title) {
    return "https://picsum.photos/200/300?random=" + Math.floor(Math.random() * 10);
}

function init(extend) {
    console.log("爬虫初始化成功");
}

function home() {
    return JSON.stringify({
        class: [
            { type_name: "📖 999迦南诗歌", type_id: "jiana" },
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
 * 分类页面 - 修复匹配逻辑
 */
function category(tid, pg, filter, extend) {
    try {
        pg = parseInt(pg) || 1;
        
        console.log("传入的tid: " + tid);
        console.log("tid类型: " + typeof tid);
        
        let videos = [];
        
        // 🔥 关键修复：根据tid的多种可能形式进行匹配
        let tidStr = String(tid || "");
        
        // 匹配迦南诗歌（支持中文名称和英文ID）
        if (tidStr === "jiana" || tidStr === "📖 迦南诗歌" || tidStr.indexOf("迦南") !== -1) {
            console.log("匹配到迦南诗歌");
            videos = [
                { vod_id: "song1###music", vod_name: "迦南诗歌 - 主啊我来到你面前", vod_pic: getMusicCover("song1"), vod_remarks: "🎵 诗歌" },
                { vod_id: "song2###music", vod_name: "迦南诗歌 - 耶和华是我的牧者", vod_pic: getMusicCover("song2"), vod_remarks: "🎵 诗歌" },
                { vod_id: "song3###music", vod_name: "迦南诗歌 - 何等恩典", vod_pic: getMusicCover("song3"), vod_remarks: "🎵 诗歌" },
                { vod_id: "song4###music", vod_name: "迦南诗歌 - 每一天", vod_pic: getMusicCover("song4"), vod_remarks: "🎵 诗歌" },
                { vod_id: "song5###music", vod_name: "迦南诗歌 - 最知心的朋友", vod_pic: getMusicCover("song5"), vod_remarks: "🎵 诗歌" }
            ];
        }
        // 匹配音乐排行
        else if (tidStr === "yypy" || tidStr === "🎵 音乐排行" || tidStr.indexOf("音乐排行") !== -1) {
            console.log("匹配到音乐排行");
            videos = [
                { vod_id: "music1###music", vod_name: "孤勇者 - 陈奕迅", vod_pic: getMusicCover("music1"), vod_remarks: "🎵 热门" },
                { vod_id: "music2###music", vod_name: "起风了 - 买辣椒也用券", vod_pic: getMusicCover("music2"), vod_remarks: "🎵 热门" },
                { vod_id: "music3###music", vod_name: "人世间 - 雷佳", vod_pic: getMusicCover("music3"), vod_remarks: "🎵 热门" },
                { vod_id: "music4###music", vod_name: "光年之外 - 邓紫棋", vod_pic: getMusicCover("music4"), vod_remarks: "🎵 热门" },
                { vod_id: "music5###music", vod_name: "少年 - 梦然", vod_pic: getMusicCover("music5"), vod_remarks: "🎵 热门" }
            ];
        }
        // 匹配赞美诗歌
        else if (tidStr === "zanmei" || tidStr === "🙏 赞美诗歌" || tidStr.indexOf("赞美诗歌") !== -1) {
            console.log("匹配到赞美诗歌");
            videos = [
                { vod_id: "zm1###music", vod_name: "赞美诗 - 献上感恩", vod_pic: getMusicCover("zm1"), vod_remarks: "🎵 赞美诗" },
                { vod_id: "zm2###music", vod_name: "赞美诗 - 恩典之路", vod_pic: getMusicCover("zm2"), vod_remarks: "🎵 赞美诗" },
                { vod_id: "zm3###music", vod_name: "赞美诗 - 祢的爱不离不弃", vod_pic: getMusicCover("zm3"), vod_remarks: "🎵 赞美诗" },
                { vod_id: "zm4###music", vod_name: "赞美诗 - 轻轻听", vod_pic: getMusicCover("zm4"), vod_remarks: "🎵 赞美诗" }
            ];
        }
        // 匹配央视栏目
        else if (tidStr === "cctv" || tidStr === "📺 央视栏目" || tidStr.indexOf("央视栏目") !== -1) {
            console.log("匹配到央视栏目");
            videos = [
                { vod_id: "cctv1###cctv", vod_name: "CCTV-1 综合", vod_pic: getMusicCover("cctv1"), vod_remarks: "📺 直播" },
                { vod_id: "cctv2###cctv", vod_name: "CCTV-2 财经", vod_pic: getMusicCover("cctv2"), vod_remarks: "📺 直播" },
                { vod_id: "cctv3###cctv", vod_name: "CCTV-3 综艺", vod_pic: getMusicCover("cctv3"), vod_remarks: "📺 直播" },
                { vod_id: "cctv4###cctv", vod_name: "CCTV-4 中文国际", vod_pic: getMusicCover("cctv4"), vod_remarks: "📺 直播" },
                { vod_id: "cctv5###cctv", vod_name: "CCTV-5 体育", vod_pic: getMusicCover("cctv5"), vod_remarks: "📺 直播" },
                { vod_id: "cctv6###cctv", vod_name: "CCTV-6 电影", vod_pic: getMusicCover("cctv6"), vod_remarks: "📺 直播" },
                { vod_id: "cctv7###cctv", vod_name: "CCTV-7 国防军事", vod_pic: getMusicCover("cctv7"), vod_remarks: "📺 直播" },
                { vod_id: "cctv8###cctv", vod_name: "CCTV-8 电视剧", vod_pic: getMusicCover("cctv8"), vod_remarks: "📺 直播" }
            ];
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
        
        let playUrl = "";
        
        if (type === "cctv") {
            let streamUrls = {
                "cctv1": "https://cctv1h5cctv.aikan.miguvideo.com/cctv1_2/index.m3u8",
                "cctv2": "https://cctv2h5cctv.aikan.miguvideo.com/cctv2_2/index.m3u8",
                "cctv3": "https://cctv3h5cctv.aikan.miguvideo.com/cctv3_2/index.m3u8",
                "cctv4": "https://cctv4h5cctv.aikan.miguvideo.com/cctv4_2/index.m3u8",
                "cctv5": "https://cctv5h5cctv.aikan.miguvideo.com/cctv5_2/index.m3u8"
            };
            playUrl = streamUrls[videoId] || streamUrls["cctv1"];
        } else if (type === "music") {
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