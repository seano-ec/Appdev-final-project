const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String, default: 'N/A' },
    description: { type: String, default: 'No description available' },
    status: { 
        type: String, 
        enum: ['available', 'checked-out'], 
        default: 'available' 
    },
    checkedOutBy: { type: String, default: null },
    checkedOutDate: { type: String, default: null },
    addedDate: { type: String, default: () => new Date().toLocaleDateString() }
});

module.exports = mongoose.model('Book', bookSchema);