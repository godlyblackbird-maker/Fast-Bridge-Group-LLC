# FAST BRIDGE GROUP - Secure Authentication Setup

## Overview
A secure backend authentication system has been set up for your FAST BRIDGE GROUP dashboard with the following features:

✅ **Secure Features:**
- Database: SQLite (database.db)
- Password Hashing: bcrypt (10 rounds)
- Authentication: JWT (JSON Web Tokens)
- CORS enabled for frontend communication
- Role-based access control (admin, user)
- Session management with last login tracking

---

## Admin Account Created
- **Name:** Isaac Haro
- **Email:** isaac.haro@fastbridgegroupllc.com
- **Password:** 315598
- **Role:** Admin

---

## Installation & Setup Instructions

### Step 1: Install Node.js
Download and install Node.js from: https://nodejs.org/
(Choose LTS version for stability)

### Step 2: Open Terminal/Command Prompt
Navigate to your project directory:
```bash
cd c:\Users\isaac\Desktop\JsCode2
```

### Step 3: Install Dependencies
Run the following command to install all required packages:
```bash
npm install
```

This will install:
- express (web framework)
- sqlite3 (database)
- bcrypt (password hashing)
- jwt (authentication tokens)
- cors (cross-origin requests)
- dotenv (environment variables)

### Step 4: Start the Server
Run the server with:
```bash
npm start
```

Or for development mode (with auto-reload):
```bash
npm run dev
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║     FAST BRIDGE GROUP Dashboard - Secure Server              ║
║                  Running on port 3000                       ║
╚════════════════════════════════════════════════════════════╝
```

### Step 5: Access the Dashboard
Open your browser and go to:
```
http://localhost:3000
```

Click "Sign In" and use:
- **Email:** isaac.haro@fastbridgegroupllc.com
- **Password:** 315598

---

## API Endpoints

### 1. Login
**POST** `/api/login`
```json
{
  "email": "isaac.haro@fastbridgegroupllc.com",
  "password": "315598"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "name": "Isaac Haro",
    "email": "isaac.haro@fastbridgegroupllc.com",
    "role": "admin"
  }
}
```

### 2. Verify Token
**POST** `/api/verify`
Headers: `Authorization: Bearer <token>`

### 3. Register New User
**POST** `/api/register`
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "secure_password_here"
}
```

### 4. Get All Users (Admin only)
**GET** `/api/users`
Headers: `Authorization: Bearer <token>`

---

## Security Highlights

### 1. Password Hashing
- Passwords are hashed using bcrypt with 10 rounds
- Original password is NEVER stored in the database
- Each password hash is unique (salted)

### 2. JWT Authentication
- Tokens expire after 24 hours
- Tokens contain user information (id, email, role, name)
- Token verification prevents unauthorized access

### 3. Database Security
- SQLite database stores only hashed passwords
- User roles control access to admin endpoints
- SQL injection is prevented through parameterized queries

### 4. CORS Protection
- Only configured origins can access the API
- Prevents unauthorized cross-site requests

---

## Database Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',    -- 'admin' or 'user'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
)
```

---

## Adding More Users (Admin)

You can add more users through the `/api/register` endpoint or directly in the database.

### Via API:
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

---

## Environment Configuration

Edit `.env` file to customize:
- **PORT:** Server port (default: 3000)
- **JWT_SECRET:** Change this in production!
- **DATABASE:** Path to SQLite database
- **OPENAI_API_KEY:** Server-side key for the dashboard AI helper
- **OPENAI_MODEL:** OpenAI model name for the AI helper (default: `gpt-5-nano`)

⚠️ **IMPORTANT FOR PRODUCTION:**
- Change `JWT_SECRET` to a long random string
- Use environment variables for sensitive data
- Enable HTTPS/SSL
- Use a production database
- Set strong password policies

---

## Frontend Integration

The login page automatically:
1. Sends credentials to `/api/login`
2. Receives and stores JWT token in localStorage
3. Redirects to dashboard on successful login
4. Shows error messages on failed login

The dashboard pages can check authentication using:
```javascript
const token = localStorage.getItem('authToken');
const user = getCurrentUser();  // from login.js

if (!token) {
  // Redirect to login
  window.location.href = '/login.html';
}
```

---

## Troubleshooting

### "npm: command not found"
- Node.js is not installed or not in PATH
- Reinstall Node.js and restart terminal

### "Port 3000 already in use"
- Change PORT in `.env` file
- Or kill process using port: `netstat -ano | findstr :3000`

### Database errors
- Delete `database.db` and restart server to reinitialize
- Make sure you have write permissions in the folder

### Login fails
- Check email and password are correct
- Verify server is running (check console)
- Clear browser cache and localStorage

---

## Files Created/Modified

```
JsCode2/
├── server.js                  (NEW - Backend server)
├── login.js                   (NEW - Login handler)
├── package.json               (NEW - Dependencies)
├── .env                       (NEW - Configuration)
├── .gitignore                 (NEW - Git ignore)
├── database.db                (AUTO - Created on first run)
├── login.html                 (MODIFIED - Added form integration)
└── [other HTML files unchanged]
```

---

## Support & Security

🔒 **Security Tips:**
1. Never commit `.env` file to version control
2. Change JWT_SECRET before deployment
3. Use HTTPS in production
4. Implement rate limiting for login attempts
5. Add email verification for new users
6. Implement password reset functionality

For any issues, check the server console for error messages.

---

Generated: March 12, 2026
Dashboard: FAST BRIDGE GROUP
