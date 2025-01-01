const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/user');
const logger = require('../logger');
const router = express.Router();


function isPastDate(dateString) {
    // Parse the input date string
    const [day, month, year] = dateString.split('/').map(Number);
    const inputDate = new Date(year, month - 1, day); // JavaScript months are 0-based

    // Get the current date without the time part
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set time to 00:00:00 to ignore time

    // Compare the dates
    return inputDate < currentDate;
}

function convertToISO(dateString) {
    const [day, month, year] = dateString.split('/');  // Split the string into day, month, and year
    // Construct the ISO string with 00:00:00.000Z time
    const isoDateString = `${year}-${month}-${day}T00:00:00.000Z`;
    return isoDateString;  // Return the ISO formatted string
}

// GET route for signup page
router.get('/signup', (req, res) => {
    try {
        res.render('signup', { title: 'Signup', error: null, form_data: {}, message: null, auth_page: true });
    } catch (err) {
        console.error(err);
        logger.logError(err);
    }
});

// GET route for login page
router.get('/login', (req, res) => {
    try {
        res.render('login', { title: 'Login', error: null, form_data: {}, message: null, auth_page: true });
    } catch (err) {
        console.error(err);
        logger.logError(err);
    }
});

// Signup route
router.post('/signup', async (req, res) => {
    const { user_name, email, dob, password, position, sex } = req.body;
    const profileUrls = [
        '/pfp/profile1.jpg',
        '/pfp/profile2.jpg',
        '/pfp/profile3.jpg',
        '/pfp/profile4.jpg',
        '/pfp/profile5.jpg',
        '/pfp/profile6.jpg',
        '/pfp/profile7.jpg',
        '/pfp/profile8.jpg',
        '/pfp/profile9.jpg',
    ];
    const profile_url = profileUrls[Math.floor(Math.random() * profileUrls.length)];

    try {
        // Validate user_name
        if (!user_name || user_name.length < 3) {
            return res.status(400).render('signup', { title: 'Signup', error: 'Invalid username', form_data: req.body, message: null, auth_page: true });
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).render('signup', { title: 'Signup', error: 'Invalid email', form_data: req.body, message: null, auth_page: true });
        }

        // Validate dob
        if (!dob || new Date(dob) > new Date()) {
            return res.status(400).render('signup', { title: 'Signup', error: 'Invalid date of birth', form_data: req.body, message: null, auth_page: true });
        }

        // Validate password
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
        if (!password || !passwordRegex.test(password)) {
            return res.status(400).render('signup', { title: 'Signup', error: 'Password must be at least 6 characters long and contain alphabets, numbers, and special symbols', form_data: req.body, message: null, auth_page: true });
        }

        // Validate position
        if (!position) {
            return res.status(400).render('signup', { title: 'Signup', error: 'Position is required', form_data: req.body, message: null, auth_page: true });
        }

        // Validate sex
        if (!sex) {
            return res.status(400).render('signup', { title: 'Signup', error: 'Sex is required', form_data: req.body, message: null, auth_page: true });
        }

        if (!isPastDate(dob)) {
            return res.status(400).render('signup', { title: 'Signup', error: 'Date of birth cannot be in the future', form_data: req.body, message: null, auth_page: true });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).render('signup', { title: 'Signup', error: 'User already exists', form_data: req.body, message: null, auth_page: true });
        }

        // Create new user
        const newUser = new User({ user_name, email, dob: convertToISO(dob), password, position, profile_url, sex });
        await newUser.save();

        // Remove password from user object before adding to session
        const userWithoutPassword = newUser.toObject();
        delete userWithoutPassword.password;

        await newUser.sendVerificationEmail();

        // Save user to session
        req.session.user = userWithoutPassword;
        res.redirect('/app/home');
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('signup', { title: 'Signup', error: 'Server error', form_data: req.body, message: null, auth_page: true });
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).render('login', { title: 'Login', error: 'Invalid email', form_data: req.body, message: null, auth_page: true });
        }

        // Validate password
        if (!password) {
            return res.status(400).render('login', { title: 'Login', error: 'Password is required', form_data: req.body, message: null, auth_page: true });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).render('login', { title: 'Login', error: 'User does not exist', form_data: req.body, message: null, auth_page: true });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).render('login', { title: 'Login', error: 'Invalid credentials', form_data: req.body, message: null, auth_page: true });
        }

        if (!user.email_verified) {
            await user.sendVerificationEmail();
            return res.status(400).render('login', { title: 'Login', error: 'Email not verified. A verification email has been sent.', form_data: req.body, message: null, auth_page: true });
        }

        // Remove password from user object before adding to session
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        // Save user to session
        req.session.user = userWithoutPassword;
        res.redirect('/app/home');
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('login', { title: 'Login', error: 'Server error', form_data: req.body, message: null, auth_page: true });
    }
});

// Route to handle email verification
router.get('/verify-email', async (req, res) => {
    try {
        const { userId, verificationCode } = req.query;
        const user = await User.findById(userId);

        if (!user || user.verificationCode !== verificationCode) {
            return res.status(400).render('verify-email', { title: 'Email Verification', error: 'Invalid verification link', message: null, auth_page: true });
        }

        const currentTime = new Date();
        const timeDifference = currentTime - user.verificationCodeCreatedAt;
        const hoursDifference = timeDifference / (1000 * 60 * 60);

        if (hoursDifference > 24) {
            return res.status(400).render('verify-email', { title: 'Email Verification', error: 'Verification link expired', message: null, auth_page: true });
        }

        user.email_verified = true;
        user.status = true;
        user.verificationCode = undefined; // Clear the verification code
        user.verificationCodeCreatedAt = undefined; // Clear the verification code creation time
        await user.save();

        res.render('verify-email', { title: 'Email Verification', message: 'Email verified successfully. You can now log in.', error: null, auth_page: true });
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('verify-email', { title: 'Email Verification', error: 'Server error', message: null, auth_page: true });
    }
});

// GET route for password reset request page
router.get('/reset-password', (req, res) => {
    res.render('reset_password_request', { title: 'Reset Password', error: null, message: null, auth_page: true });
});

// POST route to handle password reset request
router.post('/reset-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).render('reset_password_request', { title: 'Reset Password', error: 'User does not exist', message: null, auth_page: true });
        }

        // Generate a reset token and expiration time
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = Date.now() + 6 * 60 * 1000; // 6 minutes

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpires;
        await user.save();

        // Send reset email (implement sendResetEmail method in User model)
        await user.sendResetEmail(resetToken);

        res.render('reset_password_request', { title: 'Reset Password', message: 'Password reset link has been sent to your email.', error: null, auth_page: true });
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('reset_password_request', { title: 'Reset Password', error: 'Server error', message: null, auth_page: true });
    } 
});

// GET route for password reset form
router.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).render('reset_password_form', { title: 'Reset Password', error: 'Invalid or expired token', token, message: null, auth_page: true });
        }

        res.render('reset_password_form', { title: 'Reset Password', error: null, token, message: null, auth_page: true });
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('reset_password_form', { title: 'Reset Password', error: 'Server error', token, message: null, auth_page: true });
    }
});

// POST route to handle password reset form submission
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    try {
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).render('reset_password_form', { title: 'Reset Password', error: 'Invalid or expired token', token, message: null, auth_page: true });
        }

        if (password !== confirmPassword) {
            return res.status(400).render('reset_password_form', { title: 'Reset Password', error: 'Passwords do not match', token, message: null, auth_page: true });
        }

        // Validate password
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
        if (!password || !passwordRegex.test(password)) {
            return res.status(400).render('reset_password_form', { title: 'Reset Password', error: 'Password must be at least 6 characters long and contain alphabets, numbers, and special symbols', token, message: null, auth_page: true });
        }

        // Hash the new password and save it
        user.password = await password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('reset_password_form', { title: 'Reset Password', error: 'Server error', token, message: null, auth_page: true });
    }
});

module.exports = router;
