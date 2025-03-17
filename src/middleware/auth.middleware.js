/**
 * 身份验证中间件
 * 用于验证用户的JWT令牌并提取用户信息
 */

import jwt from 'jsonwebtoken';
import { unauthorized } from '../utils/error.handler.js';

/**
 * 验证JWT令牌的中间件
 * 从请求头的Authorization字段中获取令牌，验证其有效性并提取用户ID
 */
export const verifyToken = (req, res, next) => {
    try {
        // 从请求头中获取Authorization字段
        const authHeader = req.headers.authorization;

        // 检查Authorization是否存在
        if (!authHeader) {
            return next(unauthorized('缺少认证令牌'));
        }

        // 验证Bearer格式
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return next(unauthorized('认证令牌格式无效'));
        }

        const token = parts[1];

        // 验证令牌
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return next(unauthorized('认证令牌已过期'));
                }
                return next(unauthorized('认证令牌无效'));
            }

            // 将解码后的用户ID存储在请求对象中，供后续处理函数使用
            req.userId = decoded.userId;
            next();
        });
    } catch (error) {
        next(unauthorized('认证失败'));
    }
};

export default {
    verifyToken
}; 