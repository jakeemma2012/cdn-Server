const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Episode extends Model {}

Episode.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },  
    seasonId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    episodeNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    releaseDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
    videoUrl: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'Episode',
    tableName: 'episodes'
})
    
module.exports = Episode;

