const express = require('express');
const router = express.Router();
const { db } = require('../Database/database');
const jwt = require('jsonwebtoken');
const jwtSecretKey = process.env.JWT_SECRET_KEY;
const tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
const Movie = require('../Models/Movie');

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
        Movie.findAll()
            .then(movies => {
                res.json({
                    success: true,
                    data: movies
                });
            })
            .catch(err => {
                res.status(500).json({
                    success: false,
                    message: 'Database query failed',
                    error: err.message
                });
            });
        

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


