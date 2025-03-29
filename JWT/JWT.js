require('dotenv').config({ path: './.env' });
const jwt = require('jsonwebtoken');
const { db } = require('../Database/database');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwtSecretKey = process.env.JWT_SECRET_KEY;
const tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
const User = require('../Models/User');


router.post('/login', (req, res) => {
    const { email, password } = req.body;
    User.findOne({ where: { email } })
        .then(user => {
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }
            bcrypt.compare(password, user.password, (err, result) => {
                if (err) return res.sendStatus(500);
                if (result) {
                    const token = jwt.sign({ email: user.email, role: user.role }, jwtSecretKey, { expiresIn: '1h' });
                    if (user.role === 'USER') {
                        return res.json({ message: 'Login FAILED' });
                    }
                    else {
                        return res.json({ message: 'Login successful', token: token });
                    }
                }
            });
        });
});

router.post('/register', (req, res) => {
    const { email, password, role } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ message: 'Hashing password failed', error: err });
        User.create({ email, password: hash, role })
            .then(user => res.json({ message: 'Register successful', user: user }))
            .catch(err => res.status(500).json({ message: 'Register failed', error: err }));
    });
});


router.post('/refresh-token', (req, res) => {
    const { refreshToken } = req.body;
    db.query('SELECT * FROM refresh_token WHERE token = ?', [refreshToken], (err, result) => {
        if (err) return res.sendStatus(500);
        if (result.length === 0) return res.sendStatus(401);
        const token = jwt.sign({ email: result[0].email, role: result[0].role }, jwtSecretKey, { expiresIn: '1h' });
        return res.json({ message: 'Refresh token successful', token: token });
    });
});

router.post('/verify-token', (req, res) => {
    const { token } = req.body;
    jwt.verify(token, jwtSecretKey, (err, decoded) => {
        if (err) return res.sendStatus(403);
        res.json(decoded);
    });
});


module.exports = router;

