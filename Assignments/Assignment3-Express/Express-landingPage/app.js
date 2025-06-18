const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const app = express();

// Temporary in-memory user storage
const users = [];


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts); // enable layout middleware
require('ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Optional: specify default layout
app.set('layout', 'layout'); // uses views/layout.ejs as the base

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
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  const userExists = users.find(user => user.email === email);
  if (userExists) {
    return res.send('<h3>User already registered. Try logging in.</h3>');
  }

  users.push({ name, email, password });
  res.send(`<h3>Registration successful! <a href="/login">Login here</a>.</h3>`);
});

// GET: Login Form
app.get('/login', (req, res) => {
  res.render('login');
});

// POST: Handle Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.send('<h3>Invalid email or password. Please try again.</h3>');
  }

  res.render('index')
});

app.post('/submit', (req, res) => {
  console.log(req.body);
  res.send('Form submitted!');
});

app.listen(4000, () => {
  console.log('Server is running on port 4000');
});
