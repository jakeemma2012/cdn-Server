const { DataTypes } = require('sequelize');
const { sequelize } = require('../Database/database');

const Movie = sequelize.define('Movie', {
    movie_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    director: {
        type: DataTypes.STRING,
        allowNull: false
    },
    genres: {
        type: DataTypes.STRING,
        allowNull: false
    },
    overview_string: {
        type: DataTypes.STRING,
        allowNull: false
    },
    poster: {
        type: DataTypes.STRING,
        allowNull: false
    },
    poster_url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    rating: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    release_year: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Released', 'Upcoming', 'Canceled','Ongoing'),
        allowNull: false
    },
    studio: {
        type: DataTypes.STRING,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    tableName: 'movie',
    timestamps: false
});

module.exports = Movie;