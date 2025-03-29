const { DataTypes } = require('sequelize');
const { sequelize } = require('../Database/database');

const Seasion = sequelize.define('Seasion', {
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
},
);

module.exports = Seasion;

