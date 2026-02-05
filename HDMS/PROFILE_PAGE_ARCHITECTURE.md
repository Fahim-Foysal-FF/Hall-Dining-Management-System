# Profile Page Implementation Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                        │
│                                                                   │
│  Profile.jsx (Main Component)                                    │
│  ├── State Management (useState hooks)                           │
│  │   ├── profile: User data from API                             │
│  │   ├── editMode: Toggle edit form visibility                   │
│  │   ├── changePassMode: Toggle password form visibility         │
│  │   ├── formData: Profile edit form data                        │
│  │   ├── passwordData: Password change form data                 │
│  │   ├── loading: API call loading state                         │
│  │   ├── error: API error messages                               │
│  │   └── successMsg: Success notifications                       │
│  │                                                                │
│  ├── API Calls (axiosClient)                                     │
│  │   ├── GET /auth/profile (on mount & after update)             │
│  │   ├── PUT /auth/profile (on profile update)                   │
│  │   └── POST /auth/change-password (on password change)         │
│  │                                                                │
│  ├── Rendering                                                   │
│  │   ├── Loading State: Spinner                                  │
│  │   ├── Error State: Error alert                                │
│  │   ├── Read Mode:                                              │
│  │   │   ├── Profile Card (Sticky Sidebar)                       │
│  │   │   └── Profile Info Display                                │
│  │   ├── Edit Mode: Profile Edit Form                            │
│  │   └── Password Mode: Password Change Form                     │
│  │                                                                │
│  └── Event Handlers                                              │
│      ├── handleUpdateProfile()                                   │
│      ├── handleChangePassword()                                  │
│      ├── fetchProfile()                                          │
│      └── Various input change handlers                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           ▼ HTTP Requests ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                               │
│                    (axiosClient - axios)                         │
│                                                                   │
│  Base URL: http://localhost:5045/api                             │
│  Interceptor: Adds JWT token to Authorization header             │
│  Headers:                                                         │
│  - Authorization: Bearer {JWT_TOKEN}                             │
│  - Content-Type: application/json                                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           ▼ HTTP/REST ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ASP.NET Core API                             │
│                     (Backend Service)                            │
│                                                                   │
│  AuthController.cs                                               │
│  ├── [HttpGet("profile")] GetProfile()                           │
│  │   ├── Extract userId from JWT claims                          │
│  │   ├── Find user in database                                   │
│  │   ├── Get user roles                                          │
│  │   └── Return user object with profile fields                  │
│  │                                                                │
│  ├── [HttpPut("profile")] UpdateProfile(UpdateProfileRequest)    │
│  │   ├── Validate JWT and extract userId                         │
│  │   ├── Find user in database                                   │
│  │   ├── Update fields:                                          │
│  │   │   ├── FullName                                            │
│  │   │   ├── Phone                                               │
│  │   │   ├── Department                                          │
│  │   │   ├── HallName                                            │
│  │   │   └── RoomNumber                                          │
│  │   ├── Save to database via UserManager                        │
│  │   └── Return updated user object                              │
│  │                                                                │
│  └── [HttpPost("change-password")] ChangePassword(...)           │
│      ├── Validate JWT and extract userId                         │
│      ├── Find user in database                                   │
│      ├── Verify current password                                 │
│      ├── Validate new password requirements                      │
│      ├── Hash and save new password                              │
│      └── Return success/error message                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           ▼ Database Layer ▼
┌─────────────────────────────────────────────────────────────────┐
│                         EF Core DbContext                        │
│                    (HdmsDbContext)                               │
│                                                                   │
│  ApplicationUser Model (AspNetUsers Table)                       │
│  ├── Id (Primary Key)                                            │
│  ├── UserName                                                    │
│  ├── Email                                                       │
│  ├── PasswordHash (bcrypt hashed)                                │
│  ├── FullName                                                    │
│  ├── Phone                                                       │
│  ├── Department                                                  │
│  ├── HallName                                                    │
│  ├── RoomNumber                                                  │
│  ├── UserCode (e.g., MMH123456)                                  │
│  ├── WalletBalance                                               │
│  ├── AvatarPath (optional)                                       │
│  └── ... other Identity fields                                   │
│                                                                   │
│  Operations:                                                      │
│  ├── UserManager.FindByIdAsync(userId)                           │
│  ├── UserManager.UpdateAsync(user)                               │
│  ├── UserManager.ChangePasswordAsync()                           │
│  └── UserManager.GetRolesAsync(user)                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           ▼ SQL Server ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SQL Server Database                         │
│                       (HDMS_Database)                            │
│                                                                   │
│  Table: AspNetUsers                                              │
│  - Stores all user profile information                           │
│  - Row per user                                                  │
│  - Indexed by Id and Email                                       │
│                                                                   │
│  Table: AspNetRoles                                              │
│  - Role definitions (Student, Admin, etc.)                       │
│                                                                   │
│  Table: AspNetUserRoles                                          │
│  - Junction table for user-role relationships                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### 1. Profile Page Load Flow
```
User navigates to /account/profile
           ▼
    useEffect triggers
           ▼
   fetchProfile() called
           ▼
setLoading(true)
           ▼
axiosClient.get('/auth/profile')
           ▼
JWT token added to header (interceptor)
           ▼
AuthController.GetProfile()
           ▼
Extract userId from JWT claims
           ▼
UserManager.FindByIdAsync(userId)
           ▼
Get user roles
           ▼
Return { Id, Email, FullName, UserCode, Phone, Department, HallName, RoomNumber, WalletBalance, Roles }
           ▼
Frontend receives response
           ▼
setProfile(data)
setLoading(false)
           ▼
Render profile with data
```

### 2. Edit Profile Flow
```
User clicks "Edit" button
           ▼
setEditMode(true)
           ▼
Form appears with pre-filled data from profile state
           ▼
User edits fields in formData state
           ▼
User clicks "Save" button
           ▼
setSubmitting(true)
           ▼
axiosClient.put('/auth/profile', formData)
           ▼
JWT token added to header
           ▼
AuthController.UpdateProfile(UpdateProfileRequest)
           ▼
Extract userId from JWT claims
           ▼
UserManager.FindByIdAsync(userId)
           ▼
Update fields:
- user.FullName = model.FullName ?? user.FullName
- user.Phone = model.Phone ?? user.Phone
- user.Department = model.Department ?? user.Department
- user.HallName = model.HallName ?? user.HallName
- user.RoomNumber = model.RoomNumber ?? user.RoomNumber
           ▼
UserManager.UpdateAsync(user)
           ▼
Save to database
           ▼
Return success response
           ▼
Frontend:
- setSuccessMsg('Profile updated successfully!')
- setEditMode(false)
- fetchProfile() (refresh data)
- setSubmitting(false)
           ▼
Success message displays (auto-dismisses after 3 seconds)
```

### 3. Change Password Flow
```
User clicks "Change Password" button
           ▼
setChangePassMode(true)
           ▼
Password form appears
           ▼
User enters:
- currentPassword
- newPassword
- confirmPassword
           ▼
User clicks "Change Password" button
           ▼
Client-side validation:
If newPassword !== confirmPassword
  → setSubmitError('New passwords do not match')
  → Return early
           ▼
setSubmitting(true)
           ▼
axiosClient.post('/auth/change-password', {
  currentPassword,
  newPassword
})
           ▼
JWT token added to header
           ▼
AuthController.ChangePassword(ChangePasswordRequest)
           ▼
Extract userId from JWT claims
           ▼
UserManager.FindByIdAsync(userId)
           ▼
UserManager.ChangePasswordAsync(user, currentPassword, newPassword)
  ├─ Verify currentPassword is correct
  ├─ Validate newPassword meets requirements
  └─ Hash and save new password
           ▼
If failed:
  → Return error: "Failed to change password: {errors}"
  → Frontend shows error message
           ▼
If successful:
  → Return success: "Password changed successfully."
  → Frontend:
     - setSuccessMsg('Password changed successfully!')
     - setChangePassMode(false)
     - Clear password form
     - setSubmitting(false)
           ▼
Success message displays
```

## Component Structure

```
App.jsx
├── Router Setup
│   └── /account/profile → Profile.jsx
└── Auth Context / Token Management

Profile.jsx
├── State Hooks
│   ├── useState(profile)
│   ├── useState(editMode)
│   ├── useState(changePassMode)
│   ├── useState(formData)
│   ├── useState(passwordData)
│   ├── useState(loading)
│   ├── useState(error)
│   ├── useState(successMsg)
│   └── useState(submitting)
├── Effect Hooks
│   └── useEffect(() => fetchProfile(), [])
├── Event Handlers
│   ├── handleUpdateProfile(e)
│   ├── handleChangePassword(e)
│   └── fetchProfile()
└── Render
    ├── Loading Spinner
    ├── Error Alert
    ├── Profile Layout (grid: sidebar + content)
    │   ├── Sidebar Card (Sticky)
    │   │   ├── Avatar
    │   │   ├── Full Name
    │   │   ├── Email
    │   │   ├── User Code Badge
    │   │   ├── Wallet Balance
    │   │   └── Roles
    │   └── Main Content Area
    │       ├── Mode 1: Read Profile
    │       │   ├── Edit Button
    │       │   └── Field Display
    │       ├── Mode 2: Edit Form
    │       │   ├── Close Button
    │       │   ├── Form Fields
    │       │   └── Save/Cancel Buttons
    │       └── Mode 3: Password Form
    │           ├── Close Button
    │           ├── Password Fields
    │           └── Change/Cancel Buttons
    └── Alerts
        ├── Success Alert
        └── Error Alert
```

## DTO Definitions

### 1. UpdateProfileRequest
```csharp
public class UpdateProfileRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string HallName { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;
}
```

### 2. ChangePasswordRequest
```csharp
public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
```

### 3. AuthResponse (Login Response)
```csharp
public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string UserCode { get; set; } = string.Empty;
    public IList<string> Roles { get; set; } = new List<string>();
}
```

## Security Features

### 1. Authentication
- JWT Bearer token required for all profile endpoints
- Token extracted from Authorization header
- Token validated by `[Authorize]` attribute
- Claims extracted to get userId

### 2. Authorization
- User can only access their own profile
- UserID from JWT claims matched against requested resource
- Returns 401 Unauthorized if token invalid
- Returns 403 Forbidden if accessing other user's profile

### 3. Password Security
- Current password verified before allowing change
- New password hashed using Identity Framework (bcrypt-like)
- Password requirements enforced by UserManager
- No passwords logged or displayed

### 4. Data Validation
- Server-side validation on all inputs
- Password confirmation validated client-side
- Required fields checked
- Email uniqueness enforced

## Error Handling

### Frontend Error Handling
```javascript
try {
  const response = await axiosClient.get('/auth/profile');
  setProfile(response.data);
} catch (err) {
  setError('Failed to load profile');
  console.error(err);
}
```

### Backend Error Handling
```csharp
if (userId == null) return Unauthorized();
if (user == null) return NotFound();
var result = await _userManager.UpdateAsync(user);
if (!result.Succeeded) return BadRequest("Failed to update profile.");
```

## Performance Considerations

1. **API Calls Optimization**
   - Profile fetched only on mount and after updates
   - No polling or continuous requests
   - Single API call for all user data

2. **State Management**
   - Minimal re-renders using proper state organization
   - Conditional rendering for different modes
   - Debounced form submissions (submitting flag)

3. **Database Queries**
   - Single user lookup by ID
   - Efficient role loading
   - No N+1 queries

4. **Frontend Performance**
   - Lazy loading for profile data
   - Loading skeleton/spinner shown
   - Bootstrap CSS (prebuilt classes)

## Testing Strategy

### Unit Tests
- Form validation functions
- Password match validation
- State update handlers

### Integration Tests
- Profile API endpoint
- Update profile endpoint
- Change password endpoint
- JWT authentication

### E2E Tests
- Complete profile edit flow
- Complete password change flow
- Error scenarios
- Mobile responsiveness

## Deployment Checklist

- [ ] Database migrations applied
- [ ] JWT secret configured
- [ ] CORS configured for frontend domain
- [ ] HTTPS enabled (production)
- [ ] API endpoint URLs updated
- [ ] Error logging configured
- [ ] Database backups scheduled
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] User documentation created

---

**Last Updated**: January 2025
**Architecture Version**: 1.0
**Status**: Production Ready
