# 🚀 Shortify | Next-Gen URL Shortener

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-1A202C.svg)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg)](https://www.postgresql.org/)

**Shortify** is a blazing fast, highly scalable, and modern URL shortener built with a robust backend architecture and a beautiful glassmorphism frontend. It features secure authentication, Redis-backed extreme-speed caching, and background analytics tracking.

---

## ✨ Features

- **Link Shortening**: Instantly convert long, unwieldy URLs into compact, shareable links using collision-resistant `nanoid` generation.
- **Expiry Management**: Set precise expiration dates for your links. Once expired, links immediately return a `410 Gone`.
- **Advanced Authentication**: Secure JWT-based registration, login, and token-refresh endpoints.
- **High-Speed Redirects**: Engineered with a Redis caching layer to handle massive traffic spikes without hitting the primary database.
- **Real-Time Analytics**: Non-blocking (fire-and-forget) click tracking that logs IP addresses (hashed for privacy) and user agents.
- **Stunning Frontend**: A responsive, vanilla JS single-page application featuring dark mode, glassmorphism UI, and toast notifications.
- **Rate-Limiting & Security**: Built-in protection using `express-rate-limit` and `helmet` to prevent brute force attacks and spam.

## 🏗️ Architecture Stack

### Backend
- **Runtime**: Node.js & Express v5
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL (Relational Data)
- **ORM**: Prisma (Type-safe DB interactions)
- **Cache**: Redis (Lightning-fast reads)
- **Security**: bcryptjs (Password hashing), JWT (Auth), Helmet

### Frontend
- **Design System**: Vanilla HTML5 / CSS3
- **Aesthetic**: Glassmorphism, Animated CSS Gradients (`Outfit` font family)
- **Logic**: Vanilla ES6 JavaScript using the Fetch API

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- Node.js (v18+)
- Docker & Docker Compose (for spinning up Postgres and Redis)

### 1. Clone the repository
```bash
git clone https://github.com/Aadithyan27/Shortify.git
cd Shortify
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Spin up Infrastructure
Start the required PostgreSQL and Redis instances using Docker:
```bash
docker-compose up -d
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory (or ensure the existing one matches):
```env
PORT=3000
DATABASE_URL="postgresql://shortify_user:shortify_password@localhost:5432/shortify_db?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="1d"
```

### 5. Setup the Database
Push the Prisma schema to synchronize your PostgreSQL database:
```bash
npx prisma db push
```
Generate the Prisma Client:
```bash
npx prisma generate
```

### 6. Start the Server
Run the development server natively:
```bash
npm run dev
```

The application will now be running on `http://localhost:3000/`.

---

## 💻 Usage & Endpoints

### The Web Application
Navigate to `http://localhost:3000/` in your browser. 
1. Create an account via the **Register** tab.
2. Paste your long URL to shorten it.
3. Share the short link, and click **Stats** to view click analytics in real-time.

### REST API Documentation

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/auth/register` | Create a new user account | ❌ |
| `POST` | `/auth/login` | Authenticate and receive JWT | ❌ |
| `POST` | `/auth/refresh` | Refresh an expired JWT | ❌ |
| `POST` | `/urls` | Create a shortened URL | ✅ |
| `GET` | `/urls` | Retrieve all user's URLs | ✅ |
| `DELETE` | `/urls/:id` | Delete a specific URL | ✅ |
| `GET` | `/urls/:id/analytics`| Fetch click metrics for a URL | ✅ |
| `GET` | `/:shortCode` | Redirect to the original URL | ❌ |

---

## 🛡️ License
This project is licensed under the ISC License.
