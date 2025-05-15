const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts); // enable layout middleware

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

app.post('/submit', (req, res) => {
  console.log(req.body);
  res.send('Form submitted!');
});

app.listen(4000, () => {
  console.log('Server is running on port 4000');
});
