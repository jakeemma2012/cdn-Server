const { DataTypes } = require('sequelize');
const { sequelize } = require('../Database/database');

const movie_cast = sequelize.define('movie_cast', {
    movie_movie_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    movie_cast: {
        type: DataTypes.JSON,
        allowNull: false
    }
}, {
    tableName: 'movie_cast',
    timestamps: false,
    id: false
});

module.exports = movie_cast;

