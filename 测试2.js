// ==================== 最简测试爬虫 ====================
function init(extend) {
    console.log("init");
}

function home() {
    return JSON.stringify({
        class: [
            { type_name: "测试分类1", type_id: "test1" },
            { type_name: "测试分类2", type_id: "test2" }
        ]
    });
}

function homeVod() {
    return JSON.stringify({ list: [] });
}

function category(tid, pg) {
    let videos = [];
    if (tid === "test1") {
        videos = [
            { vod_id: "1", vod_name: "测试视频1", vod_pic: "", vod_remarks: "测试" },
            { vod_id: "2", vod_name: "测试视频2", vod_pic: "", vod_remarks: "测试" }
        ];
    } else if (tid === "test2") {
        videos = [
            { vod_id: "3", vod_name: "测试视频3", vod_pic: "", vod_remarks: "测试" }
        ];
    }
    return JSON.stringify({ list: videos, page: 1, pagecount: 1 });
}

function detail(vodId) {
    return JSON.stringify({
        list: [{
            vod_id: vodId,
            vod_name: "测试",
            vod_play_from: "测试",
            vod_play_url: "播放$https://example.com/test.mp4"
        }]
    });
}

function play(flag, id) {
    return JSON.stringify({ parse: 0, url: id });
}

function search(keyword, page) {
    return JSON.stringify({ list: [] });
}

__JS_SPIDER__ = {
    init: init,
    home: home,
    homeVod: homeVod,
    category: category,
    detail: detail,
    play: play,
    search: search
};