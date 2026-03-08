# Bondies Backend — New Features API Docs

All endpoints require `Authorization: Bearer <token>` unless stated otherwise.

---

## ⚙️ Settings (`/api/settings`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/settings/phone` | Update phone number (sends OTP) |
| POST | `/api/settings/phone/verify` | Verify OTP to confirm new phone |
| PATCH | `/api/settings/email` | Update email (sends OTP) |
| POST | `/api/settings/email/verify` | Verify OTP to confirm new email |
| GET | `/api/settings/notifications` | Get notification preferences |
| PATCH | `/api/settings/notifications` | Update notification preferences |
| GET | `/api/settings/privacy` | Get privacy settings |
| PATCH | `/api/settings/privacy` | Update privacy settings |
| POST | `/api/settings/block/:userId` | Block a user |
| DELETE | `/api/settings/block/:userId` | Unblock a user |
| GET | `/api/settings/blocked-users` | List blocked users |
| DELETE | `/api/settings/account` | Delete account (requires password) |
| GET | `/api/settings/referral-code` | Get/generate my referral code |
| PATCH | `/api/settings/push-token` | Update FCM push token |

### PATCH /api/settings/notifications — Body
```json
{
  "newMatch": true,
  "newMessage": true,
  "newLike": true,
  "superLike": true,
  "eventReminder": false,
  "emailNotifications": true,
  "pushNotifications": true,
  "marketingEmails": false
}
```

### PATCH /api/settings/privacy — Body
```json
{
  "profileVisibility": "everyone",  // everyone | matches_only | nobody
  "showLastActive": true,
  "showDistance": true,
  "showAge": true,
  "showOnlineStatus": true,
  "allowMessageFromNonMatches": false
}
```

### POST /api/settings/block/:userId — Body
```json
{
  "reason": "harassment",  // harassment | spam | inappropriate_content | fake_profile | other
  "notes": "Optional description"
}
```

### DELETE /api/settings/account — Body
```json
{
  "password": "current-password",
  "reason": "Optional reason for leaving"
}
```

---

## 💎 Premium (`/api/premium`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/premium/plans` | Get all available plans + pricing |
| GET | `/api/premium/status` | Get my current subscription status |
| POST | `/api/premium/activate` | Activate premium after payment |
| POST | `/api/premium/cancel` | Cancel subscription |

### Plans: `basic` ($9.99/mo), `gold` ($19.99/mo), `platinum` ($29.99/mo)

### POST /api/premium/activate — Body
```json
{
  "plan": "gold",
  "transactionId": "txn_abc123",
  "paymentProvider": "stripe"
}
```
> ⚠️ Integrate with Stripe/PayStack webhook to call this after confirmed payment.

---

## ✅ Verification (`/api/verification`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/verification/submit` | Submit selfie-with-ID for verification |
| GET | `/api/verification/status` | Get my verification status |
| GET | `/api/verification/admin/pending` | [Admin] List pending verifications |
| PATCH | `/api/verification/admin/:id/review` | [Admin] Approve or reject |

### POST /api/verification/submit — Multipart Form
```
idSelfie: <image file>   (JPG/PNG, max 5MB, person holding their ID clearly)
idType: national_id      // national_id | passport | drivers_license | other
```

### PATCH /api/verification/admin/:id/review — Body
```json
{
  "action": "approve",          // approve | reject
  "rejectionReason": "Photo is blurry, please resubmit"
}
```

---

## 📅 Events (`/api/events`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Browse events (with geo filter) |
| GET | `/api/events/mine` | My created + attending events |
| POST | `/api/events` | Create a new event |
| GET | `/api/events/:id` | Get single event details |
| PATCH | `/api/events/:id` | Update event (creator only) |
| DELETE | `/api/events/:id` | Delete event (creator only) |
| POST | `/api/events/:id/rsvp` | RSVP to an event |

### GET /api/events — Query Params
```
?page=1&limit=20
&category=social          // dating|social|sports|arts|music|food|travel|tech|other
&latitude=6.5&longitude=3.3&radius=50  // radius in km
```

### POST /api/events — Multipart Form
```
title: "Rooftop Vibes Night"
description: "..."
category: social
date: 2026-04-15T18:00:00Z
endDate: 2026-04-15T22:00:00Z
address: "10 Marina Street"
city: Lagos
country: Nigeria
latitude: 6.4550
longitude: 3.3841
isOnline: false
maxAttendees: 50
isPremiumOnly: false
isPublic: true
tags: music,rooftop,vibes
coverImage: <file>
```

### POST /api/events/:id/rsvp — Body
```json
{ "status": "going" }   // going | interested | not_going
```

---

## 🔔 Notifications (`/api/notifications`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get my notifications (paginated) |
| PATCH | `/api/notifications/read-all` | Mark all as read |
| PATCH | `/api/notifications/:id/read` | Mark single notification as read |
| DELETE | `/api/notifications/:id` | Delete a notification |

### Notification Types
`new_match`, `new_message`, `new_like`, `super_like`, `event_invite`, `event_reminder`, `premium_expiry`, `verification_approved`, `verification_rejected`, `referral_joined`, `system`

---

## 🤖 AI Features (`/api/ai`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/icebreakers/:matchId` | 3 AI conversation starters for a match |
| GET | `/api/ai/compatibility/:userId` | Compatibility score with a user |
| POST | `/api/ai/generate-bio` | Generate profile bio using AI |
| GET | `/api/ai/date-ideas/:matchId` | 4 AI-generated date ideas for a match |

### POST /api/ai/generate-bio — Body
```json
{ "tone": "funny" }   // funny | sincere | adventurous | professional
```

### GET /api/ai/date-ideas/:matchId — Query
```
?city=Lagos
```

> ⚠️ Requires `OPENAI_API_KEY` in `.env`. Uses `gpt-4o-mini` (fast & affordable).

---

## 🔑 Referral System

- Every user gets a referral code on signup (8-char, e.g. `A1B2C3D4`)
- Pass `referralCode` in the signup body to credit the referrer
- Use `GET /api/settings/referral-code` to retrieve your code + share link

---

## 📦 .env Variables to Add
```env
# OpenAI
OPENAI_API_KEY=sk-...

# App
APP_URL=https://bondies.app
```
