/**
 * 通用工具函数
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 设置ES模块中的__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 生成唯一的文件名
 * @param {string} ext - 文件扩展名，例如 '.png'
 * @returns {string} 生成的唯一文件名
 */
export const generateUniqueFilename = (ext = '.png') => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `generated_${timestamp}_${randomStr}${ext}`;
};

/**
 * 获取图片在服务器上的完整存储路径
 */
export const getImageStoragePath = () => {
    return path.join(__dirname, '../../public/images');
};

/**
 * 验证文件是否为支持的图片格式
 * @param {string} mimetype - 文件的MIME类型
 * @returns {boolean} 是否为支持的图片格式
 */
export const isValidImageType = (mimetype) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(mimetype);
};

/**
 * 获取当前时间在一分钟内和一天内的时间范围
 * @returns {Object} 包含当前分钟和当天开始时间的对象
 */
export const getTimeRanges = () => {
    const now = new Date();

    // 当前分钟的开始时间
    const currentMinuteStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        now.getMinutes()
    );

    // 当天的开始时间
    const currentDayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

    return {
        currentMinuteStart,
        currentDayStart
    };
};

export default {
    generateUniqueFilename,
    getImageStoragePath,
    isValidImageType,
    getTimeRanges
}; 