require('dotenv').config({ path: './.env' });
const express = require('express');
const { app, sequelize } = require('./Database/database');
const movieRouter = require('./Services/MovieServices');
const jwtRouter = require('./JWT/JWT');
const port = process.env.PORT || 3000;

app.use(express.json());

// Sync database
sequelize.sync({ force: false })
    .then(() => {
        console.log('Database synced');
        // Start server after database is synced
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch(err => {
        console.error('Unable to sync database:', err);
    });

app.use('/api', movieRouter);
app.use('/auth', jwtRouter);

const jwtSecretKey = process.env.JWT_SECRET_KEY;
const tokenHeaderKey = process.env.TOKEN_HEADER_KEY;

console.log(`JWT Secret Key: ${jwtSecretKey}`);
console.log(`Token Header Key: ${tokenHeaderKey}`);