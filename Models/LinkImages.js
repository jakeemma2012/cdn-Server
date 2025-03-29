const { DataTypes } = require('sequelize');
const { sequelize } = require('../Database/database');

const LinkImages = sequelize.define('LinkImages', {
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
    tableName: 'link_images',
    timestamps: false
});

module.exports = LinkImages;    
