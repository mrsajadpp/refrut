const express = require('express');
const cookieSession = require('cookie-session');
const router = express.Router();
const logger = require('../logger');
const User = require('../models/user');
const { default: mongoose } = require('mongoose');


router.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/auth/login');
});

module.exports = router;
