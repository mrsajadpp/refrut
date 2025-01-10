const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const morgan = require("morgan");
const path = require('path');
const cookieSession = require('cookie-session');
const expressLayouts = require('express-ejs-layouts');
const fs = require("fs");

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, "access.log"),
    { flags: "a" }
);

// Define a custom token for coloring status code
morgan.token('status', (req, res) => {
    const status = res.statusCode;
    let color = status >= 500 ? 'red'    // server error
        : status >= 400 ? 'yellow' // client error
            : status >= 300 ? 'cyan'   // redirection
                : status >= 200 ? 'green'  // success
                    : 'reset';                 // default

    return colors[color](status);
});

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(
    morgan((tokens, req, res) => {
        return [
            colors.blue(tokens.method(req, res)),
            colors.magenta(tokens.url(req, res)),
            tokens.status(req, res),
            colors.cyan(tokens['response-time'](req, res) + ' ms'),
        ].join(' ');
    })
);
app.use(morgan("combined", { stream: accessLogStream }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'index_layout');

// Use cookie-session middleware
app.use(cookieSession({
    name: 'session',
    keys: ['hi@23', 'hello@23'],
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
}));

// Middleware to check if user is already logged in
function checkLoggedIn(req, res, next) {
    if (!req.session.user) {
        return next();
    }
    return res.redirect('/app/');
}

function checkAdminLoggedIn(req, res, next) {
    if (req.session.user) {
        if (req.session.user.admin) {
            return next();
        }
    }
    return res.redirect('/app/');
}

// Middleware to check if user is not logged in
function checkNotLoggedIn(req, res, next) {
    if (req.session.user) {
        return next();
    }
    return res.redirect('/auth/login');
}

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');

app.use('/', indexRouter);
app.use('/auth', checkLoggedIn, authRouter);
app.use('/app', checkNotLoggedIn, userRouter);
app.use('/admin', checkAdminLoggedIn, adminRouter);

app.use((req, res) => {
    res.status(404).render('notfound', {
        title: '404 - Page Not Found',
        metaDescription: 'The page you are looking for does not exist. Please check the URL and try again.',
        layout: 'index_layout', req: req,
        error: '404 - Page Not Found'
    });
});

// Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
