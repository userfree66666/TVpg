// ==================== 测试req函数版 ====================
// 版本: 14.0.0

function init(extend) {
    console.log("init被调用");
}

function home() {
    return JSON.stringify({
        class: [
            { type_name: "测试req请求", type_id: "test_req" }
        ],
        filters: null
    });
}

function homeVod() {
    return JSON.stringify({ list: [] });
}

function category(tid, pg, filter, extend) {
    console.log("category被调用, tid=" + tid);
    
    let videos = [];
    
    if (tid === "test_req") {
        // 测试req函数是否能正常工作
        try {
            console.log("开始测试req函数");
            let testUrl = "https://httpbin.org/get";
            let response = req(testUrl, { method: 'GET', headers: {} });
            
            console.log("req返回类型: " + typeof response);
            console.log("req返回内容: " + JSON.stringify(response).substring(0, 200));
            
            videos.push({
                vod_id: "req_test###test",
                vod_name: "req测试成功 - 查看控制台",
                vod_pic: "",
                vod_remarks: "检查控制台输出"
            });
        } catch(e) {
            console.log("req函数错误: " + e.message);
            videos.push({
                vod_id: "error###test",
                vod_name: "req函数错误: " + e.message,
                vod_pic: "",
                vod_remarks: "错误"
            });
        }
        
        // 测试请求你的GitHub文件
        try {
            console.log("开始请求GitHub文件");
            let fileUrl = "https://raw.githubusercontent.com/mannys888/frist/refs/heads/main/迦南诗歌.txt";
            let response2 = req(fileUrl, { method: 'GET', headers: {} });
            
            console.log("GitHub请求返回类型: " + typeof response2);
            
            let content = null;
            if (typeof response2 === 'string') {
                content = response2;
            } else if (response2 && response2.content) {
                content = response2.content;
            }
            
            if (content) {
                console.log("文件内容长度: " + content.length);
                console.log("前200字符: " + content.substring(0, 200));
                videos.push({
                    vod_id: "file_success###test",
                    vod_name: "✅ 文件读取成功，共" + content.length + "字符",
                    vod_pic: "",
                    vod_remarks: "成功"
                });
            } else {
                console.log("文件内容为空");
                videos.push({
                    vod_id: "file_fail###test",
                    vod_name: "❌ 文件读取失败",
                    vod_pic: "",
                    vod_remarks: "失败"
                });
            }
        } catch(e) {
            console.log("GitHub请求错误: " + e.message);
            videos.push({
                vod_id: "file_error###test",
                vod_name: "❌ 请求异常: " + e.message,
                vod_pic: "",
                vod_remarks: "错误"
            });
        }
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
    return JSON.stringify({ list: [] });
}

function play(flag, id, vipFlags) {
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