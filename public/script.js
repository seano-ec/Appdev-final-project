const API_BASE_URL = '/api';
let currentUser = null;
let authToken = null;

const loginView = document.getElementById('loginView');
const appView = document.getElementById('appView');
const userSelect = document.getElementById('userSelect');
const passwordSection = document.getElementById('passwordSection');
const usernameSection = document.getElementById('usernameSection');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const guestLoginBtn = document.getElementById('guestLoginBtn');
const createAccountBtn = document.getElementById('createAccountBtn');
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

// === AUTH HELPER ===
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

// === API Functions ===
async function fetchBooks() {
    try {
        const response = await fetch(`${API_BASE_URL}/books`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed');
        myLibrary = await response.json();
        return myLibrary;
    } catch (err) {
        showNotification('Failed to fetch books', 'error');
        return [];
    }
}

async function addBookToDB(bookData) {
    try {
        const response = await fetch(`${API_BASE_URL}/books`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(bookData)
        });
        if (!response.ok) throw new Error('Failed');
        showNotification('Book added!', 'success');
        return await response.json();
    } catch (err) {
        showNotification('Failed to add book', 'error');
        return null;
    }
}

async function checkoutBook(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}/checkout`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }
        return await response.json();
    } catch (err) {
        showNotification(err.message || 'Failed to checkout', 'error');
        return null;
    }
}

async function checkinBook(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}/checkin`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed');
        return await response.json();
    } catch (err) {
        showNotification('Failed to return', 'error');
        return null;
    }
}

async function deleteBookFromDB(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed');
        return true;
    } catch (err) {
        showNotification('Failed to delete', 'error');
        return false;
    }
}

async function fetchBookHistory(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}/history`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (err) {
        return null;
    }
}

async function clearBookHistory(id) {
    try {
        await fetch(`${API_BASE_URL}/books/${id}/history`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return await fetchBookHistory(id);
    } catch (err) {
        return null;
    }
}

async function toggleFavoriteInDB(id) {
    try {
        await fetch(`${API_BASE_URL}/books/${id}/favorite`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
    } catch (err) {}
}

async function registerUser(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return { success: true, message: data.message };
    } catch (err) {
        return { success: false, message: err.message };
    }
}

async function loginUser(username, password, role) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return { success: true, token: data.token, user: data.user };
    } catch (err) {
        return { success: false, message: err.message };
    }
}

// === AUTHENTICATION LOGIC ===

function initAuth() {
    const savedToken = localStorage.getItem('bookbase_token');
    const savedUser = localStorage.getItem('bookbase_user');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        loadApp();
    } else {
        loginView.classList.remove('hidden');
        appView.classList.add('hidden');
    }
}

userSelect.addEventListener('change', () => {
    loginError.classList.add('hidden');
    loginUsername.value = '';
    loginPassword.value = '';
    
    const role = userSelect.value;
    
    if (role === 'admin') {
        usernameSection.classList.remove('hidden');
        passwordSection.classList.remove('hidden');
        loginUsername.placeholder = 'Username: admin';
        loginPassword.placeholder = 'Password: admin123';
    } else if (role === 'user') {
        usernameSection.classList.remove('hidden');
        passwordSection.classList.remove('hidden');
        loginUsername.placeholder = 'Enter your username';
        loginPassword.placeholder = 'Enter your password';
    } else {
        usernameSection.classList.add('hidden');
        passwordSection.classList.add('hidden');
    }
});

loginBtn.addEventListener('click', async () => {
    const role = userSelect.value;
    if (!role) {
        showNotification('Please select a user type', 'error');
        return;
    }

    const username = loginUsername.value.trim();
    const password = loginPassword.value;

    if (role === 'guest') {
        const result = await loginUser('', '', 'guest');
        if (result.success) {
            handleLoginSuccess(result.token, result.user);
        }
        return;
    }

    if (!username || !password) {
        loginError.textContent = 'Username and password required';
        loginError.classList.remove('hidden');
        return;
    }

    const result = await loginUser(username, password, role);
    if (result.success) {
        handleLoginSuccess(result.token, result.user);
    } else {
        loginError.textContent = result.message;
        loginError.classList.remove('hidden');
    }
});

guestLoginBtn.addEventListener('click', async () => {
    const result = await loginUser('', '', 'guest');
    if (result.success) {
        handleLoginSuccess(result.token, result.user);
    }
});

createAccountBtn.addEventListener('click', () => {
    const modal = document.getElementById('registerModal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    // Force modal to be on top of login screen
    modal.style.zIndex = '3000';
    document.getElementById('registerUsername').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerConfirmPassword').value = '';
    document.getElementById('registerError').classList.add('hidden');
});

document.getElementById('confirmRegisterBtn').addEventListener('click', async () => {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const errorEl = document.getElementById('registerError');

    if (!username || !password || !confirmPassword) {
        errorEl.textContent = 'All fields are required';
        errorEl.classList.remove('hidden');
        return;
    }

    if (password !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match';
        errorEl.classList.remove('hidden');
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters';
        errorEl.classList.remove('hidden');
        return;
    }

    const result = await registerUser(username, password);
    if (result.success) {
        document.getElementById('registerModal').style.display = 'none';
        showNotification('Account created! Please login.', 'success');
        userSelect.value = 'user';
        userSelect.dispatchEvent(new Event('change'));
    } else {
        errorEl.textContent = result.message;
        errorEl.classList.remove('hidden');
    }
});

function handleLoginSuccess(token, user) {
    authToken = token;
    currentUser = user;
    localStorage.setItem('bookbase_token', token);
    localStorage.setItem('bookbase_user', JSON.stringify(user));
    loadApp();
}

window.logout = () => {
    localStorage.removeItem('bookbase_token');
    localStorage.removeItem('bookbase_user');
    location.reload();
};

function loadApp() {
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
    
    userNameDisplay.textContent = currentUser.username || currentUser.name || 'User';
    userAvatarImg.src = currentUser.avatar || 'https://ui-avatars.com/api/?name=Guest&background=6b7280&color=fff'; 

    // === ROLE BASED PERMISSIONS ===
    if (currentUser.role === 'admin') {
        navDashboard.style.display = 'block';
        navSettings.style.display = 'block';
        resetSystemSection.style.display = 'flex';
        
        switchView('dashboard');
        setActiveNav(navDashboard); 
    } 
    else if (currentUser.role === 'user') {
        navDashboard.style.display = 'none';
        navSettings.style.display = 'block';
        resetSystemSection.style.display = 'none';
        
        switchView('library');
        setActiveNav(navLibrary);  
    } 
    else if (currentUser.role === 'guest') {
        navDashboard.style.display = 'none';
        navSettings.style.display = 'none';
        
        switchView('library');
        setActiveNav(navLibrary);   
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
    navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navDashboard);
        switchView('dashboard');
    });
    navLibrary.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navLibrary);
        switchView('library');
    });
    navFavorites.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navFavorites);
        switchView('favorites');
    });
    navSettings.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navSettings);
        switchView('settings');
    });
    navLogout.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Logout?')) logout();
    });
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

    dashboardContent.style.display = 'none';
    librarySection.style.display = 'block';

    if (viewName === 'dashboard') {
        dashboardContent.style.display = 'block';
        renderBooks();
    } else if (viewName === 'library') {
        collectionTitle.innerHTML = '<i class="ri-book-2-line"></i> My Full Library';
        renderBooks();
    } else if (viewName === 'favorites') {
        collectionTitle.innerHTML = '<i class="ri-heart-fill" style="color:#ef4444"></i> Favorite Books';
        renderBooks(true);
    } else if (viewName === 'settings') {
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
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) || 
                            book.author.toLowerCase().includes(searchTerm);
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
        
        // Only show delete button for admin
        const deleteBtn = currentUser.role === 'admin'
            ? `<button class="btn-delete" onclick="deleteBook('${book._id}')"><i class="ri-delete-bin-line"></i></button>`
            : '';
        
        // Only show history button for admin
        const historyBtn = currentUser.role === 'admin'
            ? `<button class="btn-history" onclick="viewHistory('${book._id}')"><i class="ri-history-line"></i></button>`
            : '';

        card.innerHTML = `
            <div class="book-header">
                <div class="book-title">${book.title}</div>
                <span class="status-badge ${book.status}">${book.status}</span>
            </div>
            <div class="book-author">by ${book.author}</div>
            <div class="book-description">${book.description}</div>
            ${book.checkedOutByUsername ? `<div class="book-borrower">Borrowed by: ${book.checkedOutByUsername}</div>` : ''}
            <div class="book-actions">
                <button class="${btnClass}" onclick="toggleBookStatus('${book._id}')">${btnText}</button>
                <button class="btn-fav ${book.isFavorite ? 'is-favorite' : ''}" onclick="toggleFavorite('${book._id}')"><i class="${book.isFavorite ? 'ri-heart-fill' : 'ri-heart-line'}"></i></button>
                ${historyBtn}
                ${deleteBtn}
            </div>
        `;
        list.appendChild(card);
    });
}

// === Actions ===
window.toggleBookStatus = async (id) => {
    const book = myLibrary.find(b => b._id === id);
    if (!book) return;

    if (book.status === 'available') {
        // Checkout - no prompt needed, uses logged-in user
        if (currentUser.role === 'guest') {
            document.getElementById('guestModal').style.display = 'flex';
            return;
        }
        await checkoutBook(id);
        await initData();
    } else {
        // Check in
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
    if (await addBookToDB(bookData)) {
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
    if (confirm('Delete book?')) {
        if (await deleteBookFromDB(id)) await initData();
    }
};

window.resetSystem = async () => {
    if (confirm('Delete ALL books?')) {
        for (const b of myLibrary) await deleteBookFromDB(b._id);
        await initData();
    }
};

// === Modals ===
const closeRegisterModal = () => {
    const modal = document.getElementById('registerModal');
    modal.style.display = 'none';
    modal.classList.add('hidden');
    modal.style.zIndex = '1000'; // Reset z-index
};

const closeGuestModal = () => {
    const modal = document.getElementById('guestModal');
    modal.style.display = 'none';
    modal.classList.add('hidden');
};

const closeHistoryModal = () => {
    const modal = document.getElementById('historyModal');
    modal.style.display = 'none';
    modal.classList.add('hidden');
};

window.viewHistory = async (id) => {
    const data = await fetchBookHistory(id);
    if (data) {
        document.getElementById('modalBookTitle').textContent = data.title;
        document.getElementById('modalBookAuthor').textContent = data.author;

        const reversedHistory = data.history.slice().reverse();

        document.getElementById('modalHistoryList').innerHTML = reversedHistory.map((h, i) => `
            <div class="history-item">
                <div class="history-number">#${data.history.length - i}</div>
                <div class="history-details">
                    <div><strong>Borrower:</strong> ${h.borrower}</div>
                    <div><strong>Date:</strong> ${h.checkoutDate}</div>
                </div>
            </div>`).join('') || '<p>No history</p>';
        
        // Properly show the modal - remove hidden class AND set display
        const modal = document.getElementById('historyModal');
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
};
// Setup modal close buttons
function setupModalListeners() {
    // Register modal close buttons
    const registerCloseBtn = document.querySelector('#registerModal .close-modal');
    if (registerCloseBtn) registerCloseBtn.onclick = closeRegisterModal;
    
    const cancelRegisterBtn = document.getElementById('cancelRegisterBtn');
    if (cancelRegisterBtn) cancelRegisterBtn.onclick = closeRegisterModal;
    
    // Guest modal close buttons
    const guestCloseBtn = document.querySelector('#guestModal .close-modal');
    if (guestCloseBtn) guestCloseBtn.onclick = closeGuestModal;
    
    // History modal close buttons
    const historyCloseBtn = document.querySelector('#historyModal .close-modal');
    if (historyCloseBtn) historyCloseBtn.onclick = closeHistoryModal;
}

// Close modals when clicking outside
window.onclick = (e) => {
    if (e.target.id === 'registerModal') closeRegisterModal();
    if (e.target.id === 'guestModal') closeGuestModal();
    if (e.target.id === 'historyModal') closeHistoryModal();
};

function showNotification(msg, type) {
    const n = document.createElement('div');
    n.className = `notification notification-${type}`;
    n.innerText = msg;
    n.style.cssText = `position:fixed;top:20px;right:20px;padding:15px;background:${type === 'success' ? '#10b981' : '#ef4444'};color:#fff;border-radius:8px;z-index:9999;`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

// Initialize modal listeners when DOM is ready
setupModalListeners();

// === Theme Logic ===
function setupTheme() {
    const headerBtn = document.getElementById('headerThemeBtn');
    const settingsBtn = document.getElementById('settingsThemeBtn');

    if (localStorage.getItem('theme') === 'light') updateThemeUI('light');
    else updateThemeUI('dark');

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
        if (headerIcon) headerIcon.className = 'ri-moon-line';
        if (settingsIcon) settingsIcon.className = 'ri-moon-line';
    } else {
        document.body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
        if (headerIcon) headerIcon.className = 'ri-sun-line';
        if (settingsIcon) settingsIcon.className = 'ri-sun-line';
    }
}

// === Render Recent Books Widget ===
function renderRecentWidget() {
    const container = document.getElementById('recentBooksGrid');
    if (!container) return;

    container.innerHTML = '';

    const recentBooks = myLibrary.slice(0, 4);

    if (recentBooks.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted)">No books added yet.</p>';
        return;
    }

    recentBooks.forEach(book => {
        const div = document.createElement('div');
        div.className = 'mini-card';

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