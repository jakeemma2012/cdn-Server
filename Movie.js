const express = require('express');
const router = express.Router();
const {db} = require('./Database/database');

router.get('/get-movies', (req, res) => {
    db.query('select * from refresh_token', (err, result) => {
        if(err) throw err;
        res.send(result);
    })
})

module.exports = router;


