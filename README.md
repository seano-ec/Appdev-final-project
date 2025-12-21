# BookBase - Library Management System
**BookBase** is a full-stack web application designed to manage book collections efficiently. It features a modern, responsive user interface with real-time database interactions, allowing users to track available books, manage borrowing history, and maintain a personal list of favorites.

---

##  Features

###  User Interface
- **Dashboard Overview:** Real-time statistics on total, available, and checked-out books.
- **Dark/Light Mode:** Toggle between a sleek dark theme and a clean light theme (persisted in local storage).
- **Responsive Design:** Optimized for both desktop and mobile viewing with a collapsible sidebar layout.

###  Library Management
- **Inventory Control:** Add, remove, and delete books from the database.
- **Check-In/Check-Out:** Toggle book status with a single click and track who borrowed it.
- **Borrowing History:** View a detailed log of every action (checkout/return dates) for specific books.

###  Search & Organization
- **Instant Search:** Filter books by title, author, or ISBN in real-time.
- **Smart Filters:** Sort the collection by "Available" or "Checked Out" status.
- **Favorites System:** "Heart" your favorite books to save them to a dedicated view (persisted in MongoDB).

---

##  Tech Stack

**Frontend:**
* HTML5, CSS3 (Custom Variables for Theming)
* Vanilla JavaScript (ES6+)
* Remix Icons (UI Icons)

**Backend:**
* Node.js
* Express.js (REST API)

**Database:**
* MongoDB (Mongoose ODM)

---

##  Installation & Setup

Follow these steps to run the project locally.

### 1. Clone the Repository
git clone [https://github.com/yourusername/Appdev-final-project.git](https://github.com/yourusername/Appdev-final-project.git)
cd bookbase

### 2. Install dependencies
npm install express mongoose cors body-parser

### 3. Open the run.bat file
