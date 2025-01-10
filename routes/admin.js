const express = require('express');
const cookieSession = require('cookie-session');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const logger = require('../logger');
const User = require('../models/user');
const Badge = require('../models/badge');
const { default: mongoose } = require('mongoose');
const moment = require('moment');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/badge_icon');
    },
    filename: function (req, file, cb) {
        cb(null, `${file.originalname}.jpeg`);
    }
});

function formatDateToDDMMYYYY(dateString) {
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
    try {
        res.render('admin/app', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: null, message: null, auth_page: true, req: req,
        });
    } catch (error) {
        logger.logError(error);
        res.render('admin/app', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: 'Server Error', message: null, auth_page: true, req: req,
        });
    }
});

router.get('/badges', async (req, res) => {
    try {
        let badges = await Badge.find().sort({ createdAt: -1 });
        res.render('admin/badges', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: null, message: null, auth_page: true, req: req, badges
        });
    } catch (error) {
        logger.logError(error);
        res.render('admin/badges', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: 'Server Error', message: null, auth_page: true, req: req, badges: null
        });
    }
});

router.get('/badge/add', async (req, res) => {
    try {
        res.render('admin/badges_add', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: null, message: null, auth_page: true, req: req
        });
    } catch (error) {
        logger.logError(error);
        res.render('admin/badges_add', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: 'Server Error', message: null, auth_page: true, req: req
        });
    }
});

router.post('/badge/add', upload.single('badge_image'), async (req, res) => {
    const { badge_name, description, badge_points } = req.body;

    try {
        // Validate badge_name
        if (!badge_name) {
            return res.status(400).render('admin/badges_add', {
                title: "Refrut",
                metaDescription: 'Add a new badge to the system.',
                error: 'Badge name is required.',
                message: null,
                auth_page: true,
                req: req
            });
        }

        // Validate description
        if (!description) {
            return res.status(400).render('admin/badges_add', {
                title: "Refrut",
                metaDescription: 'Add a new badge to the system.',
                error: 'Description is required.',
                message: null,
                auth_page: true,
                req: req
            });
        }

        // Validate badge_point
        if (!badge_points) {
            return res.status(400).render('admin/badges_add', {
                title: "Refrut",
                metaDescription: 'Add a new badge to the system.',
                error: 'Badge point is required.',
                message: null,
                auth_page: true,
                req: req
            });
        }

        if (!req.file) {
            return res.status(400).render('admin/badges_add', {
                title: "Refrut",
                metaDescription: 'Add a new badge to the system.',
                error: 'Badge icon is required.',
                message: null,
                auth_page: true,
                req: req
            });
        }


        // Ensure badge_point is a number
        if (isNaN(badge_points)) {
            return res.status(400).render('admin/badges_add', {
                title: "Refrut",
                metaDescription: 'Add a new badge to the system.',
                error: 'Badge points must be a number.',
                message: null,
                auth_page: true,
                req: req
            });
        }

        // Create a new Badge
        const newBadge = new Badge({
            name: badge_name,
            description,
            badge_points: parseInt(badge_points),
            badge_icon: `/badge_icon/${req.file.originalname}.jpeg`
        });

        await newBadge.save();

        // Redirect to badges list page or render success message
        res.redirect('/admin/badges');
    } catch (error) {
        logger.logError(error);
        res.status(500).render('admin/badges_add', {
            title: "Refrut",
            metaDescription: 'Add a new badge to the system.',
            error: 'Server error while adding badge.',
            message: null,
            auth_page: true,
            req: req
        });
    }
});

router.get('/badge/:badge_id/edit/', async (req, res) => {
    try {
        let badge = await Badge.findOne({ _id: new mongoose.Types.ObjectId(req.params.badge_id) });
        res.render('admin/badges_edit', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: null, message: null, auth_page: true, req: req, badge
        });
    } catch (error) {
        logger.logError(error);
        res.render('admin/badges_edit', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: 'Server Error', message: null, auth_page: true, req: req, badge: null
        });
    }
});

router.post('/badge/edit/:badge_id', upload.single('badge_image'), async (req, res) => {
    const { badge_name, description, badge_points } = req.body;

    try {

        let badge = await Badge.findOne({ _id: new mongoose.Types.ObjectId(req.params.badge_id) });
        // Validate badge_name
        if (!badge_name) {
            return res.status(400).render('admin/badges_edit', {
                title: "Refrut",
                metaDescription: 'Add a new badge to the system.',
                error: 'Badge name is required.',
                message: null,
                auth_page: true,
                req: req,
                badge
            });
        }

        // Validate description
        if (!description) {
            return res.status(400).render('admin/badges_edit', {
                title: "Refrut",
                metaDescription: 'Add a new badge to the system.',
                error: 'Description is required.',
                message: null,
                auth_page: true,
                req: req,
                badge
            });
        }

        // Validate badge_point
        if (!badge_points) {
            return res.status(400).render('admin/badges_edit', {
                title: "Refrut",
                metaDescription: 'Add a new badge to the system.',
                error: 'Badge point is required.',
                message: null,
                auth_page: true,
                req: req,
                badge
            });
        }


        // Ensure badge_point is a number
        if (isNaN(badge_points)) {
            return res.status(400).render('admin/badges_edit', {
                title: "Refrut",
                metaDescription: 'Add a new badge to the system.',
                error: 'Badge points must be a number.',
                message: null,
                auth_page: true,
                req: req,
                badge
            });
        }


        badge.name = badge_name;
        badge.description = description;
        badge.badge_points = parseInt(badge_points);
        badge.badge_icon = req.file ? `/badge_icon/${req.file.originalname}.jpeg` : badge.badge_icon;

        await badge.save();

        // Redirect to badges list page or render success message
        res.redirect('/admin/badges');
    } catch (error) {
        logger.logError(error);
        res.status(500).render('admin/badges_add', {
            title: "Refrut",
            metaDescription: 'Add a new badge to the system.',
            error: 'Server error while adding badge.',
            message: null,
            auth_page: true,
            req: req
        });
    }
});

router.get('/badge/:badge_id/delete/', async (req, res) => {
    try {
        let badge = await Badge.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.badge_id) });
        const result = await User.updateMany(
            { 'badges.badge_id': badge._id },
            { $pull: { badges: { badge_id: badge._id } } }
        );
        res.redirect('/admin/badges');
    } catch (error) {
        logger.logError(error);
        res.render('admin/badges_edit', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: 'Server Error', message: null, auth_page: true, req: req, badge: null
        });
    }
});

router.get('/users/', async (req, res) => {
    try {
        let users = await User.find({ status: true, email_verified: true }).sort({ createdAt: -1 });
        res.render('admin/users', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: null, message: null, auth_page: true, req: req, users
        });
    } catch (error) {
        logger.logError(error);
        res.render('admin/users', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: 'Server Error', message: null, auth_page: true, req: req, badge: null
        });
    }
});

module.exports = router;
