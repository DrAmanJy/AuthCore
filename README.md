# AuthCore - Enterprise-Grade Authentication & Session Management Service

Welcome to the definitive documentation for **AuthCore**, a highly scalable, centralized authentication and session management microservice built for modern web and mobile applications. This documentation provides an exhaustive, deep-dive overview of the service's architecture, security paradigms, API contracts, deployment methodologies, and developer workflows. It is designed to serve as both a showcase of best practices in backend engineering and a comprehensive guide for anyone looking to integrate with or contribute to the AuthCore ecosystem.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Motivation & Design Philosophy](#project-motivation--design-philosophy)
3. [Core Technologies & Stack](#core-technologies--stack)
4. [System Architecture](#system-architecture)
5. [Security Posture & Implementations](#security-posture--implementations)
6. [Data Models & Schema Design](#data-models--schema-design)
7. [Comprehensive API Reference](#comprehensive-api-reference)
    - [Authentication Endpoints (`/auth`)](#authentication-endpoints)
    - [User Management (`/user`)](#user-management)
    - [Session Management (`/session`)](#session-management)
8. [Session Lifecycle & State Management](#session-lifecycle--state-management)
9. [Error Handling & Standard Responses](#error-handling--standard-responses)
10. [Development Guide & Local Setup](#development-guide--local-setup)
11. [Environment Variable Configuration](#environment-variable-configuration)
12. [Deployment Strategies](#deployment-strategies)
13. [Future Roadmap](#future-roadmap)

---

## Executive Summary

**AuthCore** is a robust, standalone authentication service engineered to offload the complexities of identity verification, token lifecycle management, and active session tracking from core business applications. In modern distributed systems and microservice architectures, centralizing authentication provides immense benefits, including standardized security policies, reduced duplication of effort, and a unified audit trail for user interactions.

This project was built from the ground up to handle high-concurrency environments while maintaining uncompromising security standards. It features JWT-based stateless access combined with stateful refresh tokens and active database-backed session tracking. This hybrid approach offers the performance benefits of stateless tokens alongside the security guarantees of absolute revocation and device-level session monitoring.

---

## Project Motivation & Design Philosophy

The creation of AuthCore was driven by the repetitive necessity of implementing secure authentication in every new project. By abstracting these concerns into a dedicated service, we achieve:

1.  **Separation of Concerns:** Business logic microservices should not be burdened with password hashing, token generation, or OTP email dispatching.
2.  **Enhanced Security:** Centralizing identity allows for a single, heavily fortified perimeter. Security patches to the authentication flow only need to be deployed to one service.
3.  **Cross-Platform Compatibility:** With endpoints designed to support multiple clients (Web, iOS, Android), AuthCore uses `x-target-audience` headers and user-agent parsing to tailor token lifetimes and track login origins dynamically.
4.  **Absolute Control over Sessions:** Unlike pure JWT implementations where tokens cannot be effectively invalidated before expiration, AuthCore tracks every active session. Users can view their logged-in devices and remotely terminate suspicious sessions.

### Design Principles
-   **Defense in Depth:** Multiple layers of security, including rate limiting, Helmet for HTTP header hardening, CORS restrictions, and robust payload validation using Zod.
-   **Fail Securely:** All errors revert to a secure state. Vague error messages are provided for authentication failures to prevent user enumeration attacks.
-   **Observability:** Integrated request logging via Morgan and standardized error responses facilitate easy debugging and integration with APM tools.

---

## Core Technologies & Stack

AuthCore is built on a modern Node.js stack, leveraging the asynchronous nature of JavaScript to handle concurrent connections efficiently.

-   **Runtime:** Node.js (v22+)
-   **Framework:** Express.js (v5.x) - Utilizing the latest Express features for robust routing and middleware execution.
-   **Language:** JavaScript (ES Modules)
-   **Database:** MongoDB with Mongoose (v9.x) for flexible, schema-driven data modeling.
-   **Authentication & Cryptography:** 
    -   `bcrypt` (v6.x) for computationally expensive password hashing.
    -   `jsonwebtoken` (v9.x) for generating and verifying cryptographic access and refresh tokens.
-   **Validation:** `zod` for rigorous, schema-based request payload validation.
-   **Security Utilities:**
    -   `helmet`: Secures Express apps by setting various HTTP headers.
    -   `express-rate-limit`: Protects against brute-force and DDoS attacks.
    -   `cors`: Manages Cross-Origin Resource Sharing.
-   **Utilities:**
    -   `resend`: For transactional email delivery (OTPs, verifications).
    -   `ua-parser-js`: For parsing user-agent strings to identify devices and browsers in session management.
-   **Documentation:** `swagger-jsdoc` and `swagger-ui-express` for generating the OpenAPI specification.

---

## System Architecture

AuthCore follows a modular, feature-based directory structure (often referred to as a "screaming architecture") which makes the codebase highly navigable and maintainable.

### High-Level Directory Structure
```
src/
├── config/         # Environment variables and database connection logic
├── docs/           # Swagger UI configurations and static documentation
├── middleware/     # Global and route-specific middleware (auth, error handling)
├── modules/        # Feature modules containing routes, controllers, and services
│   ├── auth/       # Registration, login, logout, refresh logic
│   ├── passwordReset/ # Password recovery flows
│   ├── service/    # Shared business logic
│   ├── sessions/   # Session retrieval and invalidation
│   └── users/      # User profile management
├── utils/          # Helper functions, custom error classes, and wrappers
├── app.js          # Express application setup and middleware pipeline
└── server.js       # Entry point, server instantiation, and graceful shutdown
```

### Request Lifecycle
1.  **Ingress & Security:** Incoming requests pass through Helmet, CORS, and standard Express body parsers (JSON, Cookies).
2.  **Rate Limiting:** IP-based rate limiters prevent brute-force abuse.
3.  **Routing:** The Express router delegates the request to the appropriate feature module.
4.  **Validation:** Route-level middleware validates the request payload against predefined Zod schemas. Invalid payloads are immediately rejected with a 400 Bad Request.
5.  **Authentication (If applicable):** Protected routes trigger the `verifyToken` middleware, which parses the Bearer token or cookie, verifies its signature, and attaches the user context to the request.
6.  **Controller & Service:** The controller handles the HTTP context, calling pure service functions containing the core business logic, database interactions, and external API calls (e.g., sending emails).
7.  **Response/Error:** The controller formats the success response. If an error is thrown at any point, it is caught by the global error handler (`errorHandler.middleware.js`), which formats a standardized JSON error response based on the environment (development vs. production).

---

## Security Posture & Implementations

Security is not an afterthought in AuthCore; it is woven into the fabric of the application.

### 1. Hybrid Token Architecture
AuthCore employs a dual-token system:
-   **Access Tokens (Short-Lived):** JWTs used for immediate authorization. They are stateless, fast to verify, and expire quickly (e.g., 15 minutes).
-   **Refresh Tokens (Long-Lived):** Cryptographically secure, opaque strings or long-lived JWTs stored securely (e.g., in HttpOnly, Secure cookies). They are used to obtain new access tokens and are actively tracked in the database, allowing for immediate revocation.

### 2. Password Hashing
Passwords are never stored in plain text. AuthCore utilizes `bcrypt` with a sufficiently high salt round (cost factor) to mitigate dictionary and rainbow table attacks. The cost factor can be adjusted via environment variables as hardware speeds increase.

### 3. Rate Limiting Strategies
Global rate limiters restrict the overall number of requests from a single IP, while specialized, stricter rate limiters are applied to sensitive endpoints like `/auth/login` and `/auth/verify` to prevent brute forcing of passwords and OTPs.

### 4. Payload Validation
Using `zod`, every incoming request body, query parameter, and relevant header is strictly validated. This prevents NoSQL injection, prototype pollution, and ensures the application only processes expected data shapes.

### 5. HTTP Header Security
`helmet` is configured to set secure HTTP response headers, mitigating vulnerabilities like Cross-Site Scripting (XSS), Clickjacking, and MIME-sniffing.

### 6. User Agent & IP Tracking
When a user logs in, AuthCore parses the User-Agent using `ua-parser-js` and captures the IP address. This data is stored in the Session document, enabling the user to review active sessions for suspicious activity (e.g., a login from an unrecognized browser or geographical location).

---

## Data Models & Schema Design

The application relies on a NoSQL database (MongoDB) modeled with Mongoose. The primary collections are `Users` and `Sessions`.

### User Schema
The core representation of an identity within the system.

-   `_id`: Unique identifier (ObjectId).
-   `email`: String, unique, indexed, heavily validated.
-   `password`: String, bcrypt hashed.
-   `isVerified`: Boolean, indicating if the email has been confirmed via OTP.
-   `role`: Enum (e.g., 'user', 'admin'), defining global system privileges.
-   `createdAt` / `updatedAt`: Timestamps.

### Session Schema
Represents an active, authenticated device/client.

-   `_id`: Unique identifier.
-   `userId`: Reference to the User schema.
-   `refreshToken`: The hashed version of the currently active refresh token for this session.
-   `userAgent`: Raw user-agent string.
-   `deviceInfo`: Parsed object containing browser, OS, and device type.
-   `ipAddress`: The IP address from which the session was initiated.
-   `expiresAt`: Date when the session automatically expires, requiring re-authentication.
-   `createdAt`: Timestamp of login.

---

## Comprehensive API Reference

This section outlines the extensive RESTful API provided by AuthCore. The API is designed to be intuitive, resource-oriented, and highly predictable.

### Authentication Endpoints

These endpoints manage the core lifecycle of establishing and terminating identities.

#### `POST /auth/register`
Creates a new user account. Triggers an asynchronous process to send a verification OTP to the provided email address.

-   **Body:**
    -   `email` (string, required): A valid email address.
    -   `password` (string, required): Must meet complexity requirements (length, characters).
-   **Responses:**
    -   `201 Created`: User successfully registered.
    -   `400 Bad Request`: Validation failure (e.g., weak password).
    -   `409 Conflict`: Email already exists.

#### `POST /auth/login`
Authenticates a user and establishes a new session.

-   **Headers:**
    -   `x-target-audience` (string, optional): Defines the client type (e.g., 'web', 'mobile') to adjust token lifetimes.
-   **Body:**
    -   `email` (string, required)
    -   `password` (string, required)
-   **Responses:**
    -   `200 OK`: Successful login. Returns Access Token in payload, sets Refresh Token in HttpOnly cookie.
    -   `401 Unauthorized`: Invalid credentials or unverified email.

#### `POST /auth/refresh`
Issues a new Access Token using a valid Refresh Token.

-   **Headers:**
    -   `x-target-audience` (string, optional)
-   **Cookies:** `refreshToken`
-   **Responses:**
    -   `200 OK`: Returns new Access Token.
    -   `401 Unauthorized`: Refresh token invalid, expired, or revoked.
    -   `403 Forbidden`: Token reuse detected (potential security breach).

#### `POST /auth/resend-verification`
Resends the OTP for email verification.

-   **Body:**
    -   `email` (string, required)
-   **Responses:**
    -   `200 OK`: OTP sent (even if email doesn't exist, to prevent enumeration).
    -   `429 Too Many Requests`: Rate limit exceeded for OTP generation.

#### `POST /auth/verify`
Verifies a user's email address using the provided OTP.

-   **Body:**
    -   `email` (string, required)
    -   `otp` (string, required)
-   **Responses:**
    -   `200 OK`: Email verified. Automatically logs the user in and returns tokens.
    -   `400 Bad Request`: Invalid or expired OTP.

#### `POST /auth/logout`
Terminates the current session by invalidating the refresh token and clearing cookies.

-   **Headers:** `Authorization: Bearer <token>`
-   **Responses:**
    -   `200 OK`: Successfully logged out.

#### `POST /auth/logout-all`
Terminates ALL active sessions for the authenticated user across all devices.

-   **Headers:** `Authorization: Bearer <token>`
-   **Responses:**
    -   `200 OK`: All sessions invalidated.

#### `PATCH /auth/change-password`
Allows an authenticated user to update their password.

-   **Headers:** `Authorization: Bearer <token>`
-   **Body:**
    -   `oldPassword` (string, required)
    -   `newPassword` (string, required)
-   **Responses:**
    -   `200 OK`: Password updated successfully. All other sessions are typically invalidated.
    -   `401 Unauthorized`: Incorrect old password.

### User Management

Endpoints for managing the authenticated user's profile.

#### `GET /user/me`
Retrieves the profile of the currently authenticated user.

-   **Headers:** `Authorization: Bearer <token>`
-   **Responses:**
    -   `200 OK`: Returns user details (excluding password hash).

#### `PATCH /user/me`
Updates specific fields of the user's profile.

-   **Headers:** `Authorization: Bearer <token>`
-   **Body:** Updatable fields (e.g., name, preferences).
-   **Responses:**
    -   `200 OK`: Profile updated.

#### `DELETE /user/me`
Permanently deletes the user's account and all associated data, including all active sessions.

-   **Headers:** `Authorization: Bearer <token>`
-   **Responses:**
    -   `200 OK`: Account deleted.

### Session Management

Endpoints for auditing and managing active logins across devices.

#### `GET /session/`
Retrieves a list of all currently active sessions for the authenticated user. Useful for building a "Logged in Devices" UI.

-   **Headers:** `Authorization: Bearer <token>`
-   **Responses:**
    -   `200 OK`: Array of session objects (excluding sensitive token hashes), detailing browser, OS, IP, and last active time.

#### `DELETE /session/`
Deletes the current session. Functionally similar to `/auth/logout`.

-   **Headers:** `Authorization: Bearer <token>`
-   **Responses:**
    -   `200 OK`: Session terminated.

#### `GET /session/{sessionId}`
Retrieves details for a specific session.

-   **Headers:** `Authorization: Bearer <token>`
-   **Path Parameters:** `sessionId`
-   **Responses:**
    -   `200 OK`: Session details.
    -   `404 Not Found`: Session does not exist or does not belong to the user.

#### `DELETE /session/{sessionId}`
Revokes a specific session. This allows a user to remotely log out of a session on another device.

-   **Headers:** `Authorization: Bearer <token>`
-   **Path Parameters:** `sessionId`
-   **Responses:**
    -   `200 OK`: Target session terminated.

---

## Session Lifecycle & State Management

AuthCore takes a sophisticated approach to session management, treating sessions as first-class entities.

1.  **Creation:** Upon a successful login or email verification, a new `Session` document is created in the database. The ID of this session is embedded in the Refresh Token.
2.  **Maintenance:** When an Access Token expires, the client sends the Refresh Token to the `/refresh` endpoint. The server verifies the token signature, checks if the session ID exists in the database, and verifies that the session hasn't been revoked.
3.  **Rotation:** AuthCore supports Refresh Token Rotation. Every time a refresh token is used, it is invalidated and a new one is issued. This provides a mechanism to detect token theft; if a stolen token is reused, the system detects the anomaly and revokes the entire session chain.
4.  **Termination:** Sessions can be terminated voluntarily (logout), remotely via the Session Management API, or automatically when the `expiresAt` threshold is reached.

---

## Error Handling & Standard Responses

AuthCore utilizes a centralized error handling middleware (`errorHandler.middleware.js`) to ensure all API responses adhere to a predictable structure, regardless of where the error originated.

### Standard Error Response Format
```json
{
  "status": "fail",
  "message": "Human-readable error description",
}
```

### The `AppError` Class
Throughout the codebase, the custom `AppError` class is used to throw operational errors. It captures the HTTP status code, operational status (true/false indicating if it was expected), and standardizes the error message.

```javascript
// Example usage inside a service
if (!user) {
  throw new AppError("Invalid credentials", 401);
}
```

### Environment-Specific Details
In a `development` environment, the error response includes the full stack trace to aid in debugging. In `production`, stack traces are strictly suppressed to prevent information leakage.

---

## Development Guide & Local Setup

To run AuthCore locally, you will need Node.js (v22+) and access to a MongoDB instance. This project uses `pnpm` as its package manager for speed and deterministic dependencies.

### Prerequisites
- Node.js >= 22
- pnpm >= 10.x
- MongoDB (Local or Atlas)
- Resend API Key (for email delivery)

### Setup Steps
1.  **Clone the repository.**
2.  **Install dependencies:**
    ```bash
    pnpm install
    ```
3.  **Configure Environment:**
    Copy the sample environment file and populate the variables.
    ```bash
    cp .env.example .env
    ```
4.  **Start the Development Server:**
    Uses `nodemon` to automatically restart the server on file changes.
    ```bash
    pnpm run dev
    ```

The server will start on port 3000 (or the port defined in your `.env`), and API documentation will be accessible at `http://localhost:3000/docs`.

---

## Environment Variable Configuration

AuthCore's behavior is highly configurable via environment variables.

| Variable Name | Description | Default / Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Application environment (`development`, `production`) | `development` |
| `PORT` | The port the Express server binds to | `3000` |
| `MONGODB_URI` | Connection string for MongoDB | `mongodb://localhost:27017/authcore` |
| `JWT_SECRET` | Cryptographic secret for signing Access Tokens | `very_complex_secret_string` |
| `JWT_EXPIRES_IN` | Lifetime of the Access Token | `15m` |
| `JWT_REFRESH_SECRET`| Cryptographic secret for signing Refresh Tokens | `another_complex_secret_string`|
| `JWT_REFRESH_EXPIRES_IN`| Lifetime of the Refresh Token | `7d` |
| `RESEND_API_KEY` | API key for the Resend email service | `re_...` |
| `CLIENT_URL` | Allowed origin for CORS (Frontend application URL) | `http://localhost:5173` |
| `BCRYPT_COST` | Computational cost factor for password hashing | `12` |

---

## Deployment Strategies

AuthCore is designed to be stateless (at the application tier) and horizontally scalable.

### Containerization (Docker)
The recommended deployment method is via Docker. A standard `Dockerfile` can be used to containerize the Node.js application, ensuring consistency across environments.

```dockerfile
# Example Dockerfile concept
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "start"]
```

### Scalability Considerations
-   **Stateless Execution:** Because session state is stored in MongoDB, you can run multiple instances of the AuthCore service behind a load balancer without configuring sticky sessions.
-   **Database Scaling:** As read/write loads increase, scale the MongoDB cluster (e.g., utilizing Replica Sets and eventually Sharding).
-   **Caching:** For ultra-high performance, consider adding a Redis caching layer for frequently accessed, slow-changing data (like checking revoked token lists or user roles), though this adds architectural complexity.

---

## Future Roadmap

While AuthCore is production-ready, continuous evolution is planned. Upcoming features include:

1.  **OAuth2 / Social Logins:** Integration with Google, GitHub, and Apple for frictionless onboarding.
2.  **Multi-Factor Authentication (MFA):** Support for Time-Based One-Time Passwords (TOTP) using authenticator apps.
3.  **Passkeys (WebAuthn):** Implementing passwordless authentication flows using biometric hardware devices.
4.  **Role-Based Access Control (RBAC) Expansion:** Finer-grained permissions and scopes integrated directly into the token payloads.
5.  **Event Webhooks:** Emitting real-time events (e.g., `user.created`, `session.revoked`) to allow external systems to react to identity changes.

---
*AuthCore — Securing digital identities, one session at a time.*
