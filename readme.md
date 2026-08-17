# HireLink Backend Documentation

## 1. Project Overview

HireLink is a Node.js backend application built with **Express.js**, **MongoDB/Mongoose**, **JWT authentication**, **bcrypt password hashing**, and **Resend** for transactional email.

The backend provides functionality for:

* User registration and login
* JWT-based authentication
* Company email/link management
* Upvoting and downvoting company emails
* Reporting company emails
* Moderator assignment
* Moderator demotion
* User banning and unbanning
* Password reset through email
* Role-based authorization
* Banned-user checking
* Transactional email notifications

---

## 2. Technology Stack

| Technology | Purpose                         |
| ---------- | ------------------------------- |
| Node.js    | Backend runtime                 |
| Express.js | HTTP server and API framework   |
| MongoDB    | Database                        |
| Mongoose   | MongoDB ODM                     |
| JWT        | Authentication                  |
| bcryptjs   | Password hashing                |
| Resend     | Email delivery                  |
| dotenv     | Environment variable management |
| CORS       | Cross-origin request handling   |

### Dependencies

The project currently declares:

* `express`
* `mongoose`
* `bcryptjs`
* `jsonwebtoken`
* `dotenv`
* `cors`
* `resend`

---

# 3. Project Structure

```text
HireLink Backend/
│
├── Middleware/
│   ├── Auth.js
│   ├── BanChecker.js
│   ├── moderatorAuth.js
│   └── superAdminAuth.js
│
├── Model/
│   ├── BannedUsers.js
│   ├── LinkSchema.js
│   └── Users.js
│
├── controller/
│   ├── Registration.js
│   ├── companyManagerController.js
│   ├── loginController.js
│   ├── moderatorManager.js
│   ├── passwordManager.js
│   │
│   └── actions/
│       └── strictActions.js
│
├── db.js
├── mailer.js
├── server.js
├── package.json
└── package-lock.json
```

---

# 4. Application Entry Point

## `server.js`

`server.js` is the main entry point of the application.

It:

1. Loads environment variables.
2. Connects to MongoDB.
3. Creates the Express application.
4. Enables JSON request parsing.
5. Enables CORS.
6. Registers API routes.
7. Starts the HTTP server.

The application listens on:

```text
PORT
```

from the environment, or defaults to:

```text
3000
```

---

# 5. Environment Variables

The application expects environment variables for external services and authentication.

## Required variables

```env
PORT=3000
DBURL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_api_key
```

### `PORT`

Specifies the port on which Express listens.

If not provided, the application uses port `3000`.

### `DBURL`

MongoDB connection string used by Mongoose.

### `JWT_SECRET`

Secret used to sign and verify JWT authentication tokens.

### `RESEND_API_KEY`

API key used by Resend to send emails.

---

# 6. Database Connection

## `db.js`

The database connection is handled by Mongoose.

The application executes:

```text
mongoose.connect(process.env.DBURL)
```

If the connection succeeds:

```text
MongoDB connected
```

is printed.

If the connection fails, the error is logged and the process exits.

---

# 7. Database Models

## 7.1 User Model

### File

```text
Model/Users.js
```

The `User` model represents registered users.

### Fields

| Field                  | Type       | Description                         |
| ---------------------- | ---------- | ----------------------------------- |
| `name`                 | String     | User's name                         |
| `email`                | String     | User's email address                |
| `password`             | String     | Hashed password                     |
| `role`                 | String     | User authorization role             |
| `upvoteArray`          | ObjectId[] | Company mails upvoted by the user   |
| `downvoteArray`        | ObjectId[] | Company mails downvoted by the user |
| `reportedArray`        | ObjectId[] | Company mails reported by the user  |
| `isModerator`          | Boolean    | Indicates moderator status          |
| `moderatorSelectedBy`  | ObjectId   | User who selected the moderator     |
| `resetPasswordToken`   | String     | Password-reset token                |
| `resetPasswordExpires` | Date       | Password-reset token expiry         |

### Available roles

```text
superAdmin
admin
user
moderator
```

The default role is:

```text
user
```

---

# 8. Company Mail Model

## `Model/LinkSchema.js`

The `Mail` model stores company email information.

### Fields

| Field         | Type     | Description                |
| ------------- | -------- | -------------------------- |
| `companyName` | String   | Company name               |
| `email`       | String   | Company email address      |
| `upvote`      | Number   | Number of upvotes          |
| `downvote`    | Number   | Number of downvotes        |
| `postedBy`    | ObjectId | User who added the company |
| `createdAt`   | Date     | Creation timestamp         |

The model is exported as:

```text
Mail
```

---

# 9. Banned User Model

## `Model/BannedUsers.js`

The `BannedUser` model stores information about banned accounts.

### Fields

| Field      | Type     | Description                |
| ---------- | -------- | -------------------------- |
| `email`    | String   | Email of banned user       |
| `reason`   | String   | Reason for the ban         |
| `bannedBy` | ObjectId | User who performed the ban |
| `bannedAt` | Date     | Time of the ban            |

The email field is unique.

---

# 10. Authentication

## JWT Authentication

Authentication is implemented using JSON Web Tokens.

During login, the backend generates a token containing:

```text
userId
```

The token expires after:

```text
7 days
```

The client must send the JWT through the:

```http
Authorization
```

header.

---

# 11. Authentication Middleware

## `Middleware/Auth.js`

The authentication middleware:

1. Reads the `Authorization` header.
2. Rejects the request if the header is missing.
3. Verifies the JWT using `JWT_SECRET`.
4. Retrieves the corresponding user from MongoDB.
5. Removes the password from the returned user object.
6. Stores the user in:

```text
req.user
```

7. Passes control to the next middleware/controller.

### Authentication failure

Missing token:

```json
{
  "message": "No token, authorization denied"
}
```

Invalid token:

```json
{
  "message": "Token is not valid"
}
```

---

# 12. Role-Based Authorization

## Moderator Authorization

### `Middleware/moderatorAuth.js`

Allows users whose role is:

```text
moderator
```

or:

```text
superAdmin
```

Otherwise the request receives:

```text
403 Forbidden
```

---

## Super Admin Authorization

### `Middleware/superAdminAuth.js`

Only users with:

```text
role === "superAdmin"
```

are allowed.

Unauthorized users receive:

```json
{
  "message": "Access denied. Super admin only."
}
```

---

# 13. Ban Checking

## `Middleware/BanChecker.js`

The ban checker reads the email from the request body and searches the `BannedUser` collection.

If the email belongs to a banned user, the request is rejected with:

```text
403 Forbidden
```

and:

```json
{
  "message": "User is banned"
}
```

This middleware is currently applied to user registration.

---

# 14. User Registration

## Endpoint

```http
POST /api/register
```

### Middleware

```text
BanChecker
```

### Request body

```json
{
  "name": "John",
  "email": "john@example.com",
  "password": "password"
}
```

### Process

1. Read user information.
2. Check whether the email already exists.
3. Check whether the email belongs to a banned user.
4. Hash the password using bcrypt.
5. Create the user.
6. Save the user to MongoDB.

The password is hashed using bcrypt with a salt round value of `10`.

### Success

```json
{
  "message": "User registered successfully",
  "user": {}
}
```

### Possible errors

Existing user:

```text
400 Bad Request
```

Banned user:

```text
400 Bad Request
```

Server error:

```text
500 Internal Server Error
```

---

# 15. User Login

## Endpoint

```http
POST /api/login
```

### Request body

```json
{
  "email": "john@example.com",
  "password": "password"
}
```

### Process

1. Find the user using the email.
2. Compare the supplied password with the stored bcrypt hash.
3. Generate a JWT.
4. Return the authenticated user and token.

The JWT payload contains:

```json
{
  "userId": "USER_ID"
}
```

The token expires after seven days.

### Successful response

```json
{
  "message": "Login successful",
  "user": {},
  "token": "JWT_TOKEN"
}
```

---

# 16. Company Management

## Add Company

```http
POST /api/add-company
```

Authentication required.

### Body

```json
{
  "companyName": "Example Company",
  "email": "hr@example.com"
}
```

The company email is associated with the authenticated user through:

```text
postedBy
```

---

## Get Companies

```http
GET /api/get-companies
```

Authentication required.

Returns the stored company email records.

---

## Delete Company Email

```http
DELETE /api/delete-company-mail/:id
```

Authentication required.

The `id` parameter represents the MongoDB ID of the company mail record.

---

# 17. Voting System

## Upvote

```http
POST /api/upvote-company-mail/:id
```

Authentication required.

The corresponding mail's `upvote` value is increased by one.

### Response

```json
{
  "message": "Upvoted successfully",
  "upvote": 1
}
```

---

## Downvote

```http
POST /api/downvote-company-mail/:id
```

Authentication required.

The corresponding mail's `downvote` value is increased by one.

### Response

```json
{
  "message": "Downvoted successfully",
  "downvote": 1
}
```

---

# 18. Reporting Company Emails

## Endpoint

```http
POST /api/report-mail/:id
```

Authentication required.

The controller:

1. Finds the company mail.
2. Finds the authenticated user.
3. Increments the mail's report count.
4. Adds the mail ID to the user's `reportedArray`.
5. Saves both records.

The user therefore maintains a list of company mails they have reported.

---

# 19. Moderator Management

## Assign Moderator

```http
POST /api/assign-moderator
```

Authentication required.

### Request body

```json
{
  "email": "user@example.com"
}
```

The selected user is changed to:

```text
role = moderator
```

and:

```text
isModerator = true
```

The ID of the user who selected the moderator is stored in:

```text
moderatorSelectedBy
```

An email notification is then sent using Resend.

---

## Demote Moderator

The controller contains a `demoteModerator` function.

It:

1. Finds the user by email.
2. Changes `isModerator` to `false`.
3. Clears `moderatorSelectedBy`.
4. Changes the role back to `user`.
5. Sends an email notification.

Currently, this controller function exists in the source code but is **not registered as an Express route in `server.js`**.

---

# 20. Password Reset

Password reset consists of two operations.

## Request Password Reset

```http
POST /api/forgot-password
```

### Request

```json
{
  "email": "user@example.com"
}
```

The backend:

1. Finds the user.
2. Generates a random reset token.
3. Stores the token in the user document.
4. Sets an expiration time five minutes into the future.
5. Sends a reset email through Resend.

The token is generated using Node.js `crypto.randomBytes()`.

---

# 21. Reset Password

## Endpoint

```http
POST /api/reset-password/:token
```

### Body

```json
{
  "newPassword": "newPassword"
}
```

The backend verifies:

```text
resetPasswordToken
```

and:

```text
resetPasswordExpires > current time
```

If valid:

1. The new password is hashed.
2. The password is updated.
3. The reset token is removed.
4. The expiry value is removed.
5. A confirmation email is sent.

The reset token is valid for five minutes.

---

# 22. Email System

## `mailer.js`

HireLink uses the Resend service for sending emails.

The Resend client is initialized with:

```text
RESEND_API_KEY
```

Emails are sent from:

```text
HireLink <noreply@hirelink.atmex.site>
```

The reusable email function is:

```text
sendEmail(to, subject, html)
```

This function is used by:

* Moderator selection
* Moderator demotion
* Password reset
* Password reset confirmation
* User banning
* User unbanning

---

# 23. User Ban System

## Ban User

```http
POST /api/ban-user
```

Authentication required.

Super-admin authorization required.

### Body

```json
{
  "email": "user@example.com",
  "reason": "Reason for ban"
}
```

### Process

1. Find the user.
2. Create a `BannedUser` record.
3. Store the banning user's ID.
4. Delete the user's account.
5. Send a ban notification email.

The banned user's email remains in the `BannedUser` collection, preventing registration with that email.

---

# 24. Unban User

## Endpoint

```http
POST /api/unban-user
```

Authentication required.

### Body

```json
{
  "email": "user@example.com"
}
```

The corresponding banned-user record is deleted.

After removal, the email is no longer present in the banned-user collection.

An unban notification email is also sent.

---

# 25. API Reference

| Method | Endpoint                         | Authentication    | Purpose                |
| ------ | -------------------------------- | ----------------- | ---------------------- |
| POST   | `/api/register`                  | Ban check         | Register user          |
| POST   | `/api/login`                     | No                | Login                  |
| POST   | `/api/forgot-password`           | No                | Request password reset |
| POST   | `/api/reset-password/:token`     | No                | Reset password         |
| POST   | `/api/add-company`               | JWT               | Add company email      |
| GET    | `/api/get-companies`             | JWT               | Get company emails     |
| DELETE | `/api/delete-company-mail/:id`   | JWT               | Delete company email   |
| POST   | `/api/upvote-company-mail/:id`   | JWT               | Upvote company email   |
| POST   | `/api/downvote-company-mail/:id` | JWT               | Downvote company email |
| POST   | `/api/report-mail/:id`           | JWT               | Report company email   |
| POST   | `/api/assign-moderator`          | JWT               | Assign moderator       |
| POST   | `/api/ban-user`                  | JWT + Super Admin | Ban user               |
| POST   | `/api/unban-user`                | JWT               | Remove ban             |

---

# 26. Authentication Flow

```text
Client
  │
  │ POST /api/login
  ▼
Login Controller
  │
  ├── Find User
  ├── Compare Password
  └── Generate JWT
  │
  ▼
Client receives JWT
  │
  │ Authorization: <JWT>
  ▼
Auth Middleware
  │
  ├── Verify JWT
  ├── Find User
  └── req.user
  │
  ▼
Protected Controller
```

---

# 27. Registration Flow

```text
Client
  │
  │ POST /api/register
  ▼
BanChecker
  │
  ├── Check banned email
  │
  ▼
Registration Controller
  │
  ├── Check existing user
  ├── Hash password
  ├── Create User
  └── Save User
  │
  ▼
201 Created
```

---

# 28. Password Reset Flow

```text
Client
  │
  │ Forgot password
  ▼
/api/forgot-password
  │
  ├── Find user
  ├── Generate token
  ├── Store token + expiry
  └── Send email
  │
  ▼
User receives reset link
  │
  ▼
/api/reset-password/:token
  │
  ├── Validate token
  ├── Check expiration
  ├── Hash new password
  ├── Clear reset token
  └── Send confirmation
```

---

# 29. Ban Flow

```text
Super Admin
    │
    │ POST /api/ban-user
    ▼
Auth Middleware
    │
    ▼
Super Admin Middleware
    │
    ▼
Ban User Controller
    │
    ├── Create BannedUser record
    ├── Delete User
    └── Send email
```

---

# 30. Error Handling

The controllers generally use the following HTTP status codes:

| Status | Meaning                             |
| ------ | ----------------------------------- |
| `200`  | Successful operation                |
| `201`  | Resource created                    |
| `400`  | Invalid request / existing resource |
| `401`  | Authentication failure              |
| `403`  | Authorization/ban restriction       |
| `404`  | Resource/user not found             |
| `500`  | Server-side error                   |

Errors are generally returned as JSON:

```json
{
  "message": "Error description"
}
```

---

# 31. Security Mechanisms

The current implementation includes several security mechanisms:

### Password hashing

Passwords are hashed using:

```text
bcryptjs
```

before being stored.

### JWT authentication

Protected API endpoints require a valid JWT.

### JWT expiration

Authentication tokens expire after seven days.

### Password reset expiration

Password-reset tokens expire after five minutes.

### Role-based access

Super-admin functionality is protected by a dedicated middleware.

### Banned email protection

Banned email addresses cannot register again while their ban record exists.

### Password exclusion in authentication middleware

The authentication middleware retrieves the user while excluding the password field.

---

# 32. Current Implementation Notes

The following points are based directly on the supplied source code and are documented rather than silently modified.

### 32.1 Report counter is not defined in the Mail schema

`reportCompanyMail()` increments:

```text
companyMail.reports
```

and returns:

```text
companyMail.reports
```

However, `Model/LinkSchema.js` currently defines `upvote` and `downvote` but does not define a `reports` field.

Therefore, the report counter implementation should be reviewed.

---

### 32.2 Moderator middleware is currently unused

`Middleware/moderatorAuth.js` exists and supports moderator/super-admin authorization, but the routes shown in `server.js` do not currently use it.

---

### 32.3 Moderator demotion has no route

`demoteModerator()` exists inside `controller/moderatorManager.js`, but `server.js` does not currently register an endpoint for it.

---

### 32.4 Ban/unban authorization differs

The ban endpoint uses:

```text
Auth → Super Admin
```

while the unban endpoint currently uses only:

```text
Auth
```

Therefore, the current source does not restrict unbanning specifically to super administrators.

---

### 32.5 Company deletion authorization

The delete-company endpoint requires authentication, but the controller currently does not check whether the authenticated user owns the company record or has an administrative role.

---

### 32.6 Vote tracking

The `User` model contains:

```text
upvoteArray
downvoteArray
```

but the current upvote/downvote controller only increments the corresponding counters on the `Mail` document.

The current implementation does not use those arrays to prevent repeated voting.

---

### 32.7 Password reset URL

The password reset email currently contains a URL using:

```text
http://localhost:3000/reset-password/<token>
```

This is a development/local URL and should be replaced with the appropriate deployed frontend URL when the production frontend is available.

---

# 33. Deployment Requirements

A deployment environment must provide:

```text
Node.js
MongoDB connectivity
Environment variables
Resend API access
```

The deployment environment must install the dependencies listed in `package.json`.

In particular:

```text
resend
```

is a runtime dependency and is required by `mailer.js`.

---

# 34. Production Configuration Checklist

Before production deployment:

* Configure `DBURL`.
* Configure a strong `JWT_SECRET`.
* Configure `RESEND_API_KEY`.
* Configure the production `PORT` if required by the hosting platform.
* Configure the production frontend URL for password-reset links.
* Restrict CORS to trusted frontend origins instead of allowing every origin.
* Verify Resend domain configuration.
* Ensure sensitive `.env` files are not committed.
* Review authorization for deletion, voting, reporting, banning, and unbanning.
* Add the missing report field if report counting is intended.
* Add a route for moderator demotion if that functionality is required.
* Decide whether moderator-only operations should use `moderatorAuth`.
* Prevent duplicate voting if one-vote-per-user behavior is intended.

---

# 35. Overall Architecture

```text
                    ┌───────────────────┐
                    │      Client       │
                    └─────────┬─────────┘
                              │
                              │ HTTP / JSON
                              ▼
                    ┌───────────────────┐
                    │    Express.js     │
                    │     server.js     │
                    └─────────┬─────────┘
                              │
             ┌────────────────┼─────────────────┐
             │                │                 │
             ▼                ▼                 ▼
       Authentication     Controllers       Middleware
             │                │                 │
             │                │                 ├── Auth
             │                │                 ├── BanChecker
             │                │                 ├── SuperAdmin
             │                │                 └── Moderator
             │                │
             └────────────────┼─────────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │     Mongoose      │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │      MongoDB      │
                    └───────────────────┘

                              │
                              │
                              ▼
                    ┌───────────────────┐
                    │      Resend       │
                    │   Email Service   │
                    └───────────────────┘
```

---

# 36. Summary

HireLink's backend is a REST API built around Express.js and MongoDB.

Its main components are:

```text
Express
   │
   ├── Authentication
   │     └── JWT
   │
   ├── User Management
   │     ├── Registration
   │     ├── Login
   │     ├── Password Reset
   │     └── Ban/Unban
   │
   ├── Company Email Management
   │     ├── Add
   │     ├── Retrieve
   │     ├── Delete
   │     ├── Upvote
   │     ├── Downvote
   │     └── Report
   │
   ├── Moderator Management
   │     ├── Assign
   │     └── Demote
   │
   ├── Authorization
   │     ├── User
   │     ├── Moderator
   │     └── Super Admin
   │
   └── Email Notifications
         └── Resend
```

 #####################################################################################