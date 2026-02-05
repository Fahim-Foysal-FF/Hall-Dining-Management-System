# HDMS Update: Complaints, Notices & Dashboard Enhancements

## ✅ What's New

### 1. Student Complaint System
Students can now:
- **Submit Complaints** about dining services
  - Title and detailed description
  - Attach supporting files (images, documents, PDFs)
  - Automatic Track ID generation for reference
  - Receive confirmation email with Track ID
  
- **Track Complaint Status**
  - View all submitted complaints
  - Check real-time status (Pending → In Progress → Resolved)
  - See admin responses
  - Access attached files

### 2. Dining Notice Board
Students can now:
- **View Notices** about dining hall operations
  - See all active announcements
  - Check notice expiration dates
  - Read full details in modal view
  - Auto-filters expired notices

### 3. Enhanced Student Dashboard
Dashboard now shows:
- **This Month** - Tokens purchased this month
- **This Year** - Tokens purchased this year
- **Total Tokens** - Lifetime token count
- **Quick Links** to Complaints & Notices pages

### 4. Admin Complaint Management
Admins can now:
- **View All Complaints** with status filtering
- **Update Status** (Pending → In Progress → Resolved/Rejected)
- **Respond to Complaints** with detailed messages
- **View Files** uploaded by students
- **Track Timeline** of complaint resolution

### 5. Admin Notice Management
Admins can now:
- **Create Notices** about dining operations
- **Set Expiration Dates** for time-limited announcements
- **Edit Notices** at any time
- **Activate/Deactivate** notices without deleting
- **Delete Notices** when no longer needed
- **Manage** notices with pagination

## 🔗 Navigation

### For Students:
- Dashboard → See new stats cards
- Dashboard → Quick Actions → "Notices" button
- Dashboard → Quick Actions → "Complaints" button
- Or use main navbar → Notices / Support menu items

### For Admins:
- Main navbar → Management dropdown → "Notices"
- Main navbar → Management dropdown → "Complaints"

## 🛠️ Technical Details

### New Database Tables:
- `Complaints` - Student complaints with tracking
- `DiningNotices` - Dining hall announcements

### New API Endpoints:

**Student Endpoints:**
```
POST   /api/complaints/submit              - Submit complaint
GET    /api/complaints/my-complaints       - View my complaints
GET    /api/complaints/track/{trackId}     - Track complaint
GET    /api/notices/board                  - View notices
GET    /api/notices/board/{id}             - View notice details
```

**Admin Endpoints:**
```
GET    /api/complaints/admin/all           - View all complaints
PUT    /api/complaints/admin/{id}/update   - Update complaint
POST   /api/notices/create                 - Create notice
GET    /api/notices/admin/all              - View all notices
PUT    /api/notices/admin/{id}/update      - Edit notice
PUT    /api/notices/admin/{id}/toggle-status - Enable/disable
DELETE /api/notices/admin/{id}/delete      - Delete notice
```

## ⚙️ Configuration Required

### Email Setup (IMPORTANT)
For complaint confirmation emails to work, configure SMTP in `Hdms.Api/appsettings.Development.json`:

```json
"Email": {
  "FromEmail": "your-email@gmail.com",
  "FromName": "HDMS System",
  "SmtpServer": "smtp.gmail.com",
  "SmtpPort": 587,
  "Username": "your-email@gmail.com",
  "Password": "your-app-password"
}
```

Note: Use Gmail App Passwords, not your regular password.

## 📁 File Uploads

Complaint files are saved to: `Hdms.Api/wwwroot/uploads/complaints/`

Make sure this directory exists and has write permissions.

## 🚀 How to Use

### As a Student:
1. Go to Dashboard
2. Click "Complaints" button in Quick Actions
3. Fill in complaint details
4. Optionally attach a file
5. Click "Submit Complaint"
6. Receive Track ID via email
7. Track status in "My Complaints" tab

### As an Admin:
1. Go to Management → Complaints
2. Filter by status if needed
3. Click "View & Respond" on any complaint
4. Write response and select status
5. Click "Mark Resolved" or appropriate status

**For Notices:**
1. Go to Management → Notices
2. Click "New Notice"
3. Enter title, content, and optional expiration date
4. Click "Create Notice"
5. Students will see it immediately on their Notice Board

## 🐛 Troubleshooting

**Q: Complaint file upload not working?**
- A: Ensure `wwwroot/uploads/complaints/` directory exists with write permissions

**Q: Not receiving complaint confirmation emails?**
- A: Check SMTP configuration in appsettings.json and credentials

**Q: Can't see new notices on Notice Board?**
- A: Make sure notice is set to "Active" status and hasn't expired

## 📝 Notes

- All dates/times are stored in UTC in the database
- Track IDs are automatically generated (8-character alphanumeric)
- Notices can be toggled on/off without deletion
- Complaint status flow: Pending → In Progress → Resolved/Rejected
- File uploads are restricted by type and size (see component settings)

## ✨ Features Ready for Future Enhancement

- Complaint categories/classifications
- Email notifications on status updates
- Complaint analytics/reporting
- SMS notifications
- Multi-language support for notices
- Attachment download limits/expiration
- Complaint escalation workflow
