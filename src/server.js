/**
 * 服务器入口文件
 * 负责启动Express服务器和初始化数据库连接
 */

// 导入依赖
import app from './app.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 导入数据库模型
import db from './models/index.js';

// 初始化环境变量
dotenv.config();

// 设置ES模块中的__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保生成的图片目录存在
const imagesDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log(`[初始化] 创建图片存储目录: ${imagesDir}`);
}

// 设置服务器端口
const PORT = process.env.PORT || 3000;

// 添加这些辅助函数定义
// 简单的监控系统通知函数（开发环境可以只是打印日志）
const notifyMonitoringSystem = (error) => {
    console.log('[监控系统] 发送错误通知:', error.message);
};

// 简单的日志记录对象
const logger = {
    error: (error) => {
        console.error('[日志] 错误:', error.message);
    }
};

// 等待活跃连接结束
const waitForConnections = async () => {
    return new Promise(resolve => {
        console.log('[服务器] 等待活跃连接结束...');
        setTimeout(resolve, 1000);
    });
};

// 清理资源
const cleanup = async () => {
    console.log('[服务器] 清理资源...');
    return Promise.resolve();
};

// 启动服务器
const server = app.listen(PORT, async () => {
    console.log(`[服务器] 正在运行于 http://localhost:${PORT}`);

    try {
        // 初始化数据库连接
        await db.sequelize.authenticate();
        console.log('[数据库] 连接成功');

        // 在开发环境同步数据库模型
        if (process.env.NODE_ENV === 'development') {
            await db.sequelize.sync({ alter: true });
            console.log('[数据库] 模型已同步');

            // 初始化后端频率限制记录
            await db.BackendRateLimit.initRecord();
            console.log('[数据库] 后端频率限制记录已初始化');
        }
    } catch (error) {
        console.error('[数据库] 连接失败:', error);
    }
});

// 更完善的错误处理
process.on('uncaughtException', (error) => {
    console.error('[错误] 未捕获的异常:', error);
    // 发送错误到监控系统
    notifyMonitoringSystem(error);
    // 记录错误日志
    logger.error(error);
    // 在一定时间后优雅退出
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

process.on('unhandledRejection', (error) => {
    console.error('[错误] 未处理的Promise拒绝:', error);
    // 在生产环境可能需要更优雅的处理方式
});

// 更完善的优雅退出
process.on('SIGTERM', async () => {
    console.log('[服务器] 开始优雅退出...');

    // 设置超时，防止卡死
    const forceExit = setTimeout(() => {
        console.error('[服务器] 强制退出');
        process.exit(1);
    }, 30000);  // 30秒后强制退出

    try {
        // 停止接收新请求
        server.close();

        // 等待所有活跃连接结束
        await waitForConnections();

        // 关闭数据库连接
        await db.sequelize.close();

        // 清理其他资源...
        await cleanup();

        clearTimeout(forceExit);
        console.log('[服务器] 优雅退出完成');
        process.exit(0);
    } catch (error) {
        console.error('[服务器] 退出过程出错:', error);
        process.exit(1);
    }
});

export default server; 