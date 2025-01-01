const express = require('express');
const cookieSession = require('cookie-session');
const router = express.Router();
const User = require('../models/user');
const logger = require('../logger');
const { default: mongoose } = require('mongoose');


router.get('/', async (req, res) => {
    try {
        res.render('index/index', {
            layout: 'index_layout',
            title: 'Bowl - Manage Your Finances Easily',
            metaDescription: 'Bowl helps you manage your finances effortlessly. Track your income and expenses with ease, and make smarter financial decisions.',
            error: null, message: null, auth_page: true, req: req
        });
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('index/index', {
            title: 'Bowl - Manage Your Finances Easily',
            metaDescription: 'Bowl helps you manage your finances effortlessly. Track your income and expenses with ease, and make smarter financial decisions.',
            error: 'Server error', message: null, auth_page: true, req: req
        });
    }
});

// Route for robots.txt
router.get('/robots.txt', (req, res) => {
    try {
        const robotsTxt = `
User-agent: *
Allow: /*
Disallow: /app/*

Sitemap: https://bowl.grovixlab.com/sitemap.xml
`;
        res.header('Content-Type', 'text/plain');
        res.send(robotsTxt.trim());
    } catch (error) {
        console.error(error);
        logger.logError(error);
        res.status(500).send('Server error');
    }
});


module.exports = router;
