const express = require('express');
const router = express.Router();
const { db } = require('../Database/database');
const jwt = require('jsonwebtoken');
const jwtSecretKey = process.env.JWT_SECRET_KEY;
const tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
const Movie = require('../Models/Movie');
const BASE_URL = process.env.BASE_URL;
const upload = require('../Files/FileHandler');
const path = require('path');
const fs = require('fs');
const movie_cast = require('../Models/MovieCast');

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
    Movie.findByPk(id)
        .then(movie => {
            if (!movie) {
                return res.status(404).json({
                    success: false,
                    message: 'Movie not found'
                });
            }
            res.json({
                success: true,
                data: movie
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


router.post('/add-movie', upload.single('poster'), (req, res) => {
    const { director, genres, overview_string, rating, release_year, status, studio, title, movieCast } = req.body;
    const poster_url = `${BASE_URL}/uploads/${req.file.filename}`;
    const poster = req.file.filename;
    Movie.create({ director, genres, overview_string, poster, poster_url, rating, release_year, status, studio, title })
        .then(async movie => {
            const movieId = movie.movie_id;

            await movie_cast.create({ movie_movie_id: movieId, movie_cast: JSON.parse(movieCast) });

            res.json({
                success: true,
                message: 'Movie added successfully URL : ' + poster_url,
                data: movie
            });

        })
        .catch(err => {
            console.log(err.stack);
            res.status(500).json({
                success: false,
                message: 'Database query failed ',
                error: err.message
            });
        });
});


router.get("/uploads/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({
            success: false,
            message: 'File not found'
        });
    }
});


router.get('/movies/:id', (req, res) => {
    const { id } = req.params;
    Movie.findByPk(id)
        .then(movie => {
            res.json({
                success: true,
                data: movie
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

module.exports = router;
