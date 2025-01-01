const express = require('express');
const cookieSession = require('cookie-session');
const router = express.Router();
const User = require('../models/user');
const logger = require('../logger');
const { default: mongoose } = require('mongoose');


router.get('/', async (req, res) => {
    try {
        res.render('index/index', {
            title: "Refrut - Connect, Collaborate, and Grow with Startups & Tech Innovators",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: null, message: null, auth_page: true, req: req
        });
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('index/index', {
            title: "Refrut - Connect, Collaborate, and Grow with Startups & Tech Innovators",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: 'Server error', message: null, auth_page: true, req: req
        });
    }
});

// Sitemap route
router.get('/sitemap.xml', (req, res) => {
    try {
        const urls = [
            { loc: 'https://refrut.grovixlab.com/', priority: 1.0 },
            { loc: 'https://refrut.grovixlab.com/about', priority: 1.0 },
            { loc: 'https://refrut.grovixlab.com/auth/login', priority: 1.0 },
            { loc: 'https://refrut.grovixlab.com/privacy-policy', priority: 1.0 },
            { loc: 'https://refrut.grovixlab.com/terms-and-conditions', priority: 1.0 },
            { loc: 'https://refrut.grovixlab.com/auth/reset-password', priority: 1.0 },
            { loc: 'https://refrut.grovixlab.com/auth/signup', priority: 1.0 },
        ];

        const currentDate = new Date().toISOString();

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset
        xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
              http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n`;

        urls.forEach((url) => {
            sitemap += `
        <url>
          <loc>${url.loc}</loc>
          <lastmod>${currentDate}</lastmod>
          <changefreq>daily</changefreq>
          <priority>${url.priority.toFixed(2)}</priority>
        </url>`;
        });

        sitemap += '\n</urlset>';

        // Set response header to XML
        res.header('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (error) {
        console.error(error);
        logger.logError(error);
        res.status(500).send('Server error');
    }
});

// Route for robots.txt
router.get('/robots.txt', (req, res) => {
    try {
        const robotsTxt = `
User-agent: *
Allow: /*
Disallow: /app/*

Sitemap: https://refrut.grovixlab.com/sitemap.xml
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
