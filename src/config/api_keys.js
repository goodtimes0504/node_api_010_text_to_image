/**
 * API密钥配置文件
 * 集中管理所有外部API的访问密钥
 */

import dotenv from 'dotenv';

// 初始化环境变量
dotenv.config();

// 从环境变量获取密钥
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const PROXY_URL = process.env.PROXY_URL;

// 验证必要的API密钥是否存在
if (!GEMINI_API_KEY) {
    console.warn('[配置警告] 未设置GEMINI_API_KEY环境变量');
}

export default {
    GEMINI_API_KEY,
    PROXY_URL
}; 