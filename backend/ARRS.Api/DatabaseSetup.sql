-- =============================================================================
-- FILE:    Data/DatabaseSetup.sql
-- OWNER:   Thandeka (Attendance Engine & API Lead)
-- PURPOSE: Run this ONCE in SQL Server Management Studio (SSMS) to create
--          the AttendanceDB database and all required tables.
--
-- HOW TO USE:
--   1. Open SSMS → connect to your SQL Server instance
--   2. Open this file → press F5 (Execute)
-- =============================================================================

-- Create the database if it does not already exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'AttendanceDB')
BEGIN
    CREATE DATABASE AttendanceDB;
END
GO

USE AttendanceDB;
GO

-- =============================================================================
-- TABLE: Users
-- All people in the system (Students, Trainers, Admins, SuperAdmins).
-- Role stored as INT: 0=Student, 1=Trainer, 2=Admin, 3=SuperAdmin
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
CREATE TABLE Users
(
    UserId       INT IDENTITY(1,1) PRIMARY KEY,
    FullName     NVARCHAR(150)  NOT NULL,
    Email        NVARCHAR(200)  NOT NULL UNIQUE,
    PasswordHash NVARCHAR(500)  NOT NULL,
    Role         INT            NOT NULL DEFAULT 0,
    IsActive     BIT            NOT NULL DEFAULT 1,
    CreatedAt    DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
GO

-- =============================================================================
-- TABLE: Sessions
-- A scheduled class or training block with start and end times.
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Sessions' AND xtype='U')
CREATE TABLE Sessions
(
    SessionId   INT IDENTITY(1,1) PRIMARY KEY,
    SessionName NVARCHAR(200)  NOT NULL,
    TrainerId   INT            NOT NULL REFERENCES Users(UserId),
    StartTime   DATETIME2      NOT NULL,
    EndTime     DATETIME2      NOT NULL,
    IsActive    BIT            NOT NULL DEFAULT 1
);
GO

-- =============================================================================
-- TABLE: AttendanceRecords
-- One row per user per session.
-- ClockInTime and ClockOutTime are NULL until the user acts.
-- Ofentse's background job inserts Absent records when a session ends.
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AttendanceRecords' AND xtype='U')
CREATE TABLE AttendanceRecords
(
    RecordId     INT IDENTITY(1,1) PRIMARY KEY,
    UserId       INT            NOT NULL REFERENCES Users(UserId),
    SessionId    INT            NOT NULL REFERENCES Sessions(SessionId),
    ClockInTime  DATETIME2      NULL,
    ClockOutTime DATETIME2      NULL,
    Status       INT            NOT NULL DEFAULT 1,   -- Default: Absent
    Notes        NVARCHAR(500)  NULL,

    -- Enforce one record per user per session
    CONSTRAINT UQ_User_Session UNIQUE (UserId, SessionId)
);
GO

-- =============================================================================
-- TABLE: Alerts
-- Notification records. Read by users via the API. Written by engine + jobs.
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Alerts' AND xtype='U')
CREATE TABLE Alerts
(
    AlertId   INT IDENTITY(1,1) PRIMARY KEY,
    UserId    INT            NOT NULL REFERENCES Users(UserId),
    Message   NVARCHAR(500)  NOT NULL,
    IsRead    BIT            NOT NULL DEFAULT 0,
    CreatedAt DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
GO

-- =============================================================================
-- TABLE: SystemLogs
-- Written by Ofentse's logging service. Stores all system events for auditing.
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SystemLogs' AND xtype='U')
CREATE TABLE SystemLogs
(
    LogId     INT IDENTITY(1,1) PRIMARY KEY,
    Level     NVARCHAR(20)   NOT NULL,   -- INFO, WARNING, ERROR
    Source    NVARCHAR(100)  NOT NULL,   -- Which service/job wrote this
    Message   NVARCHAR(1000) NOT NULL,
    CreatedAt DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
GO

-- =============================================================================
-- SEED: Default SuperAdmin account
-- Password is "Admin@1234" — replace PasswordHash with a real BCrypt hash.
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'superadmin@school.com')
BEGIN
    INSERT INTO Users (FullName, Email, PasswordHash, Role)
    VALUES ('Super Admin', 'superadmin@school.com', 'REPLACE_WITH_BCRYPT_HASH', 3);
END
GO
