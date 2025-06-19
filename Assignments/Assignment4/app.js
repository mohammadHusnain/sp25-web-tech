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

// Product Schema
const productSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    image: String
});
const Product = mongoose.model('Product', productSchema);

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
    // If coming from checkout, add a message
    const from = req.originalUrl;
    if (from === '/checkout') {
        return res.redirect('/login?error=Please log in to continue to checkout');
    }
    res.redirect('/login?error=Please log in to continue');
}

// Seed global products if none exist
async function seedProducts() {
    const count = await Product.countDocuments();
    if (count === 0) {
        await Product.insertMany([
            {
                title: 'Urban Tech Jacket',
                description: 'Water-resistant, lightweight, and perfect for city life.',
                price: 120,
                image: '/assets/cloth1.jpg'
            },
            {
                title: 'Minimalist Hoodie',
                description: 'Soft cotton hoodie with a modern fit.',
                price: 80,
                image: '/assets/cloth2.jpg'
            },
            {
                title: 'Streetwear Cargo Pants',
                description: 'Functional cargo pants with a contemporary look.',
                price: 95,
                image: '/assets/cloth3.jpg'
            },
            {
                title: 'Signature Logo Tee',
                description: 'Classic t-shirt with A-COLD-WALL* logo.',
                price: 45,
                image: '/assets/cloth4.jpg'
            }
        ]);
        console.log('Seeded global products.');
    }
}
seedProducts();

// Middleware to initialize cart in session
app.use((req, res, next) => {
    if (!req.session.cart) req.session.cart = [];
    next();
});

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
    res.render('login', { error: req.query.error });
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
app.get('/products', async (req, res) => {
    const products = await Product.find();
    res.render('products', { products });
});

// GET: About Page
app.get('/about', (req, res) => {
    res.render('about');
});

// Add to Cart
app.post('/cart/add/:id', async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.redirect('/products?error=Product not found');
    const cart = req.session.cart;
    const existing = cart.find(item => item.productId === product._id.toString());
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            productId: product._id.toString(),
            title: product.title,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    res.redirect('/cart?success=Product added to cart');
});

// View Cart
app.get('/cart', (req, res) => {
    const cart = req.session.cart;
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.render('cart', { cart, total, success: req.query.success, error: req.query.error });
});

// Update Cart Item Quantity
app.post('/cart/update/:id', (req, res) => {
    const { quantity } = req.body;
    const cart = req.session.cart;
    const item = cart.find(i => i.productId === req.params.id);
    if (item) {
        item.quantity = Math.max(1, parseInt(quantity));
    }
    res.redirect('/cart');
});

// Remove Cart Item
app.post('/cart/remove/:id', (req, res) => {
    req.session.cart = req.session.cart.filter(i => i.productId !== req.params.id);
    res.redirect('/cart');
});

// Checkout Page
app.get('/checkout', isAuthenticated, (req, res) => {
    const cart = req.session.cart;
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.render('checkout', { cart, total, success: req.query.success, error: req.query.error });
});

// Place Order (Pay Later)
app.post('/checkout', isAuthenticated, async (req, res) => {
    const { name, phone, address } = req.body;
    const cart = req.session.cart;
    if (!cart || cart.length === 0) {
        return res.redirect('/cart?error=Your cart is empty');
    }
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    await Order.create({
        userEmail: req.session.user.email,
        items: cart.map(i => `${i.title} x${i.quantity}`),
        total,
        name,
        phone,
        address,
        status: 'Pending',
        createdAt: new Date()
    });
    req.session.cart = [];
    res.redirect('/cart?success=Order placed successfully!');
});

app.listen(4000, () => {
    console.log('Server is running on port 4000');
});
