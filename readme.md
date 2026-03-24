# MyLibrary

A full-stack web application built with Node.js/Express, React, and PostgreSQL featuring user authentication and profile management.

## Tech Stack

- **Backend:** Node.js, Express, PostgreSQL
- **Frontend:** React (Vite), React Router, Axios, React Hook Form
- **Auth:** JWT-based authentication with bcrypt password hashing

## Project Structure

```
backend/
├── src/
│   ├── app.js                  # Express entry point
│   ├── config/
│   │   ├── index.js            # Environment variable config
│   │   └── database.js         # PostgreSQL connection pool
│   ├── controllers/
│   │   ├── authController.js   # Register & login handlers
│   │   ├── addressController.js
│   │   └── paymentController.js
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_addresses.sql
│   │   └── 003_create_payment_methods.sql
│   ├── models/
│   │   ├── User.js
│   │   ├── Address.js
│   │   └── PaymentMethod.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── address.js
│   │   └── payment.js
│   └── utils/
│       └── auth.js             # Password hashing, JWT helpers, validation schemas
frontend/
├── src/
│   ├── App.jsx                 # Root component with routing
│   ├── components/
│   │   ├── AddressForm.jsx
│   │   ├── AddressList.jsx
│   │   ├── PaymentMethodForm.jsx
│   │   ├── PaymentMethodList.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx     # Auth state management
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── Profile.jsx
│   └── services/
│       └── api.js              # Axios API client
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)

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
   ```

4. Verify the tables were created:
   ```bash
   psql -U mylibrary_user -d mylibrary -c "\dt"
   ```
   You should see `users`, `addresses`, and `payment_methods` tables listed.

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mylibrary
DB_USER=mylibrary_user
DB_PASSWORD=yourpassword
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

Start the server:
```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend connects to `http://localhost:3001/api` by default. Override with the `VITE_API_URL` environment variable.

## API Endpoints

### Auth (public)
| Method | Endpoint             | Description       |
|--------|----------------------|-------------------|
| POST   | `/api/auth/register` | Create account    |
| POST   | `/api/auth/login`    | Login, returns JWT|

### Addresses (protected)
| Method | Endpoint            | Description      |
|--------|---------------------|------------------|
| GET    | `/api/addresses`    | List addresses   |
| POST   | `/api/addresses`    | Create address   |
| PUT    | `/api/addresses/:id`| Update address   |
| DELETE | `/api/addresses/:id`| Delete address   |

### Payment Methods (protected)
| Method | Endpoint           | Description           |
|--------|--------------------|-----------------------|
| GET    | `/api/payments`    | List payment methods  |
| POST   | `/api/payments`    | Add payment method    |
| PUT    | `/api/payments/:id`| Update payment method |
| DELETE | `/api/payments/:id`| Delete payment method |

Protected endpoints require an `Authorization: Bearer <token>` header.
