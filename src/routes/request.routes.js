/**
 * 请求历史路由
 * 处理用户请求历史的查询和管理
 */

import express from 'express';
import { getUserRequests, getRequestById, getUserRequestStats } from '../controllers/request.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// 所有路由都需要身份验证
router.use(verifyToken);

// 获取用户所有请求历史 - GET /api/requests
router.get('/', getUserRequests);

// 获取用户请求统计 - GET /api/requests/stats
router.get('/stats', getUserRequestStats);

// 获取单个请求详情 - GET /api/requests/:id
router.get('/:id', getRequestById);

export default router; 