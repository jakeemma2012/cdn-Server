const { DataTypes } = require('sequelize');
const { sequelize } = require('../Database/database');

const Episode = sequelize.define('Episode', {
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
},
);

module.exports = Episode;

