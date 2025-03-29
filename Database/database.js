const mysql = require('mysql');
const express = require('express');
const app = express();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    connectionLimit: process.env.DB_CONNECTION_LIMIT,
})

app.use(express.json());


db.connect((err) => {
    if(err) throw err;
    console.log('Connected to MySQL');
})

module.exports = {app,db};


