const { DataTypes } = require('sequelize');
const { sequelize } = require('../Database/database');

const LinkVideos = sequelize.define('LinkVideos', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    link: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'link_videos',
    timestamps: false
}
);

module.exports = LinkVideos;
