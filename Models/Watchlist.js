const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Watchlist extends Model {}

Watchlist.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    movieId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'Watchlist',
    tableName: 'watchlist'
})

module.exports = Watchlist;

