# Bondify API Endpoints Reference

Base URL: `http://localhost:5000/api`

## 📋 Table of Contents
- [Authentication](#authentication)
- [Profile Management](#profile-management)
- [Discovery & Matching](#discovery--matching)
- [Matches](#matches)
- [Messaging](#messaging)
- [Lookups](#lookups)

---

## Authentication

### 1. Register User
**POST** `/auth/signup`

Register a new user account and send OTP for verification.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "phoneNumber": "1234567890",
  "countryCode": "+1"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify OTP.",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "onboardingToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note:** OTP is logged to console in development mode.

---

### 2. Verify OTP
**POST** `/auth/verify-otp`

Verify the OTP code sent to user's email/phone.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "onboardingToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "isVerified": true,
      "onboardingCompleted": false
    }
  }
}
```

---

### 3. Resend OTP
**POST** `/auth/resend-otp`

Resend OTP if it expired or wasn't received.

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

---

### 4. Login
**POST** `/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "onboardingToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "username": "johndoe",
      "onboardingCompleted": true,
      "completionPercentage": 85
    }
  }
}
```

---

### 5. Get Current User
**GET** `/auth/me`

Get authenticated user's information.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "age": 28,
      "bio": "Love traveling and photography",
      ...
    }
  }
}
```

---

## Profile Management

### 1. Get My Profile
**GET** `/profile`

Get current user's complete profile.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "age": 28,
      "gender": "male",
      "bio": "Love traveling and photography",
      "interests": ["travel", "photography", "fitness"],
      "images": [
        {
          "url": "https://example.com/image1.jpg",
          "order": 1
        }
      ],
      "completionPercentage": 85,
      "bondScore": 91
    }
  }
}
```

---

### 2. Update Profile
**PATCH** `/profile`

Update user profile fields.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body (all fields optional):**
```json
{
  "name": "John Doe",
  "age": 28,
  "gender": "male",
  "bio": "Love traveling and meeting new people",
  "height": 180,
  "occupation": "Software Engineer",
  "education": "bachelors",
  "religion": "christian",
  "ethnicity": "caucasian",
  "drinking": "socially",
  "smoking": "never",
  "interests": ["travel", "photography", "cooking", "fitness"],
  "personalities": ["adventurous", "creative", "funny"],
  "location": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749],
    "city": "San Francisco",
    "state": "California",
    "country": "USA"
  },
  "languages": ["english", "spanish"],
  "lookingFor": "long-term",
  "communicationStyle": "direct"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": { ... }
  }
}
```

---

### 3. Complete Onboarding
**POST** `/profile/complete-onboarding`

Mark user's onboarding as complete.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "data": {
    "user": {
      "onboardingCompleted": true,
      ...
    }
  }
}
```

---

### 4. Get User Profile by ID
**GET** `/profile/:id`

Get another user's public profile.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Jane Smith",
      "age": 26,
      "bio": "Adventurer and foodie",
      ...
    }
  }
}
```

---

## Discovery & Matching

### 1. Get Discovery Profiles
**GET** `/discover`

Get profiles for swiping/discovery with filters.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `minAge` (number): Minimum age
- `maxAge` (number): Maximum age
- `maxDistance` (number): Maximum distance in km
- `gender` (string): Gender preference
- `religion` (string): Religion filter
- `ethnicity` (string): Ethnicity filter
- `drinking` (string): Drinking habits
- `smoking` (string): Smoking habits
- `interests` (array): Interests filter
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20)

**Example:**
```
GET /discover?minAge=25&maxAge=35&maxDistance=50&gender=female&page=1&limit=20
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "profiles": [
      {
        "id": "507f1f77bcf86cd799439012",
        "name": "Jane Smith",
        "age": 26,
        "images": [...],
        "bio": "Adventurer and foodie",
        "interests": ["travel", "food", "hiking"],
        "bondScore": 87
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

---

### 2. Perform Action (Like/Pass)
**POST** `/discover/action`

Like, superlike, or pass on a user.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "likedUserId": "507f1f77bcf86cd799439012",
  "type": "like"
}
```

**Types:**
- `like`: Regular like
- `superlike`: Super like (special notification)
- `pass`: Pass/swipe left

**Success Response (200) - No Match:**
```json
{
  "success": true,
  "message": "Action recorded successfully",
  "data": {
    "isMatch": false,
    "like": {
      "id": "...",
      "type": "like"
    }
  }
}
```

**Success Response (200) - Match:**
```json
{
  "success": true,
  "message": "It's a match!",
  "data": {
    "isMatch": true,
    "match": {
      "id": "507f1f77bcf86cd799439013",
      "matchedAt": "2024-01-15T10:30:00Z"
    },
    "likedUser": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Jane Smith",
      "images": [...]
    }
  }
}
```

---

## Matches

### 1. Get All Matches
**GET** `/matches`

Get all matched users.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "matchId": "507f1f77bcf86cd799439013",
        "matchedAt": "2024-01-15T10:30:00Z",
        "lastMessageAt": "2024-01-15T14:20:00Z",
        "user": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Jane Smith",
          "age": 26,
          "images": [...],
          "bio": "Adventurer and foodie"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "pages": 1
    }
  }
}
```

---

### 2. Get Single Match
**GET** `/matches/:id`

Get details of a specific match.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "match": {
      "id": "507f1f77bcf86cd799439013",
      "matchedAt": "2024-01-15T10:30:00Z",
      "lastMessageAt": "2024-01-15T14:20:00Z",
      "user": {
        "id": "507f1f77bcf86cd799439012",
        "name": "Jane Smith",
        ...
      }
    }
  }
}
```

---

### 3. Unmatch User
**DELETE** `/matches/:id`

Remove a match (unmatch).

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Unmatched successfully"
}
```

---

## Messaging

### 1. Get Messages
**GET** `/messages/:matchId`

Get all messages for a match.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Messages per page (default: 50)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "507f1f77bcf86cd799439014",
        "sender": {
          "id": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "images": [...]
        },
        "receiver": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Jane Smith",
          "images": [...]
        },
        "content": "Hey! How are you?",
        "type": "text",
        "read": true,
        "readAt": "2024-01-15T14:25:00Z",
        "createdAt": "2024-01-15T14:20:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 23,
      "pages": 1
    }
  }
}
```

---

### 2. Send Message
**POST** `/messages/:matchId`

Send a message in a match.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "content": "Hey! How are you?",
  "type": "text"
}
```

**Message Types:**
- `text`: Text message
- `image`: Image message (with mediaUrl)
- `gif`: GIF message (with mediaUrl)
- `emoji`: Emoji reaction

**Success Response (201):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "id": "507f1f77bcf86cd799439014",
      "content": "Hey! How are you?",
      "type": "text",
      "read": false,
      "delivered": true,
      "createdAt": "2024-01-15T14:20:00Z"
    }
  }
}
```

---

### 3. Delete Message
**DELETE** `/messages/:messageId`

Delete a sent message.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

---

## Lookups

### 1. Get Lookups by Type
**GET** `/lookup?type=interests`

Get lookup/reference data by type.

**Query Parameters:**
- `type` (required): Type of lookup data

**Available Types:**
- `interests`
- `religions`
- `ethnicities`
- `languages`
- `education`
- `zodiac`
- `personalities`
- `family-plans`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "lookups": [
      {
        "id": "507f1f77bcf86cd799439015",
        "type": "interests",
        "value": "travel",
        "label": "Travel",
        "category": "lifestyle",
        "order": 1
      },
      {
        "id": "507f1f77bcf86cd799439016",
        "type": "interests",
        "value": "photography",
        "label": "Photography",
        "category": "creative",
        "order": 2
      }
    ]
  }
}
```

---

### 2. Get All Lookup Types
**GET** `/lookup/types`

Get all lookup types with their data.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "interests": [...],
    "religions": [...],
    "ethnicities": [...],
    "languages": [...],
    "education": [...],
    "zodiac": [...],
    "personalities": [...],
    "family-plans": [...]
  }
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized, token invalid"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Server Error"
}
```

---

## Rate Limiting

Authentication endpoints (`/api/auth/*`) are rate limited to:
- **100 requests per 15 minutes** per IP address

If exceeded:
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Testing with cURL

### Complete Flow Example:

1. **Register:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

2. **Verify OTP** (check console for OTP):
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

3. **Update Profile:**
```bash
curl -X PATCH http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"John Doe","age":28,"bio":"Love traveling"}'
```

4. **Get Discovery Profiles:**
```bash
curl -X GET "http://localhost:5000/api/discover?minAge=25&maxAge=35" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Last Updated:** January 2024  
**API Version:** 1.0.0
