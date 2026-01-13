# Authentication Testing Guide

**Story:** 1.3 - Authentication System Integration
**Date:** 2025-11-13
**Status:** Ready for Manual Verification

## Overview

This guide provides comprehensive manual testing procedures for the Better-Auth authentication system integration in the Planner application. All authentication infrastructure has been implemented and verified for configuration correctness. Manual browser testing is required to validate end-to-end functionality.

## Prerequisites

1. **Development Environment:**
   - Dev server running: `bun run dev` (http://localhost:3001)
   - PostgreSQL database running: `bun run db:start`
   - Database seeded with test users: `bun run db:seed`

2. **Test Users (from seed data):**
   - ✅ `test@example.com` / `TestPassword123!` (verified user)
   - ✅ `admin@example.com` / `AdminPassword123!` (verified user)
   - ✅ `demo@example.com` / `DemoPassword123!` (verified user)
   - ❌ `unverified@example.com` / `UnverifiedPassword123!` (unverified user)

3. **Required Tools:**
   - Chrome/Firefox/Safari browser with DevTools
   - Access to Drizzle Studio: `bun run db:studio` (optional, for database verification)

## Test Suite

### Test 1: Sign-Up Flow (AC #1)

**Objective:** Verify new user can sign up with email/password and is automatically logged in

**Steps:**
1. Navigate to http://localhost:3001/login
2. Verify sign-up form is displayed (default view)
3. Enter test data:
   - Email: `newuser-{timestamp}@example.com` (must be unique)
   - Name: `Test User`
   - Password: `NewUserPassword123!` (minimum 8 characters)
4. Click "Sign Up" button
5. Verify redirect to `/dashboard`
6. Verify success toast notification appears
7. Verify user name displays: "Welcome Test User"

**Expected Results:**
- ✅ Redirect to `/dashboard` after successful signup
- ✅ Success toast: "Sign up successful" or similar message
- ✅ User name displayed in dashboard
- ✅ Database verification (optional):
  - New record in `users` table with hashed password
  - New record in `accounts` table with `providerId: "credential"`
  - New record in `sessions` table with active session

**Acceptance Criteria:** AC #1

---

### Test 2: Login Flow with Valid Credentials (AC #2)

**Objective:** Verify existing user can log in with correct email/password

**Steps:**
1. Navigate to http://localhost:3001/login
2. If on sign-up form, click "Already have an account? Sign in"
3. Enter credentials:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
4. Click "Sign In" button
5. Verify redirect to `/dashboard`
6. Verify user name displays: "Welcome {name}"
7. Click user menu icon in header
8. Verify email displays in dropdown menu

**Expected Results:**
- ✅ Redirect to `/dashboard` after successful login
- ✅ User name displayed: "Welcome Test" (or actual name from seed data)
- ✅ Email displayed in user menu
- ✅ Database verification (optional):
  - New session record created in `sessions` table

**Acceptance Criteria:** AC #2

---

### Test 3: Invalid Credentials Error Handling (AC #3)

**Objective:** Verify clear error messages for invalid login attempts

**Test 3a: Wrong Password**
1. Navigate to http://localhost:3001/login
2. Switch to sign-in form
3. Enter credentials:
   - Email: `test@example.com`
   - Password: `WrongPassword123!`
4. Click "Sign In"

**Expected Results:**
- ✅ Error toast appears with clear message (e.g., "Invalid credentials")
- ✅ No redirect - remain on `/login` page
- ✅ Database verification: No new session created

**Test 3b: Non-Existent Email**
1. Navigate to http://localhost:3001/login
2. Enter credentials:
   - Email: `nonexistent@example.com`
   - Password: `TestPassword123!`
3. Click "Sign In"

**Expected Results:**
- ✅ Error toast with message (e.g., "User not found" or "Invalid credentials")
- ✅ Remain on `/login` page

**Test 3c: Empty Fields**
1. Navigate to http://localhost:3001/login
2. Leave email and/or password empty
3. Attempt to click "Sign In"

**Expected Results:**
- ✅ Submit button should be disabled OR
- ✅ Inline validation errors appear on blur

**Acceptance Criteria:** AC #3

---

### Test 4: Session Persistence Across Browser Refresh (AC #4)

**Objective:** Verify session persists when user refreshes the browser

**Steps:**
1. Log in with valid credentials (use `test@example.com` / `TestPassword123!`)
2. Verify on `/dashboard` page
3. Press F5 (or Cmd+R on Mac) to refresh browser
4. Wait for page reload

**Expected Results:**
- ✅ Still logged in on `/dashboard` page (no redirect to `/login`)
- ✅ User name still displayed
- ✅ DevTools verification (optional):
  - Open DevTools → Application → Cookies
  - Verify Better-Auth session cookie still present
  - Cookie should not have expired

**Acceptance Criteria:** AC #4

---

### Test 5: Session Cookie Security Flags (AC #5)

**Objective:** Verify session cookies have proper security configuration

**Steps:**
1. Log in with valid credentials
2. Open Browser DevTools:
   - Chrome: F12 → Application tab → Cookies → http://localhost:3001
   - Firefox: F12 → Storage tab → Cookies
   - Safari: Develop menu → Show Web Inspector → Storage tab → Cookies
3. Locate the Better-Auth session cookie (typically named `better-auth.session_token` or similar)
4. Inspect cookie attributes

**Expected Cookie Attributes:**
- ✅ **httpOnly:** Checked/Enabled (prevents JavaScript access - XSS protection)
- ✅ **sameSite:** Lax or Strict (CSRF protection)
- ⚠️ **secure:** NOT checked in development (localhost uses HTTP)
  - Note: Will be enabled in production with HTTPS
- ✅ **Expires/Max-Age:** Approximately 7 days from current time (604800 seconds)
- ✅ **Path:** / (available to entire application)

**Acceptance Criteria:** AC #5

---

### Test 6: Logout Flow (AC #6)

**Objective:** Verify logout clears session and redirects to home page

**Steps:**
1. Log in with valid credentials
2. Navigate to `/dashboard`
3. Click user menu icon in header (typically avatar or name)
4. Click "Sign Out" button in dropdown
5. Observe redirect behavior

**Expected Results:**
- ✅ Redirect to home page (`/`) or `/login`
- ✅ Database verification (optional):
  - Session record deleted or invalidated in `sessions` table
- ✅ DevTools verification:
  - Session cookie removed from browser
- ✅ Attempt to access `/dashboard` by typing URL directly
- ✅ Verify automatic redirect to `/login` (protected route working)

**Acceptance Criteria:** AC #6

---

### Test 7: Protected Route Redirection (AC #7)

**Objective:** Verify unauthenticated users are redirected from protected routes

**Steps:**
1. Ensure logged out (clear cookies if needed):
   - DevTools → Application → Cookies → Delete all cookies
   - Or click "Sign Out" if logged in
2. Manually navigate to http://localhost:3001/dashboard by typing in address bar
3. Observe redirect behavior

**Expected Results:**
- ✅ Automatic redirect to `/login` page
- ✅ Login form displayed

**Follow-up Test:**
1. Log in with valid credentials from `/login` page
2. Verify redirect back to `/dashboard` after successful login

**Expected Results:**
- ✅ Redirect to `/dashboard` after login
- ✅ Dashboard content displayed

**Acceptance Criteria:** AC #7

---

### Test 8: Form Validation UX (AC #8)

**Objective:** Verify inline validation provides clear feedback

**Test 8a: Email Validation**
1. Navigate to `/login` page (sign-up or sign-in form)
2. Click in email field, enter invalid email: `invalidemail`
3. Tab out or click elsewhere (blur event)

**Expected Results:**
- ✅ Inline error message appears in red below email field
- ✅ Error message: "Invalid email address" or similar
- ✅ Submit button disabled while email is invalid

**Test 8b: Password Validation (Length)**
1. On sign-up form, enter password: `short` (less than 8 characters)
2. Tab out or click elsewhere

**Expected Results:**
- ✅ Inline error message in red: "Password must be at least 8 characters"
- ✅ Submit button disabled

**Test 8c: Name Validation (Sign-Up)**
1. On sign-up form, enter name: `A` (less than 2 characters)
2. Tab out

**Expected Results:**
- ✅ Inline error message in red (if name validation exists)
- ✅ Submit button disabled

**Test 8d: Error Color Verification**
1. Trigger any validation error
2. Inspect error text color

**Expected Results:**
- ✅ Error text color: red (should use CSS variable `var(--color-error)` if design system is implemented)

**Test 8e: Error Clearing**
1. Trigger validation error (e.g., invalid email)
2. Correct the field (enter valid email)
3. Tab out or blur the field

**Expected Results:**
- ✅ Error message disappears
- ✅ Submit button becomes enabled (if all other fields are valid)

**Acceptance Criteria:** AC #8

---

### Test 9: Polish and Edge Cases (AC All)

**Test 9a: Rapid Form Submissions**
1. Fill out sign-up or sign-in form with valid data
2. Click "Submit" button multiple times rapidly

**Expected Results:**
- ✅ Only one submission occurs (double-submit prevention)
- ✅ Button shows loading state or becomes disabled during submission

**Test 9b: Network Error Handling**
1. Open DevTools → Network tab
2. Enable "Offline" mode or throttle to "Offline"
3. Attempt to log in

**Expected Results:**
- ✅ Error toast with message about network failure
- ✅ No crash or hang - graceful error handling

**Test 9c: Loading States**
1. Fill out form and submit
2. Observe button and form state during submission

**Expected Results:**
- ✅ Loading indicator (spinner) appears on submit button
- ✅ Form fields disabled during submission
- ✅ Clear visual feedback that request is in progress

**Test 9d: Email Case Sensitivity**
1. Create user with email: `TestUser@example.com`
2. Log out
3. Log in with email: `testuser@example.com` (lowercase)

**Expected Results:**
- ✅ Login succeeds (email should be case-insensitive)

**Test 9e: Password Obscured**
1. Click in password field
2. Enter password characters

**Expected Results:**
- ✅ Password characters displayed as bullets (•••) or asterisks (***)
- ✅ No plain text visible

**Test 9f: Cross-Browser Compatibility**
1. Test login flow in Chrome
2. Test login flow in Firefox
3. Test login flow in Safari (if on macOS)

**Expected Results:**
- ✅ Authentication works consistently across all browsers
- ✅ No browser-specific bugs or layout issues

**Acceptance Criteria:** All ACs

---

## Test Completion Checklist

Mark each test as complete after verification:

- [ ] Test 1: Sign-up flow (AC #1)
- [ ] Test 2: Login with valid credentials (AC #2)
- [ ] Test 3a: Invalid password error (AC #3)
- [ ] Test 3b: Non-existent email error (AC #3)
- [ ] Test 3c: Empty fields validation (AC #3)
- [ ] Test 4: Session persistence on refresh (AC #4)
- [ ] Test 5: Cookie security flags (AC #5)
- [ ] Test 6: Logout flow (AC #6)
- [ ] Test 7: Protected route redirection (AC #7)
- [ ] Test 8a: Email validation (AC #8)
- [ ] Test 8b: Password length validation (AC #8)
- [ ] Test 8c: Name validation (AC #8)
- [ ] Test 8d: Error color verification (AC #8)
- [ ] Test 8e: Error clearing (AC #8)
- [ ] Test 9a: Double-submit prevention (All ACs)
- [ ] Test 9b: Network error handling (All ACs)
- [ ] Test 9c: Loading states (All ACs)
- [ ] Test 9d: Email case insensitivity (All ACs)
- [ ] Test 9e: Password obscured (All ACs)
- [ ] Test 9f: Cross-browser testing (All ACs)

## Known Issues / Notes

(Document any issues discovered during testing here)

## Test Environment

- **OS:** macOS/Windows/Linux
- **Browser:** Chrome/Firefox/Safari (version)
- **Node Version:** (from `node -v`)
- **Bun Version:** 1.3.1
- **Database:** PostgreSQL 16-alpine (Docker)
- **Test Date:** 2025-11-13

## References

- Story File: `_bmad-output/implementation-artifacts/1-3-authentication-system-integration.md`
- Architecture Doc: `docs/architecture.md#Authentication-Flow`
- Tech Spec: `_bmad-output/implementation-artifacts/tech-spec-epic-1.md#Story-1.3`
- Better-Auth Config: `packages/auth/src/index.ts`
- Auth Client: `apps/web/src/lib/auth-client.ts`

---

**Next Steps After Testing:**

1. Mark all test checkboxes as complete
2. Document any bugs or issues found
3. Update story file with test results
4. Mark story as "review" status
5. Run code review workflow if needed
