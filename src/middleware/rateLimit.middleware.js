/**
 * 频率限制中间件
 * 用于限制用户和后端API的调用频率
 */

import db from '../models/index.js';
import { tooManyRequests } from '../utils/error.handler.js';
import { getTimeRanges } from '../utils/helpers.js';

const Request = db.Request;
const BackendRateLimit = db.BackendRateLimit;

// 用户级别限制配置
const USER_LIMITS = {
    MINUTE: 5,  // 每分钟最大请求数
    DAILY: 60   // 每天最大请求数
};

// 后端全局限制配置
const BACKEND_LIMITS = {
    MINUTE: 25, // 所有用户每分钟总请求数
    DAILY: 300  // 所有用户每天总请求数
};

/**
 * 用户级别的频率限制中间件
 * 限制单个用户的请求频率
 */
export const userRateLimit = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { currentMinuteStart, currentDayStart } = getTimeRanges();

        // 获取用户在当前分钟内的请求数
        const minuteCount = await Request.count({
            where: {
                user_id: userId,
                request_timestamp: {
                    [db.Sequelize.Op.gte]: currentMinuteStart
                }
            }
        });

        // 获取用户在当天的请求数
        const dayCount = await Request.count({
            where: {
                user_id: userId,
                request_timestamp: {
                    [db.Sequelize.Op.gte]: currentDayStart
                }
            }
        });

        // 检查是否超出限制
        if (minuteCount >= USER_LIMITS.MINUTE) {
            return next(tooManyRequests('已达到每分钟请求限制，请稍后再试'));
        }

        if (dayCount >= USER_LIMITS.DAILY) {
            return next(tooManyRequests('已达到每日请求限制，请明天再试'));
        }

        next();
    } catch (error) {
        console.error('[错误] 检查用户频率限制失败:', error);
        // 发生错误时允许请求通过，避免阻塞服务
        next();
    }
};

/**
 * 后端全局频率限制中间件
 * 限制后端API的总调用频率
 */
export const backendRateLimit = async (req, res, next) => {
    try {
        // 获取或创建后端频率限制记录
        let limit = await BackendRateLimit.findByPk(1);
        if (!limit) {
            limit = await BackendRateLimit.initRecord();
        }

        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // 格式：YYYY-MM-DD

        // 检查是否需要重置计数
        let resetMinute = false;
        let resetDaily = false;

        // 检查分钟级别重置
        const lastMinute = new Date(limit.last_minute_reset);
        if (now - lastMinute >= 60000) { // 60000ms = 1分钟
            resetMinute = true;
        }

        // 检查每日重置
        if (limit.last_daily_reset !== currentDate) {
            resetDaily = true;
        }

        // 更新计数和重置时间
        const updateData = {};

        if (resetMinute) {
            updateData.minute_requests = 1;
            updateData.last_minute_reset = now;
        } else {
            updateData.minute_requests = limit.minute_requests + 1;
        }

        if (resetDaily) {
            updateData.daily_requests = 1;
            updateData.last_daily_reset = currentDate;
        } else {
            updateData.daily_requests = limit.daily_requests + 1;
        }

        // 检查是否超出限制
        if (!resetMinute && limit.minute_requests >= BACKEND_LIMITS.MINUTE) {
            return next(tooManyRequests('服务器忙，请稍后再试'));
        }

        if (!resetDaily && limit.daily_requests >= BACKEND_LIMITS.DAILY) {
            return next(tooManyRequests('服务器已达到日请求限制，请明天再试'));
        }

        // 更新频率限制记录
        await limit.update(updateData);

        next();
    } catch (error) {
        console.error('[错误] 检查后端频率限制失败:', error);
        // 发生错误时允许请求通过，避免阻塞服务
        next();
    }
};

export default {
    userRateLimit,
    backendRateLimit
}; 