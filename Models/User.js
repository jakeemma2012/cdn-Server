const { DataTypes } = require('sequelize');
const { sequelize } = require('../Database/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false    
    },  
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('USER', 'ADMIN'),
        defaultValue: 'USER',
        allowNull: false
    }
}, {
    timestamps: false
}); 

module.exports = User;
