const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Book = require('./models/Book');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve HTML/CSS/JS

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/mini_library')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

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

        book.status = 'available';
        book.checkedOutBy = null;
        book.checkedOutDate = null;

        await book.save();
        res.json(book);
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