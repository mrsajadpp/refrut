const express = require('express');
const cookieSession = require('cookie-session');
const router = express.Router();
const logger = require('../logger');
const User = require('../models/user');
const { default: mongoose } = require('mongoose');
const moment = require('moment');

router.get('/', (req, res) => {
    const originalExpiryDate = moment(req.session.user.accountExpiryDate).format('DD/MM/YYYY');
    const updatedExpiryDate = moment(req.session.user.accountExpiryDate).add(1, 'month').format('DD/MM/YYYY');
    res.render('user/app', {
        title: "Refrut - Connect, Collaborate, and Grow with Startups & Tech Innovators",
        metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
        error: null, message: null, auth_page: true, req: req, originalExpiryDate, updatedExpiryDate
    });
});


router.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/auth/login');
});

module.exports = router;
