class Library {
    constructor() {
        this.books = [];
        this.currentBookId = null;
        this.init();
    }

    async init() {
        await this.loadBooks();
        this.attachEventListeners();
    }

    // FETCH: Get books from backend
    async loadBooks() {
        try {
            const response = await fetch('/api/books');
            this.books = await response.json();
            this.renderBooks();
            this.updateStats();
        } catch (error) {
            console.error('Error loading books:', error);
        }
    }

    // FETCH: Post new book to backend
    async addBook(title, author, isbn, description) {
        try {
            const response = await fetch('/api/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, author, isbn, description })
            });

            if (response.ok) {
                await this.loadBooks();
            }
        } catch (error) {
            console.error('Error adding book:', error);
        }
    }

    // FETCH: Update status to checkout
    async checkOut(bookId) {
        const borrower = prompt('Enter borrower name:');
        if (!borrower) return;

        try {
            const response = await fetch(`/api/books/${bookId}/checkout`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ borrower })
            });

            if (response.ok) {
                await this.loadBooks();
            }
        } catch (error) {
            console.error('Error checking out:', error);
        }
    }

    // FETCH: Update status to checkin
    async checkIn(bookId) {
        try {
            const response = await fetch(`/api/books/${bookId}/checkin`, {
                method: 'PATCH'
            });

            if (response.ok) {
                await this.loadBooks();
            }
        } catch (error) {
            console.error('Error checking in:', error);
        }
    }

    // FETCH: Get borrower history
    async viewHistory(bookId) {
        try {
            const response = await fetch(`/api/books/${bookId}/history`);
            const data = await response.json();
            
            this.currentBookId = bookId;
            this.showHistoryModal(data);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    }

    // FETCH: Clear borrower history
    async clearHistory(bookId) {
        if (!confirm('Are you sure you want to clear all borrowing history for this book? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/books/${bookId}/history`, {
                method: 'DELETE'
            });

            if (response.ok) {
                const data = await response.json();
                this.showHistoryModal(data);
            }
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }

    // Show history in a modal
    showHistoryModal(data) {
        // Remove existing modal if any
        const existingModal = document.querySelector('.modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📜 Borrower History</h2>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <h3>${this.escapeHtml(data.title)}</h3>
                    <p class="modal-author">by ${this.escapeHtml(data.author)}</p>
                    
                    ${data.history.length === 0 ? 
                        '<p class="no-history">No borrowing history yet.</p>' :
                        `<div class="history-list">
                            ${data.history.map((record, index) => `
                                <div class="history-item">
                                    <div class="history-number">#${data.history.length - index}</div>
                                    <div class="history-details">
                                        <div><strong>Borrower:</strong> ${this.escapeHtml(record.borrower)}</div>
                                        <div><strong>Checked out:</strong> ${record.checkoutDate}</div>
                                        <div><strong>Returned:</strong> ${record.returnDate}</div>
                                    </div>
                                </div>
                            `).reverse().join('')}
                        </div>
                        <button class="btn-clear-history" onclick="library.clearHistory('${this.currentBookId}')">
                            🗑️ Clear All History
                        </button>`
                    }
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal on click
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    // FETCH: Delete book
    async deleteBook(bookId) {
        if (confirm('Are you sure you want to delete this book?')) {
            try {
                const response = await fetch(`/api/books/${bookId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    await this.loadBooks();
                }
            } catch (error) {
                console.error('Error deleting book:', error);
            }
        }
    }

    getFilteredBooks() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('filterStatus').value;

        return this.books.filter(book => {
            const matchesSearch = book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                (book.isbn && book.isbn.toLowerCase().includes(searchTerm));

            const matchesStatus = statusFilter === 'all' || book.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }

    renderBooks() {
        const bookList = document.getElementById('bookList');
        const filteredBooks = this.getFilteredBooks();

        if (filteredBooks.length === 0) {
            bookList.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 4em; margin-bottom: 20px;">📚</div>
                    <h3>No books found</h3>
                    <p>Add a book to get started or adjust your search filters</p>
                </div>
            `;
            return;
        }

        bookList.innerHTML = filteredBooks.map(book => `
            <div class="book-card ${book.status}">
                <div class="book-header">
                    <div>
                        <div class="book-title">${this.escapeHtml(book.title)}</div>
                        <div class="book-author">by ${this.escapeHtml(book.author)}</div>
                        <div class="book-isbn">ISBN: ${this.escapeHtml(book.isbn)}</div>
                    </div>
                    <span class="status-badge ${book.status}">
                        ${book.status === 'available' ? '✓ Available' : '✗ Checked Out'}
                    </span>
                </div>
                <div class="book-description">${this.escapeHtml(book.description)}</div>
                <div class="book-details">
                    <div>Added: ${book.addedDate}</div>
                    ${book.status === 'checked-out' ? `
                        <div>Checked out by: <strong>${this.escapeHtml(book.checkedOutBy)}</strong></div>
                        <div>Check-out date: ${book.checkedOutDate}</div>
                    ` : ''}
                </div>
                <div class="book-actions">
                    ${book.status === 'available' ? 
                        `<button class="btn-checkout" onclick="library.checkOut('${book._id}')">Check Out</button>` :
                        `<button class="btn-checkin" onclick="library.checkIn('${book._id}')">Check In</button>`
                    }
                    <button class="btn-history" onclick="library.viewHistory('${book._id}')">History</button>
                    <button class="btn-delete" onclick="library.deleteBook('${book._id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        const total = this.books.length;
        const available = this.books.filter(b => b.status === 'available').length;
        const checkedOut = this.books.filter(b => b.status === 'checked-out').length;

        document.getElementById('totalBooks').textContent = total;
        document.getElementById('availableBooks').textContent = available;
        document.getElementById('checkedOutBooks').textContent = checkedOut;
    }

    attachEventListeners() {
        document.getElementById('addBookForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('bookTitle').value.trim();
            const author = document.getElementById('bookAuthor').value.trim();
            const isbn = document.getElementById('bookISBN').value.trim();
            const description = document.getElementById('bookDescription').value.trim();

            this.addBook(title, author, isbn, description);
            e.target.reset();
        });

        document.getElementById('searchInput').addEventListener('input', () => {
            this.renderBooks();
        });

        document.getElementById('filterStatus').addEventListener('change', () => {
            this.renderBooks();
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

const library = new Library();