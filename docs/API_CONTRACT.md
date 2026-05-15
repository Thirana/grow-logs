# API Contract

## General Conventions

**Base URL**

```
Development:  http://localhost:3000/api/v1
Staging:      https://staging-api.grow-logs.com/api/v1
Production:   https://api.grow-logs.com/api/v1
```

**Versioning**
All endpoints are prefixed with /api/v1. When breaking changes are introduced in the future, a /api/v2 prefix is added while /api/v1 remains active for a deprecation period.

**Authentication**
Protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Endpoints marked PUBLIC require no token. All others require a valid JWT.

**Content Type**
All requests and responses use JSON:

```
Content-Type: application/json
```

---

## Standard Response Envelopes

Every endpoint returns one of these three shapes without exception.

**Single resource success:**

```json
{
  "data": {},
  "meta": {}
}
```

**List success:**

```json
{
  "data": [],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

**Error:**

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "text must be at least 10 characters",
    "type must be WORK or LEARNING"
  ],
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/entries"
}
```

---

## HTTP Status Codes

| Code | Meaning               | When Used                                          |
| ---- | --------------------- | -------------------------------------------------- |
| 200  | OK                    | Successful GET or PATCH                            |
| 201  | Created               | Successful POST that creates a resource            |
| 204  | No Content            | Successful DELETE                                  |
| 400  | Bad Request           | Validation failed                                  |
| 401  | Unauthorized          | Missing or invalid JWT token                       |
| 403  | Forbidden             | Authenticated but insufficient permissions         |
| 404  | Not Found             | Resource does not exist or does not belong to user |
| 409  | Conflict              | Duplicate resource                                 |
| 422  | Unprocessable Entity  | Business rule violation                            |
| 429  | Too Many Requests     | Rate limit exceeded                                |
| 500  | Internal Server Error | Unexpected server error                            |

---

## Pagination

All list endpoints support pagination via query parameters:

```
GET /entries?page=1&limit=10
```

Default: page=1, limit=10. Maximum limit: 100.

---

## Auth Endpoints

### POST /auth/register

**Access:** PUBLIC

**Description:** Registers a new user account. Sends a verification email. Does not return a JWT — user must verify email then login.

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Validation:**

- email: valid email format, required
- password: minimum 8 characters, at least one number, at least one special character, required

**Response 201:**

```json
{
  "data": {
    "message": "Registration successful. Please check your email to verify your account."
  },
  "meta": {}
}
```

**Errors:**

| Status | Scenario                 |
| ------ | ------------------------ |
| 400    | Validation failed        |
| 409    | Email already registered |

---

### POST /auth/login

**Access:** PUBLIC

**Description:** Authenticates a user and returns a JWT token.

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response 200:**

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "USER",
      "isEmailVerified": true,
      "onboardingCompleted": false,
      "subscriptionStatus": "FREE"
    }
  },
  "meta": {}
}
```

**Note:** onboardingCompleted tells the frontend whether to redirect to onboarding or dashboard.

**Cookie set on response:**

```
Set-Cookie: refresh_token=<opaque_token>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800
```

The refresh token is never returned in the response body — only as an HTTP-only cookie. The `Path` is scoped to `/api/v1/auth` so the browser only sends it on auth-related requests.

**Errors:**

| Status | Scenario                                                       |
| ------ | -------------------------------------------------------------- |
| 400    | Validation failed                                              |
| 401    | Invalid email or password (generic, never specify which field) |
| 401    | Email not verified                                             |

---

### POST /auth/verify-email

**Access:** PUBLIC

**Description:** Verifies a user's email using the token sent in the verification email.

**Request body:**

```json
{
  "token": "verification_token_from_email"
}
```

**Response 200:**

```json
{
  "data": {
    "message": "Email verified successfully. You can now log in."
  },
  "meta": {}
}
```

**Errors:**

| Status | Scenario                   |
| ------ | -------------------------- |
| 400    | Token missing or malformed |
| 401    | Token invalid or expired   |

---

### POST /auth/resend-verification

**Access:** PUBLIC

**Description:** Resends the verification email to a registered but unverified user. Always returns 200 to prevent user enumeration.

**Request body:**

```json
{
  "email": "user@example.com"
}
```

**Response 200:**

```json
{
  "data": {
    "message": "Verification email resent."
  },
  "meta": {}
}
```

---

### POST /auth/refresh

**Access:** PUBLIC (authenticated via HTTP-only refresh token cookie)

**Description:** Exchanges a valid refresh token cookie for a new access token. Rotates the refresh token — the old cookie is invalidated and a new one is set. If the presented refresh token has already been rotated (reuse detected), all sessions for that user are immediately wiped and a 401 is returned.

**Request body:** None. Refresh token is read from the HTTP-only cookie automatically.

**Response 200:**

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "meta": {}
}
```

A new `refresh_token` HTTP-only cookie is also set on the response, replacing the old one.

**Errors:**

| Status | Scenario                                                                   |
| ------ | -------------------------------------------------------------------------- |
| 401    | Refresh token cookie missing                                               |
| 401    | Refresh token expired                                                      |
| 401    | Refresh token reuse detected — all sessions wiped, user must log in again  |

---

### POST /auth/logout

**Access:** PROTECTED

**Description:** Invalidates the current refresh token server-side. The HTTP-only cookie is cleared. The access token remains valid until its 1-hour expiry — clients should discard it locally on logout.

**Request body:** None.

**Response 200:**

```json
{
  "data": {
    "message": "Logged out successfully."
  },
  "meta": {}
}
```

The `refresh_token` cookie is cleared on the response.

---

### PATCH /auth/change-password

**Access:** PROTECTED

**Description:** Changes the authenticated user's password.

**Request body:**

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Validation:**

- currentPassword: required
- newPassword: same rules as registration, must not match currentPassword

**Response 200:**

```json
{
  "data": {
    "message": "Password changed successfully."
  },
  "meta": {}
}
```

**Errors:**

| Status | Scenario                   |
| ------ | -------------------------- |
| 400    | Validation failed          |
| 401    | Current password incorrect |

---

## User Endpoints

### GET /users/me

**Access:** PROTECTED

**Description:** Returns the authenticated user's profile.

**Response 200:**

```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER",
    "isEmailVerified": true,
    "onboardingCompleted": true,
    "subscriptionStatus": "FREE",
    "subscriptionPlan": null,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "meta": {}
}
```

---

### PATCH /users/me

**Access:** PROTECTED

**Description:** Updates the authenticated user's profile.

**Request body:**

```json
{
  "email": "newemail@example.com"
}
```

**Response 200:**

```json
{
  "data": {
    "id": "uuid",
    "email": "newemail@example.com",
    "role": "USER",
    "onboardingCompleted": true,
    "subscriptionStatus": "FREE",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "meta": {}
}
```

**Errors:**

| Status | Scenario                                |
| ------ | --------------------------------------- |
| 400    | Validation failed                       |
| 409    | Email already in use by another account |

---

## Categories Endpoints

### GET /categories

**Access:** PROTECTED

**Description:** Returns all categories for the authenticated user, each including their subcategories.

**Response 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Backend Development",
      "color": "#69B598",
      "createdAt": "2024-01-15T10:30:00Z",
      "subcategories": [
        {
          "id": "uuid",
          "name": "NestJS",
          "createdAt": "2024-01-15T10:30:00Z"
        }
      ]
    }
  ],
  "meta": {
    "total": 3
  }
}
```

---

### POST /categories

**Access:** PROTECTED

**Description:** Creates a new main category. Maximum 5 categories per user enforced here. If `color` is omitted the server auto-assigns from the predefined palette.

**Request body:**

```json
{
  "name": "Backend Development",
  "color": "#69B598"
}
```

**Validation:**

- name: string, 1 to 100 characters, required
- color: one of the 8 predefined palette hex values, optional (server assigns if omitted)

**Response 201:**

```json
{
  "data": {
    "id": "uuid",
    "name": "Backend Development",
    "color": "#69B598",
    "createdAt": "2024-01-15T10:30:00Z",
    "subcategories": []
  },
  "meta": {}
}
```

**Errors:**

| Status | Scenario                                             |
| ------ | ---------------------------------------------------- |
| 400    | Validation failed                                    |
| 409    | Category with this name already exists for this user |
| 422    | User already has 5 categories                        |

---

### PATCH /categories/:id

**Access:** PROTECTED

**Description:** Updates the name of an existing category.

**Request body:**

```json
{
  "name": "Backend Engineering",
  "color": "#8285BA"
}
```

**Validation:**

- name: string, 1 to 100 characters, optional
- color: one of the 8 predefined palette hex values, optional

**Response 200:**

```json
{
  "data": {
    "id": "uuid",
    "name": "Backend Engineering",
    "color": "#8285BA",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "meta": {}
}
```

**Errors:**

| Status | Scenario                                                     |
| ------ | ------------------------------------------------------------ |
| 400    | Validation failed                                            |
| 404    | Category not found or does not belong to user                |
| 409    | Another category with this name already exists for this user |

---

### DELETE /categories/:id

**Access:** PROTECTED

**Description:** Deletes a category and all its subcategories. Cannot delete if the category has entries attached.

**Response 204:** No content

**Errors:**

| Status | Scenario                                      |
| ------ | --------------------------------------------- |
| 404    | Category not found or does not belong to user |
| 422    | Category has entries attached, cannot delete  |

---

### POST /categories/:id/subcategories

**Access:** PROTECTED

**Description:** Creates a new subcategory under the specified category.

**Request body:**

```json
{
  "name": "NestJS"
}
```

**Response 201:**

```json
{
  "data": {
    "id": "uuid",
    "categoryId": "uuid",
    "name": "NestJS",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "meta": {}
}
```

**Errors:**

| Status | Scenario                                                      |
| ------ | ------------------------------------------------------------- |
| 400    | Validation failed                                             |
| 404    | Parent category not found or does not belong to user          |
| 409    | Subcategory with this name already exists under this category |

---

### PATCH /categories/:id/subcategories/:subId

**Access:** PROTECTED

**Description:** Updates the name of an existing subcategory.

**Request body:**

```json
{
  "name": "NestJS Advanced"
}
```

**Response 200:**

```json
{
  "data": {
    "id": "uuid",
    "categoryId": "uuid",
    "name": "NestJS Advanced",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "meta": {}
}
```

**Errors:**

| Status | Scenario                                                              |
| ------ | --------------------------------------------------------------------- |
| 400    | Validation failed                                                     |
| 404    | Category or subcategory not found or does not belong to user          |
| 409    | Another subcategory with this name already exists under this category |

---

### DELETE /categories/:id/subcategories/:subId

**Access:** PROTECTED

**Description:** Deletes a subcategory. Entries that referenced it retain their category but have subcategory_id set to null.

**Response 204:** No content

**Errors:**

| Status | Scenario                                                     |
| ------ | ------------------------------------------------------------ |
| 404    | Category or subcategory not found or does not belong to user |

---

## Entries Endpoints

### GET /entries

**Access:** PROTECTED

**Description:** Returns a paginated list of log entries for the authenticated user.

**Query parameters:**

| Parameter     | Type   | Required | Default | Notes                 |
| ------------- | ------ | -------- | ------- | --------------------- |
| page          | number | NO       | 1       |                       |
| limit         | number | NO       | 10      | Max 100               |
| type          | string | NO       |         | WORK or LEARNING      |
| categoryId    | UUID   | NO       |         | Filter by category    |
| subcategoryId | UUID   | NO       |         | Filter by subcategory |
| from          | date   | NO       |         | YYYY-MM-DD            |
| to            | date   | NO       |         | YYYY-MM-DD            |

**Response 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "LEARNING",
      "text": "Learned about NestJS guards and Passport.js integration",
      "productivityScore": 8,
      "entryDate": "2024-01-15",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "category": {
        "id": "uuid",
        "name": "Backend Development"
      },
      "subcategory": {
        "id": "uuid",
        "name": "NestJS"
      }
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### POST /entries

**Access:** PROTECTED

**Description:** Creates a new log entry.

**Request body:**

```json
{
  "type": "LEARNING",
  "text": "Learned about NestJS guards and Passport.js integration",
  "categoryId": "uuid",
  "subcategoryId": "uuid",
  "productivityScore": 8,
  "entryDate": "2024-01-15"
}
```

**Validation:**

- type: WORK or LEARNING, required
- text: string, minimum 10 characters, maximum 1000 characters, required
- categoryId: valid UUID, must belong to authenticated user, required
- subcategoryId: valid UUID, must belong to the specified category, optional
- productivityScore: integer between 1 and 10, optional
- entryDate: YYYY-MM-DD format, defaults to today if not provided, optional

**Response 201:**

```json
{
  "data": {
    "id": "uuid",
    "type": "LEARNING",
    "text": "Learned about NestJS guards and Passport.js integration",
    "productivityScore": 8,
    "entryDate": "2024-01-15",
    "createdAt": "2024-01-15T10:30:00Z",
    "category": {
      "id": "uuid",
      "name": "Backend Development"
    },
    "subcategory": {
      "id": "uuid",
      "name": "NestJS"
    }
  },
  "meta": {}
}
```

**Errors:**

| Status | Scenario                                                         |
| ------ | ---------------------------------------------------------------- |
| 400    | Validation failed                                                |
| 404    | categoryId or subcategoryId not found or does not belong to user |

---

### GET /entries/summary

**Access:** PROTECTED

**Description:** Returns the full dashboard analytics in a single response: totals, per-category breakdown, per-day activity series, weekly productivity trend, week-over-week comparison, and streak stats.

**Query parameters:**

| Parameter | Type   | Required | Default | Notes                 |
| --------- | ------ | -------- | ------- | --------------------- |
| period    | string | NO       | 30d     | Options: 7d, 30d, all |
| type      | string | NO       |         | WORK or LEARNING      |

**Period scoping rules:**
- `period` scopes: `totalEntries`, `totalByType`, `averageProductivityScore`, `byCategory`, `dailyActivity`
- Always full-history (not period-scoped): `weeklyTrend` (fixed 8-week window), `currentStreak`, `longestStreak`
- Always ISO-calendar-week-based (not period-scoped): `thisWeekCount`, `lastWeekCount`

**Response 200:**

```json
{
  "data": {
    "period": "30d",
    "totalEntries": 28,
    "totalByType": {
      "WORK": 12,
      "LEARNING": 16
    },
    "averageProductivityScore": 7.4,
    "thisWeekCount": 5,
    "lastWeekCount": 7,
    "currentStreak": 9,
    "longestStreak": 23,
    "byCategory": [
      {
        "category": {
          "id": "uuid",
          "name": "Backend Development",
          "color": "#69B598"
        },
        "entryCount": 14,
        "averageProductivityScore": 8.1,
        "byType": {
          "WORK": 6,
          "LEARNING": 8
        }
      }
    ],
    "dailyActivity": [
      { "date": "2024-04-15", "workCount": 2, "learnCount": 1 },
      { "date": "2024-04-16", "workCount": 0, "learnCount": 3 }
    ],
    "weeklyTrend": [
      { "week": "2024-W10", "avgScore": 6.8 },
      { "week": "2024-W11", "avgScore": 7.1 },
      { "week": "2024-W12", "avgScore": null },
      { "week": "2024-W13", "avgScore": 7.4 },
      { "week": "2024-W14", "avgScore": 7.6 },
      { "week": "2024-W15", "avgScore": 7.8 },
      { "week": "2024-W16", "avgScore": 8.0 },
      { "week": "2024-W17", "avgScore": 7.9 }
    ]
  },
  "meta": {}
}
```

**Notes:**
- `averageProductivityScore` is `null` if no scored entries exist for that period
- Categories with zero entries in the selected period are excluded from `byCategory`
- `dailyActivity` omits dates with zero entries — frontend fills gaps
- `weeklyTrend` always returns exactly 8 entries; `avgScore` is `null` for weeks with no scored entries
- `currentStreak` uses a grace rule: if the user has not logged today, yesterday counts as the streak anchor so an active streak is not prematurely broken
- `longestStreak` is all-time personal best, not scoped to `period`

---

### GET /entries/:id

**Access:** PROTECTED

**Description:** Returns the full detail of a single entry.

**Response 200:**

```json
{
  "data": {
    "id": "uuid",
    "type": "LEARNING",
    "text": "Full markdown content here...",
    "productivityScore": 8,
    "entryDate": "2024-01-15",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "category": {
      "id": "uuid",
      "name": "Backend Development"
    },
    "subcategory": {
      "id": "uuid",
      "name": "NestJS"
    }
  },
  "meta": {}
}
```

**Errors:**

| Status | Scenario                                   |
| ------ | ------------------------------------------ |
| 404    | Entry not found or does not belong to user |

---

### PATCH /entries/:id

**Access:** PROTECTED

**Description:** Updates an existing entry. All fields optional — only send fields to change.

**Request body:**

```json
{
  "type": "LEARNING",
  "text": "Updated entry text with more detail",
  "categoryId": "uuid",
  "subcategoryId": "uuid",
  "productivityScore": 9,
  "entryDate": "2024-01-15"
}
```

**Response 200:**

```json
{
  "data": {
    "id": "uuid",
    "type": "LEARNING",
    "text": "Updated entry text with more detail",
    "productivityScore": 9,
    "entryDate": "2024-01-15",
    "updatedAt": "2024-01-15T11:00:00Z",
    "category": {
      "id": "uuid",
      "name": "Backend Development"
    },
    "subcategory": {
      "id": "uuid",
      "name": "NestJS"
    }
  },
  "meta": {}
}
```

**Errors:**

| Status | Scenario                                                                 |
| ------ | ------------------------------------------------------------------------ |
| 400    | Validation failed                                                        |
| 404    | Entry not found or does not belong to user                               |
| 404    | Updated categoryId or subcategoryId not found or does not belong to user |

---

### DELETE /entries/:id

**Access:** PROTECTED

**Description:** Permanently deletes an entry. Irreversible.

**Response 204:** No content

**Errors:**

| Status | Scenario                                   |
| ------ | ------------------------------------------ |
| 404    | Entry not found or does not belong to user |

---

## Onboarding Endpoints

### POST /onboarding/complete

**Access:** PROTECTED

**Description:** Marks onboarding as complete. Called after the user finishes category setup. Category creation during onboarding uses the standard categories endpoints.

**Request body:** Empty object {}

**Response 200:**

```json
{
  "data": {
    "message": "Onboarding completed.",
    "onboardingCompleted": true
  },
  "meta": {}
}
```

**Errors:**

| Status | Scenario                         |
| ------ | -------------------------------- |
| 400    | User has fewer than 3 categories |
| 409    | Onboarding already completed     |

---

## Feature Flags Endpoints

### GET /feature-flags

**Access:** PROTECTED

**Description:** Returns all feature flags and their current enabled state. Results cached for 60 seconds. Used by the frontend to conditionally show or hide features.

**Response 200:**

```json
{
  "data": [
    { "key": "ai_weekly_summary", "enabled": false },
    { "key": "stripe_billing", "enabled": false },
    { "key": "github_integration", "enabled": false },
    { "key": "jira_integration", "enabled": false },
    { "key": "public_profile", "enabled": false },
    { "key": "resume_export", "enabled": false }
  ],
  "meta": {}
}
```

**Note:** The description field is excluded from this response. It is an internal field for admin use only.

---

## Admin Endpoints

### GET /admin/users

**Access:** PROTECTED, ADMIN role required

**Description:** Returns a paginated list of all users.

**Query parameters:**

| Parameter          | Type   | Required | Default | Notes                             |
| ------------------ | ------ | -------- | ------- | --------------------------------- |
| page               | number | NO       | 1       |                                   |
| limit              | number | NO       | 20      | Max 100                           |
| role               | string | NO       |         | USER or ADMIN                     |
| subscriptionStatus | string | NO       |         | FREE, ACTIVE, CANCELLED, PAST_DUE |

**Response 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "USER",
      "isEmailVerified": true,
      "subscriptionStatus": "FREE",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

**Errors:**

| Status | Scenario                           |
| ------ | ---------------------------------- |
| 403    | Authenticated user is not an ADMIN |

---

### PATCH /admin/feature-flags/:key

**Access:** PROTECTED, ADMIN role required

**Description:** Enables or disables a feature flag by its key.

**Request body:**

```json
{
  "enabled": true
}
```

**Response 200:**

```json
{
  "data": {
    "key": "ai_weekly_summary",
    "enabled": true,
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "meta": {}
}
```

**Errors:**

| Status | Scenario                           |
| ------ | ---------------------------------- |
| 403    | Authenticated user is not an ADMIN |
| 404    | Feature flag key not found         |

---

## Complete Endpoint Reference

| Method | Endpoint                             | Access    | Description                           |
| ------ | ------------------------------------ | --------- | ------------------------------------- | --- |
| POST   | /auth/register                       | PUBLIC    | Register new account                  |
| POST   | /auth/login                          | PUBLIC    | Login, receive access token + refresh cookie |
| POST   | /auth/refresh                        | PUBLIC    | Rotate refresh token, get new access token |
| POST   | /auth/logout                         | PROTECTED | Invalidate refresh token server-side  |
| POST   | /auth/verify-email                   | PUBLIC    | Verify email with token               |
| POST   | /auth/resend-verification            | PUBLIC    | Resend verification email             |
| PATCH  | /auth/change-password                | PROTECTED | Change password                       |
| GET    | /users/me                            | PROTECTED | Get own profile                       |
| PATCH  | /users/me                            | PROTECTED | Update own profile                    |
| POST   | /onboarding/complete                 | PROTECTED | Mark onboarding complete              |
| GET    | /categories                          | PROTECTED | Get all categories with subcategories |
| POST   | /categories                          | PROTECTED | Create a category                     |
| PATCH  | /categories/:id                      | PROTECTED | Update a category                     |
| DELETE | /categories/:id                      | PROTECTED | Delete a category                     |
| POST   | /categories/:id/subcategories        | PROTECTED | Create a subcategory                  |
| PATCH  | /categories/:id/subcategories/:subId | PROTECTED | Update a subcategory                  | z   |
| DELETE | /categories/:id/subcategories/:subId | PROTECTED | Delete a subcategory                  |
| GET    | /entries                             | PROTECTED | Get paginated entries with filters    |
| POST   | /entries                             | PROTECTED | Create an entry                       |
| GET    | /entries/summary                     | PROTECTED | Get activity summary analytics        |
| GET    | /entries/:id                         | PROTECTED | Get single entry                      |
| PATCH  | /entries/:id                         | PROTECTED | Update an entry                       |
| DELETE | /entries/:id                         | PROTECTED | Delete an entry                       |
| GET    | /feature-flags                       | PROTECTED | Get all feature flags                 |
| GET    | /admin/users                         | ADMIN     | List all users                        |
| PATCH  | /admin/feature-flags/:key            | ADMIN     | Toggle a feature flag                 |

---

## Security Rules Applied to Every Endpoint

- Every query that reads, updates, or deletes a resource filters by the authenticated user's ID
- Category and subcategory ownership is always verified before creating a child resource
- Admin endpoints verify role in RolesGuard before any business logic runs
- UUIDs in path parameters are validated as proper UUID format before hitting the database
- Users can never access another user's data even if they know the UUID
