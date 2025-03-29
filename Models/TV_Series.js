const { DataTypes } = require('sequelize');
const { sequelize } = require('../Database/database');

const TVSeries = sequelize.define('TVSeries', {
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
},
);

module.exports = TVSeries;
