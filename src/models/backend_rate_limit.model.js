/**
 * 后端频率限制模型定义
 * 对应数据库中的 backend_rate_limits 表
 */

const defineBackendRateLimitModel = (sequelize, DataTypes) => {
    const BackendRateLimit = sequelize.define('backend_rate_limit', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            defaultValue: 1
        },
        minute_requests: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        last_minute_reset: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        daily_requests: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        last_daily_reset: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'backend_rate_limits',
        timestamps: false
    });

    // 添加用于初始化记录的静态方法
    BackendRateLimit.initRecord = async function () {
        try {
            // 确保表中始终有一条记录 (id=1)
            const [record] = await this.findOrCreate({
                where: { id: 1 },
                defaults: {
                    minute_requests: 0,
                    last_minute_reset: new Date(),
                    daily_requests: 0,
                    last_daily_reset: new Date()
                }
            });

            return record;
        } catch (error) {
            console.error('[错误] 初始化频率限制记录失败:', error);
            throw error;
        }
    };

    return BackendRateLimit;
};

export default defineBackendRateLimitModel; 