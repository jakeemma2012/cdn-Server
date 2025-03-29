const express = require('express');
const router = express.Router();
const { db } = require('../Database/database');
const jwt = require('jsonwebtoken');
const jwtSecretKey = process.env.JWT_SECRET_KEY;
const Movie = require('../Models/Movie');
const BASE_URL = process.env.BASE_URL;
const { upload_video, upload_image, handleMulterError } = require('../Files/FileHandler');
const path = require('path');
const fs = require('fs');
const movie_cast = require('../Models/MovieCast');
const LinkVideos = require('../Models/LinkVideos');
const LinkImages = require('../Models/LinkImages');

const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, jwtSecretKey, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Unauthorized' });

        const role = decoded.role;
        if (role !== 'ADMIN') return res.status(401).json({ message: 'Unauthorized' });

        next();
    });
};

router.post('/uploads_video', authenticate, upload_video.single('video'), handleMulterError, (req, res) => {
    const video = req.file.filename;
    const link = `${BASE_URL}/uploads/videos/${video}`;

    LinkVideos.create({ link })
        .then(link => {
            res.json({
                success: true,
                message: 'Link added successfully',
                data: link
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

router.post('/uploads_image', authenticate, upload_image.single('image'), handleMulterError, (req, res) => {
    const image = req.file.filename;
    const link = `${BASE_URL}/uploads/images/${image}`;
    LinkImages.create({ link })
        .then(link => {
            res.json({
                success: true,
                message: 'Link added successfully',
                data: link
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
