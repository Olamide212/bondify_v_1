# Bondify Backend - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
The `.env` file is already created with default development settings. MongoDB will connect to `localhost:27017`.

### 3. Start MongoDB
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env with your Atlas connection string
```

### 4. Seed Database
```bash
npm run seed
```

### 5. Start Server
```bash
npm run dev
```

Server will be running at: `http://localhost:5000`

## 🧪 Test the API

### Health Check
```bash
curl http://localhost:5000/health
```

### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Note**: Check your console for the OTP code!

### Verify OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "YOUR_OTP_HERE"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the `token` from the response!

### Update Profile
```bash
curl -X PATCH http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "John Doe",
    "age": 28,
    "gender": "male",
    "bio": "Love traveling and meeting new people",
    "interests": ["travel", "photography", "fitness"]
  }'
```

### Get Lookups
```bash
curl http://localhost:5000/api/lookup?type=interests
```

## 📱 Connect Frontend

Update your React Native `.env`:
```env
EXPO_PUBLIC_DEV_API_BASE_URL=http://localhost:5000/api
```

For physical device testing:
```env
EXPO_PUBLIC_DEV_API_BASE_URL=http://YOUR_LOCAL_IP:5000/api
```

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Check if MongoDB is running: `mongosh`
- Verify MONGODB_URI in `.env`

### Port 5000 Already in Use
- Change PORT in `.env`
- Or kill process: `lsof -ti:5000 | xargs kill`

### Dependencies Installation Failed
- Try: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version: `node -v` (should be v14+)

## 📚 Next Steps

1. ✅ Test all endpoints with Postman or Thunder Client
2. ✅ Connect your React Native app
3. ✅ Configure optional services (email, SMS, Cloudinary)
4. ✅ Review security settings before production deployment

## 🔒 Production Deployment

Before deploying:
1. Change `JWT_SECRET` to a strong random string
2. Update `MONGODB_URI` to production database
3. Set `NODE_ENV=production`
4. Configure CORS_ORIGIN to your frontend domain
5. Enable rate limiting
6. Set up SSL/HTTPS

Recommended platforms:
- **Backend**: Render, Railway, Heroku, DigitalOcean
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary, AWS S3

Happy coding! 🎉
