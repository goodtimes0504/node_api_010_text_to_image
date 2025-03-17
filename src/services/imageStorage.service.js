/**
 * 图片存储服务
 * 负责保存和管理生成的图片
 */

import fs from 'fs/promises';
import path from 'path';
import { generateUniqueFilename, getImageStoragePath } from '../utils/helpers.js';

/**
 * 从Base64字符串保存图片
 * @param {string} base64Data - Base64编码的图片数据
 * @param {string} [prefix='gen'] - 文件名前缀
 * @returns {Promise<string>} 保存后的图片URL相对路径
 */
export const saveImageFromBase64 = async (base64Data, prefix = 'gen') => {
    try {
        // 移除可能存在的Base64前缀
        let imageData = base64Data;
        if (base64Data.includes(',')) {
            imageData = base64Data.split(',')[1];
        }

        // 解码Base64数据
        const buffer = Buffer.from(imageData, 'base64');

        // 生成唯一文件名
        const filename = `${prefix}_${generateUniqueFilename()}`;
        const imagePath = path.join(getImageStoragePath(), filename);

        // 写入文件
        await fs.writeFile(imagePath, buffer);

        // 返回相对URL路径
        return `/images/${filename}`;
    } catch (error) {
        console.error('[错误] 保存Base64图片失败:', error);
        throw error;
    }
};

/**
 * 删除图片文件
 * @param {string} imageUrl - 图片的URL路径
 * @returns {Promise<boolean>} 删除成功返回true
 */
export const deleteImage = async (imageUrl) => {
    try {
        if (!imageUrl) return false;

        // 从URL提取文件名
        const filename = path.basename(imageUrl);
        const imagePath = path.join(getImageStoragePath(), filename);

        // 检查文件是否存在
        try {
            await fs.access(imagePath);
        } catch (err) {
            // 文件不存在
            return false;
        }

        // 删除文件
        await fs.unlink(imagePath);
        return true;
    } catch (error) {
        console.error('[错误] 删除图片失败:', error);
        return false;
    }
};

export default {
    saveImageFromBase64,
    deleteImage
}; 