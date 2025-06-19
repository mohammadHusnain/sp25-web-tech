const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const session = require('express-session');

const app = express();

// Temporary in-memory user storage
const users = [];

// MongoDB connection (local)
mongoose.connect('mongodb://127.0.0.1:27017/labtask3db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'));

// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String
});
const User = mongoose.model('User', userSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
    userEmail: String,
    items: [String],
    createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts); // enable layout middleware
require('ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Optional: specify default layout
app.set('layout', 'layout'); // uses views/layout.ejs as the base

app.use(session({
    secret: 'labtask3secret',
    resave: false,
    saveUninitialized: false
}));

// Middleware to protect routes
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
}

app.get('/', (req, res) => {
    res.render('index'); // will use layout.ejs automatically
});

app.get('/form', (req, res) => {
    res.render('formValidation'); // will also use layout
});

// GET: Register Form
app.get('/register', (req, res) => {
    res.render('register');
});

// POST: Handle Registration
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.send('<h3>User already registered. Try logging in.</h3>');
        }
        await User.create({ name, email, password });
        res.send(`<h3>Registration successful! <a href="/login">Login here</a>.</h3>`);
    } catch (err) {
        res.send('<h3>Error registering user.</h3>');
    }
});

// GET: Login Form
app.get('/login', (req, res) => {
    res.render('login');
});

// POST: Handle Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) {
        return res.send('<h3>Invalid email or password. Please try again.</h3>');
    }
    req.session.user = { email: user.email, name: user.name };
    res.redirect('/profile');
});

// GET: Profile Page
app.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile', { user: req.session.user });
});

// GET: Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Protected Orders Route
app.get('/my-orders', isAuthenticated, async (req, res) => {
    const userEmail = req.session.user.email;
    const orders = await Order.find({ userEmail });
    res.render('my-orders', { orders });
});

app.post('/submit', (req, res) => {
    console.log(req.body);
    res.send('Form submitted!');
});

// GET: Products Page
app.get('/products', isAuthenticated, (req, res) => {
    res.render('products');
});

// GET: About Page
app.get('/about', isAuthenticated, (req, res) => {
    res.render('about');
});

app.listen(4000, () => {
    console.log('Server is running on port 4000');
});
