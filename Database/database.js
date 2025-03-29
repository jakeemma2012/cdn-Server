const { Sequelize } = require('sequelize');
const express = require('express');
const app = express();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false 
    }
);

app.use(express.json());

sequelize.authenticate()
    .then(() => {
        console.log('Connected to MySQL using Sequelize');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

module.exports = { app, sequelize };


