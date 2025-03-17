/**
 * 请求历史控制器
 * 处理用户请求历史的查询和管理
 */

import db from '../models/index.js';
import { badRequest, notFound } from '../utils/error.handler.js';

const Request = db.Request;

/**
 * 获取用户所有请求历史
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
export const getUserRequests = async (req, res, next) => {
    try {
        const userId = req.userId;

        // 获取分页参数
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // 获取排序参数
        const sortBy = req.query.sortBy || 'request_timestamp';
        const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

        // 查询总记录数
        const total = await Request.count({ where: { user_id: userId } });

        // 查询请求历史记录
        const requests = await Request.findAll({
            where: { user_id: userId },
            order: [[sortBy, sortOrder]],
            limit,
            offset
        });

        // 返回结果
        res.json({
            success: true,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            requests
        });
    } catch (error) {
        console.error('[错误] 获取用户请求历史失败:', error);
        next(error);
    }
};

/**
 * 获取单个请求详情
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
export const getRequestById = async (req, res, next) => {
    try {
        const userId = req.userId;
        const requestId = req.params.id;

        // 验证请求ID
        if (!requestId || isNaN(parseInt(requestId))) {
            return next(badRequest('无效的请求ID'));
        }

        // 查询请求记录
        const request = await Request.findOne({
            where: {
                id: requestId,
                user_id: userId
            }
        });

        // 检查是否找到记录
        if (!request) {
            return next(notFound('未找到请求记录'));
        }

        // 返回结果
        res.json({
            success: true,
            request
        });
    } catch (error) {
        console.error('[错误] 获取请求详情失败:', error);
        next(error);
    }
};

/**
 * 获取用户请求统计
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
export const getUserRequestStats = async (req, res, next) => {
    try {
        const userId = req.userId;

        // 查询总请求数
        const totalRequests = await Request.count({
            where: { user_id: userId }
        });

        // 查询按类型分类的请求数
        const textToImageCount = await Request.count({
            where: {
                user_id: userId,
                request_type: 'text_to_image'
            }
        });

        const imageToImageCount = await Request.count({
            where: {
                user_id: userId,
                request_type: 'image_to_image'
            }
        });

        const textAndImageToImageCount = await Request.count({
            where: {
                user_id: userId,
                request_type: 'text_and_image_to_image'
            }
        });

        // 查询按状态分类的请求数
        const successCount = await Request.count({
            where: {
                user_id: userId,
                status: 'completed'
            }
        });

        const failedCount = await Request.count({
            where: {
                user_id: userId,
                status: 'failed'
            }
        });

        // 返回统计数据
        res.json({
            success: true,
            stats: {
                totalRequests,
                byType: {
                    textToImage: textToImageCount,
                    imageToImage: imageToImageCount,
                    textAndImageToImage: textAndImageToImageCount
                },
                byStatus: {
                    completed: successCount,
                    failed: failedCount,
                    processing: totalRequests - successCount - failedCount
                }
            }
        });
    } catch (error) {
        console.error('[错误] 获取用户请求统计失败:', error);
        next(error);
    }
};

export default {
    getUserRequests,
    getRequestById,
    getUserRequestStats
}; 