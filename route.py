#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
import importlib
import json
from datetime import datetime

# 获取当前文件所在目录
current_dir = os.path.dirname(os.path.abspath(__file__))

def get_route_key():
    """
    这里写你的判断逻辑
    返回值为 api_map 中的 key
    """
    # 示例1：按时间判断
    now = datetime.now()
    if now.hour < 9:
        return "morning"
    else:
        return "afternoon"
    
    # 示例2：按某个文件内容判断
    # flag_file = os.path.join(current_dir, "../flag.txt")
    # if os.path.exists(flag_file):
    #     with open(flag_file, 'r') as f:
    #         content = f.read().strip()
    #         if content == "k":
    #             return "special"
    # return "default"
    
    # 示例3：按请求参数判断（如果框架传入了参数）
    # if len(sys.argv) > 1:
    #     try:
    #         req_data = json.loads(sys.argv[1])
    #         if req_data.get('b') == 'k':
    #             return "special"
    #     except:
    #         pass
    # return "default"

def main():
    # API 映射表
    api_map = {
        "morning": "./py/cctv.py",     # 9点前
        "afternoon": "./api_py/Xvd.py",    # 9点后
        "special": "./api_py/Xvd.py",  # 特殊情况
        "default": "./py/cctv.py"      # 默认
    }
    
  
    
    # 1. 获取路由 key
    route_key = get_route_key()
    
    # 2. 获取目标 api 路径
    target_api = api_map.get(route_key, api_map["default"])
    
    # 3. 动态导入并执行目标模块
    # 将路径转换为模块名：./py/cctv.py -> py.cctv
    module_path = target_api.replace("./", "").replace("/", ".").replace(".py", "")
    
    try:
        module = importlib.import_module(module_path)
        result = module.main()  # 假设每个模块都有 main() 函数
        return result
    except ImportError as e:
        return {"code": -1, "msg": f"导入模块失败: {e}"}
    except AttributeError:
        # 如果没有 main 函数，尝试直接执行模块
        import runpy
        return runpy.run_path(target_api)

if __name__ == "__main__":
    result = main()
    # 输出结果（JSON格式）
    if isinstance(result, (dict, list)):
        print(json.dumps(result, ensure_ascii=False))
    else:
        print(result)