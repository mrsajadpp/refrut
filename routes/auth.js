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

async function generateUniqueRefCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let refCode;
    let isUnique = false;

    while (!isUnique) {
        refCode = '';
        for (let i = 0; i < 6; i++) {
            refCode += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        const existingUser = await User.findOne({ reff_code: refCode });
        if (!existingUser) {
            isUnique = true;
        }
    }

    return refCode;
}

// GET route for signup page
router.get('/signup', (req, res) => {
    try {
        res.render('signup', {
            title: 'Signup',
            metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
            error: null, message: null, auth_page: true, req: req, form_data: req.query, ogImage: 'signup.webp'
        });
    } catch (err) {
        console.error(err);
        logger.logError(err);
    }
});

// GET route for login page
router.get('/login', (req, res) => {
    try {
        res.render('login', {
            title: 'Login',
            metaDescription: 'Log in to Refrut to connect with a thriving community of startups and tech enthusiasts. Access exclusive resources, collaborate, and grow your network.',
            error: null, message: null, auth_page: true, req: req, form_data: null, ogImage: 'login.webp'
        });
    } catch (err) {
        console.error(err);
        logger.logError(err);
    }
});

// Signup route
router.post('/signup', async (req, res) => {
    let { user_name, email, dob, password, position, sex, reff_code } = req.body;
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
        if (!user_name) {
            return res.status(400).render('signup', {
                title: 'Signup',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'Invalid Username', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'signup.webp'
            });
        }

        if (user_name.length < 3) {
            return res.status(400).render('signup', {
                title: 'Signup',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'Invalid Username', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'signup.webp'
            });
        }

        // Validate email
        if (!email) {
            return res.status(400).render('signup', {
                title: 'Signup',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'Invalid Email', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'signup.webp'
            });
        }

        email = email.toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).render('signup', {
                title: 'Signup',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'Invalid Email', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'signup.webp'
            });
        }

        // Validate dob
        if (!dob) {
            return res.status(400).render('signup', {
                title: 'Signup',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'Invalid Date of Birth', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'signup.webp'
            });
        }

        if (new Date(dob) > new Date()) {
            return res.status(400).render('signup', {
                title: 'Signup',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'Invalid Date of Birth', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'signup.webp'
            });
        }

        // Validate reff code
        if (!reff_code) {
            return res.status(400).render('signup', {
                title: 'Signup',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'Refferal Code is Required', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'signup.webp'
            });
        }

        // Validate password
        if (!password) {
            return res.status(400).render('signup', {
                title: 'Signup',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'Password must be at least 6 characters long and contain alphabets, numbers, and special symbols', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'signup.webp'
            });
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).render('signup', {
                title: 'Signup',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'Password must be at least 6 characters long and contain alphabets, numbers, and special symbols', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'signup.webp'
            });
        }

        // Validate position
        if (!position) {
            return res.status(400).render('signup', {
                title: 'Signup',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'Position is Required', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'signup.webp'
            });
        }

        // Validate sex
        if (!sex) {
            return res.status(400).render('signup', {
                title: 'Signup',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'Sex is Required', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'signup.webp'
            });
        }

        if (!isPastDate(dob)) {
            return res.status(400).render('signup', {
                title: 'Signup',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'Date of birth cannot be in the future', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'signup.webp'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).render('signup', {
                title: 'Signup',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'User already exists', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'signup.webp'
            });
        }

        let reffer_user = await User.findOne({ reff_code: reff_code });

        if (!reffer_user) {
            return res.status(400).render('signup', {
                title: 'Signup',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'Refferal Code is Invalid', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'signup.webp'
            });
        }

        // Create new user
        const newUser = new User({ user_name, email, dob: await convertToISO(dob), reff_code: await generateUniqueRefCode(), reffer_user: reffer_user._id, password, position, profile_url, sex });
        await newUser.save();

        await newUser.sendVerificationEmail();

        res.status(500).render('verify-email', {
            title: 'Signup',
            metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
            error: null, message: "A email verification send, please check your spam folder or inbox.", auth_page: true, req: req, form_data: req.body
        });
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('signup', {
            title: 'Signup',
            metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
            error: 'Server Error', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'signup.webp'
        });
    }
});

// Login route
router.post('/login', async (req, res) => {
    let { email, password } = req.body;
    try {
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).render('login', {
                title: 'Login',
                metaDescription: 'Log in to Refrut to connect with a thriving community of startups and tech enthusiasts. Access exclusive resources, collaborate, and grow your network.',
                error: 'Invalid Email', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'login.webp'
            });
        }

        email = email.toLowerCase();

        // Validate password
        if (!password) {
            return res.status(400).render('login', {
                title: 'Login',
                metaDescription: 'Log in to Refrut to connect with a thriving community of startups and tech enthusiasts. Access exclusive resources, collaborate, and grow your network.',
                error: 'Password is Required', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'login.webp'
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).render('login', {
                title: 'Login',
                metaDescription: 'Log in to Refrut to connect with a thriving community of startups and tech enthusiasts. Access exclusive resources, collaborate, and grow your network.',
                error: 'User does not exist', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'login.webp'
            });
        }

        // Check if account is expired
        if (user.accountExpiryDate && user.accountExpiryDate < new Date()) {
            return res.status(400).render('login', {
                title: 'Login',
                metaDescription: 'Log in to Refrut to connect with a thriving community of startups and tech enthusiasts. Access exclusive resources, collaborate, and grow your network.',
                error: 'Account has expired', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'login.webp'
            });
        }

        if (!user.status) {
            return res.status(400).render('login', {
                title: 'Login',
                metaDescription: 'Log in to Refrut to connect with a thriving community of startups and tech enthusiasts. Access exclusive resources, collaborate, and grow your network.',
                error: 'User was banned', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'login.webp'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).render('login', {
                title: 'Login',
                metaDescription: 'Log in to Refrut to connect with a thriving community of startups and tech enthusiasts. Access exclusive resources, collaborate, and grow your network.',
                error: 'Invalid Passsword', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'login.webp'
            });
        }

        if (!user.email_verified) {
            await user.sendVerificationEmail();
            return res.status(400).render('login', {
                title: 'Login',
                metaDescription: 'Log in to Refrut to connect with a thriving community of startups and tech enthusiasts. Access exclusive resources, collaborate, and grow your network.',
                error: 'Email not verified. A verification email has been sent.', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'login.webp'
            });
        }

        // Remove password from user object before adding to session
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        // Save user to session
        req.session.user = userWithoutPassword;
        res.redirect('/app/');
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('login', {
            title: 'Login',
            metaDescription: 'Log in to Refrut to connect with a thriving community of startups and tech enthusiasts. Access exclusive resources, collaborate, and grow your network.',
            error: 'Server Error', message: null, auth_page: true, req: req, form_data: req.body, ogImage: 'login.webp'
        });
    }
});

// Route to handle email verification
router.get('/verify-email', async (req, res) => {
    try {
        const { userId, verificationCode } = req.query;
        const user = await User.findById(userId);

        if (!user || user.verificationCode !== verificationCode) {
            return res.status(400).render('verify-email', {
                title: 'Email Verification',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'Invalid verification link', message: null, auth_page: true, req: req, form_data: req.body
            });
        }

        const currentTime = new Date();
        const timeDifference = currentTime - user.verificationCodeCreatedAt;
        const hoursDifference = timeDifference / (1000 * 60 * 60);

        if (hoursDifference > 24) {
            return res.status(400).render('verify-email', {
                title: 'Email Verification',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'Verification link expired', message: null, auth_page: true, req: req, form_data: req.body
            });
        }

        user.email_verified = true;
        user.status = true;
        user.verificationCode = undefined; // Clear the verification code
        user.verificationCodeCreatedAt = undefined; // Clear the verification code creation time
        await user.save();

        let reffer_user = await User.findOne({ _id: user.reffer_user });
        reffer_user.extendExpiryDateByOneMonth();

        logger.logInvite(reffer_user.user_name, user.user_name);  // Log the invite

        reffer_user.notifyRefferer(user.user_name);  // Notify the refferer

        await user.sendVerificationSuccessEmail();  // Send verification success email

        res.status(500).render('verify-email', {
            title: 'Signup',
            metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
            error: null, message: "Email address verified successfully.", auth_page: true, req: req, form_data: req.body
        });
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('verify-email', {
            title: 'Email Verification',
            metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
            error: 'Server Error', message: null, auth_page: true, req: req, form_data: req.body
        });
    }
});

// GET route for password reset request page
router.get('/reset-password', (req, res) => {
    res.render('reset_password_request', {
        title: 'Reset Password',
        metaDescription: 'Forgot your password? Reset it quickly on Refrut and regain access to your account to connect, collaborate, and grow within our startup and tech community.',
        error: null, message: null, auth_page: true, req: req, form_data: req.body
    });
});

// POST route to handle password reset request
router.post('/reset-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).render('reset_password_request', {
                title: 'Reset Password',
                metaDescription: 'Forgot your password? Reset it quickly on Refrut and regain access to your account to connect, collaborate, and grow within our startup and tech community.',
                error: 'User does not exist', message: null, auth_page: true, req: req, form_data: req.body
            });
        }

        // Generate a reset token and expiration time
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = Date.now() + 6 * 60 * 1000; // 6 minutes

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpires;
        await user.save();

        // Send reset email (implement sendResetEmail method in User model)
        await user.sendResetEmail(resetToken);

        res.render('reset_password_request', {
            title: 'Reset Password',
            metaDescription: 'Forgot your password? Reset it quickly on Refrut and regain access to your account to connect, collaborate, and grow within our startup and tech community.',
            error: null, message: 'Password reset link has been sent to your email.', auth_page: true, req: req, form_data: req.body
        });
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('reset_password_request', {
            title: 'Reset Password',
            metaDescription: 'Forgot your password? Reset it quickly on Refrut and regain access to your account to connect, collaborate, and grow within our startup and tech community.',
            error: 'Server Error', message: null, auth_page: true, req: req, form_data: req.body
        });
    }
});

// GET route for password reset form
router.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).render('reset_password_form', {
                title: 'Reset Password',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'Invalid or expired token', token, message: null, auth_page: true, req: req, form_data: req.body
            });
        }

        res.render('reset_password_form', {
            title: 'Reset Password',
            metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
            error: null, token, message: null, auth_page: true, req: req, form_data: req.body
        });
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('reset_password_form', {
            title: 'Reset Password',
            metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
            error: 'Server Error', token, message: null, auth_page: true, req: req, form_data: req.body
        });
    }
});

// POST route to handle password reset form submission
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    try {
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).render('reset_password_form', {
                title: 'Reset Password',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'Invalid or expired token', token, message: null, auth_page: true, req: req, form_data: req.body
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).render('reset_password_form', {
                title: 'Reset Password',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'Passwords do not match', token, message: null, auth_page: true, req: req, form_data: req.body
            });
        }

        // Validate password
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
        if (!password || !passwordRegex.test(password)) {
            return res.status(400).render('reset_password_form', {
                title: 'Reset Password',
                metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
                error: 'Password must be at least 6 characters long and contain alphabets, numbers, and special symbols', token, message: null, auth_page: true, req: req, form_data: req.body
            });
        }

        // Hash the new password and save it
        user.password = await password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(500).render('verify-email', {
            title: 'Signup',
            metaDescription: 'Sign up for Refrut and join a vibrant community of startups and tech innovators. Unlock opportunities to collaborate, learn, and expand your professional network.',
            error: null, message: "Password reset succesfull.", auth_page: true, req: req, form_data: req.body
        });
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('reset_password_form', { title: 'Reset Password', error: 'Server error', token, message: null, auth_page: true });
    }
});

module.exports = router;
