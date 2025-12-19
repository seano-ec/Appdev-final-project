const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    isbn: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['available', 'checked-out'],
        default: 'available'
    },
    isFavorite: {
        type: Boolean,
        default: false
    },
    checkedOutBy: {
        type: String,
        default: null
    },
    checkedOutDate: {
        type: String,
        default: null
    },
    addedDate: {
        type: String,
        default: () => new Date().toLocaleDateString()
    },
    borrowHistory: [{
        borrower: String,
        checkoutDate: String,
        returnDate: String
    }]
});

module.exports = mongoose.model('Book', bookSchema);