/**
 * 图像生成控制器
 * 处理文字生图、图片生图等请求
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../models/index.js';
import geminiService from '../services/gemini.service.js';
import imageStorageService from '../services/imageStorage.service.js';
import { badRequest, serverError } from '../utils/error.handler.js';
import { generateUniqueFilename, isValidImageType } from '../utils/helpers.js';

const Request = db.Request;

// 设置ES模块中的__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置临时文件存储
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// 配置multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        cb(null, generateUniqueFilename(path.extname(file.originalname)));
    }
});

// 创建multer实例
export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 限制5MB
    fileFilter: (req, file, cb) => {
        if (isValidImageType(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('不支持的文件类型，仅接受JPEG、PNG、GIF和WebP格式'));
        }
    }
});

/**
 * 文本生成图像
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
export const textToImage = async (req, res, next) => {
    try {
        const { prompt } = req.body;

        // 验证提示文本
        if (!prompt || !prompt.trim()) {
            return next(badRequest('提示文本不能为空'));
        }

        // 记录请求开始
        const requestRecord = await Request.create({
            user_id: req.userId,
            request_type: 'text_to_image',
            input_text: prompt,
            status: 'processing',
            request_timestamp: new Date()
        });

        try {
            // 调用Gemini API生成图像
            const imageBase64 = await geminiService.generateImageFromText(prompt);

            // 检查生成的图片是否有效
            if (!imageBase64 || imageBase64.length < 1000) { // 简单检查结果是否太小
                throw new Error('生成的图片无效或过小');
            }

            // 保存图像
            const imageUrl = await imageStorageService.saveImageFromBase64(imageBase64, 'text2img');

            // 更新请求记录
            await requestRecord.update({
                generated_image_url: imageUrl,
                status: 'completed'
            });

            // 返回生成的图像URL
            res.json({
                success: true,
                message: '图像生成成功',
                imageUrl,
                requestId: requestRecord.id
            });
        } catch (error) {
            // 更新请求记录为失败状态
            await requestRecord.update({
                status: 'failed',
                error_message: error.message
            });

            throw error;
        }
    } catch (error) {
        console.error('[错误] 文本生成图像失败:', error);
        next(serverError('生成图像时发生错误: ' + error.message));
    }
};

/**
 * 图像生成图像
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
export const imageToImage = async (req, res, next) => {
    try {
        const { prompt } = req.body;
        const file = req.file;

        // 验证文件是否上传成功
        if (!file) {
            return next(badRequest('未找到上传的图像'));
        }

        // 记录请求开始
        const requestRecord = await Request.create({
            user_id: req.userId,
            request_type: 'image_to_image',
            input_text: prompt || '',
            input_image_url: `/temp/${file.filename}`, // 临时文件路径
            status: 'processing',
            request_timestamp: new Date()
        });

        try {
            // 调用Gemini API生成图像
            const imageBase64 = await geminiService.generateImageFromImage(file.path, prompt || '');

            // 检查生成的图片是否有效
            if (!imageBase64 || imageBase64.length < 1000) { // 简单检查结果是否太小
                throw new Error('生成的图片无效或过小');
            }

            // 保存图像
            const imageUrl = await imageStorageService.saveImageFromBase64(imageBase64, 'img2img');

            // 更新请求记录
            await requestRecord.update({
                generated_image_url: imageUrl,
                status: 'completed'
            });

            // 删除临时文件
            fs.unlinkSync(file.path);

            // 返回生成的图像URL
            res.json({
                success: true,
                message: '图像生成成功',
                imageUrl,
                requestId: requestRecord.id
            });
        } catch (error) {
            // 更新请求记录为失败状态
            await requestRecord.update({
                status: 'failed',
                error_message: error.message
            });

            // 删除临时文件
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }

            throw error;
        }
    } catch (error) {
        console.error('[错误] 图像生成图像失败:', error);
        next(serverError('生成图像时发生错误: ' + error.message));
    }
};

/**
 * 文本和图像生成图像
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
export const textAndImageToImage = async (req, res, next) => {
    try {
        const { prompt } = req.body;
        const file = req.file;

        // 验证文件和提示文本是否存在
        if (!file) {
            return next(badRequest('未找到上传的图像'));
        }

        if (!prompt || !prompt.trim()) {
            return next(badRequest('提示文本不能为空'));
        }

        // 记录请求开始
        const requestRecord = await Request.create({
            user_id: req.userId,
            request_type: 'text_and_image_to_image',
            input_text: prompt,
            input_image_url: `/temp/${file.filename}`, // 临时文件路径
            status: 'processing',
            request_timestamp: new Date()
        });

        try {
            // 调用Gemini API生成图像 - 修正参数顺序
            const imageBase64 = await geminiService.generateImageFromTextAndImage(file.path, prompt);

            // 检查生成的图片是否有效
            if (!imageBase64 || imageBase64.length < 1000) { // 简单检查结果是否太小
                throw new Error('生成的图片无效或过小');
            }

            // 保存图像
            const imageUrl = await imageStorageService.saveImageFromBase64(imageBase64, 'textimg2img');

            // 更新请求记录
            await requestRecord.update({
                generated_image_url: imageUrl,
                status: 'completed'
            });

            // 删除临时文件
            fs.unlinkSync(file.path);

            // 返回生成的图像URL
            res.json({
                success: true,
                message: '图像生成成功',
                imageUrl,
                requestId: requestRecord.id
            });
        } catch (error) {
            // 更新请求记录为失败状态
            await requestRecord.update({
                status: 'failed',
                error_message: error.message
            });

            // 删除临时文件
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }

            throw error;
        }
    } catch (error) {
        console.error('[错误] 文本和图像生成图像失败:', error);
        next(serverError('生成图像时发生错误: ' + error.message));
    }
};

export default {
    upload,
    textToImage,
    imageToImage,
    textAndImageToImage
}; 