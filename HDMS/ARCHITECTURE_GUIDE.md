# HDMS System Architecture - New Features

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         HDMS Application                         │
└─────────────────────────────────────────────────────────────────┘

                            ┌─────────────┐
                            │   Students  │
                            └──────┬──────┘
                                   │
                    ┌──────────────┬┴─────────────┐
                    │              │              │
            ┌──────▼──────┐  ┌───▼───────┐  ┌──▼───────────┐
            │  Dashboard  │  │ Complaints│  │   Notices    │
            ├─────────────┤  ├───────────┤  ├──────────────┤
            │ • Month     │  │ • Submit  │  │ • View List  │
            │ • Year      │  │ • Track   │  │ • Read Full  │
            │ • Total     │  │ • Update  │  │ • Filter     │
            │ • Quick Nav │  │ • File Up │  │   Expired    │
            └─────────────┘  └─────┬─────┘  └──────────────┘
                                   │
                            ┌──────▼──────┐
                            │   Backend   │
                            │   API       │
                            └──────┬──────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
    ┌───▼──────────┐       ┌──────▼──────┐        ┌──────────▼──┐
    │  Complaints  │       │   Notices   │        │   Student   │
    │  Controller  │       │  Controller │        │   Dashboard │
    ├──────────────┤       ├─────────────┤        └──────┬──────┘
    │ • Submit     │       │ • Create    │
    │ • List       │       │ • List      │       Dashboard
    │ • Track      │       │ • Update    │       Controller
    │ • Respond    │       │ • Toggle    │       ├─────────────┤
    │ • Filter     │       │ • Delete    │       │ • Get Stats │
    └───┬──────────┘       └──────┬──────┘       └─────────────┘
        │                         │
        └────────┬────────────────┘
                 │
            ┌────▼────────────────┐
            │  SQL Server Database│
            ├─────────────────────┤
            │  Tables:            │
            │  • Complaints       │
            │  • DiningNotices    │
            │  • AspNetUsers      │
            │  • [other tables]   │
            └─────────────────────┘

                    ┌──────────────┐
                    │    Admins    │
                    └──────┬───────┘
                           │
            ┌──────────────┬┴─────────────┐
            │              │              │
    ┌──────▼──────┐  ┌───▼───────┐  ┌──▼───────────┐
    │  Dashboard  │  │ Complaints│  │   Notices    │
    │  (Admin)    │  │ Manage    │  │   Manage     │
    └─────────────┘  ├───────────┤  ├──────────────┤
                     │ • View    │  │ • Create     │
                     │ • Filter  │  │ • Edit       │
                     │ • Respond │  │ • Publish    │
                     │ • Update  │  │ • Delete     │
                     └───────────┘  └──────────────┘
```

---

## Data Flow - Complaint Submission

```
Student Complaint Submission Process:
═════════════════════════════════════════════════════════════════

1. Student Fill Form
   ┌────────────────┐
   │ Title          │
   │ Description    │
   │ File (opt)     │
   └────────┬───────┘
            │
            ▼
2. Frontend Validation
   ┌────────────────────┐
   │ Check Required     │
   │ Fields             │
   │ Validate File Type │
   └────────┬───────────┘
            │
            ▼
3. API Call
   ┌──────────────────────┐
   │ POST /api/complaints │
   │ /submit              │
   └────────┬─────────────┘
            │
            ▼
4. Backend Processing
   ┌──────────────────┐
   │ Validate Input   │
   │ Generate TrackID │
   │ Save to DB       │
   │ Upload File      │
   └────────┬─────────┘
            │
            ▼
5. Email Generation
   ┌──────────────────┐
   │ Create Template  │
   │ Add Track ID     │
   │ Include Details  │
   └────────┬─────────┘
            │
            ▼
6. Send Email
   ┌──────────────────┐
   │ SMTP Server      │
   │ Student Email    │
   └────────┬─────────┘
            │
            ▼
7. Response to Student
   ┌──────────────────┐
   │ Success Message  │
   │ Show Track ID    │
   │ Navigate to View │
   └──────────────────┘
```

---

## Data Flow - Admin Notice Management

```
Admin Notice Creation:
═══════════════════════════════════════════════════════════════

1. Admin Opens Notices
   ┌─────────────────┐
   │ Admin Notices   │
   │ Management Page │
   └────────┬────────┘
            │
            ▼
2. Click New Notice
   ┌─────────────────┐
   │ Show Form       │
   │ Title           │
   │ Content         │
   │ ExpiresAt (opt) │
   └────────┬────────┘
            │
            ▼
3. Fill & Submit
   ┌──────────────────┐
   │ Validate Input   │
   │ POST API Call    │
   └────────┬─────────┘
            │
            ▼
4. Backend Processing
   ┌──────────────────┐
   │ Save to DB       │
   │ Set IsActive=1   │
   │ Record CreatedBy │
   │ Timestamp        │
   └────────┬─────────┘
            │
            ▼
5. Success Response
   ┌──────────────────┐
   │ Show Message     │
   │ Update List      │
   │ New Notice Ready │
   └──────────────────┘

Note: Notice immediately visible to students on Notice Board
if IsActive=true and not expired
```

---

## Database Schema - Simplified

```
AspNetUsers (Existing)
├─ Id (PK)
├─ UserName
├─ Email
└─ [other fields]

Complaints (NEW)
├─ Id (PK)
├─ TrackId (unique, 8-char)
├─ StudentId (FK → AspNetUsers)
├─ Title
├─ Description
├─ Status (Pending|In Progress|Resolved|Rejected)
├─ FileName
├─ FileUrl
├─ AdminResponse
├─ CreatedAt
├─ UpdatedAt
└─ ResolvedAt

DiningNotices (NEW)
├─ Id (PK)
├─ Title
├─ Content
├─ CreatedById (FK → AspNetUsers)
├─ CreatedAt
├─ UpdatedAt
├─ IsActive (true|false)
└─ ExpiresAt (nullable)

Relationships:
Complaints.StudentId ──→ AspNetUsers.Id
DiningNotices.CreatedById ──→ AspNetUsers.Id
```

---

## API Endpoint Tree

```
/api/
├─ /complaints
│  ├─ POST /submit (Student)
│  │   └─ Returns: {trackId, message}
│  │
│  ├─ GET /my-complaints (Student)
│  │   └─ Returns: [{complaint}, ...]
│  │
│  ├─ GET /track/{trackId} (Student)
│  │   └─ Returns: {complaint_details}
│  │
│  └─ /admin
│     ├─ GET /all (Admin)
│     │  └─ Returns: [{complaint}, ...]
│     │
│     └─ PUT /{id}/update (Admin)
│        └─ Returns: {message}
│
├─ /notices
│  ├─ GET /board (Student)
│  │  └─ Returns: {notices: [...], total, page, pageSize}
│  │
│  ├─ GET /board/{id} (Student)
│  │  └─ Returns: {notice_details}
│  │
│  └─ /admin
│     ├─ POST /create (Admin)
│     │  └─ Returns: {id, message}
│     │
│     ├─ GET /all (Admin)
│     │  └─ Returns: {notices: [...], total, page, pageSize}
│     │
│     ├─ PUT /{id}/update (Admin)
│     │  └─ Returns: {message}
│     │
│     ├─ PUT /{id}/toggle-status (Admin)
│     │  └─ Returns: {isActive}
│     │
│     └─ DELETE /{id}/delete (Admin)
│        └─ Returns: {message}
│
└─ /student
   └─ GET /dashboard
      └─ Returns: {stats: {...}, recentTokens, wallet, todayMenu}
```

---

## Component Hierarchy

```
App.jsx
├─ Layout.jsx
│  ├─ Navbar.jsx (with new links)
│  └─ Routes
│     ├─ /student/dashboard → StudentDashboard.jsx (enhanced)
│     │
│     ├─ /student/complaints → StudentComplaints.jsx (new)
│     │  └─ Uses: complaintsApi.js
│     │
│     ├─ /student/notices → StudentNoticeBoard.jsx (new)
│     │  └─ Uses: noticesApi.js
│     │
│     ├─ /admin/complaints → AdminComplaints.jsx (new)
│     │  └─ Uses: complaintsApi.js
│     │
│     └─ /admin/notices → AdminNotices.jsx (new)
│        └─ Uses: noticesApi.js
│
└─ Auth Routes (unchanged)
```

---

## Authentication & Authorization Flow

```
1. User Login
   │
   ▼
2. Get JWT Token
   │
   ▼
3. Store in localStorage
   │
   ├─ token
   ├─ roles: [Student] or [Admin]
   └─ fullName, userCode, etc.
   │
   ▼
4. Each API Request
   │
   ├─ Add Authorization header
   │  └─ "Authorization: Bearer {token}"
   │
   ├─ Server validates JWT
   │  │
   │  └─ Decode & check expiration
   │
   └─ Check roles
      └─ Allow/Deny based on endpoint

Complaint/Notice endpoints:
├─ [Authorize(Roles = "Student")] → Student only
├─ [Authorize(Roles = "Admin")] → Admin only
└─ [Authorize] → Either role with valid token
```

---

## File Upload Security

```
Student Upload
│
├─ Client-side validation
│  └─ Check file type & size
│
├─ HTTP multipart/form-data
│  └─ POST to /api/complaints/submit
│
├─ Server validation
│  ├─ Check file type again
│  ├─ Check file size
│  └─ Check file content
│
├─ Save file
│  ├─ Generate unique name
│  ├─ Use TrackId prefix
│  └─ Store outside web root
│
├─ Store reference in DB
│  ├─ FileName (original)
│  └─ FileUrl (access path)
│
└─ Return to user
   └─ Can download from FileUrl
```

---

## Status Flow Diagrams

### Complaint Status Progression

```
┌─────────┐
│ Pending │  (Initial state)
└────┬────┘
     │ (Admin reviews)
     ▼
┌──────────────┐
│ In Progress  │  (Under investigation)
└────┬─────────┘
     │
     ├─────────────────────┐
     │                     │
     ▼                     ▼
┌──────────┐        ┌──────────┐
│ Resolved │        │ Rejected │
└──────────┘        └──────────┘
```

### Notice Status

```
┌──────────────┐
│ IsActive:    │
│ true/false   │
└──────────────┘

┌──────────────┐     ┌────────────┐
│   Created    │────→│  Published │
│  (IsActive)  │     │  (Visible) │
└──────────────┘     └────────────┘
       │
       │ ExpiresAt
       │ reached
       ▼
    Hidden
  (Not deleted,
   just filtered)
```

---

## Feature Availability Matrix

```
┌─────────────────┬──────────┬────────┐
│    Feature      │ Student  │ Admin  │
├─────────────────┼──────────┼────────┤
│ Submit Complaint│    ✅    │   ❌   │
│ View Own        │    ✅    │   ❌   │
│ Track Complaint │    ✅    │   ❌   │
│ View All        │    ❌    │   ✅   │
│ Respond         │    ❌    │   ✅   │
│ Update Status   │    ❌    │   ✅   │
│                 │          │        │
│ View Notices    │    ✅    │   ✅   │
│ Create Notice   │    ❌    │   ✅   │
│ Edit Notice     │    ❌    │   ✅   │
│ Delete Notice   │    ❌    │   ✅   │
│ Publish/Draft   │    ❌    │   ✅   │
├─────────────────┼──────────┼────────┤
│ Dashboard Stats │    ✅    │   ✅   │
│ Month/Year View │    ✅    │   ✅   │
└─────────────────┴──────────┴────────┘
```

---

**Last Updated:** December 25, 2025
**Architecture Version:** 1.0
**Status:** Complete
