/**
 * 应用程序的主要配置文件
 * 负责设置Express应用程序、中间件和路由
 */

// 导入依赖
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import imageRoutes from './routes/image.routes.js';
import requestRoutes from './routes/request.routes.js';

// 初始化环境变量
dotenv.config();

// 设置ES模块中的__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 初始化Express应用
const app = express();

// 配置中间件
app.use(cors());                              // 启用CORS
app.use(express.json());                      // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码的请求体
app.use(morgan('dev'));                       // 日志记录

// 静态文件服务 - 用于提供生成的图片
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// 导入路由（这些将在后续步骤中实现）
// import authRoutes from './routes/auth.routes.js';
// import imageRoutes from './routes/image.routes.js';
// import requestRoutes from './routes/request.routes.js';

// 基础路由
app.get('/', (req, res) => {
    res.json({ message: '欢迎使用文生图API服务' });
});

// 挂载API路由
app.use('/api/auth', authRoutes);
app.use('/api/generate', imageRoutes);
app.use('/api/requests', requestRoutes);

// 404路由处理
app.use((req, res) => {
    res.status(404).json({ message: '找不到请求的资源' });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        message: err.message || '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

export default app; 