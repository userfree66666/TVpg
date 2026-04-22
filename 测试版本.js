// ==================== 简化测试版爬虫 ====================
// 专门用于测试迦南诗歌文件是否能正常读取

// 直接定义固定分类
function home() {
    return JSON.stringify({
        class: [
            { type_name: "📖 迦南诗歌测试", type_id: "jiana_test" },
            { type_name: "🎵 音乐排行", type_id: "yypy" }
        ],
        filters: null
    });
}

function homeVod() {
    return JSON.stringify({ list: [] });
}

// 核心分类函数 - 直接返回测试数据
function category(tid, pg, filter, extend) {
    console.log("category被调用, tid=" + tid);
    
    try {
        // 直接返回测试数据，不请求任何外部文件
        if (tid === "jiana_test") {
            let testData = {
                list: [
                    {
                        vod_id: "test1###music",
                        vod_name: "测试歌曲1 - 迦南诗歌",
                        vod_pic: "https://picsum.photos/200/300?random=1",
                        vod_remarks: "测试音频"
                    },
                    {
                        vod_id: "test2###music", 
                        vod_name: "测试歌曲2 - 赞美诗",
                        vod_pic: "https://picsum.photos/200/300?random=2",
                        vod_remarks: "测试音频"
                    },
                    {
                        vod_id: "test3###music",
                        vod_name: "测试歌曲3 - 恩典之路",
                        vod_pic: "https://picsum.photos/200/300?random=3",
                        vod_remarks: "测试音频"
                    }
                ],
                page: 1,
                pagecount: 1,
                limit: 90,
                total: 3
            };
            console.log("返回测试数据，共3条");
            return JSON.stringify(testData);
        }
        
        // 音乐排行测试数据
        if (tid === "yypy") {
            let musicData = {
                list: [
                    {
                        vod_id: "music1###music",
                        vod_name: "孤勇者 - 陈奕迅",
                        vod_pic: "https://picsum.photos/200/300?random=10",
                        vod_remarks: "热门歌曲"
                    },
                    {
                        vod_id: "music2###music",
                        vod_name: "起风了 - 买辣椒也用券",
                        vod_pic: "https://picsum.photos/200/300?random=11",
                        vod_remarks: "热门歌曲"
                    }
                ],
                page: 1,
                pagecount: 1,
                limit: 90,
                total: 2
            };
            return JSON.stringify(musicData);
        }
        
        return JSON.stringify({ list: [], page: pg, pagecount: 0, limit: 90, total: 0 });
    } catch(e) {
        console.log("category error: " + e.message);
        return JSON.stringify({ list: [], page: pg, pagecount: 0, limit: 90, total: 0 });
    }
}

// 详情函数
function detail(vodId) {
    console.log("detail被调用, vodId=" + vodId);
    try {
        let parts = vodId.split('###');
        let url = parts[0];
        let type = parts[1] || "music";
        
        let videoList = [];
        let title = "测试播放";
        
        if (type === "music") {
            videoList.push("测试音频$" + url);
        }
        
        let vod = {
            vod_id: url,
            vod_name: title,
            vod_pic: "https://picsum.photos/200/300",
            type_name: '测试',
            vod_play_from: "测试源",
            vod_play_url: videoList.join('#')
        };
        
        return JSON.stringify({ list: [vod] });
    } catch(e) {
        return JSON.stringify({ list: [] });
    }
}

// 播放函数
function play(flag, id, vipFlags) {
    console.log("play被调用, id=" + id);
    return JSON.stringify({ parse: 0, playUrl: '', url: id });
}

function search(keyword, page) {
    return JSON.stringify({ list: [] });
}

function init(extend) {
    console.log("爬虫初始化成功");
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