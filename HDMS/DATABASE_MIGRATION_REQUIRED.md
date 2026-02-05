# ⚠️ IMPORTANT: Database Migration Required

Before testing the dining closure feature, you MUST apply the database migration.

## Step 1: Apply Migration

Open PowerShell/Terminal in the `Hdms.Api` folder and run:

```bash
dotnet ef database update
```

## Step 2: Verify Migration

The command should output:
```
Building...
Successfully created database
[Migration executed: 20260104000000_AddDiningClosure]
```

## Step 3: Check Table Created

You can verify in SQL Server Management Studio:

```sql
SELECT * FROM DiningClosures
-- Should return empty set (no rows yet, but table exists)
```

## Step 4: Restart Backend

Stop and restart your backend:
```bash
# Stop current process (Ctrl+C if running in terminal)
dotnet run --project Hdms.Api/Hdms.Api.csproj
```

## Step 5: Test

1. **As Admin**: Go to Management → Dining Closure
2. **Create a closure** for today's date
3. **As Student**: Go to Dashboard and verify alert shows
4. **Try to buy token** and verify it's blocked for closed date

## Troubleshooting

### Error: "Invalid column name 'Reason'"
→ Migration not applied. Run `dotnet ef database update`

### Error: "No migrations pending"
→ Migration already applied (this is fine)

### Migration hangs or errors
→ Check database connection string in appsettings.json
→ Verify SQL Server is running
→ Check database permissions

## Files Affected by Migration

Migration file: `Hdms.Api/Migrations/20260104000000_AddDiningClosure.cs`

Creates:
- `DiningClosures` table
- Foreign keys to AspNetUsers
- Indexes on key columns
