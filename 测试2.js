// ==================== 最简化测试版 ====================
// 版本: 13.0.0 - 用于定位问题

function init(extend) {
    console.log("init被调用");
}

function home() {
    console.log("home被调用");
    return JSON.stringify({
        class: [
            { type_name: "测试分类1", type_id: "test1" },
            { type_name: "测试分类2", type_id: "test2" }
        ],
        filters: null
    });
}

function homeVod() {
    return JSON.stringify({ list: [] });
}

function category(tid, pg, filter, extend) {
    console.log("category被调用, tid=" + tid + ", pg=" + pg);
    
    // 直接返回测试数据，不请求任何网络资源
    let videos = [];
    
    if (tid === "test1") {
        videos = [
            { vod_id: "1###test", vod_name: "测试视频1", vod_pic: "", vod_remarks: "测试" },
            { vod_id: "2###test", vod_name: "测试视频2", vod_pic: "", vod_remarks: "测试" },
            { vod_id: "3###test", vod_name: "测试视频3", vod_pic: "", vod_remarks: "测试" }
        ];
    } else if (tid === "test2") {
        videos = [
            { vod_id: "4###test", vod_name: "测试视频4", vod_pic: "", vod_remarks: "测试" },
            { vod_id: "5###test", vod_name: "测试视频5", vod_pic: "", vod_remarks: "测试" }
        ];
    }
    
    return JSON.stringify({
        list: videos,
        page: 1,
        pagecount: 1,
        limit: 90,
        total: videos.length
    });
}

function detail(vodId) {
    console.log("detail被调用, vodId=" + vodId);
    return JSON.stringify({
        list: [{
            vod_id: vodId,
            vod_name: "测试播放",
            vod_play_from: "测试源",
            vod_play_url: "播放$https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        }]
    });
}

function play(flag, id, vipFlags) {
    console.log("play被调用, id=" + id);
    return JSON.stringify({ parse: 0, playUrl: '', url: id });
}

function search(keyword, page) {
    return JSON.stringify({ list: [] });
}

__JS_SPIDER__ = {
    'init': init,
    'home': home,
    'homeVod': homeVod,
    'category': category,
    'detail': detail,
    'play': play,
    'search': search
};