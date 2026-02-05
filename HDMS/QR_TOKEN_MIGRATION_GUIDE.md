# Database Migration Instructions for QR Token Group Feature

## Overview

This feature introduces a new `QRTokenGroup` table and modifies the `MealTokens` table. Follow these steps to migrate your database.

## Prerequisites

- .NET 6+ installed
- Visual Studio or Visual Studio Code
- Access to the HDMS.Api project
- SQL Server (or your configured database provider)

## Migration Steps

### Step 1: Create Migration

Open PowerShell/Terminal in the `Hdms.Api` directory and run:

```powershell
dotnet ef migrations add AddQRTokenGroup
```

This creates a new migration file in `Migrations/` folder.

### Step 2: Review Migration (Optional but Recommended)

Check the generated migration file: `Migrations/[timestamp]_AddQRTokenGroup.cs`

Expected changes:
- New `QRTokenGroups` table with columns:
  - `Id` (int, primary key)
  - `QRCode` (uniqueidentifier)
  - `StudentId` (nvarchar)
  - `TotalTokens` (int)
  - `RemainingTokens` (int)
  - `RedeemedTokens` (int)
  - `MealDate` (datetime2)
  - `MealType` (int)
  - `PricePerToken` (decimal(18,2))
  - `MealPreference` (nvarchar, nullable)
  - `TokenOrderId` (int, nullable)
  - `WeeklyMenuId` (int)
  - `Status` (int)
  - `CreatedAt` (datetime2)
  - `CompletedAt` (datetime2, nullable)
  - Foreign keys to `AspNetUsers`, `WeeklyMenus`, `TokenOrders`

- Modified `MealTokens` table:
  - New column: `QRTokenGroupId` (int, nullable)
  - New foreign key constraint

### Step 3: Apply Migration

Run the migration against your database:

```powershell
dotnet ef database update
```

Or for a specific migration:

```powershell
dotnet ef database update AddQRTokenGroup
```

### Step 4: Verify Migration

1. Open SQL Server Management Studio (SSMS) or your database tool
2. Check that `QRTokenGroups` table exists with all columns
3. Verify `MealTokens` table has `QRTokenGroupId` column
4. Confirm all foreign keys are created

## Rollback (If Needed)

If you need to rollback the migration:

```powershell
dotnet ef database update [PreviousMigrationName]
```

Or to remove the latest migration:

```powershell
dotnet ef migrations remove
```

## SQL Script (Manual Alternative)

If you prefer to apply changes manually, here's the SQL:

```sql
-- Create QRTokenGroups table
CREATE TABLE [QRTokenGroups] (
    [Id] int NOT NULL IDENTITY,
    [QRCode] uniqueidentifier NOT NULL,
    [StudentId] nvarchar(450) NOT NULL,
    [TotalTokens] int NOT NULL,
    [RemainingTokens] int NOT NULL,
    [RedeemedTokens] int NOT NULL,
    [MealDate] datetime2 NOT NULL,
    [MealType] int NOT NULL,
    [PricePerToken] decimal(18,2) NOT NULL,
    [MealPreference] nvarchar(max) NULL,
    [TokenOrderId] int NULL,
    [WeeklyMenuId] int NOT NULL,
    [Status] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CompletedAt] datetime2 NULL,
    CONSTRAINT [PK_QRTokenGroups] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_QRTokenGroups_AspNetUsers_StudentId] 
        FOREIGN KEY ([StudentId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE RESTRICT,
    CONSTRAINT [FK_QRTokenGroups_TokenOrders_TokenOrderId] 
        FOREIGN KEY ([TokenOrderId]) REFERENCES [TokenOrders] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_QRTokenGroups_WeeklyMenus_WeeklyMenuId] 
        FOREIGN KEY ([WeeklyMenuId]) REFERENCES [WeeklyMenus] ([Id]) ON DELETE RESTRICT
);

-- Create index on QRCode for faster lookups
CREATE UNIQUE INDEX [IX_QRTokenGroups_QRCode] ON [QRTokenGroups] ([QRCode]);

-- Create index on StudentId
CREATE INDEX [IX_QRTokenGroups_StudentId] ON [QRTokenGroups] ([StudentId]);

-- Create index on Status for filtering
CREATE INDEX [IX_QRTokenGroups_Status] ON [QRTokenGroups] ([Status]);

-- Add column to MealTokens
ALTER TABLE [MealTokens] ADD [QRTokenGroupId] int NULL;

-- Add foreign key to MealTokens
ALTER TABLE [MealTokens] ADD CONSTRAINT [FK_MealTokens_QRTokenGroups_QRTokenGroupId]
    FOREIGN KEY ([QRTokenGroupId]) REFERENCES [QRTokenGroups] ([Id]) ON DELETE RESTRICT;

-- Create index on QRTokenGroupId in MealTokens
CREATE INDEX [IX_MealTokens_QRTokenGroupId] ON [MealTokens] ([QRTokenGroupId]);
```

## Verification Query

After migration, run this to verify:

```sql
-- Check QRTokenGroups table exists
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'QRTokenGroups';

-- Check columns
SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'QRTokenGroups' ORDER BY ORDINAL_POSITION;

-- Check MealTokens has new column
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'MealTokens' AND COLUMN_NAME = 'QRTokenGroupId';

-- Check foreign keys
SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
WHERE CONSTRAINT_NAME LIKE '%QRTokenGroup%';
```

## Performance Considerations

The migration creates the following indexes:

1. **UNIQUE on QRCode**: Fast lookup of groups by QR code
2. **Index on StudentId**: Fast filtering by student
3. **Index on Status**: Fast filtering by group status
4. **Index on MealTokens.QRTokenGroupId**: Fast lookup of tokens in a group

These ensure good query performance.

## Backup Recommendations

Before running the migration:

1. **Backup Database**: Create a full backup of your database
2. **Test Environment**: Run migration in test environment first
3. **Verify Data**: Check for any data integrity issues

## Post-Migration Checklist

- [ ] QRTokenGroups table created with all columns
- [ ] Indexes created
- [ ] MealTokens.QRTokenGroupId column added
- [ ] Foreign keys established
- [ ] Application starts without errors
- [ ] /api/orders/options endpoint works
- [ ] /api/orders/buy-token endpoint works (single tokens)
- [ ] /api/orders/buy-qr-tokens endpoint works (new)
- [ ] /api/tokens/redeem endpoint works with QR info
- [ ] /api/tokens/scan endpoint works with QR info

## Troubleshooting

**Error: "There is already an object named 'QRTokenGroups'"**
- Migration was already applied. Check database history.

**Error: "Foreign key constraint error"**
- Ensure StudentId/WeeklyMenuId records exist in referenced tables

**Error: "The UNIQUE constraint... violation"**
- Unlikely in new migration, but check for existing QR code duplicates

**Application Error After Migration**
- Ensure all NuGet packages are updated
- Rebuild solution: `dotnet build`
- Clear cache: Delete `bin/` and `obj/` folders

## Rollback to Previous State

If something goes wrong:

```powershell
# See all migrations
dotnet ef migrations list

# Revert to previous migration (replace with actual migration name)
dotnet ef database update PreviousMigrationName

# Remove the new migration files
dotnet ef migrations remove
```

## Support

If you encounter issues:
1. Check the migration file content
2. Review application error logs
3. Verify database connectivity
4. Ensure all foreign key references exist
5. Check SQL Server logs for detailed errors

---

**Migration Name**: AddQRTokenGroup  
**Date Created**: February 4, 2026  
**Affected Tables**: MealTokens, NEW: QRTokenGroups
