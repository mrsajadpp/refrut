const express = require('express');
const cookieSession = require('cookie-session');
const router = express.Router();
const logger = require('../logger');
const User = require('../models/user');
const { default: mongoose } = require('mongoose');
const moment = require('moment');

router.get('/', async (req, res) => {
    try {
        let user = await User.findOne({ _id: new mongoose.Types.ObjectId(req.session.user._id) });
        let referrals = await User.find({
            reffer_user: user._id,
            status: true,
            email_verified: true,
            accountExpiryDate: { $gt: new Date() } // Check if account is not expired
        });
        const originalExpiryDate = moment(user.accountExpiryDate).format('DD/MM/YYYY');
        const updatedExpiryDate = moment(user.accountExpiryDate).add(1, 'month').format('DD/MM/YYYY');
        res.render('user/app', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: null, message: null, auth_page: true, req: req, originalExpiryDate, updatedExpiryDate, user, referrals
        });
    } catch (error) {
        logger.logError(error);
        res.render('user/app', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: 'Server Error', message: null, auth_page: true, req: req, originalExpiryDate: null, updatedExpiryDate: null, user: null, referrals: null
        });
    }
});

router.get('/profile/edit', async (req, res) => {
    try {
        let user = await User.findOne({ _id: new mongoose.Types.ObjectId(req.session.user._id) });
        const originalExpiryDate = moment(user.accountExpiryDate).format('DD/MM/YYYY');
        res.render('user/edit_profile', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: null, message: null, auth_page: true, req: req, originalExpiryDate, user, form_data: null
        });
    } catch (error) {
        logger.logError(error);
        res.render('user/edit_profile', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: 'Server Error', message: null, auth_page: true, req: req, originalExpiryDate: null, updatedExpiryDate: null, user: null, referrals: null, form_data: null
        });
    }
});

router.post('/profile/update', async (req, res) => {
    const { user_name, position, sex } = req.body;
    try {
        let user = await User.findOne({ _id: new mongoose.Types.ObjectId(req.session.user._id) });
        const originalExpiryDate = moment(user.accountExpiryDate).format('DD/MM/YYYY');

        // Validate user_name
        if (!user_name) {
            return res.status(400).render('user/edit_profile', {
                title: "Refrut",
                metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
                error: 'Username is required', message: null, auth_page: true, req: req, originalExpiryDate, user, form_data: null
            });
        }

        if (user_name.length < 3) {
            return res.status(400).render('user/edit_profile', {
                title: "Refrut",
                metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
                error: 'Invalid Username', message: null, auth_page: true, req: req, originalExpiryDate, user, form_data: null
            });
        }

        // Validate position
        if (!position) {
            return res.status(400).render('user/edit_profile', {
                title: "Refrut",
                metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
                error: 'Position is required', message: null, auth_page: true, req: req, originalExpiryDate, user, form_data: null
            });
        }

        // Validate sex
        if (!sex) {
            return res.status(400).render('user/edit_profile', {
                title: "Refrut",
                metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
                error: 'Sex is required', message: null, auth_page: true, req: req, originalExpiryDate, user, form_data: null
            });
        }

        // Update user
        user.user_name = user_name || user.user_name;
        user.position = position || user.position;
        user.sex = sex || user.sex;
        await user.save();

        res.render('user/edit_profile', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: null, message: 'Profile updated successfully', auth_page: true, req: req, originalExpiryDate, user, form_data: null
        });
    } catch (error) {
        logger.logError(error);
        res.render('user/edit_profile', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: 'Server Error', message: null, auth_page: true, req: req, originalExpiryDate: null, updatedExpiryDate: null, user: null, referrals: null, form_data: null
        });
    }
});

router.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/auth/login');
});

module.exports = router;
