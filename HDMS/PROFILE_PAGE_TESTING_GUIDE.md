# Profile Page Feature Testing Guide

## Quick Start

### Prerequisites
- Backend API running on `http://localhost:5045`
- Frontend running on `http://localhost:5174`
- User logged in with valid credentials
- JWT token stored in localStorage

### Default Test Account
Use credentials from the Register/Login page to test. Make sure you have an account with:
- Email
- Password
- Student ID Number
- Department
- Hall Name
- Room Number

## 🧪 Testing Scenarios

### Test 1: Load and Display Profile
**Goal**: Verify profile loads and displays all user information

**Steps**:
1. Log in to the application
2. Navigate to `/account/profile`
3. Wait for profile to load (you should see a loading spinner)

**Expected Results**:
- ✅ Profile loads without errors
- ✅ User avatar shows first letter of full name in a circle
- ✅ All fields display correctly:
  - Full Name
  - Email
  - Phone (or "Not set")
  - Department
  - Hall Name
  - Room Number
  - Wallet Balance (in ৳ format)
  - User Code (in badge format, e.g., MMH123456)
  - Role(s)
- ✅ Sticky sidebar remains fixed when scrolling
- ✅ "Edit" button is visible
- ✅ "Change Password" button is visible

---

### Test 2: Edit Profile Information
**Goal**: Verify users can edit and save profile information

**Steps**:
1. On profile page, click the "Edit" button
2. Notice the form appears with all editable fields pre-filled
3. Update the following fields:
   - Full Name: Change to "Test User Updated"
   - Phone: Change to "+8801700000000"
   - Department: Change to "Computer Science"
   - Hall Name: Change to "Hall A"
   - Room Number: Change to "101"
4. Click "Save" button
5. Wait for API response

**Expected Results**:
- ✅ Edit form appears when clicking Edit
- ✅ All fields are pre-populated with current values
- ✅ Form is editable (inputs accept text)
- ✅ Success message appears: "Profile updated successfully!"
- ✅ Form closes automatically
- ✅ Profile view refreshes with new values
- ✅ Sidebar avatar updates if name changed
- ✅ No errors displayed

**Error Handling**:
- ❌ Leave Full Name empty → Should show validation error
- ❌ Click Cancel → Form closes without saving

---

### Test 3: Cancel Edit
**Goal**: Verify cancel functionality in edit mode

**Steps**:
1. Click Edit button
2. Make changes to any field
3. Click the X button (or Cancel if present) to close edit form
4. Check if profile reverts to original values

**Expected Results**:
- ✅ Edit form closes
- ✅ Changes are NOT saved
- ✅ Profile view displays original values
- ✅ No error messages

---

### Test 4: Change Password
**Goal**: Verify password change functionality

**Prerequisite**: Know the current password

**Steps**:
1. Click "Change Password" button
2. Enter the current password
3. Enter a new password (e.g., "NewPass@2024")
4. Confirm the new password (enter same value)
5. Click "Change Password" button
6. Wait for API response

**Expected Results**:
- ✅ Password form appears
- ✅ All three password fields are visible and editable
- ✅ Success message appears: "Password changed successfully!"
- ✅ Form closes automatically
- ✅ No errors displayed
- ✅ You can now log in with the new password

---

### Test 5: Password Validation - Mismatch
**Goal**: Verify client-side password confirmation validation

**Steps**:
1. Click "Change Password" button
2. Enter current password
3. Enter new password: "NewPass@2024"
4. Confirm password: "DifferentPass@2024" (different from new password)
5. Click "Change Password" button

**Expected Results**:
- ✅ Error message appears: "New passwords do not match"
- ✅ API call is NOT made
- ✅ Form remains open
- ✅ User can correct and retry

---

### Test 6: Password Validation - Wrong Current Password
**Goal**: Verify server-side password validation

**Steps**:
1. Click "Change Password" button
2. Enter wrong current password (e.g., "WrongPassword")
3. Enter new password
4. Confirm new password (matching new password)
5. Click "Change Password" button

**Expected Results**:
- ✅ Error message appears from server
- ✅ Error should mention "incorrect password" or similar
- ✅ Password is NOT changed
- ✅ User can retry with correct password

---

### Test 7: Responsive Design - Mobile
**Goal**: Verify profile page works on mobile devices

**Steps**:
1. Open browser DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Select an iPhone or mobile device
4. Refresh the page
5. Navigate through all features

**Expected Results**:
- ✅ Layout adapts to mobile viewport
- ✅ Sidebar moves above content on small screens (or hides)
- ✅ Forms are fully accessible and usable
- ✅ Buttons have appropriate touch size
- ✅ No horizontal scrolling needed
- ✅ All fields visible without scrolling too much

---

### Test 8: Error Handling - Network Offline
**Goal**: Verify error handling when API is unavailable

**Steps**:
1. Stop the backend API
2. On profile page, click Edit
3. Make a change and click Save
4. Or try to change password

**Expected Results**:
- ✅ Error message appears (network error)
- ✅ Form remains open so user can retry
- ✅ No crash or blank screen
- ✅ Reload button or retry functionality works

---

### Test 9: Authentication - Unauthorized Access
**Goal**: Verify profile page requires authentication

**Steps**:
1. Log out of the application
2. Try to access `/account/profile` directly
3. Or clear localStorage and refresh

**Expected Results**:
- ✅ Redirected to login page
- ✅ Cannot access profile without valid token
- ✅ Session is properly managed

---

### Test 10: Field Persistence
**Goal**: Verify form doesn't lose data on accidental refresh

**Steps**:
1. Click Edit
2. Make changes but DON'T save
3. Refresh the page
4. Click Edit again

**Expected Results**:
- ✅ Form loads with original (saved) values
- ✅ Unsaved changes are not persisted
- ✅ This is expected behavior

---

## 🐛 Common Issues and Solutions

### Issue 1: "Not set" appears for some fields
**Cause**: Field value is null in database
**Solution**: Edit profile and set the field value

### Issue 2: UserCode shows as empty
**Cause**: UserCode not generated during registration
**Solution**: Check if user was created with UserCode in migration

### Issue 3: Avatar doesn't show initial
**Cause**: Full Name is empty
**Solution**: Edit profile and set Full Name

### Issue 4: API calls failing with 401 Unauthorized
**Cause**: JWT token expired or not sent
**Solution**: 
- Check if token is in localStorage
- Re-login to get new token
- Check if Authorization header is being sent (axiosClient interceptor)

### Issue 5: Success message appears but data doesn't update
**Cause**: Optimistic UI update or API caching
**Solution**: Refresh the page to verify changes were saved

---

## 📊 API Testing with Postman/cURL

### Test Profile Endpoints

#### 1. Get Profile
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5045/api/auth/profile
```

**Expected Response**:
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "fullName": "John Doe",
  "userCode": "MMH123456",
  "phone": "+8801700000000",
  "department": "Computer Science",
  "hallName": "Hall A",
  "roomNumber": "101",
  "walletBalance": 5000.00,
  "roles": ["Student"]
}
```

#### 2. Update Profile
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Updated",
    "phone": "+8801700000001",
    "department": "IT",
    "hallName": "Hall B",
    "roomNumber": "201"
  }' \
  http://localhost:5045/api/auth/profile
```

**Expected Response**:
```json
{
  "message": "Profile updated successfully.",
  "id": "user-id",
  "fullName": "John Updated",
  "email": "user@example.com",
  "phone": "+8801700000001",
  "department": "IT",
  "hallName": "Hall B",
  "roomNumber": "201"
}
```

#### 3. Change Password
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPass@2024",
    "newPassword": "NewPass@2024"
  }' \
  http://localhost:5045/api/auth/change-password
```

**Expected Response**:
```json
{
  "message": "Password changed successfully."
}
```

---

## ✅ Acceptance Criteria

- [ ] Profile page loads without errors
- [ ] All user fields display correctly
- [ ] Edit form populates with current values
- [ ] Profile can be updated and saved
- [ ] Password can be changed with validation
- [ ] Success/error messages display appropriately
- [ ] Form closes on success
- [ ] Page is responsive on mobile
- [ ] Unauthorized users cannot access profile
- [ ] API returns complete user data including all fields

---

## 📋 Checklist for Production

Before deploying to production:

- [ ] Backend API builds successfully
- [ ] All endpoints return correct status codes
- [ ] Database migrations are applied
- [ ] JWT token validation is working
- [ ] HTTPS is configured (production only)
- [ ] CORS is properly configured
- [ ] Error messages are user-friendly
- [ ] Sensitive data is not logged
- [ ] Profile page is accessible only to authenticated users
- [ ] Password requirements are enforced
- [ ] All fields validate properly

---

## 📞 Support

If you encounter any issues:

1. Check browser console for errors (F12 → Console)
2. Check browser Network tab for API responses
3. Check backend logs for server errors
4. Verify JWT token is present in localStorage
5. Ensure backend API is running on correct port

---

**Last Updated**: January 2025
**Version**: 1.0
**Status**: Ready for Testing
