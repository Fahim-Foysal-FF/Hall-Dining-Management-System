# HDMS Software Documentation (Full Report)

## 1. Product Overview
HDMS (Hall Dining Management System) streamlines dining operations for students and admins. Core capabilities include meal planning and tokening (single and QR-bundled), wallet top-ups via SSLCOMMERZ, order and redemption scanning, complaints and notices workflows, AI/administrative user moderation, and reporting.

## 2. Feature Catalog (end-to-end)
- Authentication & Profile: JWT login, registration (Student), forgot/reset, profile update with avatar upload; seeded Admin/Student accounts.
- Dining Tokens: single-token purchase and QR bundle purchase; token status lifecycle (Purchased, ListedForSale, Redeemed, Sold, Cancelled); remaining-count tracking for bundles; manual and QR-based redemption with time-based cutoff; monthly meal cap enforcement via MonthlyMealLimits.
- Token Marketplace: list, cancel, buy/sell tokens; transfer history; automatic cancellation of listings on redemption; admin debug tools (TokenDebug).
- Wallet & Payments: wallet balance, transaction history, SSLCOMMERZ initiation, IPN processing, success/fail/cancel redirects; pending-to-settled transaction transition.
- Menus & Meal Plans: weekly meal plans, menu items, food categories; automated seeding for current/next week; admin CRUD for menu and publishing; student schedule view.
- Dining Closure: admin schedules closures; student views impact on dining operations.
- Complaints Management: student submit/track/list with optional file upload; admin list/filter/update status/response; email notifications on submit/response; trackId-based access.
- Notices Board: public board listing and detail with expiry; admin create/update/toggle/delete with optional attachments; auto-hide expired/inactive notices.
- Feedback & Reports: student feedback submission; admin feedback dashboard; reporting/export endpoints and dashboards (admin/student reports pages).
- User Moderation & AI Abuse: AI-flagged user analysis; admin suspend (1–10 weeks) or revoke; abuse logs; manual block/unblock and suspension checks; login block if active suspension.
- Dashboarding: student dashboard (stats, wallet, menu); admin dashboard (overview, tokens, complaints, notices, closures, moderation summaries).
- Hardware/Scanning: QR scanning for redemption (HTML5 QR); ESP32 servo conveyor integration notes (see ESP32_SERVO_CONVEYOR.ino and SERVO_TRIGGER_FIX.md); manual verify and scan routes for admins.
- Security & Auditability: role-based authorization, email audit trails for complaints, wallet transaction records, abuse logs, suspension history.

### Feature Details (APIs, behavior, UI)
- Authentication & Profile
	- API: POST /api/auth/register, /login, /forgot, /reset, GET /profile, PUT /profile (avatar upload with extension/size checks).
	- Behavior: JWT issued with roles; login blocks if `UserSuspension` active; avatars stored under /uploads/avatars.
	- UI: Login/Register/Forgot/Reset pages; Profile page editable for name/phone/room and avatar.

- Dining Tokens
	- API: /api/tokens/my, /redeem (admin scan), plus AdminTokensController for issuance, limits, bundles.
	- Behavior: Status transitions (Purchased→ListedForSale→Redeemed/Sold/Cancelled); QR bundles track `RemainingTokens`; redemption enforces date and cutoff windows.
	- UI: BuyToken, MyTokens, AdminScan/AdminMeals/AdminTokens, TokenDebug; QR scan supported via HTML5 QR.

- Token Marketplace
	- API: MarketplaceController (list/cancel/buy/transfer), token listings tied to MealTokens; listings cancelled automatically on redemption.
	- Behavior: Prevents reuse after sale/redeem; supports bundle listings; audit via TokenTransfer/Listing records.
	- UI: Marketplace page for students; admin debug via TokenDebug.

- Wallet & Payments
	- API: POST /api/payment/initiate (creates TOPUP_PENDING and returns gateway URL); /ipn (SSLCOMMERZ callback); /success|/fail|/cancel redirects; AdminWalletsController for admin views; WalletTransactions endpoints for history.
	- Behavior: IPN finalizes balance and flips TOPUP_PENDING→TOPUP; redirects tolerate race with IPN; limits amount 1–10000 BDT.
	- UI: Wallet page shows balance/history; payment flow redirects to SSLCOMMERZ and back.

- Menus & Meal Plans
	- API: MealPlansController (CRUD), MenuController (items/categories), MealsSummaryController (stats), StudentDashboardController (menu snapshot).
	- Behavior: Startup seeding for current/next week menus; categories ensured; MenuMealItems attach food items to days/slots.
	- UI: Schedule (student) and ManageMenu (admin) pages.

- Dining Closure
	- API: DiningClosureController under /api/admin/dining for closure CRUD.
	- UI: AdminDiningClosure page; impacts displayed to students.

- Complaints Management
	- API: POST /api/complaints/submit (multipart with optional file); GET /my-complaints; GET /track/{trackId}; admin GET /admin/all and PUT /admin/{id}/update.
	- Behavior: Generates trackId, stores file under /uploads/complaints, sends email on submit and on admin response; statuses Pending/In Progress/Resolved/Rejected.
	- UI: StudentComplaints page (submit/list/track); AdminComplaints page (filter/update/respond).

- Notices Board
	- API: GET /api/notices/board (paged), GET /board/{id}; admin POST /create (multipart), PUT /admin/{id}/update, PUT /admin/{id}/toggle-status, DELETE /admin/{id}/delete.
	- Behavior: Shows only active + unexpired to students; files stored under /uploads/notices; toggle handles soft on/off.
	- UI: StudentNoticeBoard; AdminNotices CRUD.

- Feedback & Reports
	- API: FeedbackController (student submit, admin review); ReportsController/PlanController for exports and summaries; StudentReports/AdminReports pages consume data.
	- Behavior: Stores feedback, enables reporting views; exports may generate downloadable artifacts (per controller logic).
	- UI: StudentFeedback/StudentReports; AdminFeedback/AdminReports.

- User Moderation & AI Abuse
	- API: UserModerationController: GET /flagged-users, GET /analyze/{userId}, POST /suspend, POST /revoke/{suspensionId}, GET /suspensions, GET /abuse-logs, plus manual block/unblock/check-suspension endpoints documented in ADMIN_MANUAL_BLOCK_GUIDE.md.
	- Behavior: Suspensions recorded with duration and active flag; login checks active suspensions; abuse logs marked reviewed on action; AI-detected flows log with severity.
	- UI: UserModeration admin page; login denial messaging for suspended users.

- Dashboarding
	- API: StudentDashboardController (/api/student/dashboard) and DashboardController (/api/admin/dashboard) for stats, balances, recent tokens, menu snapshots.
	- UI: StudentDashboard, AdminDashboard cards for quick insights.

- Hardware/Scanning
	- Assets: ESP32_SERVO_CONVEYOR.ino, SERVO_TRIGGER_FIX.md for conveyor trigger guidance.
	- Behavior: AdminScan/ManualVerify routes support QR and manual entry; redemption endpoint accepts QR group code or token UID/ID.

- Security & Auditability
	- Mechanisms: `[Authorize(Roles="Admin"|"Student")]`, JWT validation, file-type/size checks, CORS policy, wallet transaction history, abuse logs, suspension history, email notifications for complaint lifecycle.
	- Configuration: secrets in appsettings.Development.json (to be env-specific in production); HTTPS expected for prod.

## 3. Goals and Non-Goals
- Goals: reliable dining token lifecycle, transparent wallet and payment handling, timely communications (notices/complaints), fraud and abuse mitigation, simple admin oversight, and student self-service.
- Non-goals: cafeteria inventory management, delivery logistics, or third-party restaurant aggregation.

## 4. Stakeholders and Personas
- Students: buy/redeem tokens, view menus, notices, wallet, submit complaints/feedback.
- Admins: manage menus, tokens, closures, wallets, notices, complaints, moderation, reporting.
- Finance/Ops: audit wallet transactions, payment reconciliation, dining capacity planning.

## 5. System Architecture
- Backend: ASP.NET Core 8 Web API with EF Core + SQL Server, ASP.NET Identity, JWT auth, Swagger, CORS for Vite frontends. Services include email notifications, SSLCOMMERZ payment client, and AI abuse detection. See HDMS/Hdms.Api/Program.cs.
- Frontend: React 18 + Vite + React Router, axios data layer, HTML5 QR scanning. See HDMS/hdms-client/src/App.jsx for route map.
- Database: SQL Server; code-first migrations via HdmsDbContext. Seeds roles, an admin, a sample student, wallets, weekly menu, and food categories on startup.
- Deployment topology: SPA hosted separately; API exposes `/api/*`; static uploads (avatars, notices, complaints) served from `wwwroot/uploads`.
- External integrations: SSLCOMMERZ for payments, SMTP (MailKit) for email, optional ngrok/public tunnel for payment callbacks.

## 6. Environments and Configuration
- Local Dev: run API on http://localhost:5045 (example) with Swagger; Vite on http://localhost:5173.
- Tunnel/Staging: expose API via ngrok for SSLCOMMERZ IPN; set `AppSettings:IpnHostUrl`.
- Production: HTTPS endpoints for API and IPN; hardened secrets and CORS.
- Config files: HDMS/Hdms.Api/appsettings*.json for DB, JWT, Email, AppSettings (FrontendUrl, IpnHostUrl).

## 7. Setup
Prerequisites: .NET 8 SDK, SQL Server, Node 18+, npm.
- Backend (HDMS/Hdms.Api): `dotnet restore`; `dotnet ef database update`; `dotnet run` (or publish with `dotnet publish -c Release`).
- Frontend (HDMS/hdms-client): `npm install`; `npm run dev` (or `npm run build && npm run preview`).
- Seeded accounts: admin `admin@hdms.com / Admin@12345`; student `student@hdms.com / Student@12345` with wallet balance and meal plans.

## 8. Backend Modules and APIs (high level)
- AuthController: register (student), login with JWT issuance and suspension check, profile fetch/update with avatar upload, forgot/reset password via email.
- ComplaintsController: students submit/track/list complaints with optional file upload; admins list and update status/responses with email notifications.
- NoticesController: public/anonymous board listing and detail; admins create/update/toggle/delete notices with optional attachments and expiry.
- TokensController: student token inventory (single and QR bundles), admin redemption (manual scan and QR group support), listing cancellations, status management, bundle remaining counts, marketplace interactions.
- AdminTokensController: admin token issuance, bulk actions, monthly limits, QR bundle management.
- AdminWalletsController / PaymentController: wallet top-up initiation, SSLCOMMERZ IPN handling, success/fail redirects, wallet transaction history.
- MenuController / MealPlansController / MealsSummaryController: CRUD for menu items, weekly meal plan seeding/publishing, summary stats.
- OrdersController / MarketplaceController: student token purchases, marketplace listings, transfers, buy/sell flows.
- DashboardController (admin) / StudentDashboardController (student): overview stats, recent activity, balances, menu snapshots.
- DiningClosureController: schedule and manage dining closures.
- UserModerationController: AI-flagged user analysis, suspend/revoke, abuse logs, manual block/unblock checks (see ADMIN_MANUAL_BLOCK_GUIDE.md for `/api/admin/usermoderation/block`, `/unblock/{userId}`, `/check-suspension/{userId}`).
- FeedbackController / ReportsController / PlanController: student/admin feedback, reporting, and plan exports.

## 9. Key Application Flows
- Authentication: JWT on login; roles embedded; frontend sends `Authorization: Bearer <token>`; middleware enforces roles.
- Wallet Top-up: student initiates amount → backend creates pending wallet txn and returns SSLCOMMERZ gateway URL → SSLCOMMERZ posts IPN to `/api/payment/ipn` → wallet balance updated → success/fail redirects at `/api/payment/success|fail|cancel`.
- Token Purchase & Redemption: students purchase tokens (single or QR bundles); admins redeem via scanner using token ID/UID or QR group code with cutoff windows; listings cancelled on redemption if listed.
- Complaints: student submits form + optional file; track via `trackId`; admins respond/change status; email notifications on submit/response.
- Notices: admin creates notice with optional file/expiry; students view paginated board and detail; auto-hide expired/inactive.
- Moderation: AI flags users; admins analyze, suspend (1–10 weeks), revoke, or manually block/unblock; suspensions checked during login; abuse logs reviewable.

## 10. Data Model (representative)
- Identity: ApplicationUser (extends IdentityUser with FullName, UserCode, WalletBalance, hall/room metadata, AvatarPath).
- Dining: MealPlan, WeeklyMenu, MenuMeal, MenuMealItem, FoodCategory, FoodItem.
- Tokens and Marketplace: MealToken, QRTokenGroup (bundles), TokenListing, TokenTransfer, MonthlyMealLimit, WalletTransaction.
- Engagement: Complaint, DiningNotice, Feedback, Report exports.
- Moderation: UserSuspension, UserAbuseLog.

## 11. Frontend Structure and UX
- Routing map in HDMS/hdms-client/src/App.jsx: student flows (dashboard, schedule, buy-token, my-tokens, market, wallet, feedback, reports, complaints, notices); admin flows (dashboard, meal-plan, feedback, wallets, tokens, meals, scan/manual-verify, token-debug, reports, notices, complaints, dining-closure, moderation); shared profile.
- ProtectedRoute enforces role-based access using JWT stored in localStorage.
- Axios-based API layer under `src/api`; shared layout/components under `src/components`; styling via `src/styles.css`, `src/App.css`.

## 12. Security and Compliance
- Role-based `[Authorize(Roles = "Admin"|"Student")]`; JWT validation configured in Program.cs.
- File uploads validated for extensions/size; stored under segregated upload roots.
- CORS policy `AllowFrontend` allows specified Vite origins; update for prod domains.
- Password reset/forgot avoid account enumeration; secrets should be injected via environment configs, not committed.
- HTTPS required in production; consider HSTS and secure cookies if SPA hosted together.

## 13. Testing Strategy
- Backend: unit tests for wallet, token redemption rules, moderation; API integration tests for auth/complaints/notices/payment webhooks; test data via in-memory DB or containers.
- Frontend: component tests for forms and routing guards; integration/e2e for purchase, redemption scan, complaint submission, notice CRUD.
- Ops checks: run `dotnet ef database update`, `dotnet run`, `npm test` (if added); exercise Swagger plus primary UI paths.

## 14. Deployment Notes
- Publish API with `dotnet publish -c Release`; set env vars for DB connection strings, JWT, email SMTP, payment URLs.
- Expose public HTTPS endpoint for SSLCOMMERZ IPN and callback URLs; set `AppSettings:IpnHostUrl` to public base.
- Serve SPA via static hosting or reverse proxy; ensure CORS and `FrontendUrl` match deployed domains.

## 15. Operations and Maintenance
- Monitor WalletTransactions, UserAbuseLogs, UserSuspensions for anomalies.
- Rotate JWT keys and SMTP credentials; enforce HTTPS.
- Clean old uploads tied to deleted complaints/notices.
- Track meal caps via MonthlyMealLimits; adjust defaults in TokensController if policy changes.
- Backups: schedule SQL backups; verify restore drills.
- Observability: enable structured logging and app metrics (requests, errors, redemption failures, payment IPN latency).

## 16. Risks and Mitigations
- Payment callback failure: use IPN plus user redirect; reconcile pending transactions; alert on IPN gaps.
- Clock drift: redemption cutoff uses server time; ensure NTP sync.
- Token fraud/resale: redemption cancels active listings; QR bundle remaining-count checks; consider rate limits on redemption.
- Data loss: maintain DB backups and upload storage backups; avoid storing secrets in source.

## 17. Roadmap Ideas
- Add MFA for admins; add rate limiting on auth and redemption endpoints.
- Add automated test suite (backend integration, frontend e2e).
- Add analytics dashboards for meal uptake and complaint SLAs.
- Add per-environment CORS and configuration via environment variables only.

## 18. References
- Backend entrypoint: HDMS/Hdms.Api/Program.cs
- Backend project file: HDMS/Hdms.Api/Hdms.Api.csproj
- Frontend routes: HDMS/hdms-client/src/App.jsx
- Manual admin block guide: ADMIN_MANUAL_BLOCK_GUIDE.md
- Architecture overview: HDMS/ARCHITECTURE_GUIDE.md
