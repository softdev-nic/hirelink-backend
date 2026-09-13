 # HireLink Backend Documentation

## 1. Project Overview

HireLink is a Node.js backend built with **Express.js**, **MongoDB/Mongoose**, **JWT authentication**, **bcrypt password hashing**, and **Resend** for transactional email.

The backend provides:

* User registration with mandatory email verification (OTP)
* JWT-based authentication with session invalidation on password change
* Company email/link management with moderation workflow
* One-vote-per-user upvoting and downvoting
* One-report-per-user reporting
* Moderator assignment and demotion (super admin only)
* User banning and unbanning (super admin only)
* Password reset through email with hashed tokens
* Role-based authorization
* Per-account and per-IP rate limiting
* Transactional email notifications

---

## 2. Technology Stack

| Technology | Purpose |
| ---------- | ------- |
| Node.js | Backend runtime |
| Express.js 5 | HTTP server and API framework |
| MongoDB | Database |
| Mongoose 9 | MongoDB ODM |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Resend | Email delivery |
| helmet | HTTP security headers |
| express-rate-limit | Abuse prevention |
| dotenv | Environment variable management |
| CORS | Cross-origin request handling |

### Dependencies

```text
express
mongoose
bcryptjs
jsonwebtoken
dotenv
cors
resend
helmet
express-rate-limit
```

---

## 3. Project Structure

```text
hirelink-backend/
│
├── Middleware/
│   ├── Auth.js
│   ├── BanChecker.js
│   ├── Limiter.js
│   ├── domainValidation.js
│   ├── moderatorAuth.js
│   └── superAdminAuth.js
│
├── Model/
│   ├── BannedUsers.js
│   ├── LinkSchema.js
│   ├── Users.js
│   └── ValidDomains.js
│
├── controller/
│   ├── Registration.js
│   ├── companyManagerController.js
│   ├── emailVerification.js
│   ├── getter.js
│   ├── loginController.js
│   ├── moderatorManager.js
│   ├── passwordManager.js
│   ├── templateManager.js
│   │
│   └── actions/
│       ├── mailActions.js
│       └── strictActions.js
│
├── db.js
├── mailer.js
├── server.js
├── package.json
└── package-lock.json
```

---

## 4. Application Entry Point

### `server.js`

`server.js` is the main entry point. It:

1. Loads environment variables.
2. Connects to MongoDB.
3. Creates the Express application.
4. Sets `trust proxy` so rate limiters see real client IPs behind a reverse proxy.
5. Applies `helmet()` security headers.
6. Enables JSON parsing with a 100 kb body cap.
7. Applies a CORS allowlist.
8. Registers API routes, grouped by required privilege.
9. Registers a catch-all error handler so stack traces never reach clients.
10. Starts the HTTP server on `PORT`, defaulting to `3000`.

---

## 5. Environment Variables

```env
PORT=3000
DBURL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_api_key
NODE_ENV=production
```

| Variable | Purpose |
| -------- | ------- |
| `PORT` | Port Express listens on. Defaults to `3000`. |
| `DBURL` | MongoDB connection string. |
| `JWT_SECRET` | Secret used to sign and verify JWTs. |
| `RESEND_API_KEY` | API key for Resend. |
| `NODE_ENV` | **Rate limiting is active only when this equals `production`.** Leave unset during local development. |

---

## 6. Database Connection

### `db.js`

The connection is handled by Mongoose. Before connecting, the application sets:

```js
mongoose.set("sanitizeFilter", true);
```

This strips MongoDB operators out of query filters, so a request body such as
`{"email": {"$ne": null}}` is treated as a literal value rather than a query
operator. This is the application's baseline defence against NoSQL injection.

On failure the error is logged and the process exits.

---

## 7. Database Models

### 7.1 User Model — `Model/Users.js`

| Field | Type | Description |
| ----- | ---- | ----------- |
| `name` | String | User's name |
| `email` | String | Unique, stored lowercase and trimmed |
| `password` | String | bcrypt hash |
| `role` | String | Authorization role |
| `upvoteArray` | ObjectId[] | Mails upvoted by the user |
| `downvoteArray` | ObjectId[] | Mails downvoted by the user |
| `reportedArray` | ObjectId[] | Mails reported by the user |
| `isModerator` | Boolean | Moderator flag |
| `isVerified` | Boolean | Email verification status; login requires `true` |
| `moderatorSelectedBy` | ObjectId | Super admin who assigned the moderator |
| `resetPasswordToken` | String | **SHA-256 hash** of the reset token |
| `resetPasswordExpires` | Date | Reset token expiry |
| `passwordChangedAt` | Date | JWTs issued before this timestamp are rejected |
| `template.subject` | String | User's saved email subject |
| `template.text` | String | User's saved email body |
| `otpChallenge.challengeId` | String | Random UUID identifying one verification attempt |
| `otpChallenge.otp` | String | Six-digit code |
| `otpChallenge.otpExpiresAt` | Date | Code expiry |
| `otpChallenge.attempts` | Number | Failed attempts; the challenge is destroyed at 5 |

**Email normalization.** The email field uses `lowercase: true` and `trim: true`.
This must stay consistent with `BannedUsers`, otherwise a banned user could
re-register using a different letter case.

**Index.** A sparse index on `otpChallenge.challengeId` keeps verification
lookups off a full collection scan.

**`toJSON` transform.** The schema deletes `password`, `resetPasswordToken`,
`resetPasswordExpires`, `otpChallenge` and `__v` from any serialized document.
This is a safety net: even if a controller returns a whole user document, the
secrets do not reach the client.

**Roles:** `superAdmin`, `admin`, `user`, `moderator`. Default is `user`.

---

### 7.2 Company Mail Model — `Model/LinkSchema.js`

| Field | Type | Description |
| ----- | ---- | ----------- |
| `companyName` | String | Company name, trimmed |
| `email` | String | Company email, lowercase and trimmed |
| `upvote` | Number | Upvote count |
| `downvote` | Number | Downvote count |
| `reports` | Number | Report count |
| `postedBy` | ObjectId | User who added the record |
| `createdAt` | Date | Creation timestamp |
| `status` | String | `pending`, `approved` or `rejected` |
| `category` | String | One of the `CATEGORIES` list; defaults to `Other` |
| `AttendedBy` | ObjectId | Moderator who changed the status |
| `expiresAt` | Date | TTL deletion time; `null` means never |

**TTL index.**

```js
MailSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

The `expireAfterSeconds` option belongs in the second argument. Placing it
inside the key list creates an ordinary compound index and nothing expires.
MongoDB removes expired documents roughly once a minute.

**Lifecycle:** new submissions expire after 3 days unless approved. Approving
clears `expiresAt`; rejecting sets it 24 hours out.

---

### 7.3 Banned User Model — `Model/BannedUsers.js`

| Field | Type | Description |
| ----- | ---- | ----------- |
| `email` | String | Unique, lowercase and trimmed |
| `reason` | String | Reason for the ban |
| `bannedBy` | ObjectId | Super admin who issued the ban |
| `bannedAt` | Date | Time of the ban |

---

### 7.4 Valid Domains Model — `Model/ValidDomains.js`

Caches domains that have passed MX-record validation, so repeated submissions
from the same company do not trigger a DNS lookup each time.

---

## 8. Authentication

JWTs are signed with `HS256` and contain `userId`. Tokens expire after 7 days.
Clients send the token in the `Authorization` header, with or without a
`Bearer ` prefix.

### `Middleware/Auth.js`

`authMiddleware`:

1. Reads the `Authorization` header and strips an optional `Bearer ` prefix.
2. Rejects the request with `401` if no token is present.
3. Verifies the JWT with the algorithm pinned to `HS256`. Pinning prevents an
   attacker supplying a token that claims a different algorithm.
4. Loads the user, excluding the password field.
5. **Rejects the request if the user no longer exists.** Banning deletes the
   account, so without this a banned user's token would keep working until it
   expired.
6. **Rejects tokens issued before `passwordChangedAt`.** This is what makes a
   password reset log out an attacker who is already signed in.
7. Stores the user in `req.user`.

`filterValidation` restricts non-moderators to the `approved` filter when
listing company mails. It reads `req.user` rather than querying the database
again.

---

## 9. Role-Based Authorization

### `Middleware/superAdminAuth.js`

Allows only `role === "superAdmin"`. Everyone else receives `403`.

### `Middleware/moderatorAuth.js`

Exports three functions:

* **`moderatorAuth`** — used on deletion. Allows the request if the caller is
  the creator of the mail **or** a moderator/super admin. The loaded mail is
  attached to `req.mail`.
* **`moderatorOnly`** — allows moderators and super admins.
* **`moderatorcheck`** — a route handler (not middleware) that reports whether
  the caller is a moderator. It always sends a response.

---

## 10. Ban Checking — `Middleware/BanChecker.js`

Reads the email from the request body, lowercases it, and searches the
`BannedUser` collection. A match returns `403`. Applied to registration.

The lowercasing matters: ban records are stored lowercase, so comparing raw
input would let `Victim@example.com` bypass a ban on `victim@example.com`.

---

## 11. Domain Validation — `Middleware/domainValidation.js`

Applied to company submissions. It:

1. Validates that the email contains exactly one `@`.
2. Returns early if the domain is already cached in `ValidDomains`.
3. Resolves MX records for the domain, returning `400` if there are none.
4. Upserts the domain into the cache, so concurrent submissions cannot cause a
   duplicate-key error.

---

## 12. Rate Limiting — `Middleware/Limiter.js`

Limiters are **skipped entirely unless `NODE_ENV === "production"`**, so local
testing is never throttled.

All IP-based keys pass through `ipKeyGenerator`, which normalizes IPv6
addresses to a subnet. Using `req.ip` directly would let an IPv6 client obtain
a fresh counter per address.

| Limiter | Window | Limit | Keyed by |
| ------- | ------ | ----- | -------- |
| `authLimiter` | 1 hour | 10 | Email (failed logins only) |
| `otpVerifyLimiter` | 1 hour | 10 | `challengeId` |
| `otpResendLimiter` | 1 hour | 3 | Email |
| `passwordResetLimiter` | 1 hour | 3 | Email |
| `registerLimiter` | 24 hours | 10 | IP |
| `ipFloodLimiter` | 1 hour | 60 | IP |
| `mailSubmissionLimiter` | 24 hours | 10 | User ID |

**Why two layers.** Account-keyed limiters protect a specific account from
being targeted, but an attacker controls the key and can rotate it.
`ipFloodLimiter` sits behind them to cap total volume from one source.

**Ordering.** `mailSubmissionLimiter` reads `req.user._id`, so it must be
placed after `authMiddleware`. Limiters on public routes key on request body
fields and can run first.

**Storage.** Counts are held in memory and reset when the process restarts. A
shared store such as `rate-limit-mongo` would be required if the app is scaled
to more than one instance.

---

## 13. Email Verification

Registration creates the account and immediately issues an OTP challenge. The
account cannot log in until verification succeeds.

### `generateOTP(userDoc)`

An internal function, not a route handler. It accepts a user document, so both
registration and resend can reuse it.

1. Generates a six-digit code with `crypto.randomInt`, which is a
   cryptographically secure generator.
2. Generates a `challengeId` with `crypto.randomUUID`.
3. Stores the code with a 5-minute expiry and resets `attempts` to zero.
4. Sends the code by email, escaping the user's name.
5. Returns the `challengeId`, and **throws** on failure so the caller knows the
   email was not sent.

### `POST /api/otp/verify`

Public, because unverified users cannot log in and so could never reach a
protected route.

The user is located by `challengeId`, a 122-bit random UUID that identifies
one verification attempt without requiring a JWT. Codes are compared with
`crypto.timingSafeEqual` so response timing reveals nothing.

Five wrong attempts destroys the challenge, which is the real protection
against guessing: a rate limiter can be sidestepped by changing networks, but
the counter is stored in the database.

Request body:

```json
{
  "challengeId": "uuid",
  "otp": "123456"
}
```

### `POST /api/otp/resend`

Issues a fresh code. Necessary because codes expire in five minutes and a
burnt challenge would otherwise leave an account permanently stranded: unable
to log in without verifying, and unable to verify without a code.

Returns the same generic `200` whether the account exists, does not exist, or
is already verified, so it cannot be used to discover which addresses are
registered.

---

## 14. User Registration

```http
POST /api/register
```

Middleware: `registerLimiter` → `bannedCheck`

Request body:

```json
{
  "name": "John",
  "email": "john@example.com",
  "password": "at-least-8-chars"
}
```

Process:

1. Validate that all three fields are strings, the email matches a basic
   pattern, and the password is at least 8 characters. The string check closes
   an injection route where an object could be supplied in place of a string.
2. Normalize the email to lowercase.
3. Reject if the email is already registered or banned.
4. Hash the password with bcrypt, 10 salt rounds.
5. Save the user.
6. Issue an OTP challenge. A mail failure is caught and reported in the
   response rather than turning a saved account into a `500`.

Success:

```json
{
  "message": "User registered successfully. Check your email for the verification code.",
  "challengeId": "uuid"
}
```

The response deliberately contains **no user object**, because the document at
this point holds the OTP and the password hash.

---

## 15. User Login

```http
POST /api/login
```

Middleware: `authLimiter` → `ipFloodLimiter`

Process:

1. Validate that email and password are strings.
2. Look up the user by lowercased email.
3. Compare the password against the stored hash.
4. Reject unverified accounts with `403` and `needsVerification: true`, which
   lets the frontend redirect to the OTP screen.
5. Sign a JWT valid for 7 days.

**Uniform failure response.** Both an unknown email and a wrong password return
`401` with the same message. When the two differed, the response revealed which
addresses were registered. For the same reason, an unknown email still runs a
bcrypt comparison against a dummy hash, so the two paths take a similar amount
of time.

Successful response:

```json
{
  "message": "Login successful",
  "token": "JWT_TOKEN",
  "user": {
    "_id": "...",
    "name": "...",
    "email": "...",
    "role": "user",
    "isModerator": false
  }
}
```

---

## 16. Company Management

### Add company

```http
POST /api/add-company
```

Middleware: `authMiddleware` → `mailSubmissionLimiter` → `domainCheck`

```json
{
  "companyName": "Example Company",
  "email": "hr@example.com",
  "category": "IT"
}
```

`category` falls back to `Other` when omitted. An invalid category returns
`400` rather than a validation `500`.

### List companies

```http
GET /api/get-companies/:statusParameter
```

`statusParameter` is one of `approved`, `pending`, `rejected`, `all`.
Non-moderators may only request `approved`.

### Delete company mail

```http
DELETE /api/delete-company-mail/:id
```

Middleware: `authMiddleware` → `moderatorAuth`

Permitted for the creator of the record **or** a moderator/super admin.

---

## 17. Voting System

```http
POST /api/upvote-company-mail/:id
POST /api/downvote-company-mail/:id
```

One vote per user per mail. The user document's `upvoteArray` and
`downvoteArray` are the source of truth:

```js
User.updateOne(
  { _id: req.user._id, upvoteArray: { $ne: mailId } },
  { $addToSet: { upvoteArray: mailId }, $pull: { downvoteArray: mailId } }
);
```

The filter matches only when the user has not already voted, and the array
update is atomic, so two simultaneous requests cannot both succeed. The mail's
counter is incremented only when `modifiedCount` is 1. Switching from upvote to
downvote withdraws the previous vote and decrements the opposite counter.

A repeat vote returns `400`.

Response:

```json
{
  "message": "Upvoted successfully",
  "upvote": 1,
  "downvote": 0
}
```

Votes can be switched but not withdrawn entirely.

---

## 18. Reporting

```http
POST /api/report-mail/:id
```

One report per user per mail, enforced the same way as voting through
`reportedArray`. The mail's `reports` counter is incremented atomically.

---

## 19. Moderator Management

Both endpoints require **super admin** authorization.

```http
POST /api/assign-moderator
POST /api/demote-moderator
```

```json
{ "email": "user@example.com" }
```

Assignment sets `role = "moderator"`, `isModerator = true` and records
`moderatorSelectedBy`. Demotion reverses all three.

**A super admin's role cannot be changed by either endpoint.** Without this,
an attacker who reached moderator level could demote the super admin and remove
their ban powers.

Assigning a user who is already a moderator returns `400`, preventing
`moderatorSelectedBy` from being silently reassigned.

Both send an email notification with the recipient's name HTML-escaped.

---

## 20. Mail Moderation

```http
POST /api/change-mail-status
```

Middleware: `authMiddleware` → `moderatorOnly`

```json
{
  "mailId": "MAIL_ID",
  "newStatus": "approved"
}
```

`newStatus` is validated against `pending`, `approved` and `rejected` before
the save. Approving clears `expiresAt`; rejecting sets it 24 hours ahead. The
acting moderator is recorded in `AttendedBy`.

---

## 21. Password Reset

### Request a reset

```http
POST /api/forgot-password
```

1. Generate a 32-byte random token.
2. Store **only its SHA-256 hash** in `resetPasswordToken`.
3. Set a 5-minute expiry.
4. Email the raw token as a reset link.

Storing the hash means a database leak yields no usable reset tokens, on the
same reasoning as password hashing. The response is an identical `200` whether
or not the account exists.

### Perform the reset

```http
POST /api/reset-password/:token
```

```json
{ "password": "at-least-8-chars" }
```

The incoming token is hashed and matched against the stored hash together with
an unexpired timestamp. On success the password is rehashed, the token cleared,
and `passwordChangedAt` set to the current time — which invalidates every JWT
issued before that moment.

---

## 22. User Templates

```http
POST /api/template/add
GET  /api/template/get
```

Stores a reusable email subject and body per user. Input is capped at 200
characters for the subject and 5000 for the body.

---

## 23. Ban System

Both endpoints require **super admin** authorization.

```http
POST /api/ban-user
POST /api/unban-user
```

Ban request body:

```json
{
  "email": "user@example.com",
  "reason": "Reason for ban"
}
```

Ban process:

1. Reject if the target is a super admin, or is the caller themselves.
2. Upsert a `BannedUser` record, so banning twice is a no-op rather than a
   duplicate-key error.
3. Send the notification email, with both the name and the reason escaped.
4. Delete the user account.

The email is sent before the deletion, because the document supplies the name
and address. A mail failure is caught so it cannot abort the ban.

Unbanning removes the record and sends a notification. The response is sent
after all work completes.

**Note:** banning deletes the user document, so mails posted by that user keep
a `postedBy` reference that no longer resolves. Handle null values when
populating.

---

## 24. API Reference

| Method | Endpoint | Authorization | Purpose |
| ------ | -------- | ------------- | ------- |
| POST | `/api/register` | Ban check | Register user |
| POST | `/api/login` | None | Login |
| POST | `/api/otp/verify` | None | Verify email with OTP |
| POST | `/api/otp/resend` | None | Request a new OTP |
| POST | `/api/forgot-password` | None | Request password reset |
| POST | `/api/reset-password/:token` | None | Reset password |
| POST | `/api/add-company` | JWT | Add company email |
| GET | `/api/get-companies/:statusParameter` | JWT | List company emails |
| DELETE | `/api/delete-company-mail/:id` | JWT + creator or moderator | Delete company email |
| POST | `/api/upvote-company-mail/:id` | JWT | Upvote |
| POST | `/api/downvote-company-mail/:id` | JWT | Downvote |
| POST | `/api/report-mail/:id` | JWT | Report |
| POST | `/api/template/add` | JWT | Save email template |
| GET | `/api/template/get` | JWT | Fetch email template |
| GET | `/api/role` | JWT | Get caller's role |
| GET | `/api/moderator-check` | JWT | Check moderator status |
| POST | `/api/change-mail-status` | JWT + moderator | Approve or reject a mail |
| POST | `/api/assign-moderator` | JWT + super admin | Assign moderator |
| POST | `/api/demote-moderator` | JWT + super admin | Demote moderator |
| POST | `/api/ban-user` | JWT + super admin | Ban user |
| POST | `/api/unban-user` | JWT + super admin | Remove ban |

---

## 25. Registration and Verification Flow

```text
Client
  │ POST /api/register
  ▼
registerLimiter → BanChecker
  │
  ▼
Registration Controller
  ├── Validate input types and length
  ├── Normalize email to lowercase
  ├── Check existing and banned
  ├── Hash password
  ├── Save user (isVerified = false)
  └── generateOTP() → sends email
  │
  ▼
201 + challengeId
  │
  │ POST /api/otp/verify { challengeId, otp }
  ▼
Verify Controller
  ├── Find user by challengeId
  ├── Check expiry
  ├── timingSafeEqual comparison
  ├── 5 failures destroys the challenge
  └── isVerified = true
  │
  ▼
Login now permitted
```

---

## 26. Authentication Flow

```text
Client
  │ POST /api/login
  ▼
authLimiter → ipFloodLimiter
  │
  ▼
Login Controller
  ├── Find user (lowercased email)
  ├── Compare password (uniform failure response)
  ├── Reject if not verified
  └── Sign JWT (HS256, 7 days)
  │
  ▼
Client receives JWT
  │ Authorization: <JWT>
  ▼
Auth Middleware
  ├── Verify JWT with pinned algorithm
  ├── Load user, reject if deleted
  ├── Reject if issued before passwordChangedAt
  └── req.user
  │
  ▼
Protected Controller
```

---

## 27. Error Handling

| Status | Meaning |
| ------ | ------- |
| `200` | Successful operation |
| `201` | Resource created |
| `400` | Invalid request or duplicate resource |
| `401` | Authentication failure |
| `403` | Authorization or ban restriction |
| `404` | Resource not found |
| `429` | Rate limit exceeded |
| `500` | Server-side error |

Errors are returned as JSON:

```json
{ "message": "Error description" }
```

Controllers log the full error server-side and return a generic message.
Raw error objects and `error.message` values are never sent to clients, since
they can disclose internal structure. A catch-all handler in `server.js`
covers anything thrown outside a controller's try/catch.

---

## 28. Security Mechanisms

**Authentication**

* Passwords hashed with bcrypt, 10 salt rounds.
* JWTs signed and verified with the algorithm pinned to `HS256`.
* Tokens expire after 7 days.
* Deleted and banned users' tokens are rejected immediately.
* Password resets invalidate all existing sessions via `passwordChangedAt`.

**Account security**

* Email verification is mandatory before login.
* OTPs are generated with a cryptographically secure RNG and compared in
  constant time, with a 5-attempt cap.
* Reset tokens are stored as SHA-256 hashes with a 5-minute expiry.

**Information disclosure**

* Login, forgot-password and OTP resend return uniform responses, so none can
  be used to discover which email addresses are registered.
* The `toJSON` transform strips password hashes, reset tokens and OTP data from
  every serialized user.
* No stack traces or raw error objects reach clients.

**Injection and input handling**

* `sanitizeFilter` blocks MongoDB operator injection at the driver level.
* Controllers verify types before querying.
* All user-supplied text inserted into outbound email HTML is escaped.
* Request bodies are capped at 100 kb.

**Authorization**

* Moderator assignment, demotion, ban and unban are restricted to super admins.
* A super admin's role cannot be changed and their account cannot be banned.
* Deletion requires ownership or moderator status.

**Abuse prevention**

* Account-keyed rate limits on login, OTP and password reset, with an IP-based
  backstop.
* Daily per-user cap on company submissions.
* One vote and one report per user per mail, enforced atomically.
* Emails are stored and compared lowercase, so bans cannot be evaded by
  changing letter case.

**Transport and headers**

* `helmet()` sets security headers and removes `X-Powered-By`.
* CORS is restricted to an allowlist; the localhost origin is excluded in
  production.

---

## 29. Operational Notes

### Rate limiting requires `NODE_ENV=production`

Every limiter is skipped when `NODE_ENV` is anything else. This is deliberate,
so local testing is not throttled, but it means the variable **must** be set on
the production host or the application runs with no rate limiting at all.

### Reverse proxies

`app.set("trust proxy", 1)` is required behind Render, Railway, Nginx or any
similar proxy. Without it every request appears to come from the proxy's IP and
the IP-based limiters block all users at once.

### Index changes are not automatic

Mongoose creates indexes but never drops or modifies existing ones. Changing an
index definition in a schema leaves the old index in the database. Drop it
explicitly, then restart so the new definition is created.

### In-memory rate limit counters

Counters reset on restart and are not shared between instances. A store such as
`rate-limit-mongo` is needed before scaling horizontally.

---

## 30. Deployment Requirements

A deployment environment must provide:

```text
Node.js
MongoDB connectivity
Environment variables (including NODE_ENV=production)
Resend API access with a verified sending domain
```

---

## 31. Production Configuration Checklist

* Configure `DBURL`, `JWT_SECRET`, `RESEND_API_KEY` and `PORT`.
* **Set `NODE_ENV=production`**, or no rate limiting is applied.
* Confirm `trust proxy` matches the hosting setup.
* Verify the Resend sending domain.
* Confirm the CORS allowlist contains the production frontend origin.
* Ensure `.env` is not committed, and rotate any secret that ever was.
* Confirm at least one account has `role: "superAdmin"`, otherwise no one can
  assign moderators or issue bans.
* Enable Dependabot or equivalent for dependency alerts.
* Add automated tests for the authentication and authorization paths.

---

## 32. Architecture

```text
                    ┌───────────────────┐
                    │      Client       │
                    └─────────┬─────────┘
                              │ HTTP / JSON
                              ▼
                    ┌───────────────────┐
                    │    Express.js     │
                    │     server.js     │
                    │  helmet + CORS    │
                    └─────────┬─────────┘
                              │
             ┌────────────────┼─────────────────┐
             │                │                 │
             ▼                ▼                 ▼
        Rate Limiters    Controllers        Middleware
             │                │                 ├── Auth
             │                │                 ├── BanChecker
             │                │                 ├── SuperAdmin
             │                │                 ├── Moderator
             │                │                 └── DomainValidation
             │                │
             └────────────────┼─────────────────┘
                              ▼
                    ┌───────────────────┐
                    │     Mongoose      │
                    │  sanitizeFilter   │
                    └─────────┬─────────┘
                              ▼
                    ┌───────────────────┐
                    │      MongoDB      │
                    └───────────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │      Resend       │
                    │   Email Service   │
                    └───────────────────┘
```

---

## 33. Summary

```text
Express
   │
   ├── Authentication
   │     ├── JWT (HS256, 7 days)
   │     ├── Email verification (OTP)
   │     └── Session invalidation on password change
   │
   ├── User Management
   │     ├── Registration
   │     ├── Login
   │     ├── Password Reset
   │     └── Ban / Unban
   │
   ├── Company Email Management
   │     ├── Add (domain-validated)
   │     ├── Retrieve (status-filtered)
   │     ├── Delete (creator or moderator)
   │     ├── Upvote / Downvote (one per user)
   │     ├── Report (one per user)
   │     └── Approve / Reject (moderator)
   │
   ├── Moderator Management
   │     ├── Assign (super admin)
   │     └── Demote (super admin)
   │
   ├── Authorization
   │     ├── User
   │     ├── Moderator
   │     └── Super Admin
   │
   ├── Rate Limiting
   │     ├── Account-keyed
   │     ├── IP backstop
   │     └── Per-user daily caps
   │
   └── Email Notifications
         └── Resend
```