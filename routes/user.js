const express = require('express');
const cookieSession = require('cookie-session');
const router = express.Router();
const logger = require('../logger');
const User = require('../models/user');
const { default: mongoose } = require('mongoose');
const moment = require('moment');

router.get('/', (req, res) => {
    const originalExpiryDate = moment(req.session.user.accountExpiryDate).format('DD/MM/YYYY');
    const updatedExpiryDate = moment(req.session.user.accountExpiryDate).add(1, 'month').format('DD/MM/YYYY');

    const html = `
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitation Page</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background-color: #f4f4f4;
                }
                .container {
                    text-align: center;
                    padding: 20px;
                    background-color: white;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                    max-width: 600px;
                    width: 100%;
                }
                h3 {
                    color: #333;
                }
                p {
                    font-size: 16px;
                    color: #666;
                }
                a {
                    color: #0078e8;
                    text-decoration: none;
                    font-weight: bold;
                }
                button {
                    padding: 10px 20px;
                    background-color: #0078e8;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                }
                button:hover {
                    background-color: #005bb5;
                }
                @media (max-width: 600px) {
                    .container {
                        padding: 10px;
                    }
                    p {
                        font-size: 14px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h3>This section under construction</h3><br>
                <p>Use this link to invite community members: 
                    <a href="https://refrut.grovixlab.com/auth/signup?reff_code=${req.session.user.reff_code}" id="inviteLink">Invite Link</a>
                </p><br>
                <button id="copyButton">Copy Invite Link</button><br><br>
                <p>Your account expiry date is: ${originalExpiryDate}</p>
                <p>By sharing this invitation, your expiry date has been increased by one month! New expiry date: ${updatedExpiryDate}</p>
            </div>

            <script>
                const copyButton = document.getElementById('copyButton');
                const inviteLink = document.getElementById('inviteLink');

                copyButton.addEventListener('click', () => {
                    const link = inviteLink.href;
                    navigator.clipboard.writeText(link).then(() => {
                        alert('Invite link copied to clipboard!');
                    }, (err) => {
                        alert('Failed to copy the invite link');
                    });
                });
            </script>
        </body>
    </html>
    `;

    res.send(html);
});


router.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/auth/login');
});

module.exports = router;
