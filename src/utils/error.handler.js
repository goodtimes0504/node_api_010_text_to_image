/**
 * 错误处理工具
 * 提供统一的错误处理方法和错误类
 */

// 自定义API错误类
export class ApiError extends Error {
    constructor(statusCode, message, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

// 400 Bad Request - 请求参数错误
export const badRequest = (message = '请求参数无效') => {
    return new ApiError(400, message);
};

// 401 Unauthorized - 身份验证失败
export const unauthorized = (message = '未授权访问') => {
    return new ApiError(401, message);
};

// 403 Forbidden - 没有权限
export const forbidden = (message = '禁止访问') => {
    return new ApiError(403, message);
};

// 404 Not Found - 资源不存在
export const notFound = (message = '请求的资源不存在') => {
    return new ApiError(404, message);
};

// 409 Conflict - 资源冲突
export const conflict = (message = '资源冲突') => {
    return new ApiError(409, message);
};

// 429 Too Many Requests - 请求过多
export const tooManyRequests = (message = '请求过于频繁，请稍后再试') => {
    return new ApiError(429, message);
};

// 500 Internal Server Error - 服务器内部错误
export const serverError = (message = '服务器内部错误') => {
    return new ApiError(500, message, true);
};

// 503 Service Unavailable - 服务不可用
export const serviceUnavailable = (message = '服务暂时不可用') => {
    return new ApiError(503, message);
};

export default {
    ApiError,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    conflict,
    tooManyRequests,
    serverError,
    serviceUnavailable
}; 