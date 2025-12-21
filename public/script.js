// === Configuration ===
const API_BASE_URL = 'http://localhost:3000/api';

// === Data Storage ===
let myLibrary = [];
let currentView = 'dashboard'; // 'dashboard', 'library', 'favorites', 'settings'

// === DOM Elements ===
const mainView = document.getElementById('mainView');
const settingsView = document.getElementById('settingsView');
const statsSection = document.getElementById('statsSection');
const formSection = document.getElementById('formSection');
const collectionTitle = document.getElementById('collectionTitle');
// We need this to change the layout columns
const dashboardGrid = document.querySelector('.dashboard-grid'); 

const bookList = document.getElementById('bookList');
const addBookForm = document.getElementById('addBookForm');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');

// Stats Elements
const totalBooksEl = document.getElementById('totalBooks');
const availableBooksEl = document.getElementById('availableBooks');
const checkedOutBooksEl = document.getElementById('checkedOutBooks');

// Navigation Elements
const navDashboard = document.getElementById('nav-dashboard');
const navLibrary = document.getElementById('nav-library');
const navFavorites = document.getElementById('nav-favorites');
const navSettings = document.getElementById('nav-settings');
const navLogout = document.getElementById('nav-logout');
const navItems = document.querySelectorAll('.nav-item');

// === API Functions (Database Logic Preserved) ===
async function fetchBooks() {
    try {
        const response = await fetch(`${API_BASE_URL}/books`);
        if (!response.ok) throw new Error('Failed to fetch books');
        const books = await response.json();
        myLibrary = books;
        return books;
    } catch (err) {
        console.error('Error fetching books:', err);
        showNotification('Failed to load books from database', 'error');
        return [];
    }
}

async function addBookToDB(bookData) {
    try {
        const response = await fetch(`${API_BASE_URL}/books`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData)
        });
        if (!response.ok) throw new Error('Failed to add book');
        const newBook = await response.json();
        showNotification('Book added successfully!', 'success');
        return newBook;
    } catch (err) {
        console.error('Error adding book:', err);
        showNotification('Failed to add book to database', 'error');
        return null;
    }
}

async function checkoutBook(id, borrower = 'Current User') {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}/checkout`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ borrower })
        });
        if (!response.ok) throw new Error('Failed to checkout book');
        const updatedBook = await response.json();
        showNotification('Book checked out successfully!', 'success');
        return updatedBook;
    } catch (err) {
        console.error('Error checking out book:', err);
        showNotification('Failed to checkout book', 'error');
        return null;
    }
}

async function checkinBook(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}/checkin`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to checkin book');
        const updatedBook = await response.json();
        showNotification('Book returned successfully!', 'success');
        return updatedBook;
    } catch (err) {
        console.error('Error checking in book:', err);
        showNotification('Failed to return book', 'error');
        return null;
    }
}

async function deleteBookFromDB(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete book');
        showNotification('Book deleted successfully!', 'success');
        return true;
    } catch (err) {
        console.error('Error deleting book:', err);
        showNotification('Failed to delete book', 'error');
        return false;
    }
}

async function fetchBookHistory(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}/history`);
        if (!response.ok) throw new Error('Failed to fetch history');
        return await response.json();
    } catch (err) {
        console.error('Error fetching history:', err);
        showNotification('Failed to load history', 'error');
        return null;
    }
}

async function clearBookHistory(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}/history`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to clear history');
        showNotification('History cleared successfully!', 'success');
        return await response.json();
    } catch (err) {
        console.error('Error clearing history:', err);
        showNotification('Failed to clear history', 'error');
        return null;
    }
}

// === NEW: API Function for Favorites ===
async function toggleFavoriteInDB(id) {
    try {
        // This assumes your backend has a route: PATCH /api/books/:id/favorite
        const response = await fetch(`${API_BASE_URL}/books/${id}/favorite`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            // Fallback for backends that don't have a specific route yet:
            // We can try to update the book directly if you have a generic update route
            console.warn('Favorite route not found, trying generic update...');
            // throw new Error('Favorite route not implemented'); 
        }
        
        const updatedBook = await response.json();
        return updatedBook;
    } catch (err) {
        console.error('Error updating favorite:', err);
        showNotification('Failed to update favorite status', 'error');
        throw err; // Re-throw to handle UI revert
    }
}


// === Notification System ===
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        z-index: 10000; animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// === Initialization ===
async function init() {
    showNotification('Loading books from database...', 'info');
    await fetchBooks();
    renderBooks();
    updateStats();
    setupNavigation();
}

// === Navigation Logic ===
function setupNavigation() {
    
    // 1. Dashboard: Show Stats + Form + List (2 Columns)
    navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navDashboard);
        switchView('dashboard');
    });

    // 2. My Library: Show ONLY List (Full Width)
    navLibrary.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navLibrary);
        switchView('library');
    });

    // 3. Favorites: Show Only Favorites (Full Width)
    navFavorites.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navFavorites);
        switchView('favorites');
    });

    // 4. Settings
    navSettings.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navSettings);
        switchView('settings');
    });

    // 5. Logout
    navLogout.addEventListener('click', (e) => {
        e.preventDefault();
        if(confirm('Are you sure you want to logout?')) {
            showNotification('Logging out...', 'info');
            setTimeout(() => location.reload(), 1000);
        }
    });
}

function setActiveNav(activeItem) {
    navItems.forEach(item => item.classList.remove('active'));
    activeItem.classList.add('active');
}

// === View Logic ===
function switchView(viewName) {
    currentView = viewName;

    // Default State: Show Main, Hide Settings
    mainView.classList.remove('hidden');
    settingsView.classList.add('hidden');
    
    // Default Title
    collectionTitle.innerHTML = '<i class="ri-book-open-line"></i> Book Collection';

    if (viewName === 'dashboard') {
        // Show Stats & Form
        statsSection.style.display = 'grid';
        formSection.style.display = 'block';
        
        // Restore 2-Column Grid
        if(dashboardGrid) dashboardGrid.style.gridTemplateColumns = '350px 1fr';
        
        renderBooks();
    } 
    else if (viewName === 'library') {
        // Hide Stats & Form
        statsSection.style.display = 'none';
        formSection.style.display = 'none';
        
        // 1-Column Grid (Full Width)
        if(dashboardGrid) dashboardGrid.style.gridTemplateColumns = '1fr';
        
        collectionTitle.innerHTML = '<i class="ri-book-2-line"></i> My Full Library';
        renderBooks();
    }
    else if (viewName === 'favorites') {
        // Hide Stats & Form
        statsSection.style.display = 'none';
        formSection.style.display = 'none';
        
        // 1-Column Grid
        if(dashboardGrid) dashboardGrid.style.gridTemplateColumns = '1fr';
        
        collectionTitle.innerHTML = '<i class="ri-heart-fill" style="color:#ef4444"></i> Favorite Books';
        renderBooks();
    } 
    else if (viewName === 'settings') {
        mainView.classList.add('hidden');
        settingsView.classList.remove('hidden');
    }
}

// === Core Functions ===
function updateStats() {
    const total = myLibrary.length;
    const checkedOut = myLibrary.filter(book => book.status === 'checked-out').length;
    const available = total - checkedOut;

    totalBooksEl.textContent = total;
    availableBooksEl.textContent = available;
    checkedOutBooksEl.textContent = checkedOut;
}

function renderBooks() {
    bookList.innerHTML = '';
    
    const searchTerm = searchInput.value.toLowerCase();
    const statusFilter = filterStatus.value;

    const filteredBooks = myLibrary.filter(book => {
        // 1. Search Filter
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) || 
                              book.author.toLowerCase().includes(searchTerm);
        
        // 2. Status Filter
        let matchesStatus = true;
        if (statusFilter === 'available') matchesStatus = book.status === 'available';
        if (statusFilter === 'checked-out') matchesStatus = book.status === 'checked-out';

        // 3. View Filter (Favorites)
        let matchesView = true;
        if (currentView === 'favorites') matchesView = book.isFavorite;

        return matchesSearch && matchesStatus && matchesView;
    });

    if (filteredBooks.length === 0) {
        bookList.innerHTML = `
            <div class="empty-state">
                <i class="ri-search-2-line" style="font-size: 3em; margin-bottom: 10px;"></i>
                <p>No books found.</p>
            </div>`;
        return;
    }

    filteredBooks.forEach(book => {
        const card = document.createElement('div');
        card.className = `book-card ${book.status === 'checked-out' ? 'checked-out' : 'available'}`;
        
        const statusBadge = book.status === 'checked-out'
            ? '<span class="status-badge checked-out">Checked Out</span>' 
            : '<span class="status-badge available">Available</span>';

        const btnClass = book.status === 'checked-out' ? 'btn-checkin' : 'btn-checkout';
        const btnText = book.status === 'checked-out' ? 'Return' : 'Check Out';
        
        // Heart Logic
        const heartIcon = book.isFavorite ? 'ri-heart-fill' : 'ri-heart-line';
        const favClass = book.isFavorite ? 'is-favorite' : '';

        card.innerHTML = `
            <div class="book-header">
                <div class="book-title">${book.title}</div>
                ${statusBadge}
            </div>
            <div class="book-author">by ${book.author}</div>
            <div class="book-isbn">ISBN: ${book.isbn}</div>
            <div class="book-description">${book.description}</div>
            ${book.checkedOutBy ? `<div class="book-borrower"><strong>Borrowed by:</strong> ${book.checkedOutBy}</div>` : ''}
            ${book.checkedOutDate ? `<div class="book-date"><strong>Checked out:</strong> ${book.checkedOutDate}</div>` : ''}
            
            <div class="book-actions">
                <button class="${btnClass}" onclick="toggleBookStatus('${book._id}')">
                    ${btnText}
                </button>
                
                <button class="btn-fav ${favClass}" onclick="toggleFavorite('${book._id}')">
                    <i class="${heartIcon}"></i>
                </button>
                
                <button class="btn-history" onclick="viewHistory('${book._id}')">
                    <i class="ri-history-line"></i>
                </button>
                <button class="btn-delete" onclick="deleteBook('${book._id}')">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        `;
        bookList.appendChild(card);
    });
}

addBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const bookData = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        isbn: document.getElementById('bookISBN').value,
        description: document.getElementById('bookDescription').value
    };

    const newBook = await addBookToDB(bookData);
    if (newBook) {
        await fetchBooks();
        addBookForm.reset();
        renderBooks();
        updateStats();
        
        if (currentView === 'favorites' || currentView === 'library') navDashboard.click();
    }
});

searchInput.addEventListener('input', renderBooks);
filterStatus.addEventListener('change', renderBooks);

let pendingBookId = null;

window.toggleBookStatus = async (id) => {
    const book = myLibrary.find(b => b._id === id);
    if (!book) return;
    
    if (book.status === 'available') {
        // OPEN THE CUSTOM WINDOW INSTEAD OF PROMPT
        pendingBookId = id;
        document.getElementById('borrowerNameInput').value = ''; 
        document.getElementById('borrowModal').style.display = 'flex';
        document.getElementById('borrowerNameInput').focus();
    } else {
        // RETURN BOOK LOGIC
        await checkinBook(id);
        await fetchBooks();
        renderBooks();
        updateStats();
    }
};



window.toggleFavorite = async (id) => {
    const book = myLibrary.find(b => b._id === id);
    if (!book) return;

    // 1. Optimistic UI: Toggle immediately for speed
    book.isFavorite = !book.isFavorite;
    renderBooks();

    // 2. Call API to save to MongoDB
    try {
        await toggleFavoriteInDB(id);
    } catch (err) {
        // 3. Revert if API fails
        book.isFavorite = !book.isFavorite;
        renderBooks();
    }
};

window.deleteBook = async (id) => {
    if(confirm('Delete this book from the database?')) {
        const success = await deleteBookFromDB(id);
        if (success) {
            await fetchBooks();
            renderBooks();
            updateStats();
        }
    }
};

window.resetSystem = async () => {
    if(confirm('This will delete ALL books from the database. Are you sure?')) {
        showNotification('Deleting all books...', 'info');
        for (const book of myLibrary) {
            await deleteBookFromDB(book._id);
        }
        await fetchBooks();
        renderBooks();
        updateStats();
        showNotification('System Reset Complete', 'success');
    }
};

// === Modal Logic ===
const modal = document.getElementById('historyModal');
const closeBtn = document.querySelector('.close-modal');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
let currentBookId = null;

window.viewHistory = async (id) => {
    currentBookId = id;
    const historyData = await fetchBookHistory(id);
    
    if (historyData) {
        document.getElementById('modalBookTitle').textContent = historyData.title;
        document.getElementById('modalBookAuthor').textContent = `by ${historyData.author}`;
        renderHistoryList(historyData.history);
        modal.style.display = 'flex';
    }
};

function renderHistoryList(history) {
    const list = document.getElementById('modalHistoryList');
    list.innerHTML = '';
    
    if (!history || history.length === 0) {
        list.innerHTML = '<p class="no-history">No borrowing history available.</p>';
        return;
    }
    
    history.forEach((log, index) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="history-number">#${history.length - index}</div>
            <div class="history-details">
                <div><strong>Borrower:</strong> ${log.borrower}</div>
                <div><strong>Checked Out:</strong> ${log.checkoutDate}</div>
                <div><strong>Returned:</strong> ${log.returnDate}</div>
            </div>`;
        list.appendChild(item);
    });
}

closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

clearHistoryBtn.onclick = async () => {
    if (confirm('Clear all borrowing history for this book?')) {
        const result = await clearBookHistory(currentBookId);
        if (result) {
            renderHistoryList(result.history);
        }
    }
};

// === Theme Toggle Logic ===
const themeToggleBtn = document.getElementById('themeToggle');
const body = document.body;
const icon = themeToggleBtn.querySelector('i');

// Load theme preference from local storage (UI preference, not DB data)
if (localStorage.getItem('bookbase_theme') === 'light') {
    body.classList.add('light-mode');
    icon.classList.remove('ri-sun-line');
    icon.classList.add('ri-moon-line');
}

themeToggleBtn.addEventListener('click', () => {
    body.classList.toggle('light-mode');
    
    if (body.classList.contains('light-mode')) {
        localStorage.setItem('bookbase_theme', 'light');
        icon.classList.remove('ri-sun-line');
        icon.classList.add('ri-moon-line');
    } else {
        localStorage.setItem('bookbase_theme', 'dark');
        icon.classList.remove('ri-moon-line');
        icon.classList.add('ri-sun-line');
    }
});

// === BORROW WINDOW LOGIC ===
document.getElementById('confirmBorrowBtn').onclick = async () => {
    const name = document.getElementById('borrowerNameInput').value;
    
    if (name && name.trim() !== "" && pendingBookId) {
        await checkoutBook(pendingBookId, name.trim());
        
        // Refresh UI
        document.getElementById('borrowModal').style.display = 'none';
        await fetchBooks();
        renderBooks();
        updateStats();
        pendingBookId = null;
    }
};

// Helper function to close the window
window.closeBorrowModal = () => {
    document.getElementById('borrowModal').style.display = 'none';
    pendingBookId = null;
};


// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
    .book-borrower, .book-date { font-size: 0.85em; color: #94a3b8; margin-top: 5px; }
`;
document.head.appendChild(style);

init();

