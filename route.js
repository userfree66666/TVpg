//#!/usr/bin/env node
// -*- coding: utf-8 -*-

const fs = require('fs');
const path = require('path');

/**
 * 获取路由 key
 * 这里写你的判断逻辑
 */
function getRouteKey() {
    // 示例1：按时间判断
    const now = new Date();
    const hour = now.getHours();
    
    if (hour < 9) {
        return "morning";
    } else {
        return "afternoon";
    }
    
    // 示例2：按某个文件内容判断
    // try {
    //     const flagFile = path.join(__dirname, '../flag.txt');
    //     if (fs.existsSync(flagFile)) {
    //         const content = fs.readFileSync(flagFile, 'utf8').trim();
    //         if (content === 'k') return "special";
    //     }
    // } catch(e) {}
    // return "default";
    
    // 示例3：按环境变量判断
    // if (process.env.API_MODE === 'special') {
    //     return "special";
    // }
    // return "default";
}

/**
 * 动态加载并执行目标模块
 */
async function main() {
    // API 映射表
    const apiMap = {
        "morning": "./py/cctv.py",     // 9点前
        "afternoon": "./api_py/Xvd.py",    // 9点后
        "special": "./ff/te1.json",  // 特殊情况
        "default": "./py/cctv.py"      // 默认
    };
    
    // 1. 获取路由 key
    const routeKey = getRouteKey();
    
    // 2. 获取目标 api 路径
    let targetApi = apiMap[routeKey] || apiMap["default"];
    
    // 确保路径是绝对路径
    if (!path.isAbsolute(targetApi)) {
        targetApi = path.join(__dirname, targetApi);
    }
    
    // 3. 动态导入并执行目标模块
    try {
        // 清除 require 缓存，确保每次都是最新
        delete require.cache[require.resolve(targetApi)];
        
        // 加载模块
        const targetModule = require(targetApi);
        
        // 执行模块的 main 函数（如果存在）
        let result;
        if (typeof targetModule === 'function') {
            result = await targetModule();
        } else if (typeof targetModule.main === 'function') {
            result = await targetModule.main();
        } else {
            result = targetModule;
        }
        
        // 输出结果（JSON格式）
        const output = typeof result === 'object' 
            ? JSON.stringify(result, null, 2)
            : String(result);
        
        console.log(output);
        return result;
        
    } catch (error) {
        const errorResult = {
            code: -1,
            msg: `执行失败: ${error.message}`,
            stack: error.stack
        };
        console.log(JSON.stringify(errorResult));
        return errorResult;
    }
}

// 执行入口
if (require.main === module) {
    main().catch(err => {
        console.log(JSON.stringify({ code: -1, msg: err.message }));
    });
}

module.exports = { main, getRouteKey };