require('dotenv').config({ path: './.env' });
const express = require('express');
const { app, sequelize } = require('./Database/database');
const movieRouter = require('./Services/MovieServices');
const jwtRouter = require('./JWT/JWT');
const port = process.env.PORT || 3000;
const seedDatabase = require('./Database/seed');

app.use(express.json());

const createTables = async () => {
    try {
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS link_videos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                link VARCHAR(255) NOT NULL
            )
        `);

        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS link_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                link VARCHAR(255) NOT NULL
            )
        `);

        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS Users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL
            )
        `);

        console.log('Links table created');
    } catch (error) {
        console.error('Error creating tables:', error);
    }
};

createTables()
    .then(async () => {
        await seedDatabase();
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    });

app.use('/api', movieRouter);
app.use('/auth', jwtRouter);

const jwtSecretKey = process.env.JWT_SECRET_KEY;
const tokenHeaderKey = process.env.TOKEN_HEADER_KEY;

console.log(`JWT Secret Key: ${jwtSecretKey}`);
console.log(`Token Header Key: ${tokenHeaderKey}`);