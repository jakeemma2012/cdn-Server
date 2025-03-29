const { DataTypes } = require('sequelize');
const { sequelize } = require('../Database/database');

const Watchlist = sequelize.define('Watchlist', {   
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
},
);

module.exports = Watchlist;

