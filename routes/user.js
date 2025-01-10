const express = require('express');
const cookieSession = require('cookie-session');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const logger = require('../logger');
const User = require('../models/user');
const { default: mongoose } = require('mongoose');
const moment = require('moment');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/pfp');
    },
    filename: function (req, file, cb) {
        cb(null, `${req.session.user._id}.jpg`);
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
        let user = await User.findOne({ _id: new mongoose.Types.ObjectId(req.session.user._id) });
        let referrals = await User.find({
            reffer_user: user._id,
            status: true,
            email_verified: true,
            accountExpiryDate: { $gt: new Date() } // Check if account is not expired
        });

        let reffer_user = await User.findOne({ _id: new mongoose.Types.ObjectId(user.reffer_user) }).lean();

        const originalExpiryDate = await user.admin ? "9999+": formatDateToDDMMYYYY(user.accountExpiryDate);

        res.render('user/app', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: null, message: null, auth_page: true, req: req, originalExpiryDate, user, referrals, reffer_user, form_data: null
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

router.get('/badges', async (req, res) => { 
    try {
        let user = await User.findOne({ _id: new mongoose.Types.ObjectId(req.session.user._id) });
        let reffer_user = await User.findOne({ _id: new mongoose.Types.ObjectId(user.reffer_user) }).lean();

        const badge = await User.findById(user._id, 'badges').populate('badges.badge_id').exec();

        const originalExpiryDate = await user.admin ? "9999+": formatDateToDDMMYYYY(user.accountExpiryDate);

        res.render('user/badges', {
            title: "Refrut",
            metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
            error: null, message: null, auth_page: true, req: req, originalExpiryDate, badges: badge.badges, referrals: null, user, reffer_user, form_data: null
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

router.get('/profile/edit', async (req, res) => {
    try {
        let user = await User.findOne({ _id: new mongoose.Types.ObjectId(req.session.user._id) });
        const originalExpiryDate = await user.admin ? "9999+": formatDateToDDMMYYYY(user.accountExpiryDate);
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

router.post('/profile/update', upload.single('profile_picture'), async (req, res) => {
    const { user_name, position, sex, bio } = req.body;
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

        if (bio && bio.length > 150) {
            return res.status(400).render('user/edit_profile', {
                title: "Refrut",
                metaDescription: 'Welcome to Refrut, a dynamic community for startups, tech enthusiasts, and innovators. Discover resources, connect with like-minded professionals, and unlock new opportunities to grow.',
                error: 'Bio must be 150 characters or less', message: null, auth_page: true, req: req, originalExpiryDate, user, form_data: null
            });
        }

        // Update user
        user.user_name = user_name || user.user_name;
        user.position = position || user.position;
        user.sex = sex || user.sex;
        user.bio = bio ? bio : "Passionate about innovation, collaboration, and growth, I'm a proud member of the Refrut community.";

        if (req.file) {
            user.profile_url = `/pfp/${req.session.user._id}.jpg`;
        }

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

router.get('/:user_id/email/unsubscribe', async (req, res) => {
    try {
        if(req.params.user_id !== req.session.user._id) {
            res.status(500).render('verify-email', {
                title: 'Unsubscribe',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: "You don't have acces to do this.", message: null, auth_page: true, req: req, form_data: req.body
            });
        }
        let user = await User.findOne({ _id: new mongoose.Types.ObjectId(req.session.user._id) });
        user.email_subscribed = false;
        await user.save();
        res.status(500).render('verify-email', {
            title: 'Unsubscribe',
            metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
            error: null, message: "Unsubscribed from our email brodcast.", auth_page: true, req: req, form_data: req.body
        });
    } catch (error) {
        logger.logError(error);
        res.status(500).render('verify-email', {
            title: 'Unsubscribe',
            metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
            error: "Server Error", message: null, auth_page: true, req: req, form_data: req.body
        });
    }
});

router.get('/:user_id/email/subscribe', async (req, res) => {
    try {
        if(req.params.user_id !== req.session.user._id) {
            res.status(500).render('verify-email', {
                title: 'Subscribe',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: "You don't have acces to do this.", message: null, auth_page: true, req: req, form_data: req.body
            });
        }
        let user = await User.findOne({ _id: new mongoose.Types.ObjectId(req.session.user._id) });
        user.email_subscribed = true;
        await user.save();
        res.status(500).render('verify-email', {
            title: 'Subscribe',
            metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
            error: null, message: "Subscribed from our email brodcast.", auth_page: true, req: req, form_data: req.body
        });
    } catch (error) {
        logger.logError(error);
        res.status(500).render('verify-email', {
            title: 'Subscribe',
            metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
            error: "Server Error", message: null, auth_page: true, req: req, form_data: req.body
        });
    }
});

router.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/auth/login');
});

module.exports = router;
