# HDMS - Hall Dining Management System
## Complete Technical Documentation

---

# Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database Schema](#4-database-schema)
5. [API Reference](#5-api-reference)
6. [Frontend Application](#6-frontend-application)
7. [Core Features](#7-core-features)
8. [Hardware Integration](#8-hardware-integration)
9. [Security & Authentication](#9-security--authentication)
10. [Payment Integration](#10-payment-integration)
11. [Installation & Setup](#11-installation--setup)
12. [Configuration Guide](#12-configuration-guide)
13. [Testing Guide](#13-testing-guide)
14. [Deployment Guide](#14-deployment-guide)

---

# 1. Project Overview

## 1.1 Introduction

**HDMS (Hall Dining Management System)** is a comprehensive digital solution designed to modernize and streamline dining operations in university/college residential halls. The system replaces traditional paper-based meal token systems with a fully digital, QR-code-based solution.

## 1.2 Problem Statement

Traditional hall dining systems face several challenges:
- Paper token waste and forgery risks
- Manual tracking errors and inefficiencies
- No real-time inventory management
- Difficulty in managing meal preferences
- Cash handling complexities
- Limited data for operational insights

## 1.3 Solution

HDMS addresses these challenges by providing:
- **Digital Meal Tokens**: QR-code based tokens that can't be forged
- **Wallet System**: Cashless transactions with online top-up
- **Real-Time Tracking**: Live monitoring of token purchases and redemptions
- **Marketplace**: Peer-to-peer token resale functionality
- **AI Moderation**: Automated abuse detection and prevention
- **Hardware Integration**: Automated gate control at dining entry

## 1.4 Key Objectives

| Objective | Description |
|-----------|-------------|
| **Digitization** | Replace physical tokens with QR-code-based digital tokens |
| **Cashless Operations** | Enable digital wallet-based transactions |
| **Real-Time Monitoring** | Track meal consumption and operations live |
| **Student Convenience** | Allow token resale and meal preference selection |
| **Admin Efficiency** | Automated scanning, reporting, and moderation |
| **Abuse Prevention** | AI-powered detection of system misuse |

## 1.5 User Roles

| Role | Description | Key Capabilities |
|------|-------------|------------------|
| **Student** | Hall resident who purchases and uses meal tokens | Purchase tokens, view menu, sell unused tokens, submit complaints, provide meal feedback, manage wallet |
| **Admin** | Dining hall administrator | Scan/redeem tokens, manage menus, view reports, moderate users, handle complaints, manage dining closures |

## 1.6 System Boundaries

**In Scope:**
- User registration and authentication
- Meal token purchase, redemption, and resale
- Digital wallet with online payment
- Menu management and display
- Complaint and feedback handling
- User moderation and suspension
- Basic hardware integration (gate control)

**Out of Scope:**
- Food preparation tracking
- Inventory/supply chain management
- Staff payroll management
- Advanced analytics/ML predictions

---

# 2. System Architecture

## 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HDMS SYSTEM ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   PRESENTATION LAYER                                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                      React Frontend (Vite)                          │  │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│   │  │ Student  │  │  Admin   │  │   Auth   │  │  Shared  │           │  │
│   │  │  Pages   │  │  Pages   │  │  Pages   │  │Components│           │  │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │  │
│   │                          │                                         │  │
│   │                    Axios HTTP Client                               │  │
│   └──────────────────────────┼─────────────────────────────────────────┘  │
│                              │                                             │
│   ════════════════════════════════════════════════════════════════════════ │
│                              │ REST API (JSON)                             │
│   ════════════════════════════════════════════════════════════════════════ │
│                              │                                             │
│   APPLICATION LAYER          │                                             │
│   ┌──────────────────────────┼─────────────────────────────────────────┐  │
│   │              ASP.NET Core 8 Web API                                │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │  │
│   │  │ Controllers │  │  Services   │  │ Middleware  │                │  │
│   │  │             │  │             │  │             │                │  │
│   │  │ Auth        │  │ SSLCommerz  │  │ JWT Auth    │                │  │
│   │  │ Tokens      │  │ Email       │  │ Suspension  │                │  │
│   │  │ Marketplace │  │ AbuseDetect │  │ CORS        │                │  │
│   │  │ Payment     │  │             │  │             │                │  │
│   │  │ Feedback    │  │             │  │             │                │  │
│   │  │ Complaints  │  │             │  │             │                │  │
│   │  │ Dashboard   │  │             │  │             │                │  │
│   │  │ Moderation  │  │             │  │             │                │  │
│   │  └─────────────┘  └─────────────┘  └─────────────┘                │  │
│   │                          │                                         │  │
│   │              Entity Framework Core 8 (ORM)                         │  │
│   └──────────────────────────┼─────────────────────────────────────────┘  │
│                              │                                             │
│   DATA LAYER                 │                                             │
│   ┌──────────────────────────┼─────────────────────────────────────────┐  │
│   │                    SQL Server Database                             │  │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │  │
│   │  │  Users   │ │  Tokens  │ │ Wallets  │ │  Menus   │             │  │
│   │  └──────────┘ └──────────┘ └──────────┘ └──────────┘             │  │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │  │
│   │  │Complaints│ │ Feedback │ │Suspensions│ │ Closures │             │  │
│   │  └──────────┘ └──────────┘ └──────────┘ └──────────┘             │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   EXTERNAL INTEGRATIONS                                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐       │  │
│   │  │ SSLCOMMERZ │  │ Gmail SMTP │  │   ESP32 Microcontroller │       │  │
│   │  │  Payment   │  │   Email    │  │   (Gate/Conveyor)       │       │  │
│   │  └────────────┘  └────────────┘  └────────────────────────┘       │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Component Responsibilities

### 2.2.1 Presentation Layer (Frontend)

| Component | Responsibility |
|-----------|----------------|
| **Student Pages** | Dashboard, token purchase, wallet, marketplace, feedback, complaints |
| **Admin Pages** | Dashboard, QR scanning, menu management, reports, moderation |
| **Auth Pages** | Login, registration, password reset |
| **Shared Components** | Layout, navbar, buttons, cards, forms |
| **API Module** | Axios client with JWT interceptors |

### 2.2.2 Application Layer (Backend)

| Component | Responsibility |
|-----------|----------------|
| **Controllers** | Handle HTTP requests, input validation, response formatting |
| **Services** | Business logic, external service integration |
| **Middleware** | Authentication, suspension check, CORS |
| **DTOs** | Data transfer objects for API contracts |

### 2.2.3 Data Layer

| Component | Responsibility |
|-----------|----------------|
| **DbContext** | Entity Framework database context |
| **Models** | Entity definitions with relationships |
| **Migrations** | Database schema versioning |

## 2.3 Data Flow Diagrams

### 2.3.1 Token Purchase Flow

```
Student                    Frontend                   Backend                    Database
   │                          │                          │                          │
   │─── Select date/meal ────►│                          │                          │
   │                          │─── GET /buy-options ────►│                          │
   │                          │                          │─── Query menu ──────────►│
   │                          │                          │◄── Menu data ────────────│
   │                          │◄── Options response ─────│                          │
   │◄── Show options ─────────│                          │                          │
   │                          │                          │                          │
   │─── Confirm purchase ────►│                          │                          │
   │                          │─── POST /buy ───────────►│                          │
   │                          │                          │─── Check balance ───────►│
   │                          │                          │◄── Balance OK ───────────│
   │                          │                          │─── Create token ─────────►│
   │                          │                          │─── Debit wallet ─────────►│
   │                          │                          │◄── Success ─────────────│
   │                          │◄── Token created ────────│                          │
   │◄── Show success ─────────│                          │                          │
   │                          │                          │─── Send QR email ───────►│ (Email Service)
   │                          │                          │                          │
```

### 2.3.2 Token Redemption Flow

```
Admin                      Frontend                   Backend                    Database         ESP32
   │                          │                          │                          │               │
   │─── Scan QR code ────────►│                          │                          │               │
   │                          │─── POST /redeem ────────►│                          │               │
   │                          │                          │─── Find token ──────────►│               │
   │                          │                          │◄── Token data ───────────│               │
   │                          │                          │─── Validate token ───────│               │
   │                          │                          │─── Update status ────────►│               │
   │                          │                          │◄── Success ─────────────│               │
   │                          │◄── Redemption OK ────────│                          │               │
   │                          │─── Trigger gate ────────────────────────────────────────────────────►│
   │◄── Show success ─────────│                          │                          │               │
   │                          │                          │                          │    Gate opens │
```

---

# 3. Technology Stack

## 3.1 Backend Technologies

### 3.1.1 Framework & Runtime

| Technology | Version | Purpose |
|------------|---------|---------|
| **.NET** | 8.0 | Runtime platform |
| **ASP.NET Core** | 8.0 | Web API framework |
| **C#** | 12 | Programming language |

### 3.1.2 NuGet Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `Microsoft.EntityFrameworkCore.SqlServer` | 8.0.10 | SQL Server database provider |
| `Microsoft.AspNetCore.Identity.EntityFrameworkCore` | 8.0.10 | User identity management |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | 8.0.10 | JWT token authentication |
| `MailKit` | 4.14.1 | Email sending via SMTP |
| `QRCoder` | 1.4.3 | QR code generation |
| `Swashbuckle.AspNetCore` | 6.5.0 | Swagger/OpenAPI documentation |
| `Azure.Identity` | 1.12.0 | Azure authentication (optional) |
| `System.Text.Json` | 8.0.5 | JSON serialization |

## 3.2 Frontend Technologies

### 3.2.1 Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **Vite** | 5.4.10 | Build tool and dev server |
| **JavaScript/JSX** | ES2022+ | Programming language |

### 3.2.2 NPM Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `react-router-dom` | 6.28.0 | Client-side routing |
| `axios` | 1.7.7 | HTTP client |
| `html5-qrcode` | 2.3.8 | QR code scanning |

## 3.3 Database

| Technology | Purpose |
|------------|---------|
| **SQL Server** | Primary database (Express/Standard) |
| **Entity Framework Core** | Object-relational mapping |
| **Code-First Migrations** | Schema management |

## 3.4 External Services

| Service | Purpose |
|---------|---------|
| **SSLCOMMERZ** | Payment gateway (Bangladesh) |
| **Gmail SMTP** | Transactional emails |
| **ngrok** | Development tunneling (optional) |

## 3.5 Hardware

| Component | Purpose |
|-----------|---------|
| **ESP32** | Microcontroller for gate/conveyor |
| **Servo Motor** | Gate mechanism |
| **IR Sensor** | Bowl detection (conveyor) |
| **L298N Motor Driver** | Conveyor belt control |

---

# 4. Database Schema

## 4.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────┐                                                          │
│  │  ApplicationUser │◄─────────────────────────────────────────────────────┐   │
│  │  (Identity)      │                                                      │   │
│  ├──────────────────┤                                                      │   │
│  │ Id (PK)          │                                                      │   │
│  │ Email            │                                                      │   │
│  │ FullName         │                                                      │   │
│  │ StudentIdNumber  │                                                      │   │
│  │ Department       │                                                      │   │
│  │ HallName         │                                                      │   │
│  │ RoomNumber       │                                                      │   │
│  │ UserCode         │     ┌─────────────────┐      ┌──────────────────┐   │   │
│  │ Phone            │     │   MealToken     │      │   WeeklyMenu     │   │   │
│  │ WalletBalance    │────►├─────────────────┤◄─────├──────────────────┤   │   │
│  │ AvatarPath       │     │ Id (PK)         │      │ Id (PK)          │   │   │
│  └──────────────────┘     │ TokenUid (GUID) │      │ WeekStartDate    │   │   │
│           │               │ StudentId (FK)  │      │ WeekEndDate      │   │   │
│           │               │ WeeklyMenuId    │      │ IsPublished      │   │   │
│           │               │ Date            │      │ CreatedById (FK) │───┘   │
│           │               │ MealType        │      └──────────────────┘       │
│           │               │ Price           │               │                 │
│           │               │ Status          │               │                 │
│           │               │ MealPreference  │      ┌────────┴────────┐       │
│           │               │ QRTokenGroupId  │      │    MenuMeal     │       │
│           │               └─────────────────┘      ├─────────────────┤       │
│           │                        │               │ Id (PK)         │       │
│           │                        │               │ WeeklyMenuId    │       │
│  ┌────────┴────────┐              │               │ Date            │       │
│  │WalletTransaction│              │               │ MealType        │       │
│  ├─────────────────┤              │               └─────────────────┘       │
│  │ Id (PK)         │              │                        │                 │
│  │ UserId (FK)     │              │               ┌────────┴────────┐       │
│  │ Amount          │              │               │  MenuMealItem   │       │
│  │ Type            │              │               ├─────────────────┤       │
│  │ Ref             │              │               │ Id (PK)         │       │
│  │ Description     │              │               │ MenuMealId      │       │
│  │ CreatedAt       │              │               │ FoodItemId      │       │
│  └─────────────────┘              │               └─────────────────┘       │
│                                   │                        │                 │
│  ┌─────────────────┐              │               ┌────────┴────────┐       │
│  │  QRTokenGroup   │◄─────────────┘               │    FoodItem     │       │
│  ├─────────────────┤                              ├─────────────────┤       │
│  │ Id (PK)         │                              │ Id (PK)         │       │
│  │ QRCode (GUID)   │                              │ Name            │       │
│  │ StudentId (FK)  │                              │ Price           │       │
│  │ TotalTokens     │                              │ CategoryId      │       │
│  │ RemainingTokens │                              └─────────────────┘       │
│  │ MealDate        │                                                        │
│  │ MealType        │                                                        │
│  │ Status          │                                                        │
│  └─────────────────┘                                                        │
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Complaint     │    │  MealFeedback   │    │ UserSuspension  │         │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤         │
│  │ Id (PK)         │    │ Id (PK)         │    │ Id (PK)         │         │
│  │ TrackId         │    │ StudentId (FK)  │    │ UserId (FK)     │         │
│  │ StudentId (FK)  │    │ Date            │    │ Reason          │         │
│  │ Title           │    │ MealType        │    │ DurationWeeks   │         │
│  │ Description     │    │ Rating          │    │ SuspendedAt     │         │
│  │ Status          │    │ Comment         │    │ SuspendedUntil  │         │
│  │ FileUrl         │    └─────────────────┘    │ IsActive        │         │
│  │ AdminResponse   │                           │ IsAIDetected    │         │
│  └─────────────────┘                           └─────────────────┘         │
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │  TokenListing   │    │ DiningClosure   │    │  DiningNotice   │         │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤         │
│  │ Id (PK)         │    │ Id (PK)         │    │ Id (PK)         │         │
│  │ TokenId (FK)    │    │ StartDate       │    │ Title           │         │
│  │ SellerId (FK)   │    │ EndDate         │    │ Content         │         │
│  │ ListingPrice    │    │ Reason          │    │ ExpiresAt       │         │
│  │ Status          │    │ IsActive        │    │ IsActive        │         │
│  │ BuyerId (FK)    │    │ CreatedById     │    │ CreatedById     │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Model Definitions

### 4.2.1 ApplicationUser

```csharp
public class ApplicationUser : IdentityUser
{
    // Personal Information
    public string FullName { get; set; } = string.Empty;
    public string StudentIdNumber { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string HallName { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;
    
    // System Fields
    public string UserCode { get; set; } = string.Empty;  // Format: MMHxxxxxx
    public string? Phone { get; set; }
    public string Locale { get; set; } = "en";
    public string? AvatarPath { get; set; }
    
    // Financial
    public decimal WalletBalance { get; set; } = 0m;
}
```

### 4.2.2 MealToken

```csharp
public class MealToken
{
    public int Id { get; set; }
    public Guid TokenUid { get; set; }                    // QR code identifier
    public string StudentId { get; set; } = string.Empty;
    public ApplicationUser? Student { get; set; }
    
    public int WeeklyMenuId { get; set; }
    public WeeklyMenu? WeeklyMenu { get; set; }
    
    public DateTime Date { get; set; }
    public MealType MealType { get; set; }                // Lunch = 1, Dinner = 2
    public decimal Price { get; set; }
    public TokenStatus Status { get; set; } = TokenStatus.Purchased;
    
    public string? MealPreference { get; set; }           // CHICKEN, FISH, EGG
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Bundle support
    public int? QRTokenGroupId { get; set; }
    public QRTokenGroup? QRTokenGroup { get; set; }
    
    // Redemption tracking
    public DateTime? RedeemedAt { get; set; }
    public string? RedeemedById { get; set; }
    public ApplicationUser? RedeemedBy { get; set; }
}
```

### 4.2.3 QRTokenGroup

```csharp
public class QRTokenGroup
{
    public int Id { get; set; }
    public Guid QRCode { get; set; }                      // Single QR for group
    
    public string StudentId { get; set; } = string.Empty;
    public ApplicationUser? Student { get; set; }
    
    public int TotalTokens { get; set; }                  // 1-4 tokens
    public int RemainingTokens { get; set; }
    public int RedeemedTokens { get; set; }
    
    public DateTime MealDate { get; set; }
    public MealType MealType { get; set; }
    public decimal PricePerToken { get; set; }
    public string? MealPreference { get; set; }
    
    public QRTokenGroupStatus Status { get; set; } = QRTokenGroupStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    
    public ICollection<MealToken> MealTokens { get; set; } = new List<MealToken>();
}
```

### 4.2.4 WalletTransaction

```csharp
public class WalletTransaction
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }
    
    public decimal Amount { get; set; }           // Positive = credit, Negative = debit
    public string Type { get; set; } = string.Empty;
    // Types: TOPUP, TOPUP_PENDING, PURCHASE, SALE, REFUND, ADJUSTMENT
    
    public string? Ref { get; set; }              // e.g., "token:5", "listing:3"
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

### 4.2.5 Complaint

```csharp
public class Complaint
{
    public int Id { get; set; }
    public string TrackId { get; set; } = Guid.NewGuid().ToString().Substring(0, 8).ToUpper();
    
    public string StudentId { get; set; } = string.Empty;
    public ApplicationUser? Student { get; set; }
    
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";  // Pending, In Progress, Resolved, Rejected
    
    public string? FileName { get; set; }
    public string? FileUrl { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public string? AdminResponse { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
```

### 4.2.6 UserSuspension

```csharp
public class UserSuspension
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }
    
    public string Reason { get; set; } = string.Empty;
    public string? Details { get; set; }
    
    public int DurationWeeks { get; set; }        // 1-10 weeks
    public DateTime SuspendedAt { get; set; }
    public DateTime SuspendedUntil { get; set; }
    
    public string SuspendedById { get; set; } = string.Empty;
    public ApplicationUser? SuspendedBy { get; set; }
    
    public bool IsActive { get; set; } = true;
    public bool IsAIDetected { get; set; } = false;  // Auto-detected abuse
    
    public DateTime? RevokedAt { get; set; }
    public string? RevokedById { get; set; }
    public string? RevocationReason { get; set; }
}
```

## 4.3 Enumerations

```csharp
public enum MealType
{
    Breakfast = 0,
    Lunch = 1,
    Dinner = 2
}

public enum TokenStatus
{
    Purchased = 0,
    Redeemed = 1,
    ListedForSale = 2,
    Sold = 3,
    Cancelled = 4
}

public enum ListingStatus
{
    Active = 0,
    Completed = 1,
    Cancelled = 2
}

public enum OrderPaymentStatus
{
    Pending = 0,
    Completed = 1,
    Failed = 2,
    Refunded = 3
}

public enum QRTokenGroupStatus
{
    Active = 0,
    Completed = 1,
    Cancelled = 2,
    Expired = 3
}
```

---

# 5. API Reference

## 5.1 Authentication API

### POST /api/auth/register
Register a new student account.

**Request:**
```json
{
  "email": "student@example.com",
  "password": "SecurePass@123",
  "fullName": "John Doe",
  "studentIdNumber": "2021001234",
  "department": "Computer Science",
  "hallName": "Hall A",
  "roomNumber": "101"
}
```

**Response:** `200 OK`
```json
"User registered successfully."
```

### POST /api/auth/login
Authenticate and receive JWT token.

**Request:**
```json
{
  "email": "student@example.com",
  "password": "SecurePass@123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "abc123-def456",
  "email": "student@example.com",
  "fullName": "John Doe",
  "userCode": "MMH001234",
  "roles": ["Student"]
}
```

**Error Response (Suspended):** `401 Unauthorized`
```json
{
  "error": "AccountSuspended",
  "message": "Your account has been suspended until 2026-03-01.",
  "reason": "Complaint spam abuse",
  "suspendedUntil": "2026-03-01T00:00:00Z",
  "daysRemaining": 24
}
```

### GET /api/auth/profile
Get current user's profile (Requires authentication).

**Response:** `200 OK`
```json
{
  "id": "abc123-def456",
  "email": "student@example.com",
  "fullName": "John Doe",
  "userCode": "MMH001234",
  "phone": "01712345678",
  "department": "Computer Science",
  "hallName": "Hall A",
  "roomNumber": "101",
  "walletBalance": 500.00,
  "avatarPath": "/uploads/avatars/abc123.jpg",
  "roles": ["Student"]
}
```

### POST /api/auth/forgot
Request password reset email.

**Request:**
```json
{
  "email": "student@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "If this email exists, a reset link has been sent."
}
```

### POST /api/auth/reset
Reset password with token.

**Request:**
```json
{
  "userId": "abc123-def456",
  "token": "CfDJ8NrGx...",
  "newPassword": "NewSecure@123"
}
```

## 5.2 Token API

### GET /api/tokens/my
Get current user's tokens.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "date": "2026-02-06T00:00:00Z",
    "mealType": 1,
    "price": 60.00,
    "status": 0,
    "tokenUid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "mealPreference": "CHICKEN",
    "isBundle": false,
    "qrTokenGroupId": null,
    "totalTokens": null,
    "remainingTokens": null
  },
  {
    "id": 5,
    "date": "2026-02-07T00:00:00Z",
    "mealType": 2,
    "price": 180.00,
    "status": 0,
    "tokenUid": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "mealPreference": "FISH",
    "isBundle": true,
    "qrTokenGroupId": 2,
    "totalTokens": 3,
    "remainingTokens": 3
  }
]
```

### POST /api/tokens/redeem
Redeem a token (Admin only).

**Request:**
```json
{
  "tokenUid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```
OR
```json
{
  "qrGroupCode": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
}
```

**Response:** `200 OK`
```json
{
  "message": "Token redeemed successfully",
  "tokenId": 1,
  "studentName": "John Doe",
  "mealPreference": "CHICKEN",
  "isBundle": false,
  "remainingTokens": null
}
```

### GET /api/orders/buy-options
Get purchase options for a date.

**Query Parameters:**
- `date` (optional): Target date (defaults to today)

**Response:** `200 OK`
```json
{
  "date": "2026-02-06",
  "menuId": 5,
  "lunch": {
    "available": true,
    "price": 60.00,
    "items": "Chicken/Fish, Vegetables",
    "choices": ["CHICKEN", "FISH"],
    "alreadyPurchased": false
  },
  "dinner": {
    "available": true,
    "price": 60.00,
    "items": "Chicken/Egg",
    "choices": ["CHICKEN", "EGG"],
    "alreadyPurchased": false
  },
  "walletBalance": 500.00
}
```

### POST /api/orders/buy
Purchase a single token.

**Request:**
```json
{
  "date": "2026-02-06",
  "slot": "LUNCH",
  "preference": "CHICKEN"
}
```

**Response:** `200 OK`
```json
{
  "message": "Token purchased successfully",
  "tokenId": 10,
  "tokenUid": "new-guid-here"
}
```

### POST /api/orders/buy-qr-group
Purchase bulk tokens (2-4).

**Request:**
```json
{
  "date": "2026-02-06",
  "slot": "LUNCH",
  "quantity": 3,
  "preference": "CHICKEN"
}
```

**Response:** `200 OK`
```json
{
  "message": "Successfully purchased 3 tokens",
  "qrGroupId": 5,
  "qrCode": "group-qr-guid",
  "totalTokens": 3,
  "totalPrice": 180.00
}
```

## 5.3 Marketplace API

### GET /api/marketplace/listings
Get active token listings.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "tokenId": 5,
    "qrGroupId": null,
    "isBundle": false,
    "bundleSize": null,
    "date": "2026-02-07T00:00:00Z",
    "mealType": "Lunch",
    "listingPrice": 55.00,
    "status": 0,
    "sellerName": "John Doe"
  }
]
```

### POST /api/marketplace/listings
Create a new listing.

**Request:**
```json
{
  "tokenId": 5,
  "listingPrice": 55.00
}
```
OR for bundles:
```json
{
  "qrGroupId": 2,
  "listingPrice": 165.00
}
```

### POST /api/marketplace/buy/{listingId}
Purchase a listed token.

**Response:** `200 OK`
```json
{
  "message": "Token purchased successfully",
  "newBalance": 445.00
}
```

### DELETE /api/marketplace/cancel/{listingId}
Cancel own listing.

## 5.4 Payment API

### POST /api/payment/initiate
Start payment for wallet top-up.

**Request:**
```json
{
  "amount": 500.00
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "gatewayUrl": "https://sandbox.sslcommerz.com/gwprocess/v4/...",
  "sessionKey": "abc123...",
  "transactionId": "TOPUP-abc12345-637123456789"
}
```

### POST /api/payment/ipn
IPN callback from SSLCOMMERZ (System use).

### GET /api/payment/success
Success redirect handler.

### GET /api/payment/fail
Failure redirect handler.

### GET /api/payment/cancel
Cancellation redirect handler.

## 5.5 Feedback API

### GET /api/feedback/eligible
Get tokens eligible for feedback.

**Response:** `200 OK`
```json
{
  "tokens": [
    {
      "id": 3,
      "date": "2026-02-05T00:00:00Z",
      "mealType": "Lunch",
      "price": 60.00
    }
  ],
  "myFeedback": [
    {
      "id": 1,
      "date": "2026-02-04T00:00:00Z",
      "mealType": "Dinner",
      "rating": 4,
      "comment": "Good food!",
      "createdAt": "2026-02-04T20:30:00Z"
    }
  ]
}
```

### POST /api/feedback/from-token
Submit feedback for a redeemed token.

**Request:**
```json
{
  "tokenId": 3,
  "rating": 5,
  "comment": "Excellent meal today!"
}
```

## 5.6 Complaints API

### POST /api/complaints/submit
Submit a new complaint (with optional file).

**Request:** `multipart/form-data`
- `title`: Complaint title
- `description`: Detailed description
- `file`: Optional attachment

**Response:** `200 OK`
```json
{
  "trackId": "AB12CD34",
  "message": "Complaint submitted successfully"
}
```

### GET /api/complaints/my
Get user's complaints.

### PUT /api/complaints/{id}/respond
Admin response to complaint.

**Request:**
```json
{
  "status": "Resolved",
  "response": "Issue has been addressed."
}
```

## 5.7 Admin Dashboard API

### GET /api/admin/dashboard
Get admin dashboard statistics.

**Response:** `200 OK`
```json
{
  "stats": {
    "students": 150,
    "admins": 5,
    "tokens": 2500,
    "revenueTotal": 125000.00,
    "revenueToday": 3600.00
  },
  "today": {
    "date": "2026-02-05",
    "lunch": {
      "total": 85,
      "used": 72,
      "remaining": 13,
      "listed": 3
    },
    "dinner": {
      "total": 90,
      "used": 0,
      "remaining": 90,
      "listed": 5
    }
  },
  "market": {
    "listedNow": 8,
    "soldToday": 3,
    "volumeToday": 180.00
  }
}
```

## 5.8 User Moderation API

### GET /api/admin/usermoderation/flagged-users
Get AI-flagged users.

**Response:** `200 OK`
```json
[
  {
    "userId": "user123",
    "fullName": "Suspicious User",
    "email": "sus@example.com",
    "abuseScore": 75,
    "riskLevel": "Critical",
    "flags": [
      "SPAM_COMPLAINTS: 8 complaints in 24 hours",
      "DUPLICATE_COMPLAINTS: 6 similar complaints detected"
    ],
    "suggestedSuspensionWeeks": 4,
    "hasActiveSuspension": true
  }
]
```

### POST /api/admin/usermoderation/suspend
Suspend a user.

**Request:**
```json
{
  "userId": "user123",
  "reason": "Repeated abuse of complaint system",
  "durationWeeks": 4,
  "details": "User submitted 15 duplicate complaints in 2 days"
}
```

### POST /api/admin/usermoderation/revoke/{suspensionId}
Revoke a suspension.

**Request:**
```json
{
  "reason": "Appeal approved - first-time offense"
}
```

## 5.9 Dining Closure API

### GET /api/admin/dining/closures
Get all dining closures.

### POST /api/admin/dining/closures
Create a closure period.

**Request:**
```json
{
  "startDate": "2026-02-15",
  "endDate": "2026-02-17",
  "reason": "Eid Holiday",
  "description": "Dining hall closed for Eid-ul-Fitr"
}
```

### GET /api/admin/dining/closures/active
Get currently active closures (public).

---

# 6. Frontend Application

## 6.1 Project Structure

```
hdms-client/
├── public/
│   └── images/                    # Static images
├── src/
│   ├── api/                       # API service modules
│   │   ├── axiosClient.js         # Configured Axios instance
│   │   ├── authApi.js             # Authentication endpoints
│   │   ├── tokensApi.js           # Token management
│   │   ├── ordersApi.js           # Purchase operations
│   │   ├── marketplaceApi.js      # Marketplace operations
│   │   ├── paymentApi.js          # Payment integration
│   │   ├── complaintsApi.js       # Complaint handling
│   │   ├── feedbackApi.js         # Feedback submission
│   │   ├── adminApi.js            # Admin dashboard
│   │   ├── userModerationApi.js   # User moderation
│   │   └── diningClosureApi.js    # Closure management
│   │
│   ├── components/
│   │   ├── Layout.jsx             # Main layout wrapper
│   │   ├── Navbar.jsx             # Navigation bar
│   │   ├── ProtectedRoute.jsx     # Auth route guard
│   │   └── ui/                    # Reusable UI components
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       └── ...
│   │
│   ├── config/
│   │   └── espConfig.js           # ESP32 hardware config
│   │
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── ResetPassword.jsx
│   │   │
│   │   ├── Student/
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── BuyToken.jsx
│   │   │   ├── MyTokens.jsx
│   │   │   ├── Wallet.jsx
│   │   │   ├── Marketplace.jsx
│   │   │   ├── WeeklyMenu.jsx
│   │   │   ├── Feedback.jsx
│   │   │   ├── StudentComplaints.jsx
│   │   │   ├── StudentNoticeBoard.jsx
│   │   │   └── StudentReports.jsx
│   │   │
│   │   ├── Admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminScan.jsx
│   │   │   ├── AdminTokens.jsx
│   │   │   ├── AdminWallets.jsx
│   │   │   ├── ManageMenu.jsx
│   │   │   ├── AdminComplaints.jsx
│   │   │   ├── AdminFeedback.jsx
│   │   │   ├── UserModeration.jsx
│   │   │   ├── AdminDiningClosure.jsx
│   │   │   ├── AdminReports.jsx
│   │   │   ├── AdminNotices.jsx
│   │   │   └── TokenDebug.jsx
│   │   │
│   │   └── Account/
│   │       └── Profile.jsx
│   │
│   ├── styles/
│   │   └── styles.css             # Global styles
│   │
│   ├── App.jsx                    # Root component with routes
│   ├── App.css                    # App-level styles
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Base styles
│
├── package.json
├── vite.config.js
└── index.html
```

## 6.2 Routing Configuration

```jsx
// App.jsx - Route definitions
<Routes>
  {/* Public Routes */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password" element={<ResetPassword />} />

  {/* Protected Student Routes */}
  <Route path="/student" element={<ProtectedRoute roles={['Student']}><Layout /></ProtectedRoute>}>
    <Route index element={<StudentDashboard />} />
    <Route path="buy" element={<BuyToken />} />
    <Route path="tokens" element={<MyTokens />} />
    <Route path="wallet" element={<Wallet />} />
    <Route path="marketplace" element={<Marketplace />} />
    <Route path="menu" element={<WeeklyMenu />} />
    <Route path="feedback" element={<Feedback />} />
    <Route path="complaints" element={<StudentComplaints />} />
    <Route path="notices" element={<StudentNoticeBoard />} />
    <Route path="reports" element={<StudentReports />} />
  </Route>

  {/* Protected Admin Routes */}
  <Route path="/admin" element={<ProtectedRoute roles={['Admin']}><Layout /></ProtectedRoute>}>
    <Route index element={<AdminDashboard />} />
    <Route path="scan" element={<AdminScan />} />
    <Route path="tokens" element={<AdminTokens />} />
    <Route path="wallets" element={<AdminWallets />} />
    <Route path="menu" element={<ManageMenu />} />
    <Route path="complaints" element={<AdminComplaints />} />
    <Route path="feedback" element={<AdminFeedback />} />
    <Route path="moderation" element={<UserModeration />} />
    <Route path="closures" element={<AdminDiningClosure />} />
    <Route path="reports" element={<AdminReports />} />
    <Route path="notices" element={<AdminNotices />} />
  </Route>

  {/* Shared Routes */}
  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
</Routes>
```

## 6.3 API Client Configuration

```javascript
// api/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add JWT token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401 errors
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check if suspended
      if (error.response?.data?.error === 'AccountSuspended') {
        localStorage.clear();
        window.location.href = '/login?suspended=true';
      } else {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
```

## 6.4 Key Page Components

### 6.4.1 StudentDashboard

**Features:**
- Welcome header with user info
- Dining closure alerts
- First token gift notification
- Quick stats (tokens, wallet, menu)
- Recent token activity
- Today's menu preview
- Quick action buttons

### 6.4.2 BuyToken

**Features:**
- Date selection
- Meal type selection (Lunch/Dinner)
- Meal preference selection (Chicken/Fish/Egg)
- Single vs bundle purchase toggle
- Quantity selector (2-4 for bundles)
- Price calculation
- Dining closure validation
- Purchase confirmation

### 6.4.3 AdminScan

**Features:**
- Live camera QR scanning
- Camera selection dropdown
- Manual token ID entry
- Token details display
- Redemption confirmation
- ESP32 gate trigger
- Error handling for expired/used tokens

---

# 7. Core Features

## 7.1 Digital Meal Token System

### 7.1.1 Token Lifecycle

```
┌─────────────┐
│  PURCHASED  │ ◄── Initial state after purchase
└──────┬──────┘
       │
       ├───────────────────────────┐
       │                           │
       ▼                           ▼
┌─────────────┐             ┌─────────────┐
│ LISTED FOR  │             │  REDEEMED   │ ◄── After scanning at dining
│    SALE     │             └─────────────┘
└──────┬──────┘
       │
       ├───────────────┐
       │               │
       ▼               ▼
┌─────────────┐ ┌─────────────┐
│    SOLD     │ │  CANCELLED  │ ◄── If listing cancelled
└──────┬──────┘ └─────────────┘
       │
       ▼
┌─────────────┐
│  REDEEMED   │ ◄── By new owner
└─────────────┘
```

### 7.1.2 Token Purchase Rules

| Rule | Description |
|------|-------------|
| Monthly Limit | Max 45 tokens per month (configurable) |
| Single Purchase | One token per meal per day |
| Dining Closure | Cannot purchase during closure periods |
| Balance Check | Sufficient wallet balance required |
| Menu Availability | Valid menu must exist for date |

### 7.1.3 Token Redemption Rules

| Rule | Description |
|------|-------------|
| Date Match | Token date must match current date |
| Time Window | Within meal time window (e.g., 12:00-14:00 for lunch) |
| Status Check | Must be "Purchased" or "Sold" status |
| Single Use | Can only be redeemed once |
| Admin Only | Only Admin role can redeem |

## 7.2 QR Token Groups (Bulk Tokens)

### 7.2.1 Concept

Students can purchase 2-4 tokens for the same meal as a group, receiving a single QR code that tracks multiple entries.

### 7.2.2 Benefits

- **Convenience**: One QR code for group dining
- **Flexibility**: Bring friends/family to dining
- **Tracking**: System tracks remaining entries

### 7.2.3 How It Works

1. Student selects bulk purchase (2-4 tokens)
2. System creates `QRTokenGroup` with `TotalTokens = N`
3. Creates N individual `MealToken` records linked to group
4. Single QR code generated with group's `QRCode` GUID
5. Each scan decrements `RemainingTokens`
6. When `RemainingTokens = 0`, group marked "Completed"

### 7.2.4 Marketplace Integration

- Cannot list partially redeemed bundles
- All tokens in bundle must be "Purchased" status
- Listing price typically for entire bundle
- Transfer moves all tokens to buyer

## 7.3 Wallet System

### 7.3.1 Transaction Types

| Type | Description | Amount |
|------|-------------|--------|
| `TOPUP` | Successful wallet top-up | +positive |
| `TOPUP_PENDING` | Pending payment | +positive (held) |
| `PURCHASE` | Token purchase | -negative |
| `SALE` | Token sold on marketplace | +positive |
| `REFUND` | Token refund (cancellation) | +positive |
| `ADJUSTMENT` | Admin manual adjustment | ±any |

### 7.3.2 Balance Calculation

```csharp
// Effective balance = sum of all transactions
var balance = await _context.WalletTransactions
    .Where(t => t.UserId == userId && t.Type != "TOPUP_PENDING")
    .SumAsync(t => t.Amount);
```

### 7.3.3 Payment Flow

```
1. User clicks "Top Up ৳500"
      │
2. POST /api/payment/initiate
      │
3. Create WalletTransaction (Type: TOPUP_PENDING, Amount: 500)
      │
4. Redirect to SSLCOMMERZ gateway
      │
5. User completes payment on gateway
      │
6. SSLCOMMERZ sends IPN to /api/payment/ipn
      │
7. Validate transaction signature
      │
8. Update transaction: Type: TOPUP (from TOPUP_PENDING)
      │
9. Update user.WalletBalance += 500
      │
10. Redirect user to /student/wallet?payment=success&amount=500
```

## 7.4 Marketplace

### 7.4.1 Listing a Token

**Requirements:**
- Token status must be "Purchased"
- Token date must be in the future
- User must own the token
- Not part of a partially redeemed bundle

**Process:**
1. User selects token and sets asking price
2. Token status changes to "ListedForSale"
3. Listing appears in marketplace
4. Original owner retains token until sold

### 7.4.2 Buying a Listed Token

**Process:**
1. Buyer clicks "Buy" on listing
2. System verifies buyer has sufficient balance
3. Debit buyer's wallet
4. Credit seller's wallet (minus any fees)
5. Transfer token ownership to buyer
6. Mark listing as "Completed"
7. Email notifications to both parties

### 7.4.3 Cancelling a Listing

**Process:**
1. Seller cancels listing
2. Token status reverts to "Purchased"
3. Listing marked as "Cancelled"

## 7.5 AI Abuse Detection

### 7.5.1 Detection Factors

| Factor | Threshold | Score |
|--------|-----------|-------|
| Complaints (24h) | > 5 | +30 |
| Complaints (24h) | > 3 | +15 |
| Complaints (7d) | > 15 | +25 |
| Complaints (7d) | > 10 | +12 |
| Duplicate complaints | > 70% similar | +20 |
| Historical abuse | Per severity | +variable |

### 7.5.2 Risk Levels

| Score | Level | Action |
|-------|-------|--------|
| 0-24 | Low | No action |
| 25-44 | Medium | Flag for review |
| 45-69 | High | Flag, suggest suspension |
| 70+ | Critical | Auto-suspend |

### 7.5.3 Suspension Duration

| Score | Duration |
|-------|----------|
| < 35 | 1 week |
| 35-44 | 2 weeks |
| 45-54 | 3 weeks |
| 55-64 | 4 weeks |
| 65-74 | 5 weeks |
| 75-84 | 6 weeks |
| 85-94 | 8 weeks |
| 95+ | 10 weeks |

### 7.5.4 Suspension Effects

- Cannot log in
- Active sessions terminated via middleware
- Existing tokens remain (can be used after suspension ends)
- Marketplace listings cancelled

## 7.6 Dining Closure Management

### 7.6.1 Purpose

Allow admins to schedule periods when dining is closed for:
- Holidays (Eid, Puja, etc.)
- Maintenance
- Special events
- Emergency situations

### 7.6.2 Effects

- Token purchases blocked for closure dates
- Alert banner shown on student dashboard
- Buy page shows "Dining Closed" message
- Existing tokens for closure dates can be refunded

## 7.7 Complaint System

### 7.7.1 Submission

- Title and description required
- Optional file attachment (images, documents)
- Unique 8-character tracking ID generated
- Email confirmation sent

### 7.7.2 Status Flow

```
PENDING → IN PROGRESS → RESOLVED/REJECTED
```

### 7.7.3 AI Monitoring

Complaints are monitored for abuse:
- Rapid submission detected
- Duplicate content analyzed
- User flagged if abusive pattern found

## 7.8 Feedback System

### 7.8.1 Eligibility

- Must have redeemed token for the meal
- One feedback per meal per day
- Submit within reasonable time frame

### 7.8.2 Submission

- Star rating (1-5)
- Optional text comment
- Linked to specific meal/date

### 7.8.3 Admin Analytics

- Average ratings by meal type
- Trend analysis over time
- Comment sentiment review

---

# 8. Hardware Integration

## 8.1 ESP32 Controller Overview

### 8.1.1 Purpose

Automate physical access control at dining hall entrance:
- Gate opens when valid token scanned
- Conveyor belt for food distribution (optional)
- Real-time status monitoring

### 8.1.2 Components

| Component | Model | Purpose |
|-----------|-------|---------|
| Microcontroller | ESP32 DevKit | Main processor, WiFi |
| Servo Motor | SG90/MG995 | Gate mechanism |
| IR Sensor | FC-51 | Object detection |
| Motor Driver | L298N | Conveyor control |

### 8.1.3 Pin Configuration

```cpp
const int SERVO_PIN = 5;    // Gate servo signal
const int IR_PIN    = 4;    // IR sensor input
const int MOTOR_IN1 = 16;   // Conveyor forward
const int MOTOR_IN2 = 17;   // Conveyor backward
```

## 8.2 HTTP API Endpoints

### GET /open-gate

Triggers gate to open for 5 seconds.

**Response:**
```
Gate opened for 5 seconds
```

### GET /status

Returns current servo state.

**Response:**
```
servo_closed
```
or
```
servo_open
```

### GET /health

Returns system health status.

**Response:**
```json
{
  "status": "ok",
  "servo_open": false,
  "uptime_ms": 3600000
}
```

## 8.3 Wiring Diagram

```
ESP32                           Components
┌─────────────┐
│             │
│   GPIO 5 ───┼──────────────── Servo Signal (Orange)
│             │
│   GPIO 4 ───┼──────────────── IR Sensor OUT
│             │
│   GPIO 16 ──┼──────────────── L298N IN1 (Motor A)
│             │
│   GPIO 17 ──┼──────────────── L298N IN2 (Motor A)
│             │
│   3.3V ─────┼──────────────── IR Sensor VCC
│             │
│   GND ──────┼──────────────── IR Sensor GND
│             │                 Servo GND (Brown)
│   5V ───────┼──────────────── Servo VCC (Red)
│             │                 L298N 5V Logic
│             │
└─────────────┘

L298N Motor Driver
┌─────────────────┐
│                 │
│   12V ──────────┼── External Power (for motor)
│   GND ──────────┼── Common Ground
│   OUT1/OUT2 ────┼── Conveyor Motor
│                 │
└─────────────────┘
```

## 8.4 Integration Flow

```
Frontend AdminScan
       │
       │ 1. Scan QR code
       │ 2. POST /api/tokens/redeem
       ▼
Backend API
       │
       │ 3. Validate token
       │ 4. Update database
       │ 5. Return success
       ▼
Frontend
       │
       │ 6. HTTP GET http://ESP32_IP/open-gate
       ▼
ESP32
       │
       │ 7. Open servo to 90°
       │ 8. Wait 5 seconds
       │ 9. Close servo to 0°
       ▼
Physical Gate Opens/Closes
```

## 8.5 ESP32 Setup Instructions

1. **Install Arduino IDE** (1.8.x or 2.x)

2. **Add ESP32 Board Support**
   - File → Preferences → Additional Board URLs
   - Add: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools → Board → Boards Manager → Search "ESP32" → Install

3. **Install Libraries**
   - Sketch → Include Library → Manage Libraries
   - Install: `ESP32Servo`

4. **Configure Sketch**
   ```cpp
   const char* ssid     = "YOUR_WIFI_NAME";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```

5. **Upload**
   - Connect ESP32 via USB
   - Select Board: "ESP32 Dev Module"
   - Select Port
   - Click Upload

6. **Test**
   - Open Serial Monitor (115200 baud)
   - Note IP address
   - Test: `curl http://IP_ADDRESS/health`

---

# 9. Security & Authentication

## 9.1 JWT Authentication

### 9.1.1 Token Structure

```
Header.Payload.Signature
```

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "nameid": "user-id-guid",
  "unique_name": "user@email.com",
  "role": "Student",
  "jti": "unique-token-id",
  "exp": 1707220800,
  "iss": "HdmsApi",
  "aud": "HdmsClient"
}
```

### 9.1.2 Configuration

```csharp
// Program.cs
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "HdmsApi",
            ValidAudience = "HdmsClient",
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(configuration["Jwt:Key"]))
        };
    });
```

### 9.1.3 Token Expiry

Default: 120 minutes (configurable in appsettings.json)

## 9.2 Role-Based Authorization

### 9.2.1 Roles

| Role | Description |
|------|-------------|
| Admin | Full system access |
| Student | Student-specific features |

### 9.2.2 Authorization Attributes

```csharp
[Authorize]                        // Any authenticated user
[Authorize(Roles = "Admin")]       // Admin only
[Authorize(Roles = "Student")]     // Student only
[AllowAnonymous]                   // Public access
```

## 9.3 Suspension Enforcement

### 9.3.1 Middleware Check

```csharp
app.Use(async (context, next) =>
{
    if (context.User?.Identity?.IsAuthenticated == true)
    {
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        var activeSuspension = await db.UserSuspensions
            .FirstOrDefaultAsync(s => 
                s.UserId == userId && 
                s.IsActive && 
                s.SuspendedUntil > DateTime.UtcNow);

        if (activeSuspension != null)
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new {
                error = "AccountSuspended",
                message = $"Suspended until {activeSuspension.SuspendedUntil:yyyy-MM-dd}",
                reason = activeSuspension.Reason
            });
            return;
        }
    }
    await next();
});
```

### 9.3.2 Login Check

```csharp
// In AuthController.Login
var activeSuspension = await _context.UserSuspensions
    .Where(s => s.UserId == user.Id && s.IsActive && s.SuspendedUntil > now)
    .FirstOrDefaultAsync();

if (activeSuspension != null)
{
    return Unauthorized(new {
        error = "AccountSuspended",
        message = "Your account has been suspended.",
        suspendedUntil = activeSuspension.SuspendedUntil
    });
}
```

## 9.4 Password Security

### 9.4.1 Requirements

- Minimum 6 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character

### 9.4.2 Hashing

ASP.NET Identity uses PBKDF2 with:
- SHA256 algorithm
- 100,000 iterations
- 128-bit salt

## 9.5 CORS Configuration

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "http://localhost:5174",
            "https://your-production-domain.com"
        )
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});
```

---

# 10. Payment Integration

## 10.1 SSLCOMMERZ Overview

### 10.1.1 Supported Payment Methods

- Credit/Debit Cards (Visa, MasterCard, AMEX)
- Mobile Banking (bKash, Nagad, Rocket, etc.)
- Internet Banking (20+ banks)

### 10.1.2 Environment

| Environment | URL |
|-------------|-----|
| Sandbox | `https://sandbox.sslcommerz.com` |
| Production | `https://securepay.sslcommerz.com` |

## 10.2 Configuration

```json
{
  "SSLCommerz": {
    "StoreId": "your_store_id_here",
    "StorePassword": "your_store_password_here"
  },
  "AppSettings": {
    "FrontendUrl": "http://localhost:5173",
    "IpnHostUrl": "https://your-public-url.ngrok.io"
  }
}
```

## 10.3 Payment Flow

### 10.3.1 Initiation

```csharp
[HttpPost("initiate")]
public async Task<IActionResult> InitiatePayment(InitiatePaymentRequest request)
{
    var tranId = $"TOPUP-{user.Id.Substring(0, 8)}-{DateTime.UtcNow.Ticks}";

    var paymentRequest = new PaymentRequest
    {
        TransactionId = tranId,
        Amount = request.Amount,
        SuccessUrl = $"{ipnHostUrl}/api/payment/success",
        FailUrl = $"{ipnHostUrl}/api/payment/fail",
        CancelUrl = $"{ipnHostUrl}/api/payment/cancel",
        IpnUrl = $"{ipnHostUrl}/api/payment/ipn",
        CustomerName = user.FullName,
        CustomerEmail = user.Email,
        // ... more fields
    };

    var response = await _sslCommerz.InitiatePayment(paymentRequest);
    
    // Create pending transaction
    _context.WalletTransactions.Add(new WalletTransaction {
        UserId = user.Id,
        Amount = request.Amount,
        Type = "TOPUP_PENDING",
        Ref = tranId
    });

    return Ok(new { gatewayUrl = response.GatewayPageURL });
}
```

### 10.3.2 IPN Processing

```csharp
[HttpPost("ipn")]
public async Task<IActionResult> IPN([FromForm] SSLCommerzIPN ipn)
{
    // 1. Validate payment with SSLCOMMERZ
    var validation = await _sslCommerz.ValidatePayment(ipn.val_id);
    
    if (validation.Status == "VALID" || validation.Status == "VALIDATED")
    {
        // 2. Find pending transaction
        var txn = await _context.WalletTransactions
            .FirstOrDefaultAsync(t => t.Ref == ipn.tran_id);
        
        // 3. Update transaction
        txn.Type = "TOPUP";
        
        // 4. Update user balance
        var user = await _userManager.FindByIdAsync(txn.UserId);
        user.WalletBalance += txn.Amount;
        
        await _context.SaveChangesAsync();
    }
    
    return Ok();
}
```

### 10.3.3 Redirect Handlers

```csharp
[HttpGet("success")]
public IActionResult Success([FromQuery] string tran_id, [FromQuery] decimal amount)
{
    return Redirect($"{frontendUrl}/student/wallet?payment=success&amount={amount}");
}

[HttpGet("fail")]
public IActionResult Fail()
{
    return Redirect($"{frontendUrl}/student/wallet?payment=failed");
}

[HttpGet("cancel")]
public IActionResult Cancel()
{
    return Redirect($"{frontendUrl}/student/wallet?payment=cancelled");
}
```

## 10.4 Testing with ngrok

For local development, use ngrok to expose your local server:

```bash
ngrok http 5000
```

Update `appsettings.json`:
```json
{
  "AppSettings": {
    "IpnHostUrl": "https://abc123.ngrok.io"
  }
}
```

---

# 11. Installation & Setup

## 11.1 Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 18.x+ | Frontend build |
| .NET SDK | 8.0+ | Backend runtime |
| SQL Server | 2019+ | Database |
| Visual Studio / VS Code | Latest | Development |
| Arduino IDE | 1.8.x / 2.x | ESP32 development |

## 11.2 Backend Setup

### Step 1: Clone Repository
```powershell
git clone https://github.com/your-repo/hdms.git
cd hdms/HDMS/Hdms.Api
```

### Step 2: Configure Database
Edit `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=HdmsDb;Trusted_Connection=True;..."
  }
}
```

### Step 3: Run Migrations
```powershell
dotnet ef database update
```

### Step 4: Start API
```powershell
dotnet run
```

API available at: `http://localhost:5000`

## 11.3 Frontend Setup

### Step 1: Navigate to Client
```powershell
cd hdms/HDMS/hdms-client
```

### Step 2: Install Dependencies
```powershell
npm install
```

### Step 3: Start Development Server
```powershell
npm run dev
```

Frontend available at: `http://localhost:5173`

## 11.4 Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hdms.com | Admin@12345 |
| Student | student@hdms.com | Student@12345 |

---

# 12. Configuration Guide

## 12.1 Backend Configuration

### appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=HdmsDb;Trusted_Connection=True;MultipleActiveResultSets=true;Encrypt=False;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "your-super-secret-key-minimum-32-characters-long",
    "Issuer": "HdmsApi",
    "Audience": "HdmsClient",
    "ExpiresMinutes": 120
  },
  "Email": {
    "SmtpServer": "smtp.gmail.com",
    "Port": 587,
    "Username": "your-email@gmail.com",
    "Password": "your-app-password",
    "FromEmail": "your-email@gmail.com",
    "FromName": "HDMS System"
  },
  "SSLCommerz": {
    "StoreId": "your_store_id",
    "StorePassword": "your_store_password"
  },
  "AppSettings": {
    "FrontendUrl": "http://localhost:5173",
    "IpnHostUrl": "http://localhost:5000"
  }
}
```

### Key Configuration Items

| Key | Description | Required |
|-----|-------------|----------|
| `ConnectionStrings:DefaultConnection` | SQL Server connection | Yes |
| `Jwt:Key` | JWT signing key (min 32 chars) | Yes |
| `Email:*` | SMTP settings for emails | Yes |
| `SSLCommerz:*` | Payment gateway credentials | For payments |
| `AppSettings:FrontendUrl` | Frontend URL for redirects | Yes |
| `AppSettings:IpnHostUrl` | Public URL for payment callbacks | For payments |

## 12.2 Frontend Configuration

### Environment Variables

Create `.env` file:
```
VITE_API_URL=http://localhost:5000/api
VITE_ESP32_URL=http://192.168.1.100
```

### ESP32 Configuration

```javascript
// src/config/espConfig.js
export const ESP32_CONFIG = {
  baseUrl: import.meta.env.VITE_ESP32_URL || 'http://192.168.1.100',
  gateEndpoint: '/open-gate',
  statusEndpoint: '/status',
  healthEndpoint: '/health',
  timeout: 5000
};
```

---

# 13. Testing Guide

## 13.1 API Testing with Swagger

Access Swagger UI at: `http://localhost:5000/swagger`

### Test Authentication
1. Use `/api/auth/login` with default credentials
2. Copy JWT token from response
3. Click "Authorize" button in Swagger
4. Enter: `Bearer YOUR_TOKEN_HERE`

## 13.2 Test Scenarios

### 13.2.1 Student Token Purchase
1. Login as student
2. Check wallet balance (GET /api/orders/wallet)
3. Get buy options (GET /api/orders/buy-options?date=TOMORROW)
4. Purchase token (POST /api/orders/buy)
5. Verify token in list (GET /api/tokens/my)
6. Check wallet deduction

### 13.2.2 Token Redemption
1. Login as admin
2. Navigate to Admin Scan page
3. Scan student's QR code
4. Verify success message
5. Check token status changed to "Redeemed"

### 13.2.3 Marketplace Flow
1. Student A lists token (POST /api/marketplace/listings)
2. Verify listing appears (GET /api/marketplace/listings)
3. Student B purchases (POST /api/marketplace/buy/{id})
4. Verify:
   - Token ownership transferred
   - Wallet balances updated
   - Listing marked completed

### 13.2.4 Abuse Detection
1. Submit 6+ complaints in 24 hours
2. Check Admin Moderation page
3. Verify user flagged with appropriate score
4. Verify auto-suspension if score ≥ 70

## 13.3 Hardware Testing

```bash
# Check ESP32 health
curl http://ESP32_IP/health

# Check servo status
curl http://ESP32_IP/status

# Trigger gate
curl http://ESP32_IP/open-gate

# Watch serial output
# (Use Arduino IDE Serial Monitor at 115200 baud)
```

---

# 14. Deployment Guide

## 14.1 Production Checklist

### Security
- [ ] Change default admin password
- [ ] Use strong JWT secret key
- [ ] Enable HTTPS
- [ ] Update CORS for production domain
- [ ] Secure database connection

### Configuration
- [ ] Update connection strings
- [ ] Configure production email settings
- [ ] Set production SSLCOMMERZ credentials
- [ ] Update IPN URLs for public access

### Performance
- [ ] Enable response caching
- [ ] Configure database connection pooling
- [ ] Enable GZIP compression

## 14.2 Docker Deployment (Optional)

### Dockerfile (Backend)
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Hdms.Api/Hdms.Api.csproj", "Hdms.Api/"]
RUN dotnet restore "Hdms.Api/Hdms.Api.csproj"
COPY . .
WORKDIR "/src/Hdms.Api"
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Hdms.Api.dll"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "5000:80"
    environment:
      - ConnectionStrings__DefaultConnection=Server=db;Database=HdmsDb;...
    depends_on:
      - db
  
  db:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      - SA_PASSWORD=YourStrong@Password
      - ACCEPT_EULA=Y
    ports:
      - "1433:1433"
```

## 14.3 IIS Deployment

1. Publish application:
   ```powershell
   dotnet publish -c Release -o ./publish
   ```

2. Configure IIS:
   - Create new site
   - Set physical path to publish folder
   - Configure application pool for .NET Core

3. Install .NET Core Hosting Bundle on server

---

# Appendix

## A. Error Codes

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Bad Request | Check request body format |
| 401 | Unauthorized | Login or check suspension |
| 403 | Forbidden | Check role permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Check logs for details |

## B. Token Status Reference

| Status | Value | Description |
|--------|-------|-------------|
| Purchased | 0 | Valid, unused token |
| Redeemed | 1 | Already used at dining |
| ListedForSale | 2 | Listed on marketplace |
| Sold | 3 | Sold to another student |
| Cancelled | 4 | Token cancelled/refunded |

## C. Meal Types

| Type | Value | Time Window |
|------|-------|-------------|
| Breakfast | 0 | 7:00 - 9:00 |
| Lunch | 1 | 12:00 - 14:00 |
| Dinner | 2 | 19:00 - 21:00 |

## D. Glossary

| Term | Definition |
|------|------------|
| **Token** | Digital meal voucher |
| **TokenUid** | Unique GUID in QR code |
| **QR Group** | Bundle of tokens with single QR |
| **Listing** | Token listed for sale |
| **IPN** | Instant Payment Notification |
| **Wallet** | User's digital balance |

---

**Documentation Version:** 2.0  
**Last Updated:** February 2026  
**System:** HDMS Hall Dining Management System
