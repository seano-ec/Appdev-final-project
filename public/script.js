const API_BASE_URL = 'http://localhost:3000/api';
let currentUser = null;

const loginView = document.getElementById('loginView');
const appView = document.getElementById('appView');
const userSelect = document.getElementById('userSelect');
const passwordSection = document.getElementById('passwordSection');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const guestLoginBtn = document.getElementById('guestLoginBtn');
const loginError = document.getElementById('loginError');

const mainView = document.getElementById('mainView');
const settingsView = document.getElementById('settingsView');
const dashboardContent = document.getElementById('dashboardContent');
const librarySection = document.getElementById('librarySection');
const collectionTitle = document.getElementById('collectionTitle');

const userAvatarImg = document.getElementById('userAvatarImg');
const userNameDisplay = document.getElementById('userNameDisplay');

const navDashboard = document.getElementById('nav-dashboard');
const navLibrary = document.getElementById('nav-library');
const navFavorites = document.getElementById('nav-favorites');
const navSettings = document.getElementById('nav-settings');
const navLogout = document.getElementById('nav-logout');
const navItems = document.querySelectorAll('.nav-item');

const resetSystemSection = document.getElementById('resetSystemSection');

let myLibrary = [];
let currentView = 'dashboard';

// === API Functions ===
async function fetchBooks() {
    try {
        const response = await fetch(`${API_BASE_URL}/books`);
        if (!response.ok) throw new Error('Failed');
        // FIX 1: Reverse the array so latest books come first
        myLibrary = (await response.json()).reverse();
        return myLibrary;
    } catch (err) {
        showNotification('Using offline mode (Database fetch failed)', 'error');
        return [];
    }
}
async function addBookToDB(bookData) {
    try {
        const response = await fetch(`${API_BASE_URL}/books`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bookData)
        });
        if (!response.ok) throw new Error('Failed');
        showNotification('Book added!', 'success');
        return await response.json();
    } catch (err) { showNotification('Failed to add book', 'error'); return null; }
}
async function checkoutBook(id, borrower) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}/checkout`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ borrower })
        });
        if (!response.ok) throw new Error('Failed');
        return await response.json();
    } catch (err) { showNotification('Failed to checkout', 'error'); return null; }
}
async function checkinBook(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}/checkin`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed');
        return await response.json();
    } catch (err) { showNotification('Failed to return', 'error'); return null; }
}
async function deleteBookFromDB(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed');
        return true;
    } catch (err) { showNotification('Failed to delete', 'error'); return false; }
}
async function fetchBookHistory(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}/history`);
        return await response.json();
    } catch (err) { return null; }
}
async function clearBookHistory(id) {
    try {
        await fetch(`${API_BASE_URL}/books/${id}/history`, { method: 'DELETE' });
        return await fetchBookHistory(id); 
    } catch (err) { return null; }
}
async function toggleFavoriteInDB(id) {
    try { await fetch(`${API_BASE_URL}/books/${id}/favorite`, { method: 'PATCH' }); } catch (err) {}
}

// === AUTHENTICATION LOGIC ===

function initAuth() {
    const savedUser = localStorage.getItem('bookbase_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        loadApp();
    } else {
        loginView.classList.remove('hidden');
        appView.classList.add('hidden');
    }
}

userSelect.addEventListener('change', () => {
    loginError.classList.add('hidden');
    loginPassword.value = '';
    // Show password only for Admin
    if (userSelect.value === 'admin') {
        passwordSection.classList.remove('hidden');
    } else {
        passwordSection.classList.add('hidden');
    }
});

loginBtn.addEventListener('click', () => {
    const role = userSelect.value;
    if (!role) {
        showNotification('Please select a user', 'error');
        return;
    }

    if (role === 'admin') {
        if (loginPassword.value === 'admin123') { 
            loginUser('Administrator', 'admin', 'https://ui-avatars.com/api/?name=Admin&background=3b82f6&color=fff');
        } else {
            loginError.classList.remove('hidden');
        }
    } else {
        // Log in as User
        loginUser('User', 'user', 'https://ui-avatars.com/api/?name=User&background=10b981&color=fff');
    }
});

guestLoginBtn.addEventListener('click', () => {
    loginUser('Guest', 'guest', 'https://ui-avatars.com/api/?name=Guest&background=6b7280&color=fff');
});

function loginUser(name, role, avatar) {
    currentUser = { name, role, avatar };
    localStorage.setItem('bookbase_user', JSON.stringify(currentUser));
    loadApp();
}

window.logout = () => {
    localStorage.removeItem('bookbase_user');
    location.reload();
};

function loadApp() {
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
    
    userNameDisplay.textContent = currentUser.name;
    userAvatarImg.src = currentUser.avatar;

    // === ROLE BASED PERMISSIONS ===
    
    //admin
    if (currentUser.role === 'admin') {
        navDashboard.style.display = 'block';     
        navSettings.style.display = 'block';      
        resetSystemSection.style.display = 'flex'; 
        switchView('dashboard');
    }
    //USER
    else if (currentUser.role === 'user') {
        navDashboard.style.display = 'none';     
        navSettings.style.display = 'block';       
        resetSystemSection.style.display = 'none'; 
        switchView('library');                    
    }
    //GUEST
    else if (currentUser.role === 'guest') {
        navDashboard.style.display = 'none';
        navSettings.style.display = 'none';
        switchView('library');
    }

    initData(); 
}

async function initData() {
    await fetchBooks();
    renderBooks();
    renderRecentWidget();
    updateStats();
    setupNavigation();
    setupTheme();
}

// === Navigation & Views ===
function setupNavigation() {
    navDashboard.addEventListener('click', (e) => { e.preventDefault(); setActiveNav(navDashboard); switchView('dashboard'); });
    navLibrary.addEventListener('click', (e) => { e.preventDefault(); setActiveNav(navLibrary); switchView('library'); });
    navFavorites.addEventListener('click', (e) => { e.preventDefault(); setActiveNav(navFavorites); switchView('favorites'); });
    navSettings.addEventListener('click', (e) => { e.preventDefault(); setActiveNav(navSettings); switchView('settings'); });
    navLogout.addEventListener('click', (e) => { e.preventDefault(); if(confirm('Logout?')) logout(); });
}

function setActiveNav(activeItem) {
    navItems.forEach(item => item.classList.remove('active'));
    activeItem.classList.add('active');
}

function switchView(viewName) {
    currentView = viewName;
    mainView.classList.remove('hidden');
    settingsView.classList.add('hidden');
    collectionTitle.innerHTML = '<i class="ri-book-open-line"></i> Book Collection';

    // Reset visibility
    dashboardContent.style.display = 'none';
    librarySection.style.display = 'block'; // Always show list unless settings

    if (viewName === 'dashboard') {
        dashboardContent.style.display = 'block'; // Show Stats + Form
        renderBooks();
    } 
    else if (viewName === 'library') {
        collectionTitle.innerHTML = '<i class="ri-book-2-line"></i> My Full Library';
        renderBooks();
    }
    else if (viewName === 'favorites') {
        collectionTitle.innerHTML = '<i class="ri-heart-fill" style="color:#ef4444"></i> Favorite Books';
        renderBooks(true);
    } 
    else if (viewName === 'settings') {
        mainView.classList.add('hidden');
        settingsView.classList.remove('hidden');
    }
}

// === Core Logic ===
function updateStats() {
    document.getElementById('totalBooks').textContent = myLibrary.length;
    const checkedOut = myLibrary.filter(b => b.status === 'checked-out').length;
    document.getElementById('checkedOutBooks').textContent = checkedOut;
    document.getElementById('availableBooks').textContent = myLibrary.length - checkedOut;
}

function renderBooks(onlyFavorites = false) {
    const list = document.getElementById('bookList');
    list.innerHTML = '';
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;

    const filtered = myLibrary.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) || book.author.toLowerCase().includes(searchTerm);
        let matchesStatus = true;
        if (statusFilter === 'available') matchesStatus = book.status === 'available';
        if (statusFilter === 'checked-out') matchesStatus = book.status === 'checked-out';
        const matchesFav = onlyFavorites ? book.isFavorite : true;
        return matchesSearch && matchesStatus && matchesFav;
    });

    if (filtered.length === 0) {
        list.innerHTML = `<div class="empty-state"><p>No books found.</p></div>`;
        return;
    }

    filtered.forEach(book => {
        const card = document.createElement('div');
        card.className = `book-card ${book.status === 'checked-out' ? 'checked-out' : 'available'}`;
        const btnClass = book.status === 'checked-out' ? 'btn-checkin' : 'btn-checkout';
        const btnText = book.status === 'checked-out' ? 'Return' : 'Check Out';
        const deleteBtn = currentUser.role === 'admin' 
            ? `<button class="btn-delete" onclick="deleteBook('${book._id}')"><i class="ri-delete-bin-line"></i></button>` 
            : '';

        card.innerHTML = `
            <div class="book-header">
                <div class="book-title">${book.title}</div>
                <span class="status-badge ${book.status}">${book.status}</span>
            </div>
            <div class="book-author">by ${book.author}</div>
            <div class="book-description">${book.description}</div>
            ${book.checkedOutBy ? `<div class="book-borrower">Borrowed by: ${book.checkedOutBy}</div>` : ''}
            <div class="book-actions">
                <button class="${btnClass}" onclick="toggleBookStatus('${book._id}')">${btnText}</button>
                <button class="btn-fav ${book.isFavorite ? 'is-favorite' : ''}" onclick="toggleFavorite('${book._id}')"><i class="${book.isFavorite ? 'ri-heart-fill' : 'ri-heart-line'}"></i></button>
                <button class="btn-history" onclick="viewHistory('${book._id}')"><i class="ri-history-line"></i></button>
                ${deleteBtn}
            </div>
        `;
        list.appendChild(card);
    });
}

// === Actions ===
let pendingBookId = null;

window.toggleBookStatus = async (id) => {
    const book = myLibrary.find(b => b._id === id);
    if (!book) return;

    if (book.status === 'available') {
        if (currentUser.role === 'guest') {
            document.getElementById('guestModal').style.display = 'flex';
            return;
        }
        pendingBookId = id;
        document.getElementById('borrowerNameInput').value = '';
        document.getElementById('borrowModal').style.display = 'flex';
        document.getElementById('borrowerNameInput').focus();
    } else {
        await checkinBook(id);
        await initData();
    }
};

document.getElementById('addBookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const bookData = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        isbn: document.getElementById('bookISBN').value,
        description: document.getElementById('bookDescription').value
    };
    if(await addBookToDB(bookData)) {
        await initData();
        document.getElementById('addBookForm').reset();
    }
});

document.getElementById('searchInput').addEventListener('input', () => renderBooks(currentView === 'favorites'));
document.getElementById('filterStatus').addEventListener('change', () => renderBooks(currentView === 'favorites'));

window.toggleFavorite = async (id) => {
    const book = myLibrary.find(b => b._id === id);
    if (book) {
        book.isFavorite = !book.isFavorite;
        renderBooks(currentView === 'favorites');
        await toggleFavoriteInDB(id);
    }
};
window.deleteBook = async (id) => {
    if(confirm('Delete book?')) {
        if(await deleteBookFromDB(id)) await initData();
    }
};
window.resetSystem = async () => {
    if(confirm('Delete ALL books?')) {
        for(const b of myLibrary) await deleteBookFromDB(b._id);
        await initData();
    }
};

// === Modals ===
const closeModals = () => {
    document.getElementById('borrowModal').style.display = 'none';
    document.getElementById('guestModal').style.display = 'none';
    document.getElementById('historyModal').style.display = 'none';
    pendingBookId = null;
};

document.getElementById('confirmBorrowBtn').onclick = async () => {
    const name = document.getElementById('borrowerNameInput').value;
    if (name && pendingBookId) {
        await checkoutBook(pendingBookId, name);
        closeModals();
        await initData();
    }
};

window.viewHistory = async (id) => {
    const data = await fetchBookHistory(id);
    if (data) {
        document.getElementById('modalBookTitle').textContent = data.title;
        document.getElementById('modalBookAuthor').textContent = data.author;
        
        // FIX 2: Reverse history array before rendering so latest is on top
        // .slice() is used to create a copy so we don't mutate the original if we needed it elsewhere
        const reversedHistory = data.history.slice().reverse();

        document.getElementById('modalHistoryList').innerHTML = reversedHistory.map((h, i) => `
            <div class="history-item">
                <div class="history-number">#${data.history.length - i}</div>
                <div class="history-details">
                    <div><strong>Borrower:</strong> ${h.borrower}</div>
                    <div><strong>Date:</strong> ${h.checkoutDate}</div>
                </div>
            </div>`).join('') || '<p>No history</p>';
        document.getElementById('historyModal').style.display = 'flex';
    }
};

document.querySelectorAll('.close-modal, #cancelBorrowBtn').forEach(btn => btn.onclick = closeModals);
window.onclick = (e) => {
    if (e.target.classList.contains('modal')) closeModals();
};

function showNotification(msg, type) {
    const n = document.createElement('div');
    n.className = `notification notification-${type}`;
    n.innerText = msg;
    n.style.cssText = `position:fixed;top:20px;right:20px;padding:15px;background:${type==='success'?'#10b981':'#ef4444'};color:#fff;border-radius:8px;z-index:9999;`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

// === Theme Logic (Header + Settings) ===
function setupTheme() {
    const headerBtn = document.getElementById('headerThemeBtn');
    const settingsBtn = document.getElementById('settingsThemeBtn');
    
    // Check saved theme
    if(localStorage.getItem('theme')==='light') updateThemeUI('light');
    else updateThemeUI('dark');

    // Button Logic
    const toggleTheme = () => {
        const isLight = document.body.classList.contains('light-mode');
        updateThemeUI(isLight ? 'dark' : 'light');
    };

    headerBtn.onclick = toggleTheme;
    settingsBtn.onclick = toggleTheme;
}

function updateThemeUI(theme) {
    const headerIcon = document.querySelector('#headerThemeBtn i');
    const settingsIcon = document.querySelector('#settingsThemeBtn i');
    
    if (theme === 'light') {
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
        if(headerIcon) headerIcon.className = 'ri-moon-line';
        if(settingsIcon) settingsIcon.className = 'ri-moon-line';
    } else {
        document.body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
        if(headerIcon) headerIcon.className = 'ri-sun-line';
        if(settingsIcon) settingsIcon.className = 'ri-sun-line';
    }
}

// === Render Recent Books Widget (Top 4) ===
function renderRecentWidget() {
    const container = document.getElementById('recentBooksGrid');
    if (!container) return;

    container.innerHTML = '';
    
    // Get the first 4 books (since array is already reversed, these are the newest)
    const recentBooks = myLibrary.slice(0, 4);

    if (recentBooks.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted)">No books added yet.</p>';
        return;
    }

    recentBooks.forEach(book => {
        const div = document.createElement('div');
        div.className = 'mini-card';
        
        // Determine button style
        const btnClass = book.status === 'checked-out' ? 'btn-checkin' : 'btn-checkout';
        const btnText = book.status === 'checked-out' ? 'Return' : 'Borrow';
        const badgeColor = book.status === 'checked-out' ? 'var(--danger)' : 'var(--success)';

        div.innerHTML = `
            <div class="book-title" title="${book.title}">${book.title}</div>
            <div class="book-author">by ${book.author}</div>
            <div class="mini-footer">
                <span style="color:${badgeColor}; font-size: 11px; font-weight:bold; text-transform:uppercase;">
                    ${book.status.replace('-', ' ')}
                </span>
                <button class="mini-btn ${btnClass}" onclick="toggleBookStatus('${book._id}')">
                    ${btnText}
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

initAuth();