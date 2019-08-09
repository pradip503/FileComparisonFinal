const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser')
const path = require('path');
const upload = require('express-fileupload');

const session = require('express-session');
const flash = require('connect-flash');

//loading helpers
const {
    formatIndex,
    checkStatus,
    checkIfThereIsMessage
} = require('./helpers/handlebars-helpers');

//setting up default view engine
app.set('view engine', 'handlebars');
app.engine('handlebars', exphbs({
    defaultLayout: 'home',
    helpers: {
        formatIndex,
        checkStatus,
        checkIfThereIsMessage
    }
}));

//set public folder static path
app.use(express.static(path.join(__dirname, 'public')));

// upload
app.use(upload());

// set body parser
app.use(bodyParser.urlencoded({
    extended: true
}));

//express session and flash
app.use(session({
    secret: 'Heyuwaitmer',
    resave: false,
    saveUninitialized: true,
    maxAge: 24 * 60 * 60 * 1000,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000
    }
}));
app.use(flash());

//set local variable for success and failure flash message
app.use((req, res, next) => {
    res.locals.success_message = req.flash('success_message');
    res.locals.error_message = req.flash('error_message');
    res.locals.username = req.session.username;
    res.locals.teacher = req.session.teacher;
    res.locals.student = req.session.student;
    next();
});

// configuring routes
const home = require('./routes/home.js');
const teacher = require('./routes/teacher.js');
app.use('/', home);
app.use('/teacher', teacher);

//listening to the server
const port = process.env.port || 4500;
app.listen(port, (error) => {
    if (error) {
        console.log(error);
    };

    console.log(`Listening to ${port}`);
});

module.exports = app;