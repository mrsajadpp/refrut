const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const moment = require('moment');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cron = require('node-cron');

const userSchema = new mongoose.Schema({
    user_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    dob: {
        type: Date,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    profile_url: {
        type: String,
        required: true
    },
    sex: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    status: {
        type: Boolean,
        default: true,
        required: true
    },
    email_verified: {
        type: Boolean,
        default: false,
        required: true
    },
    verificationCode: {
        type: String
    },
    verificationCodeCreatedAt: {
        type: Date
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    }
});

userSchema.pre('save', async function (next) {
    if (this.isModified('password') || this.isNew) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Method to set status to false if email_verified is false after 24 hours
userSchema.methods.checkEmailVerification = function () {
    const user = this;
    if (!user.email_verified) {
        const createdAt = user._id.getTimestamp();
        const currentTime = new Date();
        const timeDifference = currentTime - createdAt;
        const hoursDifference = timeDifference / (1000 * 60 * 60);

        if (hoursDifference > 24) {
            user.status = false;
            user.save();
        }
    }
};

// Method to send verification email
userSchema.methods.sendVerificationEmail = async function () {
    const user = this;
    user.verificationCode = crypto.randomBytes(20).toString('hex');
    user.verificationCodeCreatedAt = new Date();
    await user.save();

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'noreply.bowldot@gmail.com',
            pass: process.env.APP_PASS
        }
    });

    const verificationUrl = `https://bowl.grovixlab.com/auth/verify-email?userId=${user._id}&verificationCode=${user.verificationCode}`;

    const mailOptions = {
        from: 'Refrut. <noreply.bowldot@gmail.com>',
        to: user.email,
        subject: 'Email Verification',
        text: `Please verify your email by clicking the following link: ${verificationUrl}`,
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification - Refrut</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px; }
        .content { font-size: 16px; color: #333333; line-height: 1.6; text-align: left; }
        .content p { margin: 10px 0; }
        .footer { text-align: center; font-size: 12px; color: #888888; padding: 20px; }
        .footer img { margin-top: 10px; height: 30px; }
        .cta-btn {
            background-color: #000;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 3px;
            display: inline-block;
        }
            .cta-btn a {
            text-decoration: none;
            coor: #fff;
            }
        .note {
            font-size: 14px;
            color: #777777;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <table class="container" align="center">
        <tr>
            <td class="content">
                <p>Dear <strong>${user.user_name}</strong>,</p>
                <p>Thank you for registering with Refrut! To complete your registration, we need you to verify your email address.</p>
                <p>Please click the link below to verify your email:</p>
                <p><a href="${verificationUrl}" class="cta-btn">Verify Email</a></p>
                <p class="note">If the button above does not work, please copy and paste the following URL into your browser:</p>
                <p class="note"><a href="${verificationUrl}" style="color: #0078e8;">${verificationUrl}</a></p>
                <p>If you did not register with us, please ignore this email.</p>
                <p>Thank you for choosing Refrut!</p>
                <p>Warm regards,<br>The Refrut Team</p>
            </td>
        </tr>
        <tr>
            <td class="footer">
                <img src="https://bowl.grovixlab.com/logo/refrut-text-logo.png" alt="Refrut Logo">
                <p>© Refrut. by Grovix Lab. All rights reserved.</p>
            </td>
        </tr>
    </table>
</body>
</html>
`
    };

    await transporter.sendMail(mailOptions);
};

// Method to send password reset email
userSchema.methods.sendResetEmail = async function (resetToken) {
    const user = this;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'noreply.bowldot@gmail.com',
            pass: process.env.APP_PASS
        }
    });

    const resetUrl = `https://bowl.grovixlab.com/auth/reset-password/${resetToken}`;

    const mailOptions = {
        from: 'Refrut. <noreply.bowldot@gmail.com>',
        to: user.email,
        subject: 'Password Reset',
        text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}. This link will expire in 6 minutes.`,
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Refrut</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px; }
        .content { font-size: 16px; color: #333333; line-height: 1.6; text-align: left; }
        .content p { margin: 10px 0; }
        .footer { text-align: center; font-size: 12px; color: #888888; padding: 20px; }
        .footer img { margin-top: 10px; height: 30px; }
        .cta-btn {
            background-color: #000;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 3px;
            display: inline-block;
        }
            .cta-btn a {
            text-decoration: none;
            coor: #fff;
            }
            .note {
            font-size: 14px;
            color: #777777;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <table class="container" align="center">
        <tr>
            <td class="content">
                <p>Dear <strong>${user.user_name}</strong>,</p>
                <p>We received a request to reset the password for your account at Refrut.</p>
                <p>Please click the link below to reset your password:</p>
                <p><a href="${resetUrl}" class="cta-btn">Reset Password</a></p>
                <p class="note">If the button above does not work, please copy and paste the following URL into your browser:</p>
                <p class="note"><a href="${resetUrl}" style="color: #0078e8;">${resetUrl}</a></p>
                <p>This link will expire in 6 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
                <p>Thank you for being a valued member of Refrut!</p>
                <p>Warm regards,<br>The Refrut Team</p>
            </td>
        </tr>
        <tr>
            <td class="footer">
                <img src="https://bowl.grovixlab.com/logo/refrut-text-logo.png" alt="Refrut Logo">
                <p>© Refrut. by Grovix Lab. All rights reserved.</p>
            </td>
        </tr>
    </table>
</body>
</html>
`
    };

    await transporter.sendMail(mailOptions);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
