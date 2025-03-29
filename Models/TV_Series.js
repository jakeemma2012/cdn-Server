const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class TV_Series extends Model {}

TV_Series.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    movieId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    totalSeasons: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    totalEpisodes: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'TV_Series',
    tableName: 'tv_series'
})

module.exports = TV_Series;
