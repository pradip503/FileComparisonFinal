var express = require('express');
var router = express.Router();

const fs = require('fs');
const pdf = require('pdf-parse');
const superagent = require('superagent');

const db = require('../config/database');

// open login view
router.get('/', (req, res) => {
    var assignments = "SELECT * FROM assignment";

    db.query(assignments, (error, results) => {

        res.render('home/result_home', {
            result_home: true,
            assignments: results
        });

        if (error) throw error;
    });
});

// loads result view
router.get('/result_view/:username/:id', (req, res) => {
    var getResult = "SELECT * FROM result WHERE user_id = ?";
    db.query(getResult, [req.params.id], (error, results) => {
        res.render('home/result_view', {
            with_whom_author: req.params.username,
            main_user_id: req.params.id,
            user_compare_data: results
        });
        if (error) throw error;
    });

});
module.exports = router;