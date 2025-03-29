const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Actor extends Model {}

Actor.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    profileUrl: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'Actor',
    tableName: 'actors'
})

module.exports = Actor;

