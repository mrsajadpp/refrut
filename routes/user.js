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

router.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/auth/login');
});

module.exports = router;
