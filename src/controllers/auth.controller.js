/**
 * 用户认证控制器
 * 处理用户注册和登录功能
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import { badRequest, unauthorized, conflict, serverError } from '../utils/error.handler.js';

const User = db.User;

/**
 * 用户注册
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
export const register = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // 验证请求参数
        if (!username || !password) {
            return next(badRequest('用户名和密码不能为空'));
        }

        // 验证用户名长度和格式
        if (username.length < 3 || username.length > 20) {
            return next(badRequest('用户名长度必须在3到20个字符之间'));
        }

        // 验证密码强度
        if (password.length < 6) {
            return next(badRequest('密码长度必须至少为6个字符'));
        }

        // 检查用户名是否已存在
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return next(conflict('用户名已存在'));
        }

        // 密码加密
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 创建新用户
        await User.create({
            username,
            password_hash
        });

        // 返回成功响应
        res.status(201).json({
            message: '用户注册成功'
        });
    } catch (error) {
        console.error('[错误] 用户注册失败:', error);
        next(serverError('注册过程中发生错误'));
    }
};

/**
 * 用户登录
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // 验证请求参数
        if (!username || !password) {
            return next(badRequest('用户名和密码不能为空'));
        }

        // 查找用户
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return next(unauthorized('用户名或密码不正确'));
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return next(unauthorized('用户名或密码不正确'));
        }

        // 生成JWT令牌
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // 返回令牌
        res.json({ token });
    } catch (error) {
        console.error('[错误] 用户登录失败:', error);
        next(serverError('登录过程中发生错误'));
    }
};

export default {
    register,
    login
}; 