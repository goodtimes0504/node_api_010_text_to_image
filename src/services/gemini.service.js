/**
 * Gemini API 服务
 * 提供与Google Gemini API交互的功能
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';
import fs from 'fs';
import { GEMINI_API_KEY, PROXY_URL } from '../config/api_keys.js';
import { serverError } from '../utils/error.handler.js';

// 配置代理
let agent = null;
if (PROXY_URL) {
    agent = new HttpsProxyAgent(PROXY_URL);
    global.fetch = (url, options = {}) => {
        return fetch(url, { ...options, agent });
    };
    console.log('[配置] 使用代理:', PROXY_URL);
}

// 初始化GoogleGenerativeAI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// 配置生成模型
const modelName = "gemini-2.0-flash-exp";
const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
        responseModalities: ["Text", "Image"],
    }
});

/**
 * 将图像文件转换为Base64格式
 * @param {string} imagePath - 图像文件路径
 * @returns {Promise<string>} Base64编码的图像数据
 */
const imageToBase64 = async (imagePath) => {
    try {
        const imageBuffer = await fs.promises.readFile(imagePath);
        return imageBuffer.toString('base64');
    } catch (error) {
        console.error('[错误] 图像转Base64失败:', error);
        throw error;
    }
};

/**
 * 使用文本提示生成图像
 * @param {string} prompt - 描述要生成的图像的文本提示
 * @returns {Promise<string>} 生成的图像内容 (Base64)
 */
export const generateImageFromText = async (prompt) => {
    try {
        // 创建聊天会话
        const chat = model.startChat({
            history: [],
            generationConfig: {
                responseModalities: ["Text", "Image"],
            }
        });

        // 提示词
        const enhancedPrompt = `请生成一张关于以下内容的图片：${prompt}`;

        console.log(`[信息] 发送提示词到Gemini API: "${enhancedPrompt}"`);

        // 发送消息
        const result = await chat.sendMessage([{ text: enhancedPrompt }]);
        const response = result.response;

        if (!response || !response.candidates || !response.candidates[0]) {
            console.error('[错误] API返回无效响应结构');
            throw serverError('生成图像失败: API返回无效响应');
        }

        const candidate = response.candidates[0];
        if (!candidate.content || !candidate.content.parts) {
            console.error('[错误] 候选响应中无内容部分');
            throw serverError('生成图像失败: 无法获取生成的内容');
        }

        console.log(`[信息] 响应包含 ${candidate.content.parts.length} 个部分`);

        // 查找包含图像数据的部分
        for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
                console.log('[信息] 从响应中找到图像数据');
                return part.inlineData.data;
            }
        }

        // 如果没有找到图像数据，查看文本部分是否包含Base64图像
        for (const part of candidate.content.parts) {
            if (part.text) {
                console.log(`[信息] 响应中包含文本: "${part.text.substring(0, 50)}${part.text.length > 50 ? '...' : ''}"`);

                // 从文本中提取可能的Base64图像
                const base64Match = part.text.match(/data:image\/[^;]+;base64,([^"'\s]+)/);
                if (base64Match && base64Match[1]) {
                    console.log('[信息] 从文本中提取到Base64图像数据');
                    return base64Match[1];
                }
            }
        }

        console.error('[错误] 无法在响应中找到图像数据');
        throw serverError('生成图像失败: 返回的不是图像数据');
    } catch (error) {
        console.error('[错误] 从文本生成图像失败:', error);
        throw error;
    }
};

/**
 * 使用图像生成新图像
 * @param {string} imagePath - 输入图像的文件路径
 * @param {string} prompt - 可选的文本提示
 * @returns {Promise<string>} 生成的图像内容 (Base64)
 */
export const generateImageFromImage = async (imagePath, prompt = '') => {
    try {
        // 读取图像文件
        const imageData = await imageToBase64(imagePath);

        // 确定图像MIME类型
        let mimeType;
        const ext = imagePath.split('.').pop().toLowerCase();
        if (ext === 'png') {
            mimeType = 'image/png';
        } else if (ext === 'jpg' || ext === 'jpeg') {
            mimeType = 'image/jpeg';
        } else if (ext === 'gif') {
            mimeType = 'image/gif';
        } else if (ext === 'webp') {
            mimeType = 'image/webp';
        } else {
            throw new Error(`不支持的图像格式: ${ext}`);
        }

        // 创建聊天会话
        const chat = model.startChat({
            history: [],
            generationConfig: {
                responseModalities: ["Text", "Image"],
            }
        });

        // 创建消息内容
        const messageParts = [
            { text: prompt || "根据这张图像生成一个新的变体图像。" },
            {
                inlineData: {
                    mimeType,
                    data: imageData
                }
            }
        ];

        // 发送消息
        const result = await chat.sendMessage(messageParts);
        const response = result.response;

        if (!response || !response.candidates || !response.candidates[0]) {
            throw serverError('生成图像失败: API返回无效响应');
        }

        // 检查是否包含图像
        const imageCandidate = response.candidates[0];
        if (!imageCandidate.content || !imageCandidate.content.parts) {
            throw serverError('生成图像失败: 无法获取生成的内容');
        }

        // 查找图像数据
        for (const part of imageCandidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return part.inlineData.data;
            }
        }

        throw serverError('生成图像失败: 返回的不是图像数据');
    } catch (error) {
        console.error('[错误] 从图像生成图像失败:', error);
        throw error;
    }
};

/**
 * 使用文本和图像生成新图像
 * @param {string} imagePath - 输入图像的文件路径
 * @param {string} prompt - 文本提示
 * @returns {Promise<string>} 生成的图像内容 (Base64)
 */
export const generateImageFromTextAndImage = async (imagePath, prompt) => {
    try {
        // 读取图像文件
        const imageData = await imageToBase64(imagePath);

        // 确定图像MIME类型
        let mimeType;
        const ext = imagePath.split('.').pop().toLowerCase();
        if (ext === 'png') {
            mimeType = 'image/png';
        } else if (ext === 'jpg' || ext === 'jpeg') {
            mimeType = 'image/jpeg';
        } else if (ext === 'gif') {
            mimeType = 'image/gif';
        } else if (ext === 'webp') {
            mimeType = 'image/webp';
        } else {
            throw new Error(`不支持的图像格式: ${ext}`);
        }

        // 创建聊天会话
        const chat = model.startChat({
            history: [],
            generationConfig: {
                responseModalities: ["Text", "Image"],
                temperature: 0.8,       // 增加温度以提高创造性
                topK: 32,               // 调整topK
                topP: 0.95              // 保持较高的topP值
            }
        });

        // 创建消息内容
        const messageParts = [
            {
                text: `请根据以下指示修改这张图片：${prompt}
            
具体要求：
1. 必须对图片进行明显的视觉修改
2. 修改应符合提示词的要求
3. 保持图片的主要内容特征
4. 返回完全修改后的新图片，而不是原图
            
请创建一个与原图明显不同的新版本。` },
            {
                inlineData: {
                    mimeType,
                    data: imageData
                }
            }
        ];

        // 发送消息
        const result = await chat.sendMessage(messageParts);
        const response = result.response;

        if (!response || !response.candidates || !response.candidates[0]) {
            throw serverError('生成图像失败: API返回无效响应');
        }

        // 检查是否包含图像
        const imageCandidate = response.candidates[0];
        if (!imageCandidate.content || !imageCandidate.content.parts) {
            throw serverError('生成图像失败: 无法获取生成的内容');
        }

        // 查找图像数据
        for (const part of imageCandidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return part.inlineData.data;
            }
        }

        throw serverError('生成图像失败: 返回的不是图像数据');
    } catch (error) {
        console.error('[错误] 从文本和图像生成图像失败:', error);
        throw error;
    }
};

/**
 * 列出可用的 Gemini 模型
 * 用于调试和检查模型可用性
 */
export const listAvailableModels = async () => {
    try {
        const models = await genAI.listModels();
        console.log('[API] 可用的 Gemini 模型:', models);
        return models;
    } catch (error) {
        console.error('[错误] 获取模型列表失败:', error);
        throw error;
    }
};

export default {
    generateImageFromText,
    generateImageFromImage,
    generateImageFromTextAndImage,
    listAvailableModels
}; 