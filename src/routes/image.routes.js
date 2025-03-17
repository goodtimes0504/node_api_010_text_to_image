/**
 * 图像生成路由
 * 处理各种图像生成请求
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { upload, textToImage, imageToImage, textAndImageToImage } from '../controllers/image.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { userRateLimit, backendRateLimit } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

// 所有路由都需要身份验证和频率限制
router.use(verifyToken);
router.use(userRateLimit);
router.use(backendRateLimit);

// 设置文件上传
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置上传目录和文件名
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/chat-images'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'chat-image-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadMulter = multer({ storage: storage });

// 文本生成图像 - POST /api/generate/text
router.post('/text', textToImage);

// 图像生成图像 - POST /api/generate/image
router.post('/image', uploadMulter.single('image'), imageToImage);

// 文本和图像生成图像 - POST /api/generate/textAndImage
router.post('/textAndImage', uploadMulter.single('image'), textAndImageToImage);

export default router; 