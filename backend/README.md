# Bondify Backend API

A comprehensive Node.js + Express backend for the Bondify dating application.

## Features

- 🔐 **Authentication**: JWT-based authentication with OTP verification
- 👤 **User Profiles**: Complete profile management with onboarding flow
- 💑 **Matching System**: Swipe-based discovery with mutual matching
- 💬 **Messaging**: Real-time messaging between matched users
- 🔍 **Advanced Discovery**: Filter by age, location, interests, lifestyle preferences
- 📊 **Lookup Data**: Centralized reference data (interests, religions, etc.)
- 🛡️ **Security**: Rate limiting, helmet, CORS protection
- 📱 **Mobile Ready**: Optimized for React Native mobile apps

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure your settings:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/bondify
JWT_SECRET=your-secret-key-change-in-production
```

4. Start MongoDB:
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas connection string in .env
```

5. Seed lookup data:
```bash
npm run seed
```

6. Start the development server:
```bash
npm run dev
```

The server will start at `http://localhost:5000`

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "phoneNumber": "1234567890",
  "countryCode": "+1"
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Profile Endpoints

#### Get My Profile
```http
GET /api/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PATCH /api/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "age": 28,
  "bio": "Love traveling and photography",
  "interests": ["travel", "photography", "cooking"],
  "location": {
    "coordinates": [-122.4194, 37.7749],
    "city": "San Francisco",
    "state": "California",
    "country": "USA"
  }
}
```

#### Complete Onboarding
```http
POST /api/profile/complete-onboarding
Authorization: Bearer <token>
```

#### Get User Profile by ID
```http
GET /api/profile/:id
Authorization: Bearer <token>
```

### Discovery Endpoints

#### Get Discovery Profiles
```http
GET /api/discover?minAge=25&maxAge=35&maxDistance=50&gender=female
Authorization: Bearer <token>
```

Query Parameters:
- `minAge`: Minimum age filter
- `maxAge`: Maximum age filter
- `maxDistance`: Maximum distance in kilometers
- `gender`: Gender preference
- `religion`: Religion filter
- `ethnicity`: Ethnicity filter
- `drinking`: Drinking habits filter
- `smoking`: Smoking habits filter
- `interests`: Interests filter (can be array)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)

#### Perform Action (Like/Pass)
```http
POST /api/discover/action
Authorization: Bearer <token>
Content-Type: application/json

{
  "likedUserId": "507f1f77bcf86cd799439011",
  "type": "like"
}
```

Types: `like`, `superlike`, `pass`

### Match Endpoints

#### Get All Matches
```http
GET /api/matches
Authorization: Bearer <token>
```

#### Get Single Match
```http
GET /api/matches/:id
Authorization: Bearer <token>
```

#### Unmatch User
```http
DELETE /api/matches/:id
Authorization: Bearer <token>
```

### Message Endpoints

#### Get Messages for Match
```http
GET /api/messages/:matchId
Authorization: Bearer <token>
```

#### Send Message
```http
POST /api/messages/:matchId
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hey! How are you?",
  "type": "text"
}
```

#### Delete Message
```http
DELETE /api/messages/:messageId
Authorization: Bearer <token>
```

### Lookup Endpoints

#### Get Lookups by Type
```http
GET /api/lookup?type=interests
```

Available types:
- `interests`
- `religions`
- `ethnicities`
- `languages`
- `education`
- `zodiac`
- `personalities`
- `family-plans`

#### Get All Lookup Types
```http
GET /api/lookup/types
```

## Database Models

### User
- Authentication (email, password, OTP)
- Basic info (name, age, gender, bio)
- Location (coordinates, city, country)
- Physical attributes (height, ethnicity)
- Professional (occupation, education)
- Lifestyle (religion, drinking, smoking, exercise)
- Preferences (looking for, communication style)
- Interests and personalities
- Profile media (images)
- Verification and premium status

### Match
- Two users (user1, user2)
- Match status (pending, matched, unmatched)
- Match timestamp
- Last message timestamp

### Message
- Match reference
- Sender and receiver
- Content and type
- Read/delivered status

### Like
- User and liked user
- Type (like, superlike, pass)

### Lookup
- Type and value
- Label and category
- Order and active status

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js       # MongoDB connection
│   │   ├── jwt.js            # JWT utilities
│   │   └── otp.js            # OTP generation
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── profileController.js
│   │   ├── discoverController.js
│   │   ├── matchController.js
│   │   ├── messageController.js
│   │   └── lookupController.js
│   ├── middleware/
│   │   ├── auth.js           # Authentication middleware
│   │   ├── errorHandler.js   # Global error handler
│   │   └── validation.js     # Request validation
│   ├── models/
│   │   ├── User.js
│   │   ├── Match.js
│   │   ├── Message.js
│   │   ├── Like.js
│   │   └── Lookup.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── profileRoutes.js
│   │   ├── discoverRoutes.js
│   │   ├── matchRoutes.js
│   │   ├── messageRoutes.js
│   │   └── lookupRoutes.js
│   ├── seeders/
│   │   └── seedLookups.js    # Seed reference data
│   └── server.js             # Main application file
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Scripts

```bash
# Start production server
npm start

# Start development server with auto-reload
npm run dev

# Seed lookup data
npm run seed
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment mode | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/bondify |
| JWT_SECRET | JWT signing secret | - |
| JWT_EXPIRES_IN | JWT expiration time | 30d |
| ONBOARDING_TOKEN_EXPIRES_IN | Onboarding token expiration | 7d |
| OTP_EXPIRES_IN | OTP expiration in minutes | 10 |
| OTP_LENGTH | OTP code length | 6 |
| CORS_ORIGIN | CORS allowed origins | * |

## Security Features

- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on auth endpoints
- ✅ Helmet security headers
- ✅ CORS protection
- ✅ Input validation and sanitization
- ✅ MongoDB injection prevention

## Testing

Check server health:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Development Tips

1. **OTP Testing**: During development, OTP codes are logged to console
2. **Database Reset**: Delete MongoDB database to start fresh
3. **Seed Data**: Run `npm run seed` after database reset
4. **Token Debug**: Check JWT tokens at [jwt.io](https://jwt.io)

## Future Enhancements

- [ ] Socket.io for real-time messaging
- [ ] Email/SMS OTP delivery integration
- [x] Image upload with AWS S3
- [ ] Push notifications
- [ ] Advanced matching algorithm
- [ ] Community features
- [ ] Payment integration for premium features
- [ ] Admin dashboard
- [ ] Analytics and reporting

## Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongosh

# Or check your MONGODB_URI in .env
```

### Port Already in Use
```bash
# Change PORT in .env or kill process on port 5000
lsof -ti:5000 | xargs kill
```

### OTP Not Received
During development, OTP codes are logged to console. Check terminal output.

## CloudFront CDN Setup (Optional)

For faster global asset delivery, you can set up AWS CloudFront CDN to serve S3 assets. This can reduce latency by 100-200ms and lower costs.

### Quick Setup

1. **Run the deployment script**:
   ```bash
   cd ..
   ./deploy-cloudfront.sh
   ```

2. **Update environment variables**:
   ```bash
   # Add to your .env file
   AWS_CLOUDFRONT_DOMAIN=https://YOUR_DISTRIBUTION_ID.cloudfront.net
   ```

3. **Redeploy your backend** to use CloudFront URLs.

### Manual Setup

See [CLOUDFRONT_SETUP.md](../CLOUDFRONT_SETUP.md) for detailed instructions.

### Benefits

- ⚡ **Faster loading**: Assets served from global edge locations
- 💰 **Cost savings**: Reduced S3 data transfer costs
- 🛡️ **DDoS protection**: Built-in protection against attacks
- 📊 **Analytics**: Detailed usage and performance metrics

## Support

For issues and questions:
- Create an issue in the repository
- Contact the development team

## License

ISC
