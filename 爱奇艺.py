# -*- coding: utf-8 -*-
"""
央视大全爬虫模块 (Python版)
基于 JS 版逻辑实现，提供栏目搜索、详情、播放地址获取等功能
"""

import json
import time
from typing import Dict, List, Optional, Any
import requests


class CCTVSpider:
    """央视爬虫主类"""

    # 全局请求头
    DEFAULT_HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.54 Safari/537.36",
        "Origin": "https://tv.cctv.com",
        "Referer": "https://tv.cctv.com/"
    }

    # 筛选器配置（与 JS 完全一致）
    FILTERS_CONFIG = [
        {
            "key": "cid", "name": "频道", "value": [
                {"n": "全部", "v": ""},
                {"n": "CCTV-1综合", "v": "EPGC1386744804340101"},
                {"n": "CCTV-2财经", "v": "EPGC1386744804340102"},
                {"n": "CCTV-3综艺", "v": "EPGC1386744804340103"},
                {"n": "CCTV-4中文国际", "v": "EPGC1386744804340104"},
                {"n": "CCTV-5体育", "v": "EPGC1386744804340107"},
                {"n": "CCTV-6电影", "v": "EPGC1386744804340108"},
                {"n": "CCTV-7国防军事", "v": "EPGC1386744804340109"},
                {"n": "CCTV-8电视剧", "v": "EPGC1386744804340110"},
                {"n": "CCTV-9纪录", "v": "EPGC1386744804340112"},
                {"n": "CCTV-10科教", "v": "EPGC1386744804340113"},
                {"n": "CCTV-11戏曲", "v": "EPGC1386744804340114"},
                {"n": "CCTV-12社会与法", "v": "EPGC1386744804340115"},
                {"n": "CCTV-13新闻", "v": "EPGC1386744804340116"},
                {"n": "CCTV-14少儿", "v": "EPGC1386744804340117"},
                {"n": "CCTV-15音乐", "v": "EPGC1386744804340118"},
                {"n": "CCTV-16奥林匹克", "v": "EPGC1634630207058998"},
                {"n": "CCTV-17农业农村", "v": "EPGC1563932742616872"},
                {"n": "CCTV-5+体育赛事", "v": "EPGC1468294755566101"}
            ]
        },
        {
            "key": "fc", "name": "分类", "value": [
                {"n": "全部", "v": ""},
                {"n": "新闻", "v": "新闻"}, {"n": "体育", "v": "体育"}, {"n": "综艺", "v": "综艺"},
                {"n": "健康", "v": "健康"}, {"n": "生活", "v": "生活"}, {"n": "科教", "v": "科教"},
                {"n": "经济", "v": "经济"}, {"n": "农业", "v": "农业"}, {"n": "法治", "v": "法治"},
                {"n": "军事", "v": "军事"}, {"n": "少儿", "v": "少儿"}, {"n": "动画", "v": "动画"},
                {"n": "纪实", "v": "纪实"}, {"n": "戏曲", "v": "戏曲"}, {"n": "音乐", "v": "音乐"},
                {"n": "影视", "v": "影视"}
            ]
        },
        {
            "key": "fl", "name": "字母", "value": [{"n": "全部", "v": ""}] +
                       [{"n": l, "v": l} for l in "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z".split(",")]
        },
        {
            "key": "year", "name": "年份", "value": [{"n": "全部", "v": ""}] +
                       [{"n": str(2022 - i), "v": str(2022 - i)} for i in range(23)]
        },
        {
            "key": "month", "name": "月份", "value": [{"n": "全部", "v": ""}] +
                       [{"n": f"{i:02d}", "v": f"{i:02d}"} for i in range(1, 13)]
        }
    ]

    def __init__(self):
        self._cache: Dict[str, Any] = {}          # 简单内存缓存
        self.session = requests.Session()
        self.session.headers.update(self.DEFAULT_HEADERS)

    def _fetch_json(self, url: str, use_cache: bool = True) -> Optional[Dict]:
        """请求 JSON 数据，支持缓存"""
        if use_cache and url in self._cache:
            return self._cache[url]
        try:
            resp = self.session.get(url, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            if use_cache:
                self._cache[url] = data
            return data
        except Exception as e:
            print(f"请求失败: {url} - {e}")
            return None

    # ==================== 对外接口（与 JS 函数对应） ====================

    def init(self, extend: Optional[Dict] = None) -> None:
        """初始化（占位，无实际操作）"""
        print("央视大全爬虫-Python版（支持年份/月份筛选，直接返回原始hls_url）")

    def home(self) -> str:
        """返回首页分类和筛选器配置"""
        result = {
            "class": [{"type_name": "央视大全", "type_id": "CCTV"}],
            "filters": {"CCTV": self.FILTERS_CONFIG}
        }
        return json.dumps(result, ensure_ascii=False)

    def homeVod(self) -> str:
        """首页视频列表（空）"""
        return json.dumps({"list": []})

    def category(self, tid: str, pg: int = 1, filter_params: Optional[Dict] = None, extend: Optional[Dict] = None) -> str:
        """
        获取栏目列表（支持筛选）
        :param tid: 类型ID（固定传 "CCTV" 即可）
        :param pg: 页码
        :param filter_params: 筛选参数，包含 fl, fc, cid, year, month 等
        :param extend: 扩展参数（合并到 filter_params）
        :return: JSON 字符串，包含 list, page, pagecount, total
        """
        pg = int(pg) if pg else 1
        params = {}
        if filter_params:
            params.update(filter_params)
        if extend:
            params.update(extend)

        # 构建请求参数
        query = {
            "fl": params.get("fl", ""),
            "fc": params.get("fc", ""),
            "cid": params.get("cid", ""),
            "p": pg,
            "n": 20,
            "serviceId": "tvcctv",
            "t": "json"
        }
        url = "https://api.cntv.cn/lanmu/columnSearch?" + "&".join(f"{k}={v}" for k, v in query.items())

        data = self._fetch_json(url)
        if not data or "response" not in data or "docs" not in data["response"]:
            return json.dumps({"list": [], "page": pg, "pagecount": 0, "total": 0})

        docs = data["response"]["docs"]
        videos = []
        # 构建 prefix = 年月 (如 "202301")
        year = params.get("year", "")
        month = params.get("month", "")
        prefix = year + month

        for vod in docs:
            last_video = vod.get("lastVIDE", {}).get("videoSharedCode", "")
            if not last_video:
                last_video = "_"
            guid = f"{prefix}###{vod.get('column_name', '')}###{last_video}###{vod.get('column_logo', '')}"
            videos.append({
                "vod_id": guid,
                "vod_name": vod.get("column_name", ""),
                "vod_pic": vod.get("column_logo", ""),
                "vod_remarks": ""
            })

        total = data["response"].get("numFound", len(videos))
        pagecount = (total + 19) // 20
        return json.dumps({
            "list": videos,
            "page": pg,
            "pagecount": pagecount,
            "limit": 20,
            "total": total
        }, ensure_ascii=False)

    def _get_raw_hls_url(self, pid: str) -> Optional[str]:
        """通过 pid 获取原始 hls_url"""
        if not pid:
            return None
        url = f"https://vdn.apps.cntv.cn/api/getHttpVideoInfo.do?pid={pid}"
        data = self._fetch_json(url)
        if data and "hls_url" in data:
            return data["hls_url"].strip()
        return None

    def detail(self, vod_id: str) -> str:
        """
        获取栏目详情（包含播放列表）
        :param vod_id: 格式: "年月###栏目名###lastVideo###logo"
        :return: JSON 字符串，包含 list 字段（详情视频列表）
        """
        parts = vod_id.split("###")
        if len(parts) < 4:
            return json.dumps({"list": []})
        prefix, title, last_video, logo = parts[0], parts[1], parts[2], parts[3]

        if last_video == "_":
            return json.dumps({"list": []})

        # 获取视频信息，拿到 ctid (栏目ID)
        info_url = f"https://api.cntv.cn/video/videoinfoByGuid?guid={last_video}&serviceId=tvcctv"
        info = self._fetch_json(info_url)
        if not info or "ctid" not in info:
            return json.dumps({"list": []})
        topic_id = info["ctid"]
        channel = info.get("channel", "")

        # 获取栏目下的视频列表 (最多100条)
        list_url = f"https://api.cntv.cn/NewVideo/getVideoListByColumn?id={topic_id}&d={prefix}&p=1&n=100&sort=desc&mode=0&serviceId=tvcctv&t=json"
        list_data = self._fetch_json(list_url)
        if not list_data or "data" not in list_data or "list" not in list_data["data"]:
            return json.dumps({"list": []})

        video_list = []
        for video in list_data["data"]["list"]:
            play_id = video.get("pid") or video.get("vid") or video.get("guid")
            if play_id:
                video_list.append(f"{video.get('title', '')}${play_id}")

        if not video_list:
            return json.dumps({"list": []})

        # 获取第一集的原始 hls_url 用于备注（调试）
        first_pid = video_list[0].split("$")[1] if "$" in video_list[0] else ""
        debug_url = self._get_raw_hls_url(first_pid) or ""

        display_date = prefix if prefix else str(time.localtime().tm_year)
        vod = {
            "vod_id": vod_id,
            "vod_name": f"{display_date} {title}",
            "vod_pic": logo,
            "type_name": channel,
            "vod_year": display_date,
            "vod_area": "",
            "vod_remarks": debug_url,          # 第一集的原始播放地址
            "vod_actor": "",
            "vod_director": topic_id,           # 存储 topicId
            "vod_content": "当前页面默认只展示最新100期的内容,可在分类页面选择年份和月份进行往期节目查看。年份和月份仅影响当前页面内容,不参与分类过滤。视频默认播放使用原始hls_url（包含maxbr参数）。",
            "vod_play_from": "CCTV",
            "vod_play_url": "#".join(video_list)
        }
        return json.dumps({"list": [vod]}, ensure_ascii=False)

    def play(self, flag: str, pid: str, vip_flags: Any = None) -> str:
        """
        获取视频播放地址
        :param flag: 无用，保留兼容
        :param pid: 视频pid
        :return: JSON 字符串，包含 playUrl
        """
        raw_url = self._get_raw_hls_url(pid)
        if not raw_url:
            return json.dumps({"parse": 0, "playUrl": "", "url": pid})
        return json.dumps({"parse": 0, "playUrl": "", "url": raw_url})

    def search(self, wd: str, quick: bool = False) -> str:
        """搜索（暂未实现，返回空列表）"""
        return json.dumps({"list": []})


# 若需要导出与 JS 相同的函数接口（供其他框架调用），可以创建全局实例并绑定方法
_spider = CCTVSpider()

def init(extend=None):
    return _spider.init(extend)

def home():
    return _spider.home()

def homeVod():
    return _spider.homeVod()

def category(tid, pg, filter=None, extend=None):
    return _spider.category(tid, pg, filter, extend)

def detail(vodId):
    return _spider.detail(vodId)

def play(flag, id, vipFlags=None):
    return _spider.play(flag, id, vipFlags)

def search(wd, quick=False):
    return _spider.search(wd, quick)


if __name__ == "__main__":
    # 简单测试示例
    sp = CCTVSpider()
    # 测试 home
    print("=== home ===")
    print(sp.home())
    # 测试 category (获取第一页)
    print("\n=== category (第1页) ===")
    print(sp.category("CCTV", 1, {}))
    # 测试 detail (需替换为真实 vod_id)
    # 示例 vod_id 结构: "202301###新闻联播###GUID###logo"
    # print("\n=== detail ===")
    # print(sp.detail("202301###新闻联播###123456###"))