/**
 * 参数验证工具
 * 用于验证请求参数的有效性
 */

/**
 * 验证分页参数
 * @param {Object} query - 查询参数对象
 * @returns {Object} 验证后的分页参数
 */
export const validatePagination = (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    return {
        page: page > 0 ? page : 1,
        limit: limit > 0 && limit <= 50 ? limit : 10, // 限制最大每页50条
        offset: (page - 1) * limit
    };
};

/**
 * 验证排序参数
 * @param {Object} query - 查询参数对象
 * @param {Array} allowedFields - 允许排序的字段
 * @returns {Object} 验证后的排序参数
 */
export const validateSorting = (query, allowedFields = ['request_timestamp', 'id']) => {
    const sortBy = query.sortBy && allowedFields.includes(query.sortBy)
        ? query.sortBy
        : 'request_timestamp';

    const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    return { sortBy, sortOrder };
};

/**
 * 验证日期范围参数
 * @param {Object} query - 查询参数对象
 * @returns {Object|null} 验证后的日期范围参数，如果无日期参数则返回null
 */
export const validateDateRange = (query) => {
    if (!query.startDate && !query.endDate) return null;

    const result = {};

    if (query.startDate) {
        const startDate = new Date(query.startDate);
        if (!isNaN(startDate.getTime())) {
            result.startDate = startDate;
        }
    }

    if (query.endDate) {
        const endDate = new Date(query.endDate);
        if (!isNaN(endDate.getTime())) {
            // 设置为当天的结束时间
            endDate.setHours(23, 59, 59, 999);
            result.endDate = endDate;
        }
    }

    return Object.keys(result).length > 0 ? result : null;
};

export default {
    validatePagination,
    validateSorting,
    validateDateRange
}; 