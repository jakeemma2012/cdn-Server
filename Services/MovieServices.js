const express = require('express');
const router = express.Router();
const { db } = require('../Database/database');
const jwt = require('jsonwebtoken');
const jwtSecretKey = process.env.JWT_SECRET_KEY;
const tokenHeaderKey = process.env.TOKEN_HEADER_KEY;


router.get('/get-movies', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    jwt.verify(token, jwtSecretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: 'Token verification failed',
                error: err.message
            });
        }
        
        db.query('select * from movie', (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Database query failed',
                    error: err.message
                });
            }
            res.json({
                success: true,
                data: result
            });
        })
    });
})


router.get('/get-movie/:id', (req, res) => {
    const { id } = req.params;
    db.query('select * from movie where id = ?', [id], (err, result) => {
        if (err) throw err;
        res.send(result);
    })
})



module.exports = router;


