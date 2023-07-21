const express = require('express');
const app = express();
const port = 3000;

// Additional Imports
const bodyParser = require('body-parser');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();

app.use(express.json());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));

// Databases

const u_db = new sqlite3.Database('./src/static/db/users.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the users database.');
});

const f_db = new sqlite3.Database('./src/static/db/files.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the files database.');
});


// Functions

function requireLogin(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

let default_get = (req, res, next) => {

    if (req.path == "/login") {
        return next();
    }

    if (req.session && req.session.user) {
        // pass
    } else {
        f_db.get("SELECT path FROM files_login WHERE path = ?", [req.path], (err, data) => {
            if (err) {
                console.error(err);
            }
            if (data) {
                res.sendFile(__dirname + req.path);
            } else {
                res.redirect('/login');
            }
        });
        return;
    }
    if (req.path.includes('.') || req.method != "GET") {
        return next();
    }
    f_db.get("SELECT admin_req FROM files WHERE path = ?", [req.path], (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send("Internal Server Error");
            return next();
        }
        if (!data) {
            console.info(req.path + ": file not found.");
        }
        if (data.admin_req == 1) {
            // Admin Required
        }
        res.sendFile(__dirname + req.path);

        return;
    });
}

app.use(default_get);

// Routes

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

module.exports = server;