# Manual Testing Guide: Story 1.4 - UI Shell and Theme System

## Overview

This guide provides step-by-step instructions for manually testing all acceptance criteria for Story 1.4: Basic UI Shell and Theme System.

**Story Status:** Implementation complete, awaiting manual browser validation
**Test Environment:** Development server (bun run dev)
**Required Tools:** Modern browser (Chrome recommended for DevTools), keyboard, mouse

---

## Pre-Test Setup

1. **Start the development server:**
   ```bash
   cd /Users/vladimir.leletko/develop/planner/planner
   bun run dev
   ```

2. **Open browser to:** http://localhost:3000

3. **Login credentials:** Use test user from database seed data:
   - Email: admin@example.com (or check packages/database/src/seed.ts for test users)
   - Password: password (or as configured in seed)

---

## Acceptance Criteria Testing

### AC1: Application Header is Visible and Functional

**Steps:**
1. Navigate to /dashboard after logging in
2. Observe the header at the top of the page

**Expected Results:**
- [ ] Header is visible at the top
- [ ] "Planner" branding/logo is visible (square "P" with teal gradient)
- [ ] Navigation links are visible: Board, Projects, Reports
- [ ] User menu button is visible with avatar showing user initials
- [ ] Theme toggle button is visible (Sun or Moon icon)
- [ ] "+ New Card" button is visible (or just "+" on mobile)
- [ ] Header remains fixed at top when scrolling page content

**PASS / FAIL:** _____

**Notes:** _________________________________________________

---

### AC2: User Menu Displays Correct Information

**Steps:**
1. Ensure you're logged in as a test user with known name/email
2. Click on the user menu button (avatar with name) in the header
3. Observe the dropdown menu that appears
4. Click outside the menu to close it
5. Open the menu again and press Escape key

**Expected Results:**
- [ ] Dropdown menu opens when clicking user menu button
- [ ] User's name is displayed in the menu
- [ ] User's email is displayed in the menu
- [ ] "Logout" option is visible
- [ ] Menu closes when clicking outside
- [ ] Menu closes when pressing Escape key

**PASS / FAIL:** _____

**Notes:** _________________________________________________

---

### AC3: Theme Toggle Switches Modes Smoothly

**Steps:**
1. Navigate to any page after logging in (e.g., /dashboard)
2. Observe the current theme (light or dark)
3. Click the theme toggle button (Sun/Moon icon)
4. Watch the transition carefully
5. Toggle again to return to original theme

**Expected Results:**
- [ ] Theme switches between light and dark mode
- [ ] Transition is smooth (200ms fade, no jarring flash)
- [ ] Background color transitions smoothly
- [ ] Text colors update appropriately
- [ ] All UI components reflect the new theme colors
- [ ] Theme icon updates (Sun for light mode, Moon for dark mode)
- [ ] No flash of unstyled content during transition

**PASS / FAIL:** _____

**Notes:** _________________________________________________

---

### AC4: Theme Preference Persists Across Sessions

**Steps:**
1. Set theme to dark mode using the toggle
2. Refresh the browser (Cmd+R or Ctrl+R)
3. Observe if dark mode is still active
4. Close the browser tab completely
5. Open a new tab and navigate to http://localhost:3000/dashboard
6. Observe if dark mode is still active
7. Open browser DevTools > Application > Local Storage
8. Check for key "planner-theme"

**Expected Results:**
- [ ] Dark mode persists after browser refresh
- [ ] Dark mode persists after closing and reopening tab
- [ ] localStorage contains "planner-theme" key with value "dark"
- [ ] Switching to light mode updates localStorage to "light"
- [ ] System theme option (if available) respects OS preference

**PASS / FAIL:** _____

**Notes:** _________________________________________________

---

### AC5: Responsive Layout Works on Mobile and Desktop

**Steps:**
1. Open browser DevTools (F12 or right-click > Inspect)
2. Click the device toolbar icon (Cmd+Shift+M or Ctrl+Shift+M)
3. Test Desktop: Set viewport to 1440px width
4. Observe header and navigation
5. Test Tablet: Set viewport to 768px width
6. Test Mobile: Set viewport to 375px width
7. Observe how header adapts on each size

**Expected Results:**

**Desktop (1440px):**
- [ ] Header displays full navigation links (Board, Projects, Reports)
- [ ] "+ New Card" button shows full text
- [ ] User name is visible next to avatar
- [ ] Layout uses max-width 1280px container (check with DevTools elements inspector)
- [ ] All elements are comfortably spaced

**Mobile (375px):**
- [ ] Header adapts with mobile-friendly layout
- [ ] Navigation links may be hidden (check if accessible via menu)
- [ ] "+ New Card" button shows just "+" or icon
- [ ] User avatar is visible
- [ ] Theme toggle is accessible
- [ ] All interactive elements are tappable (min 44x44px touch target)

**PASS / FAIL:** _____

**Notes:** _________________________________________________

---

### AC6: Keyboard Navigation is Fully Functional

**Steps:**
1. Navigate to /dashboard
2. Click in the address bar to reset focus
3. Press Tab key repeatedly
4. Observe focus indicator as it moves through elements
5. When focused on "+ New Card" button, press Enter
6. When focused on theme toggle, press Space
7. When focused on user menu, press Enter, then Escape

**Expected Results:**
- [ ] Tab key moves focus through interactive elements in logical order:
  - Planner logo/link
  - Board link
  - Projects link
  - Reports link
  - "+ New Card" button
  - Theme toggle button
  - User menu button
- [ ] Focus indicators are clearly visible with teal ring/outline
- [ ] Focus contrast meets WCAG 2.1 AA (3:1 minimum)
- [ ] Enter key activates buttons and links
- [ ] Space key activates buttons (like theme toggle)
- [ ] Escape key closes dropdown menus (user menu)
- [ ] No focus traps (can Tab through entire header and beyond)

**PASS / FAIL:** _____

**Notes:** _________________________________________________

---

### AC7: ARIA Labels are Present on Interactive Elements

**Steps:**
1. Open browser DevTools (F12)
2. Click the "Elements" tab
3. Inspect the header element
4. Inspect each interactive element (buttons, links)
5. Open "Accessibility" tab in DevTools for each element
6. Verify accessible names and roles

**Expected Results:**
- [ ] Theme toggle button has accessible name "Toggle theme" or similar
- [ ] User menu button has accessible name "User menu" or includes user's name
- [ ] All navigation links have accessible names
- [ ] Header uses `<header>` semantic element
- [ ] Navigation uses `<nav>` element or appropriate ARIA role
- [ ] All buttons have descriptive aria-labels or accessible names
- [ ] No accessibility errors in DevTools Accessibility panel

**To verify in DevTools:**
1. Inspect element
2. Check Accessibility tab
3. Look for "Name" field (should not be empty)
4. Look for "Role" field (should be appropriate: button, link, navigation, etc.)

**PASS / FAIL:** _____

**Notes:** _________________________________________________

---

### AC8: Design Specification is Followed

**Steps:**
1. Open browser DevTools (F12)
2. Inspect header and UI elements
3. Check computed styles for various elements
4. Verify design token usage

**Expected Results:**

**Typography:**
- [ ] Font family is Inter or Geist (check computed style for `font-family`)
- [ ] Body text uses appropriate sizes

**Colors (Light Mode):**
- [ ] Primary actions ("+New Card" button) use teal background (#14b8a6 or oklch equivalent)
- [ ] Active navigation link uses teal accent color
- [ ] Secondary text uses gray color
- [ ] Background is white or very light teal

**Colors (Dark Mode):**
- [ ] Primary actions use lighter teal for contrast
- [ ] Background is dark
- [ ] Text is light for readability
- [ ] Maintains teal accent throughout

**Spacing:**
- [ ] Elements use consistent spacing (4px base unit system)
- [ ] Header height is 64px (inspect with DevTools)
- [ ] Padding around elements feels balanced

**Border Radius:**
- [ ] Buttons have small border radius (~6-10px)
- [ ] Consistent radius across interactive elements

**Shadows:**
- [ ] Subtle shadows on header or dropdown menus
- [ ] Elevation system creates visual hierarchy

**Layout:**
- [ ] Main container has max-width of 1280px
- [ ] Content is centered on wide screens
- [ ] Fixed header at top (position: fixed)

**To verify specific CSS variable values:**
1. Inspect any element with primary color
2. Go to "Computed" tab in DevTools
3. Look for CSS variables like `--primary`, `--background`, etc.
4. Verify OKLCH values match design specification

**PASS / FAIL:** _____

**Notes:** _________________________________________________

---

## Browser Compatibility Testing

**Recommended Browsers:**
- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Safari (if on macOS)

**Test basic functionality in each browser:**
1. Header displays correctly
2. Theme toggle works
3. User menu works
4. Responsive layout adapts
5. Keyboard navigation works

---

## Lighthouse Accessibility Audit

**Steps:**
1. Open Chrome DevTools
2. Go to "Lighthouse" tab
3. Select "Accessibility" only
4. Click "Analyze page load"
5. Review results

**Expected Results:**
- [ ] Accessibility score: 90+ (preferably 100)
- [ ] No critical accessibility issues
- [ ] All interactive elements have accessible names
- [ ] Color contrast meets WCAG AA standards
- [ ] No ARIA violations

**PASS / FAIL:** _____

**Score:** _____

**Issues Found:** _________________________________________________

---

## Test Results Summary

**Total Tests:** 8 Acceptance Criteria + Browser Compatibility + Accessibility Audit

**Passed:** _____
**Failed:** _____
**Blocked:** _____

**Critical Issues Found:**
_________________________________________________________________
_________________________________________________________________

**Minor Issues Found:**
_________________________________________________________________
_________________________________________________________________

**Recommendations:**
_________________________________________________________________
_________________________________________________________________

**Tested By:** _____________________
**Date:** _____________________
**Environment:** Development (localhost:3000)

---

## Next Steps After Testing

If all tests pass:
1. Mark story status as "review" in story file
2. Update sprint-status.yaml to mark story as "review"
3. Consider running code review workflow
4. Proceed to next story or epic as appropriate

If tests fail:
1. Document failures in story Dev Agent Record
2. Create follow-up tasks to address issues
3. Keep story in "in-progress" status
4. Fix issues and retest
