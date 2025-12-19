class Library {
    constructor() {
        this.books = [];
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
                await this.loadBooks(); // Reload list
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

        // Note: MongoDB uses '_id', not 'id'. 
        // Also added quotes around ID in onclick function calls to support string IDs.
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