# FAST BRIDGE GROUP Dashboard - Secure Authentication System

## Quick Start

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Start the Server
```bash
npm start
```

If you are running this in production, set one of these before starting the server so SQLite uses persistent storage instead of the app folder:

```env
DATABASE_PATH=/var/data/database.db
# or
RENDER_DISK_MOUNT_PATH=/var/data
# or
PERSISTENT_STORAGE_PATH=/var/data
# or
DATA_DIR=/var/data
```

If you are using message archive recovery, also set your S3-compatible storage variables and verify them after deploy:

```env
AWS_S3_BUCKET=your-fast-bridge-uploads
AWS_S3_REGION=us-west-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
# Optional for R2/MinIO/other S3-compatible providers:
# AWS_S3_ENDPOINT=https://your-endpoint.example.com
# AWS_S3_FORCE_PATH_STYLE=true
```

Admin runtime verification:
- The server now runs an S3 archive health check on startup and logs whether put/get/delete verification passed.
- An admin can also call `/api/admin/storage-status?verify=1` while signed in to confirm both persistent SQLite usage and live S3 archive access.

### 3️⃣ Open Dashboard
```
http://localhost:3000
```

### 4️⃣ Login with Admin Account
- **Email:** `isaac.haro@fastbridgegroupllc.com`
- **Password:** `315598`

---

## What's Been Set Up

✅ **Backend Server** (`server.js`)
- Express.js server on port 3000
- RESTful API endpoints
- JWT authentication system

✅ **Secure Database** (`database.db`)
- SQLite database
- Users table with hashed passwords
- Admin account pre-created

✅ **Password Security**
- Bcrypt hashing (10 rounds)
- Salted passwords
- No plain-text storage

✅ **Authentication**
- JWT tokens (24-hour expiration)
- Session management
- Role-based access control

✅ **Frontend Integration**
- Login form connected to API
- Automatic token storage
- Auth check on protected pages
- User profile display

---

## Files Created

| File | Purpose |
|------|---------|
| `server.js` | Backend Express server with API endpoints |
| `package.json` | Node.js dependencies |
| `.env` | Environment configuration |
| `login.js` | Frontend login handler |
| `auth.js` | Authentication middleware |
| `database.db` | SQLite database (auto-created) |
| `SETUP_GUIDE.md` | Complete setup documentation |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | User login |
| POST | `/api/register` | Register new user |
| POST | `/api/verify` | Verify JWT token |
| GET | `/api/users` | Get all users (admin only) |

---

## Admin Account Details

```
Name:     Isaac Haro
Email:    isaac.haro@fastbridgegroupllc.com
Password: 315598
Role:     Admin
```

This account is automatically created when the server starts for the first time.

---

## Security Features

🔒 **Password Hashing**
- bcrypt with 10 salt rounds
- Unique hash for each password

🔐 **JWT Authentication**
- Secure token-based authentication
- 24-hour token expiration
- Encoded user information

🛡️ **Database Protection**
- SQLite with parameterized queries
- Prevents SQL injection
- Role-based access control

🌐 **API Security**
- CORS enabled
- Token validation
- Error handling

---

## Development Notes

- **Database:** SQLite (file-based, portable)
- **Production database path:** Required. The server now refuses to boot in production unless `DATABASE_PATH`, `RENDER_DISK_MOUNT_PATH`, `PERSISTENT_STORAGE_PATH`, or `DATA_DIR` points to persistent storage.
- **Port:** 3000 (configurable in `.env`)
- **JWT Secret:** Change in production!
- **AI Model:** Set `OPENAI_MODEL` in `.env` if you want something other than `gpt-5-nano`
- **AI Key:** Set `OPENAI_API_KEY` in `.env` for the dashboard AI helper
- **Node Version:** v14+ recommended

---

## Troubleshooting

### Port Already in Use
Edit `.env` and change `PORT=3000` to another port

### Database Issues
Delete `database.db` and restart server

### Login Not Working
Verify server is running: check console output

---

## Next Steps

1. ✅ Secure authentication setup complete
2. 📧 Consider adding email verification
3. 🔑 Implement password reset functionality
4. 📊 Add user management dashboard
5. 🚀 Deploy to production

---

**Created:** March 12, 2026  
**Dashboard:** FAST BRIDGE GROUP  
**Status:** ✅ Ready for Use
