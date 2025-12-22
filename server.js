const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Book = require('./models/Book');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'zzLKyuovSbdr3+ay79eNoRhQIf2fzczP5yPdx5ll5iPK3/J3EZxotmNO0LacF7O2DTCd9nvOx+wg/h0NiNn18Q==';

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://appdev-final-project-ten.vercel.app/', /\.vercel\.app$/],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cached connection for serverless
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }

    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://temp:temp123@cluster0.ddy3sjl.mongodb.net/library?retryWrites=true&w=majority';

    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        cachedDb = mongoose.connection;
        console.log('Connected to MongoDB');
        return cachedDb;
    } catch (err) {
        console.error('MongoDB connection error:', err);
        throw err;
    }
}

// Connect before handling requests
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (err) {
        res.status(500).json({ message: 'Database connection failed', error: err.message });
    }
});

// --- JWT Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// --- AUTH Routes ---

// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            username,
            password: hashedPassword,
            role: 'user'
        });

        await user.save();

        res.status(201).json({ 
            message: 'User created successfully',
            username: user.username
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Guest login (no auth needed)
        if (role === 'guest') {
            const token = jwt.sign(
                { userId: 'guest', username: 'Guest', role: 'guest' },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            return res.json({
                token,
                user: {
                    username: 'Guest',
                    role: 'guest',
                    avatar: 'https://ui-avatars.com/api/?name=Guest&background=6b7280&color=fff'
                }
            });
        }

        // Admin login (hardcoded)
        if (role === 'admin') {
            if (username === 'admin' && password === 'admin123') {
                const token = jwt.sign(
                    { userId: 'admin', username: 'Administrator', role: 'admin' },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );
                return res.json({
                    token,
                    user: {
                        username: 'Administrator',
                        role: 'admin',
                        avatar: 'https://ui-avatars.com/api/?name=Admin&background=3b82f6&color=fff'
                    }
                });
            } else {
                return res.status(401).json({ message: 'Invalid admin credentials' });
            }
        }

        // Regular user login
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password required' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                username: user.username,
                role: user.role,
                avatar: `https://ui-avatars.com/api/?name=${user.username}&background=10b981&color=fff`
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- BOOK Routes (Protected) ---

// Get all books (filtered by user)
app.get('/api/books', authenticateToken, async (req, res) => {
    try {
        let books;
        
        if (req.user.role === 'admin') {
            // Admin sees ALL books
            books = await Book.find().populate('checkedOutBy', 'username');
        } else if (req.user.role === 'guest') {
            // Guests only see available books
            books = await Book.find({ status: 'available' });
        } else {
            // Regular users see:
            // 1. Available books
            // 2. Books they personally checked out
            books = await Book.find({
                $or: [
                    { status: 'available' },
                    { checkedOutBy: req.user.userId }
                ]
            }).populate('checkedOutBy', 'username');
        }
        
        res.json(books.reverse());
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// Add a book (admin only)
app.post('/api/books', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can add books' });
        }

        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            isbn: req.body.isbn,
            description: req.body.description
        });

        const newBook = await book.save();
        res.status(201).json(newBook);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Toggle favorite
app.patch('/api/books/:id/favorite', authenticateToken, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        book.isFavorite = !book.isFavorite;
        const updatedBook = await book.save();
        res.json(updatedBook);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Checkout a book (no borrower name needed - uses logged in user)
app.patch('/api/books/:id/checkout', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'guest') {
            return res.status(403).json({ message: 'Guests cannot checkout books' });
        }

        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });

        if (book.status === 'checked-out') {
            return res.status(400).json({ message: 'Book already checked out' });
        }

        book.status = 'checked-out';
        book.checkedOutBy = req.user.userId;
        book.checkedOutByUsername = req.user.username;
        book.checkedOutDate = new Date().toLocaleDateString();
        
        await book.save();
        res.json(book);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Check-in a book
app.patch('/api/books/:id/checkin', authenticateToken, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });

        // Only admin or the person who checked it out can return it
        if (req.user.role !== 'admin' && book.checkedOutBy.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'You can only return books you checked out' });
        }

        // Add to history before checking in
        if (book.checkedOutBy && book.checkedOutDate) {
            book.borrowHistory.push({
                borrower: book.checkedOutByUsername,
                borrowerId: book.checkedOutBy,
                checkoutDate: book.checkedOutDate,
                returnDate: new Date().toLocaleDateString()
            });
        }

        book.status = 'available';
        book.checkedOutBy = null;
        book.checkedOutByUsername = null;
        book.checkedOutDate = null;

        await book.save();
        res.json(book);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get borrower history for a specific book
app.get('/api/books/:id/history', authenticateToken, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });

        res.json({
            title: book.title,
            author: book.author,
            history: book.borrowHistory || []
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Clear borrower history (admin only)
app.delete('/api/books/:id/history', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can clear history' });
        }

        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });

        book.borrowHistory = [];
        await book.save();
        
        res.json({ 
            message: 'History cleared successfully',
            title: book.title,
            author: book.author,
            history: []
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a book (admin only)
app.delete('/api/books/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can delete books' });
        }

        await Book.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted Book' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});