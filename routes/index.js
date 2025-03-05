const express = require('express');
const cookieSession = require('cookie-session');
const router = express.Router();
const User = require('../models/user');
const logger = require('../logger');
const RSSParser = require('rss-parser');
const parser = new RSSParser();
const axios = require('axios');
const { default: mongoose } = require('mongoose');

// Middleware to check if user is already logged in
function checkLoggedIn(req, res, next) {
    if (!req.session.user) {
        return next();
    }
    return res.redirect('/app/');
}


async function fetchMediumStories() {
    const mediumRSSFeed = 'https://medium.com/feed/@refrut'; // Replace with your Medium username
    try {
        const feed = await parser.parseURL(mediumRSSFeed);
        const stories = feed.items.map(item => {
            // Extract thumbnail and description from the content field
            const content = item['content:encoded'];
            const thumbnailMatch = content.match(/src="(.*?)"/);
            const thumbnail = thumbnailMatch ? thumbnailMatch[1] : null;

            const descriptionMatch = content.match(/<p>(.*?)<\/p>/);
            const description = descriptionMatch ? descriptionMatch[1] : null;


            return {
                title: item.title,
                link: item.link,
                description: description, // Fallback to snippet if no description
                thumbnail: thumbnail,
                pubDate: item.pubDate,
                categories: item.categories,
            };
        });

        return stories;
    } catch (error) {
        console.error('Error fetching Medium stories:', error);
        return null;
    }
}

function formatDateToDDMMYYYY(dateString) {
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}


router.get('/', checkLoggedIn, async (req, res) => {
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

router.get('/events', async (req, res) => {
    try {
        const data = await axios.get('https://api.buildnship.in/makemypass/integration/org/refrut/list-events/');
        const events = data.data.response;

        let formattedEvents = events.map(event => {
            event.description = event.description ? event.description : "No description";
            event.logo = event.logo ? event.logo : "No Logo";
            event.banner = event.banner ? event.banner : "https://i.postimg.cc/bJv00Sr9/no-image.jpg";
        });
        
        res.render('index/events', {
            title: "Explore Upcoming Events",
            metaDescription: 'Stay updated with the latest events happening near you. Discover event details, dates, locations, and more. Register now to secure your spot and make the most of these opportunities.',
            error: null, message: null, auth_page: true, req: req, events, ogImage: 'events.webp'
        });
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('index/index', {
            title: "Explore Upcoming Events",
            metaDescription: 'Stay updated with the latest events happening near you. Discover event details, dates, locations, and more. Register now to secure your spot and make the most of these opportunities.',
            error: 'Server error', message: null, auth_page: true, req: req, events: null, ogImage: 'events.webp'
        });
    }
});

router.get('/blog', async (req, res) => {
    try {
        const blogs = await fetchMediumStories();

        res.render('index/blogs', {
            title: "Discover Inspiring Blogs",
            metaDescription: 'Explore our collection of insightful blogs covering a wide range of topics, including technology, lifestyle, personal growth, and more. Stay informed, inspired, and entertained.',
            error: null, message: null, auth_page: true, req: req, blogs, ogImage: 'blog.webp'
        });
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('index/blogs', {
            title: "Discover Inspiring Blogs",
            metaDescription: 'Explore our collection of insightful blogs covering a wide range of topics, including technology, lifestyle, personal growth, and more. Stay informed, inspired, and entertained.',
            error: 'Server error', message: null, auth_page: true, req: req, blogs: null, ogImage: 'blog.webp'
        });
    }
});

router.get('/partners', async (req, res) => {
    try {
        res.render('index/partners', {
            title: "Partners",
            metaDescription: 'Explore our valued partners at Refrut who contribute to our mission of innovation and growth. From technology to marketing, we collaborate with industry leaders to bring cutting-edge solutions and services to our community.',
            error: null, message: null, auth_page: true, req: req, ogImage: 'partners.webp'
        });
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('index/partners', {
            title: "Partners",
            metaDescription: 'Explore our valued partners at Refrut who contribute to our mission of innovation and growth. From technology to marketing, we collaborate with industry leaders to bring cutting-edge solutions and services to our community.',
            error: 'Server error', message: null, auth_page: true, req: req, ogImage: 'partners.webp'
        });
    }
});

router.get('/user/:user_id', async (req, res) => {
    try {
        let user = await User.findOne({ _id: new mongoose.Types.ObjectId(req.params.user_id) }).lean();

        if (!user) {
            if (req.session.user) {
                return res.redirect('/app/');
            } else {
                return res.render('index/index', {
                    title: "Refrut - Connect, Collaborate, and Grow with Startups & Tech Innovators",
                    metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
                    error: 'User not found', message: null, auth_page: true, req: req
                });
            }
        }

        if (req.session.user && req.session.user._id === user._id.toString()) {
            return res.redirect('/app/');
        }

        let referrals = await User.find({
            reffer_user: user._id,
            status: true,
            email_verified: true,
            accountExpiryDate: { $gt: new Date() } // Check if account is not expired
        });

        let reffer_user = await User.findOne({ _id: new mongoose.Types.ObjectId(user.reffer_user) }).lean();

        const originalExpiryDate = await user.admin ? "9999+": formatDateToDDMMYYYY(user.accountExpiryDate);

        res.render('index/user', {
            title: `${user.user_name} - Refrut`,
            metaDescription: user.bio ? user.bio : "Passionate about innovation, collaboration, and growth, I'm a proud member of the Refrut community.",
            error: null, message: null, auth_page: true, req: req, originalExpiryDate, user, referrals, reffer_user, ogImage: `https://refrut.grovixlab.com${user.profile_url}`
        });
    } catch (error) {
        logger.logError(error);
        res.render('index/user', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: 'Server Error', message: null, auth_page: true, req: req, originalExpiryDate: null, user: null, referrals: null, reffer_user: null
        });
    }
});

router.get('/user/:user_id/badges', async (req, res) => {
    try {
        let user = await User.findOne({ _id: new mongoose.Types.ObjectId(req.params.user_id) }).lean();
        let reffer_user = await User.findOne({ _id: new mongoose.Types.ObjectId(user.reffer_user) }).lean();

        const badge = await User.findById(user._id, 'badges').populate('badges.badge_id').exec();

        const originalExpiryDate = await user.admin ? "9999+": formatDateToDDMMYYYY(user.accountExpiryDate);

        res.render('index/badges', {
            title: `${user.user_name}/Badges - Refrut`,
            metaDescription: user.bio ? user.bio : "Passionate about innovation, collaboration, and growth, I'm a proud member of the Refrut community.",
            error: null, message: null, auth_page: true, req: req, originalExpiryDate, user, reffer_user, ogImage: `https://refrut.grovixlab.com${user.profile_url}`,badges: badge.badges
        });
    } catch (error) {
        logger.logError(error);
        res.render('user/app', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: 'Server Error', message: null, auth_page: true, req: req, originalExpiryDate: null, user: null, referrals: null, reffer_user: null, form_data: null
        });
    }
});

router.get('/terms-and-conditions', async (req, res) => {
    try {
        res.render('index/terms_and_conditions', {
            title: "Terms and Conditions",
            metaDescription: "Read Refrut's Terms and Conditions to understand your rights and responsibilities when using our website and services. Learn about account security, privacy policy, and legal agreements.",
            error: null, message: null, auth_page: true, req: req
        });
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('index/terms_and_conditions', {
            title: "Terms and Conditions",
            metaDescription: "Read Refrut's Terms and Conditions to understand your rights and responsibilities when using our website and services. Learn about account security, privacy policy, and legal agreements.",
            error: 'Server error', message: null, auth_page: true, req: req
        });
    }
});

router.get('/privacy-policy', async (req, res) => {
    try {
        res.render('index/privacy_policy', {
            title: "Privacy Policy",
            metaDescription: "Explore Refrut's Privacy Policy to understand how we collect, use, and protect your personal information. Your privacy is important to us, and we are committed to safeguarding your data.",
            error: null, message: null, auth_page: true, req: req
        });
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('index/privacy_policy', {
            title: "Privacy Policy",
            metaDescription: "Explore Refrut's Privacy Policy to understand how we collect, use, and protect your personal information. Your privacy is important to us, and we are committed to safeguarding your data.",
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

router.get('/sitemap-users.xml', async (req, res) => {
    try {
        // Fetch users with verified email and active status
        let users = await User.find({ email_verified: true, status: true }).lean();

        const currentDate = new Date().toISOString();

        // Initialize sitemap XML structure
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset
            xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                  http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n`;

        // Add a URL entry for each user
        users.forEach(user => {
            sitemap += `
            <url>
                <loc>https://refrut.grovixlab.com/user/${user._id}</loc>
                <lastmod>${currentDate}</lastmod>
                <changefreq>daily</changefreq>
                <priority>1.0</priority>
            </url>`;
        });

        // Close the sitemap XML structure
        sitemap += '\n</urlset>';

        // Set response header to XML
        res.header('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (error) {
        console.error(error);
        // Log the error using your logger
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
