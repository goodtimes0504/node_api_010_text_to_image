/**
 * 图片生成控制器
 * 处理图片生成相关的HTTP请求
 */

import imageService from '../services/image.service.js';
import { serverError } from '../utils/error.handler.js';

/**
 * 生成图片
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
export const generateImage = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数: prompt'
            });
        }

        const imageData = await imageService.generateImageFromText(prompt);

        res.status(200).json({
            success: true,
            imageData
        });
    } catch (error) {
        console.error('[错误] 生成图片失败:', error);
        serverError(error.message)(req, res);
    }
};

export default {
    generateImage
}; 