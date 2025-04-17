const { DataTypes } = require('sequelize');
const { sequelize } = require('../Database/database');

const LinkBackdrops = sequelize.define('LinkBackdrops', {
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
    tableName: 'link_backdrops',
    timestamps: false
});

module.exports = LinkBackdrops;    
