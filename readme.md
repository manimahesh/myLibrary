# MyLibrary

A full-stack web application built with Node.js/Express, React, and PostgreSQL featuring user authentication, a bookstore browsing experience, wishlist management, and personal book summaries.

## Tech Stack

- **Backend:** Node.js, Express, PostgreSQL
- **Frontend:** React (Vite), React Router, Axios, React Hook Form
- **Auth:** JWT-based authentication with bcrypt password hashing
- **External APIs:** NYT Books API, Google Books API

## Project Structure

```
backend/
├── src/
│   ├── app.js                        # Express entry point
│   ├── config/
│   │   ├── index.js                  # Environment variable config
│   │   └── database.js               # PostgreSQL connection pool
│   ├── controllers/
│   │   ├── authController.js         # Register & login handlers
│   │   ├── addressController.js
│   │   ├── paymentController.js
│   │   ├── booksController.js        # NYT & Google Books proxy
│   │   ├── wishlistController.js
│   │   └── bookSummaryController.js
│   ├── middleware/
│   │   └── auth.js                   # JWT verification middleware
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_addresses.sql
│   │   ├── 003_create_payment_methods.sql
│   │   ├── 004_create_wishlists.sql
│   │   └── 005_create_book_summaries.sql
│   ├── models/
│   │   ├── User.js
│   │   ├── Address.js
│   │   ├── PaymentMethod.js
│   │   ├── Wishlist.js
│   │   └── BookSummary.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── address.js
│   │   ├── payment.js
│   │   ├── books.js
│   │   ├── wishlist.js
│   │   └── bookSummary.js
│   ├── services/
│   │   ├── nytBooksService.js        # NYT Books API client
│   │   └── googleBooksService.js     # Google Books API client
│   └── utils/
│       └── auth.js                   # Password hashing, JWT helpers, validation schemas
frontend/
├── src/
│   ├── App.jsx                       # Root component with routing (ProtectedLayout wrapper)
│   ├── components/
│   │   ├── Layout.jsx                # Persistent sidebar shell for all authenticated pages
│   │   ├── ProtectedRoute.jsx        # JWT auth guard
│   │   ├── BookCard.jsx              # Book thumbnail card with wishlist button
│   │   ├── WishlistItem.jsx          # Wishlist row with rating & summary editor
│   │   ├── AddressForm.jsx
│   │   ├── AddressList.jsx
│   │   ├── PaymentMethodForm.jsx
│   │   └── PaymentMethodList.jsx
│   ├── context/
│   │   └── AuthContext.jsx           # Auth state (localStorage token, JWT user)
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Store.jsx                 # Browse NYT bestsellers & Google Books; ?focus=search
│   │   ├── BookDetail.jsx            # Full book info, ratings, add to wishlist
│   │   ├── Wishlist.jsx              # Manage wishlist with ratings & summaries
│   │   └── Profile.jsx               # Addresses & payments tabs via ?tab=payments
│   └── services/
│       └── api.js                    # Axios API client
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)
- NYT Books API key — [developer.nytimes.com](https://developer.nytimes.com/get-started)
- Google Books API key — [console.cloud.google.com](https://console.cloud.google.com/)

### PostgreSQL Installation

**macOS (Homebrew):**
```bash
brew install postgresql@17
brew services start postgresql@17
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**

Download and run the installer from https://www.postgresql.org/download/windows/. The installer includes pgAdmin and sets up PostgreSQL as a service automatically.

### Database Setup

1. Connect to PostgreSQL:
   ```bash
   psql postgres
   ```

2. Create the database and user:
   ```sql
   CREATE USER mylibrary_user WITH PASSWORD 'yourpassword';
   CREATE DATABASE mylibrary OWNER mylibrary_user;
   \q
   ```

3. Run the migrations in order:
   ```bash
   psql -U mylibrary_user -d mylibrary -f backend/src/migrations/001_create_users.sql
   psql -U mylibrary_user -d mylibrary -f backend/src/migrations/002_create_addresses.sql
   psql -U mylibrary_user -d mylibrary -f backend/src/migrations/003_create_payment_methods.sql
   psql -U mylibrary_user -d mylibrary -f backend/src/migrations/004_create_wishlists.sql
   psql -U mylibrary_user -d mylibrary -f backend/src/migrations/005_create_book_summaries.sql
   ```

4. Verify the tables were created:
   ```bash
   psql -U mylibrary_user -d mylibrary -c "\dt"
   ```
   You should see `users`, `addresses`, `payment_methods`, `wishlists`, and `book_summaries` tables listed.

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/manimahesh/myLibrary.git
cd myLibrary
```

### 2. Start the backend

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mylibrary
DB_USER=mylibrary_user
DB_PASSWORD=yourpassword
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
NYT_API_KEY=your_nyt_api_key
GOOGLE_BOOKS_API_KEY=your_google_books_api_key
```

```bash
npm run dev
```

The API will be available at `http://localhost:3001`.

### 3. Start the frontend

Open a new terminal tab:

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

> By default the frontend points to `http://localhost:3001/api`. To use a different backend URL, set `VITE_API_URL` in a `frontend/.env` file:
> ```env
> VITE_API_URL=http://your-backend-url/api
> ```

### Both servers must be running at the same time for the app to work.

## API Endpoints

### Auth (public)
| Method | Endpoint             | Description        |
|--------|----------------------|--------------------|
| POST   | `/api/auth/register` | Create account     |
| POST   | `/api/auth/login`    | Login, returns JWT |

### Addresses (protected)
| Method | Endpoint             | Description      |
|--------|----------------------|------------------|
| GET    | `/api/addresses`     | List addresses   |
| POST   | `/api/addresses`     | Create address   |
| PUT    | `/api/addresses/:id` | Update address   |
| DELETE | `/api/addresses/:id` | Delete address   |

### Payment Methods (protected)
| Method | Endpoint            | Description           |
|--------|---------------------|-----------------------|
| GET    | `/api/payments`     | List payment methods  |
| POST   | `/api/payments`     | Add payment method    |
| PUT    | `/api/payments/:id` | Update payment method |
| DELETE | `/api/payments/:id` | Delete payment method |

### Books (protected)
| Method | Endpoint                   | Description                              |
|--------|----------------------------|------------------------------------------|
| GET    | `/api/books/nyt-top`       | NYT hardcover-fiction top 10             |
| GET    | `/api/books/google-search` | Google Books search (`?q=query`)         |
| GET    | `/api/books/:id`           | Book detail by Google volume ID or ISBN  |

### Wishlist (protected)
| Method | Endpoint            | Description                  |
|--------|---------------------|------------------------------|
| GET    | `/api/wishlist`     | List wishlist items          |
| POST   | `/api/wishlist`     | Add book (`{ book_id }`)     |
| PUT    | `/api/wishlist/:id` | Update rating (`{ rating }`) |
| DELETE | `/api/wishlist/:id` | Remove from wishlist         |

### Book Summaries (protected)
| Method | Endpoint                 | Description                                  |
|--------|--------------------------|----------------------------------------------|
| GET    | `/api/summaries/:bookId` | Get personal summary for a book              |
| POST   | `/api/summaries`         | Create summary (`{ book_id, summary_text }`) |
| PUT    | `/api/summaries/:id`     | Update summary (`{ summary_text }`)          |
| DELETE | `/api/summaries/:id`     | Delete summary                               |

All protected endpoints require an `Authorization: Bearer <token>` header.

## Features

- **Persistent sidebar** — Fixed left navigation shell across all authenticated pages with links to Store, Search, Wishlist, Profile, and Payment Methods
- **Browse** — Search any book via Google Books, view NYT hardcover-fiction bestsellers, and explore curated picks. Navigate to `/store?focus=search` to auto-focus the search bar
- **Book Detail** — Full book info including cover, publication date, page count, description, and aggregated Google Books ratings
- **Wishlist** — Add/remove books, rate them 1–5 stars, and write personal reading notes per book. BookCard reflects existing wishlist state immediately via pre-fetch
- **Profile** — Manage saved addresses and payment methods. Switch between tabs via URL param (`?tab=payments`) so the sidebar Payment Methods link navigates directly to that section
