# Testing & Deployment Checklist

## Pre-Testing Verification ✅

### Backend Setup
- [x] Database migrations applied
- [x] Complaints table created
- [x] DiningNotices table created
- [x] Foreign key relationships configured
- [x] Indexes created
- [x] API controllers created
- [x] wwwroot/uploads/complaints directory created

### Frontend Setup
- [x] Components created
- [x] API services created
- [x] Routes configured in App.jsx
- [x] Navigation links added to Navbar.jsx
- [x] No build errors
- [x] No TypeScript errors

### Documentation
- [x] Implementation summary created
- [x] Features guide created
- [x] Quick start guide created
- [x] Architecture guide created
- [x] Completion report created

---

## Testing Phase - Functional Testing

### A. Student Complaint System

#### Complaint Submission ✓
- [ ] Navigate to Dashboard
- [ ] Click "Complaints" button
- [ ] Click "Submit Complaint" tab
- [ ] Fill in title: "Test Complaint"
- [ ] Fill in description: "This is a test"
- [ ] Submit without file
  - [ ] Check success message appears
  - [ ] Check Track ID is displayed
  - [ ] Check Track ID format is 8 characters
- [ ] Submit with file (image/PDF)
  - [ ] Check file upload works
  - [ ] Check success message appears
  - [ ] Verify file size limit works (if set)

#### Email Confirmation (requires SMTP)
- [ ] Configure SMTP in appsettings.Development.json
- [ ] Submit complaint
- [ ] Check email inbox for confirmation
- [ ] Verify Track ID is in email
- [ ] Verify email is properly formatted (HTML)
- [ ] Verify email sender is correct

#### View My Complaints ✓
- [ ] Navigate to /student/complaints
- [ ] Click "My Complaints" tab
- [ ] Verify submitted complaint appears
- [ ] Check status badge is "Pending"
- [ ] Check creation date is displayed
- [ ] Check file attachment link works (if file was added)

#### Track Complaint ✓
- [ ] Note the Track ID from submission
- [ ] Use Track ID in complaint list to verify
- [ ] Check all complaint details are visible
- [ ] Check admin response field (empty initially)

### B. Admin Complaint Management

#### View All Complaints
- [ ] Login as admin
- [ ] Navigate to Management → Complaints
- [ ] Verify complaint list appears
- [ ] Check student name is displayed
- [ ] Check complaint title is visible
- [ ] Check status badge appears

#### Filter by Status
- [ ] Click "All" filter - should show all
- [ ] Click "Pending" filter - should show only pending
- [ ] Click "In Progress" filter - empty or filtered
- [ ] Click "Resolved" filter - empty or filtered
- [ ] Click "Rejected" filter - empty or filtered

#### View & Respond to Complaint
- [ ] Click "View & Respond" button
- [ ] Modal opens with complaint details
- [ ] Check title, description visible
- [ ] Check student name and email visible
- [ ] Check attached file (if any) is visible
- [ ] Write response in text area
- [ ] Click "Mark In Progress"
- [ ] Check complaint status updated to "In Progress"
- [ ] Go back and verify status changed in list

#### Update Complaint Status
- [ ] Edit same complaint
- [ ] Click "Mark Resolved"
- [ ] Verify status updated to "Resolved"
- [ ] Check "Resolved At" timestamp is set
- [ ] Verify student can see response now

### C. Student Notice Board

#### View Notices
- [ ] Navigate to Dashboard
- [ ] Click "Notices" button
- [ ] Check notice list appears (may be empty initially)
- [ ] If notices exist:
  - [ ] Check notice title is visible
  - [ ] Check creation date is visible
  - [ ] Check "View Details" button works

#### View Notice Details
- [ ] Click "View Details" on any notice
- [ ] Modal opens with full content
- [ ] Check notice title in modal
- [ ] Check notice content is readable
- [ ] Check author name is displayed
- [ ] Check creation date is displayed
- [ ] Check expiration date (if applicable)

#### Notice Pagination
- [ ] If more than 10 notices exist
  - [ ] Check pagination controls appear
  - [ ] Click "Next" button
  - [ ] Verify next page of notices loads
  - [ ] Click "Previous" button
  - [ ] Verify previous page loads

#### Expired Notice Filtering
- [ ] Wait for or create a notice with past expiration
- [ ] Refresh notice board
- [ ] Verify expired notice does not appear
- [ ] (Admin can verify it exists but IsActive=false)

### D. Admin Notice Management

#### Create Notice
- [ ] Login as admin
- [ ] Navigate to Management → Notices
- [ ] Click "New Notice"
- [ ] Form appears
- [ ] Fill title: "Test Dining Update"
- [ ] Fill content: "Detailed notice content here"
- [ ] Leave expiration blank (eternal notice)
- [ ] Click "Create Notice"
- [ ] Success message appears
- [ ] Notice appears in list

#### Create Notice with Expiration
- [ ] Click "New Notice" again
- [ ] Fill title and content
- [ ] Set expiration date to tomorrow
- [ ] Click "Create Notice"
- [ ] Verify notice created
- [ ] Check expiration date in list

#### Edit Notice
- [ ] Click edit button on notice (pencil icon)
- [ ] Form fills with current data
- [ ] Change title to "Updated Title"
- [ ] Click "Update Notice"
- [ ] Verify changes saved
- [ ] Check list shows new title

#### Toggle Notice Status
- [ ] Click eye/eye-slash icon to deactivate
- [ ] Notice status changes to "Inactive"
- [ ] Student notice board is refreshed
- [ ] Inactive notice no longer visible to students
- [ ] Click eye icon again to reactivate
- [ ] Notice visible to students again

#### Delete Notice
- [ ] Click delete button (trash icon)
- [ ] Confirm deletion (if prompt appears)
- [ ] Notice removed from list
- [ ] Verify notice no longer visible to students

### E. Dashboard Enhancements

#### View New Stats
- [ ] Navigate to Student Dashboard
- [ ] Check "Total Tokens" stat card exists
- [ ] Check "This Month" stat card exists and shows number
- [ ] Check "This Year" stat card exists and shows number
- [ ] Check stats have correct icons and colors
- [ ] Check quick action buttons include new ones

#### Quick Actions
- [ ] Check "Complaints" button visible and clickable
- [ ] Check "Notices" button visible and clickable
- [ ] Both buttons navigate to correct pages
- [ ] All 6 action buttons are aligned properly

---

## Integration Testing

### Cross-Feature Integration
- [ ] Submit complaint, see it in My Complaints
- [ ] Create notice as admin, see on student board
- [ ] Toggle notice off, disappears from student board
- [ ] Update complaint status, student sees update
- [ ] File attachment in complaint, can download

### Authorization Testing
- [ ] Student cannot access /admin/complaints
  - [ ] Should redirect or show 403
- [ ] Admin can access /admin/complaints
  - [ ] Should load properly
- [ ] Student cannot access /admin/notices
  - [ ] Should redirect or show 403
- [ ] Admin can create notices
  - [ ] Only admins see create form

### Database Testing
- [ ] Complaints table has data after submission
- [ ] DiningNotices table has data after creation
- [ ] Foreign keys are working (no orphaned records)
- [ ] Cascading deletes work properly
- [ ] Indexes are created (check query performance)

---

## API Testing (with Postman/curl)

### Unauthenticated Requests
- [ ] GET /api/complaints/my-complaints → 401 Unauthorized
- [ ] GET /api/notices/board → 401 Unauthorized
- [ ] POST /api/complaints/submit → 401 Unauthorized

### Student JWT Token Requests
- [ ] GET /api/complaints/my-complaints → 200 OK
- [ ] GET /api/notices/board → 200 OK
- [ ] POST /api/complaints/submit → 200 OK (with data)

### Admin JWT Token Requests
- [ ] GET /api/complaints/admin/all → 200 OK
- [ ] PUT /api/complaints/admin/{id}/update → 200 OK
- [ ] POST /api/notices/create → 201 Created
- [ ] GET /api/notices/admin/all → 200 OK

### Role-Based Access
- [ ] Student token on admin endpoint → 403 Forbidden
- [ ] Admin token on student endpoint → works
- [ ] Invalid token → 401 Unauthorized

---

## Performance Testing

### Load Testing
- [ ] Submit 10 complaints rapidly - should all succeed
- [ ] Load notice list with 100+ notices - pagination works
- [ ] Upload large file (within limits) - completes
- [ ] Query complaints with filters - responds quickly

### Browser Testing
- [ ] Chrome - all features work
- [ ] Firefox - all features work
- [ ] Edge - all features work
- [ ] Safari (if available) - all features work

### Mobile Responsiveness
- [ ] Complaint form on mobile - readable and usable
- [ ] Notice board on mobile - scrolls properly
- [ ] Admin panels on mobile - functional
- [ ] Dashboard stats on mobile - visible

---

## Security Testing

### File Upload Security
- [ ] Upload .exe file - should be blocked/rejected
- [ ] Upload oversized file - should be blocked
- [ ] Upload valid file - should succeed
- [ ] Try to access uploaded file directly - should redirect

### SQL Injection Prevention
- [ ] Submit complaint with SQL: `'; DROP TABLE--` 
  - [ ] Should be treated as text, not executed
- [ ] Check database is intact after

### XSS Prevention
- [ ] Submit complaint with HTML tags: `<script>alert('xss')</script>`
  - [ ] Should display as text, not execute
  - [ ] Should be safe in admin view

### CSRF Protection
- [ ] Forms should have CSRF token (if configured)
- [ ] Submitting form should work
- [ ] Manual API call without token may fail (expected)

---

## Database Verification

### Table Structure
```sql
-- Run these to verify structure
SELECT * FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN ('Complaints', 'DiningNotices');

-- Check Complaints columns
EXEC sp_columns @table_name = 'Complaints';

-- Check DiningNotices columns
EXEC sp_columns @table_name = 'DiningNotices';

-- Check relationships
SELECT * FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS;
```

### Data Integrity
- [ ] No orphaned complaints (StudentId should exist in AspNetUsers)
- [ ] No null required fields
- [ ] Dates are in UTC
- [ ] TrackId is unique
- [ ] File URLs are valid paths

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests pass
- [ ] No security vulnerabilities found
- [ ] Code reviewed and approved
- [ ] Database backup created
- [ ] Rollback plan documented

### Deployment Steps
1. [ ] Backup production database
2. [ ] Create deployment branch
3. [ ] Merge feature branch to main
4. [ ] Build backend release configuration
5. [ ] Build frontend production build
6. [ ] Deploy backend to production
7. [ ] Run migrations on production database
8. [ ] Deploy frontend to production server
9. [ ] Configure production email settings
10. [ ] Set file upload permissions correctly

### Post-Deployment
- [ ] Test complaint submission in production
- [ ] Test notice creation in production
- [ ] Verify email sending works
- [ ] Check file uploads work
- [ ] Monitor error logs
- [ ] Verify database backups are working
- [ ] Test rollback plan (if needed)

---

## Known Limitations & Future Enhancements

### Current Limitations
- Single file upload per complaint (can be enhanced to multiple)
- No file preview in browser (direct download only)
- Email notifications one-way (no reply-to-email feature)
- No bulk operations for notices
- Limited complaint search/filtering

### Suggested Enhancements
- [ ] Add complaint categories
- [ ] Add priority levels for complaints
- [ ] Email notifications on status updates
- [ ] Complaint analytics/statistics page
- [ ] SMS alerts for urgent notices
- [ ] Complaint assignment to staff
- [ ] Multiple file attachments per complaint
- [ ] Notice scheduling (post at future time)
- [ ] Multi-language support for notices

---

## Support & Troubleshooting

### Common Issues

**Issue: "Unauthorized" on every API call**
- Solution: Check token in localStorage
- Verify JWT is properly configured
- Check token expiration

**Issue: File upload fails**
- Solution: Check wwwroot/uploads/complaints/ exists
- Verify write permissions on directory
- Check file size limits in code

**Issue: Email not sending**
- Solution: Configure SMTP in appsettings.json
- Check network connectivity
- Verify credentials are correct
- Check firewall settings for port 587

**Issue: Complaint not appearing in admin list**
- Solution: Refresh page
- Check database for data
- Verify JWT token permissions
- Check if complaint status filter is hiding it

### Contact & Documentation
- See IMPLEMENTATION_SUMMARY.md for technical details
- See FEATURES_GUIDE.md for user documentation
- See QUICKSTART.md for setup instructions

---

## Sign-off

- [ ] Testing completed
- [ ] All tests passed
- [ ] No critical issues found
- [ ] Ready for production deployment
- [ ] Documentation reviewed
- [ ] Team approves deployment

**Tested By:** _________________  
**Date:** _________________  
**Environment:** Development / Staging / Production  

---

**Last Updated:** December 25, 2025
**Status:** Ready for Testing Phase
