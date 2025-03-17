/**
 * 数据库模型索引文件
 * 初始化Sequelize并加载所有模型
 */

import { Sequelize } from 'sequelize';
import config from '../config/config.js';
import dotenv from 'dotenv';

// 初始化环境变量
dotenv.config();

// 获取当前环境
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 创建Sequelize实例
const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        pool: dbConfig.pool
    }
);

// 导入模型定义
import defineUserModel from './user.model.js';
import defineRequestModel from './request.model.js';
import defineBackendRateLimitModel from './backend_rate_limit.model.js';

// 初始化模型
const db = {
    sequelize,
    Sequelize,
    User: defineUserModel(sequelize, Sequelize),
    Request: defineRequestModel(sequelize, Sequelize),
    BackendRateLimit: defineBackendRateLimitModel(sequelize, Sequelize)
};

// 设置模型关联
db.User.hasMany(db.Request, { foreignKey: 'user_id', as: 'requests' });
db.Request.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });

export default db; 