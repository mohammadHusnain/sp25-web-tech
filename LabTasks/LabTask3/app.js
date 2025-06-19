require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const User = require('./models/User');
const Order = require('./models/Order');
const { ensureAuthenticated } = require('./middleware/auth');
const bcrypt = require('bcrypt');

const app = express();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'labtask3secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 },
  })
);

// Home page
app.get('/', (req, res) => {
  res.render('index', { user: req.session.userId });
});

// Register
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.send('<h3>User already exists. <a href="/login">Login here</a>.</h3>');
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();
    res.send('<h3>Registration successful! <a href="/login">Login here</a>.</h3>');
  } catch (err) {
    res.send('Error registering user.');
  }
});

// Login
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.send('<h3>Invalid email or password.</h3>');
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('<h3>Invalid email or password.</h3>');
    req.session.userId = user._id;
    req.session.userEmail = user.email;
    res.redirect('/');
  } catch (err) {
    res.send('Error logging in.');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Protected Orders Route
app.get('/my-orders', ensureAuthenticated, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.userId });
    res.render('orders', { orders });
  } catch (err) {
    res.send('Error fetching orders.');
  }
});

app.listen(4000, () => {
  console.log('LabTask3 app running on http://localhost:4000');
}); 