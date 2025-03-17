/**
 * 请求记录模型定义
 * 对应数据库中的 requests 表
 */

const defineRequestModel = (sequelize, DataTypes) => {
    const Request = sequelize.define('request', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        request_type: {
            type: DataTypes.ENUM('text_to_image', 'image_to_image', 'text_and_image_to_image'),
            allowNull: false
        },
        input_text: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        input_image_url: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        generated_image_url: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        generated_text: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        request_timestamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        status: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        error_message: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'requests',
        timestamps: false,
        indexes: [
            {
                name: 'idx_user_id',
                fields: ['user_id']
            },
            {
                name: 'idx_request_timestamp',
                fields: ['request_timestamp']
            },
            {
                name: 'idx_user_timestamp',
                fields: ['user_id', 'request_timestamp']
            }
        ]
    });

    return Request;
};

export default defineRequestModel; 