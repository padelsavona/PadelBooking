# ADR 002: Authentication and Authorization

## Status
Accepted

## Context
We need a secure and scalable authentication and authorization system for the PadelBooking platform.

## Decision
We will use JWT-based authentication with role-based access control (RBAC).

## Details

### Authentication
- JWT tokens for stateless authentication
- Password hashing with bcrypt (cost factor 12)
- Token expiration: 30 minutes (configurable)
- Refresh tokens not implemented in v1 (future consideration)

### Authorization (RBAC)
Three roles:
1. **USER**: Can book courts, view/cancel own bookings
2. **MANAGER**: USER privileges + manage courts, view all bookings
3. **ADMIN**: Full system access, user management

### Security Measures
- Password requirements: min 8 chars, uppercase, lowercase, digit
- Rate limiting on authentication endpoints
- No password in API responses
- Secure password reset flow (future)

## Rationale
- JWT is stateless, scales horizontally
- RBAC provides clear separation of concerns
- Bcrypt is industry-standard for password hashing
- Role system is simple but extensible

## Consequences

### Positive
- Stateless authentication scales well
- Clear security boundaries
- Industry-standard approach
- Easy to audit access

### Negative
- No built-in token revocation (requires additional infrastructure)
- 30-minute expiration may be short for some use cases
- Refresh token complexity deferred

## Future Enhancements
- OAuth2/OIDC integration (Google, etc.)
- Multi-factor authentication
- Refresh tokens
- Token blacklisting for logout
