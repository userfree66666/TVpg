// ==================== 完整修复版爬虫 ====================
// 版本: 5.0.0 - 完美支持迦南诗歌

// ==================== 全局配置 ====================
const config = {
    player: {},
    filter: {}
};

const header = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.54 Safari/537.36"
};

// ==================== 全局变量 ====================
let txty = null;
let tid = null;
let txt = null;

// ==================== 工具函数 ====================

/**
 * 同步网络请求
 */
function fetchSync(url, customHeaders) {
    try {
        let reqHeaders = customHeaders || header;
        let response = req(url, {
            'method': 'GET',
            'headers': reqHeaders
        });
        return response;
    } catch (error) {
        console.log("fetchSync error: " + url);
        return null;
    }
}

/**
 * 获取音乐封面
 */
function getMusicCover(title) {
    try {
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
    } catch (error) {
        return "https://picsum.photos/200/300";
    }
}

/**
 * 格式化时长
 */
function formatDuration(url) {
    try {
        if (url && url.indexOf('.mp3') > 0) return "音频";
        if (url && url.indexOf('.mp4') > 0) return "视频";
        if (url && url.indexOf('.m3u8') > 0) return "直播";
        return "点播";
    } catch (error) {
        return "未知";
    }
}

// ==================== 核心功能 ====================

/**
 * 初始化函数
 */
function init(extend) {
    try {
        console.log("============初始化成功============");
        console.log("extend参数:", extend);
        txty = null;
        tid = null;
        txt = null;
    } catch (error) {
        console.log("init error: " + error);
    }
}

/**
 * 首页函数 - 返回分类列表
 */
function home() {
    try {
        let classes = [
            { type_name: "🎵 音乐排行", type_id: "yypy" },
            { type_name: "📖 迦南诗歌", type_id: "迦南诗歌.txt" },
            { type_name: "🙏 赞美诗歌", type_id: "zm" },
            { type_name: "📺 央视栏目", type_id: "TOPC" }
        ];
        
        return JSON.stringify({
            class: classes,
            filters: null
        });
    } catch (error) {
        console.log("home error: " + error);
        return JSON.stringify({ class: [], filters: null });
    }
}

/**
 * 首页视频列表
 */
function homeVod() {
    try {
        return JSON.stringify({ list: [] });
    } catch (error) {
        console.log("homeVod error: " + error);
        return JSON.stringify({ list: [] });
    }
}

/**
 * 分类页面 - 完全修复版
 */
function category(tid, pg, filter, extend) {
    try {
        pg = parseInt(pg) || 1;
        
        if (pg >= 2) {
            return JSON.stringify({
                list: [],
                page: pg,
                pagecount: 1,
                limit: 90,
                total: 0
            });
        }
        
        console.log("收到分类ID: " + tid);
        
        let result;
        
        // 🔥 关键修复：支持多种分类名称匹配
        // 处理迦南诗歌（支持带特殊符号的版本）
        if (tid === "迦南诗歌.txt" || tid === "迦南诗歌" || tid === "📖 迦南诗歌" || (tid && tid.indexOf("迦南") !== -1)) {
            console.log("匹配到迦南诗歌分类，请求文件: 迦南诗歌.txt");
            result = getRankData("迦南诗歌.txt");
        }
        // 处理音乐排行
        else if (tid === "yypy" || tid === "音乐排行" || tid === "🎵 音乐排行") {
            console.log("匹配到音乐排行分类，请求文件: yypy.txt");
            result = getRankData("yypy.txt");
        }
        // 处理赞美诗歌
        else if (tid === "zm" || tid === "赞美诗歌" || tid === "🙏 赞美诗歌") {
            console.log("匹配到赞美诗歌分类，请求文件: zm.txt");
            result = getRankData("zm.txt");
        }
        // 处理央视栏目
        else if (tid === "TOPC" || tid === "央视栏目" || tid === "📺 央视栏目") {
            console.log("匹配到央视栏目分类");
            result = getCCTVList();
        }
        // 默认处理
        else {
            console.log("未匹配到特殊分类，尝试作为文件名请求: " + tid);
            result = getRankData(tid);
        }
        
        return JSON.stringify(result);
    } catch (error) {
        console.log("category error: " + error);
        return JSON.stringify({ list: [], page: pg, pagecount: 0, limit: 90, total: 0 });
    }
}

/**
 * 获取TXT文件数据 - 完整修复版
 */
function getRankData(fileName) {
    try {
        // 🔥 使用完整的GitHub Raw地址
        let baseUrl = "https://raw.githubusercontent.com/mannys888/frist/refs/heads/main/";
        let url = baseUrl + fileName;
        
        console.log("请求文件URL: " + url);
        
        let response = fetchSync(url);
        let videos = [];
        
        if (response && response.content) {
            let content = response.content;
            console.log("文件内容长度: " + content.length);
            
            let lines = content.split(/\r?\n/);
            console.log("文件行数: " + lines.length);
            
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                if (!line || line.trim() === "") continue;
                
                // 解析格式：标题,URL
                if (line.indexOf(',') > 0) {
                    let parts = line.split(',');
                    if (parts.length >= 2) {
                        let title = parts[0].trim();
                        let link = parts[1].trim();
                        
                        // 确保URL有效
                        if (link && (link.indexOf('http') >= 0 || link.indexOf('https') >= 0)) {
                            videos.push({
                                vod_id: link + "###music",
                                vod_name: title,
                                vod_pic: getMusicCover(title),
                                vod_remarks: formatDuration(link)
                            });
                            console.log("添加视频: " + title);
                        }
                    }
                }
            }
        } else {
            console.log("文件请求失败或无内容: " + url);
        }
        
        console.log("getRankData完成，文件名: " + fileName + "，共获取 " + videos.length + " 条数据");
        
        return {
            list: videos,
            page: 1,
            pagecount: 1,
            limit: 90,
            total: videos.length
        };
    } catch (error) {
        console.log("getRankData error: " + error);
        return { list: [], page: 1, pagecount: 0, limit: 90, total: 0 };
    }
}

/**
 * 获取央视栏目列表
 */
function getCCTVList() {
    try {
        let videos = [];
        let cctvChannels = [
            { name: "CCTV-1 综合", id: "cctv1", pic: "https://picsum.photos/200/300?random=11" },
            { name: "CCTV-2 财经", id: "cctv2", pic: "https://picsum.photos/200/300?random=12" },
            { name: "CCTV-3 综艺", id: "cctv3", pic: "https://picsum.photos/200/300?random=13" },
            { name: "CCTV-4 中文国际", id: "cctv4", pic: "https://picsum.photos/200/300?random=14" },
            { name: "CCTV-5 体育", id: "cctv5", pic: "https://picsum.photos/200/300?random=15" },
            { name: "CCTV-6 电影", id: "cctv6", pic: "https://picsum.photos/200/300?random=16" },
            { name: "CCTV-7 国防军事", id: "cctv7", pic: "https://picsum.photos/200/300?random=17" },
            { name: "CCTV-8 电视剧", id: "cctv8", pic: "https://picsum.photos/200/300?random=18" },
            { name: "CCTV-9 纪录", id: "cctv9", pic: "https://picsum.photos/200/300?random=19" },
            { name: "CCTV-10 科教", id: "cctv10", pic: "https://picsum.photos/200/300?random=20" },
            { name: "CCTV-11 戏曲", id: "cctv11", pic: "https://picsum.photos/200/300?random=21" },
            { name: "CCTV-12 社会与法", id: "cctv12", pic: "https://picsum.photos/200/300?random=22" },
            { name: "CCTV-13 新闻", id: "cctv13", pic: "https://picsum.photos/200/300?random=23" },
            { name: "CCTV-14 少儿", id: "cctv14", pic: "https://picsum.photos/200/300?random=24" },
            { name: "CCTV-15 音乐", id: "cctv15", pic: "https://picsum.photos/200/300?random=25" }
        ];
        
        for (let i = 0; i < cctvChannels.length; i++) {
            let channel = cctvChannels[i];
            videos.push({
                vod_id: channel.id + "###cctv",
                vod_name: channel.name,
                vod_pic: channel.pic,
                vod_remarks: "📺 央视直播"
            });
        }
        
        return {
            list: videos,
            page: 1,
            pagecount: 1,
            limit: 90,
            total: videos.length
        };
    } catch (error) {
        console.log("getCCTVList error: " + error);
        return { list: [], page: 1, pagecount: 0, limit: 90, total: 0 };
    }
}

/**
 * 获取直播流地址
 */
function getStreamUrl(channelId) {
    let streamUrls = {
        "cctv1": "https://cctv1h5cctv.aikan.miguvideo.com/cctv1_2/index.m3u8",
        "cctv2": "https://cctv2h5cctv.aikan.miguvideo.com/cctv2_2/index.m3u8",
        "cctv3": "https://cctv3h5cctv.aikan.miguvideo.com/cctv3_2/index.m3u8",
        "cctv4": "https://cctv4h5cctv.aikan.miguvideo.com/cctv4_2/index.m3u8",
        "cctv5": "https://cctv5h5cctv.aikan.miguvideo.com/cctv5_2/index.m3u8",
        "cctv6": "https://cctv6h5cctv.aikan.miguvideo.com/cctv6_2/index.m3u8",
        "cctv7": "https://cctv7h5cctv.aikan.miguvideo.com/cctv7_2/index.m3u8",
        "cctv8": "https://cctv8h5cctv.aikan.miguvideo.com/cctv8_2/index.m3u8",
        "cctv9": "https://cctv9h5cctv.aikan.miguvideo.com/cctv9_2/index.m3u8",
        "cctv10": "https://cctv10h5cctv.aikan.miguvideo.com/cctv10_2/index.m3u8",
        "cctv11": "https://cctv11h5cctv.aikan.miguvideo.com/cctv11_2/index.m3u8",
        "cctv12": "https://cctv12h5cctv.aikan.miguvideo.com/cctv12_2/index.m3u8",
        "cctv13": "https://cctv13h5cctv.aikan.miguvideo.com/cctv13_2/index.m3u8",
        "cctv14": "https://cctv14h5cctv.aikan.miguvideo.com/cctv14_2/index.m3u8",
        "cctv15": "https://cctv15h5cctv.aikan.miguvideo.com/cctv15_2/index.m3u8"
    };
    return streamUrls[channelId] || streamUrls["cctv1"];
}

/**
 * 详情页面
 */
function detail(vodId) {
    try {
        if (!vodId) {
            return JSON.stringify({ list: [] });
        }
        
        let aid = vodId.split('###');
        if (aid.length < 2) {
            return JSON.stringify({ list: [] });
        }
        
        let videoId = aid[0];
        let type = aid[1];
        
        let videoList = [];
        
        if (type === "cctv") {
            // 央视直播
            let streamUrl = getStreamUrl(videoId);
            videoList.push("直播流$" + streamUrl);
            
            let vod = {
                vod_id: videoId,
                vod_name: "央视直播",
                vod_pic: "",
                type_name: '直播',
                vod_year: '',
                vod_area: '',
                vod_remarks: '高清直播',
                vod_actor: '',
                vod_director: '',
                vod_content: '央视高清直播频道',
                vod_play_from: "央视直播",
                vod_play_url: videoList.join('#')
            };
            return JSON.stringify({ list: [vod] });
            
        } else if (type === "music") {
            // 音乐播放
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
                vod_year: '',
                vod_area: '',
                vod_remarks: '点击播放',
                vod_actor: '',
                vod_director: '',
                vod_content: title,
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
    try {
        let link = id;
        
        // 检查是否是URL
        let pattern = /(https?:\/\/[^/]+)/;
        let match = pattern.exec(id);
        
        if (!match) {
            // 不是URL，尝试获取视频信息
            let url = "https://vdn.apps.cntv.cn/api/getHttpVideoInfo.do?pid=" + id;
            let response = fetchSync(url);
            
            if (response && response.content) {
                try {
                    let jo = JSON.parse(response.content);
                    if (jo && jo.hls_url) {
                        link = jo.hls_url.trim();
                    }
                } catch (e) {
                    console.log("parse error: " + e);
                }
            }
        }
        
        let result = {
            parse: 0,
            playUrl: '',
            url: link,
            header: header
        };
        
        console.log("播放地址: " + link);
        return JSON.stringify(result);
    } catch (error) {
        console.log("play error: " + error);
        return JSON.stringify({ parse: 0, playUrl: '', url: '' });
    }
}

/**
 * 搜索功能
 */
function search(keyword, page) {
    try {
        return JSON.stringify({ list: [] });
    } catch (error) {
        console.log("search error: " + error);
        return JSON.stringify({ list: [] });
    }
}

// ==================== 导出模块 ====================
__JS_SPIDER__ = {
    'init': init,
    'home': home,
    'homeVod': homeVod,
    'category': category,
    'detail': detail,
    'play': play,
    'search': search
};