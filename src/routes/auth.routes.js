/**
 * 用户认证路由
 * 处理用户注册和登录请求
 */

import express from 'express';
import { register, login } from '../controllers/auth.controller.js';

const router = express.Router();

// 用户注册路由 - POST /api/auth/register
router.post('/register', register);

// 用户登录路由 - POST /api/auth/login
router.post('/login', login);

export default router; 