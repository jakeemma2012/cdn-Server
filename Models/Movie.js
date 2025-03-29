const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database'); 

class Movie extends Model {}

Movie.init({
    movieId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    rating: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: {
            min: 0,
            max: 10,
        },
    },
    overviewString: {
        type: DataTypes.TEXT,
    },
    genres: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING, 
        allowNull: false,
    },
    studio: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    director: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    poster: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    movieCast: {
        type: DataTypes.JSON, 
    },
    posterUrl: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    releaseYear: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1900,
            max: 2100,
        },
    },
}, {
    sequelize,
    modelName: 'Movie',
    tableName: 'movie',
});

module.exports = Movie;