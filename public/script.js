// === Data Storage ===
let myLibrary = [];
let currentView = 'dashboard'; // 'dashboard' or 'favorites'

// === Book Class ===
class Book {
    constructor(title, author, isbn, description) {
        this.id = Date.now() + Math.random().toString(16).slice(2);
        this.title = title;
        this.author = author;
        this.isbn = isbn || 'N/A';
        this.description = description || 'No description provided.';
        this.isCheckedOut = false;
        this.isFavorite = false; // New Property
        this.history = [];
        this.createdAt = new Date();
    }

    toggleStatus() {
        this.isCheckedOut = !this.isCheckedOut;
        const action = this.isCheckedOut ? 'Checked Out' : 'Returned';
        this.addToHistory(action);
    }

    toggleFavorite() {
        this.isFavorite = !this.isFavorite;
    }

    addToHistory(action) {
        const log = { action: action, date: new Date().toLocaleString() };
        this.history.unshift(log);
    }
}

// === DOM Elements ===
const mainView = document.getElementById('mainView');
const settingsView = document.getElementById('settingsView');
const statsSection = document.getElementById('statsSection');
const formSection = document.getElementById('formSection');
const collectionTitle = document.getElementById('collectionTitle');

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


// === Initialization ===
function init() {
    addDummyData();
    renderBooks();
    updateStats();
    setupNavigation();
}

function addDummyData() {
    const b1 = new Book("The Psychology of Money", "Morgan Housel", "9780857197689", "Timeless lessons on wealth.");
    const b2 = new Book("Atomic Habits", "James Clear", "9780735211292", "Build good habits & break bad ones.");
    const b3 = new Book("Deep Work", "Cal Newport", "9781455586691", "Rules for focused success.");
    
    b3.toggleStatus(); // Make one checked out
    b1.toggleFavorite(); // Make one favorite

    myLibrary.push(b1, b2, b3);
}

// === Navigation Logic ===
function setupNavigation() {
    
    // 1. Dashboard: Show All
    navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navDashboard);
        switchView('dashboard');
    });

    // 2. My Library: Scroll to List
    navLibrary.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navLibrary);
        switchView('dashboard');
        document.getElementById('librarySection').scrollIntoView({ behavior: 'smooth' });
    });

    // 3. Favorites: Filter List, Hide Form/Stats
    navFavorites.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navFavorites);
        switchView('favorites');
    });

    // 4. Settings: Show Settings Panel
    navSettings.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navSettings);
        switchView('settings');
    });

    // 5. Logout
    navLogout.addEventListener('click', (e) => {
        e.preventDefault();
        if(confirm('Are you sure you want to logout?')) {
            alert('Logging out...');
            location.reload(); // Simulates logout
        }
    });
}

function setActiveNav(activeItem) {
    navItems.forEach(item => item.classList.remove('active'));
    activeItem.classList.add('active');
}

function switchView(viewName) {
    currentView = viewName;

    // Reset UI Visibility
    mainView.classList.remove('hidden');
    settingsView.classList.add('hidden');
    statsSection.style.display = 'grid'; // Restore grid
    formSection.style.display = 'block'; // Restore block
    collectionTitle.innerHTML = '<i class="ri-book-open-line"></i> Book Collection';

    if (viewName === 'dashboard') {
        // Standard view (handled by reset above)
        renderBooks();
    } 
    else if (viewName === 'favorites') {
        // Hide Stats and Form, only show List
        statsSection.style.display = 'none';
        formSection.style.display = 'none';
        collectionTitle.innerHTML = '<i class="ri-heart-fill" style="color:#ef4444"></i> Favorite Books';
        renderBooks();
    } 
    else if (viewName === 'settings') {
        // Hide Main, Show Settings
        mainView.classList.add('hidden');
        settingsView.classList.remove('hidden');
    }
}

// === Core Functions ===
function updateStats() {
    const total = myLibrary.length;
    const checkedOut = myLibrary.filter(book => book.isCheckedOut).length;
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
        if (statusFilter === 'available') matchesStatus = !book.isCheckedOut;
        if (statusFilter === 'checked-out') matchesStatus = book.isCheckedOut;

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
        card.className = `book-card ${book.isCheckedOut ? 'checked-out' : 'available'}`;
        
        const statusBadge = book.isCheckedOut 
            ? '<span class="status-badge checked-out">Checked Out</span>' 
            : '<span class="status-badge available">Available</span>';

        const btnClass = book.isCheckedOut ? 'btn-checkin' : 'btn-checkout';
        const btnText = book.isCheckedOut ? 'Return' : 'Check Out';
        
        // Heart Icon Logic
        const heartIcon = book.isFavorite ? 'ri-heart-fill' : 'ri-heart-line';
        const heartColor = book.isFavorite ? 'color: #ef4444;' : 'color: white;';

        card.innerHTML = `
            <div class="book-header">
                <div class="book-title">${book.title}</div>
                ${statusBadge}
            </div>
            <div class="book-author">by ${book.author}</div>
            <div class="book-isbn">ISBN: ${book.isbn}</div>
            <div class="book-description">${book.description}</div>
            
            <div class="book-actions">
                <button class="${btnClass}" onclick="toggleBookStatus('${book.id}')">
                    ${btnText}
                </button>
                <button class="btn-fav" onclick="toggleFavorite('${book.id}')" style="${heartColor}">
                    <i class="${heartIcon}"></i>
                </button>
                <button class="btn-history" onclick="viewHistory('${book.id}')">
                    <i class="ri-history-line"></i>
                </button>
                <button class="btn-delete" onclick="deleteBook('${book.id}')">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        `;
        bookList.appendChild(card);
    });
}

// === Event Listeners ===
addBookForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('bookTitle').value;
    const author = document.getElementById('bookAuthor').value;
    const isbn = document.getElementById('bookISBN').value;
    const desc = document.getElementById('bookDescription').value;

    const newBook = new Book(title, author, isbn, desc);
    newBook.addToHistory('Added to library');
    myLibrary.push(newBook);
    
    addBookForm.reset();
    renderBooks();
    updateStats();
    
    // If in favorites view, switch back to dashboard to see the new book
    if (currentView === 'favorites') navDashboard.click();
});

searchInput.addEventListener('input', renderBooks);
filterStatus.addEventListener('change', renderBooks);

// === Global Functions ===
window.toggleBookStatus = (id) => {
    const book = myLibrary.find(b => b.id === id);
    if (book) {
        book.toggleStatus();
        renderBooks();
        updateStats();
    }
};

window.toggleFavorite = (id) => {
    const book = myLibrary.find(b => b.id === id);
    if (book) {
        book.toggleFavorite();
        renderBooks(); // Re-render to update heart icon
    }
};

window.deleteBook = (id) => {
    if(confirm('Delete this book?')) {
        myLibrary = myLibrary.filter(b => b.id !== id);
        renderBooks();
        updateStats();
    }
};

window.resetSystem = () => {
    if(confirm('This will delete all books. Are you sure?')) {
        myLibrary = [];
        renderBooks();
        updateStats();
        alert('System Reset Complete');
    }
};

// === Modal Logic (History) ===
const modal = document.getElementById('historyModal');
const closeBtn = document.querySelector('.close-modal');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
let currentBookId = null;

window.viewHistory = (id) => {
    const book = myLibrary.find(b => b.id === id);
    if (!book) return;
    currentBookId = id;
    document.getElementById('modalBookTitle').textContent = book.title;
    document.getElementById('modalBookAuthor').textContent = `by ${book.author}`;
    renderHistoryList(book);
    modal.style.display = 'flex';
};

function renderHistoryList(book) {
    const list = document.getElementById('modalHistoryList');
    list.innerHTML = '';
    if (book.history.length === 0) {
        list.innerHTML = '<p class="no-history">No history available.</p>';
        return;
    }
    book.history.forEach((log, index) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="history-number">#${book.history.length - index}</div>
            <div class="history-details">
                <div><strong>Action:</strong> ${log.action}</div>
                <div><strong>Date:</strong> ${log.date}</div>
            </div>`;
        list.appendChild(item);
    });
}

closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
clearHistoryBtn.onclick = () => {
    const book = myLibrary.find(b => b.id === currentBookId);
    if (book) {
        book.history = [];
        book.addToHistory('History cleared');
        renderHistoryList(book);
    }
};

// === Theme Toggle Logic ===
const themeToggleBtn = document.getElementById('themeToggle');
const body = document.body;
const icon = themeToggleBtn.querySelector('i');

themeToggleBtn.addEventListener('click', () => {
    // Toggle the class
    body.classList.toggle('light-mode');
    
    // Switch the Icon
    if (body.classList.contains('light-mode')) {
        icon.classList.remove('ri-sun-line');
        icon.classList.add('ri-moon-line');
    } else {
        icon.classList.remove('ri-moon-line');
        icon.classList.add('ri-sun-line');
    }
});

// Run Init
init();