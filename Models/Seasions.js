const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Seasions extends Model {}

Seasions.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tvSeriesId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    seasonNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    totalEpisodes: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    releaseDate: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'Seasions',
    tableName: 'seasions'
})

module.exports = Seasions;

