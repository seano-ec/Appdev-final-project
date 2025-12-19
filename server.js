const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Book = require('./models/Book');

const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config();

app.use(cors());
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

// --- API Routes ---

// Get all books
app.get('/api/books', async (req, res) => {
    try {
        const books = await Book.find();
        res.json(books);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a book
app.post('/api/books', async (req, res) => {
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        isbn: req.body.isbn,
        description: req.body.description
    });

    try {
        const newBook = await book.save();
        res.status(201).json(newBook);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Checkout a book
app.patch('/api/books/:id/checkout', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).send('Book not found');

        book.status = 'checked-out';
        book.checkedOutBy = req.body.borrower;
        book.checkedOutDate = new Date().toLocaleDateString();
        
        await book.save();
        res.json(book);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Check-in a book
app.patch('/api/books/:id/checkin', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).send('Book not found');

        // Add to history before checking in
        if (book.checkedOutBy && book.checkedOutDate) {
            book.borrowHistory.push({
                borrower: book.checkedOutBy,
                checkoutDate: book.checkedOutDate,
                returnDate: new Date().toLocaleDateString()
            });
        }

        book.status = 'available';
        book.checkedOutBy = null;
        book.checkedOutDate = null;

        await book.save();
        res.json(book);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get borrower history for a specific book
app.get('/api/books/:id/history', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).send('Book not found');

        res.json({
            title: book.title,
            author: book.author,
            history: book.borrowHistory || []
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Clear borrower history for a specific book
app.delete('/api/books/:id/history', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).send('Book not found');

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

// Delete a book
app.delete('/api/books/:id', async (req, res) => {
    try {
        await Book.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted Book' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});