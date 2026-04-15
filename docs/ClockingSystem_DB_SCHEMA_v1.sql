-- ============================================================
--  ITCA STUDENT CLOCKING SYSTEM  (v2 - fixed)
--  Database: Microsoft SQL Server (SSMS 22)
--  Campus:   POTCHEFSTROOM
-- ============================================================

-- Step 1: Create and select the database
CREATE DATABASE ITCA_ClockingSystem;
GO
USE ITCA_ClockingSystem;
GO

-- ============================================================
-- TABLE 1: Roles
-- ============================================================
CREATE TABLE Roles (
    RoleId   INT IDENTITY(1,1) PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL UNIQUE
);
GO

-- ============================================================
-- TABLE 2: Programmes
-- ============================================================
CREATE TABLE Programmes (
    ProgrammeId   INT IDENTITY(1,1) PRIMARY KEY,
    ProgrammeName VARCHAR(100) NOT NULL UNIQUE,
    YearLevel     INT NOT NULL
);
GO

-- ============================================================
-- TABLE 3: Classes (Physical Rooms with QR codes)
-- ============================================================
CREATE TABLE Classes (
    ClassId      INT IDENTITY(1,1) PRIMARY KEY,
    ClassName    VARCHAR(50)  NOT NULL UNIQUE,
    QRCodeToken  VARCHAR(255) NULL UNIQUE
);
GO

-- ============================================================
-- TABLE 4: Users (Students + Admins)
-- ============================================================
CREATE TABLE Users (
    UserId        INT IDENTITY(1,1) PRIMARY KEY,
    FullName      VARCHAR(150) NOT NULL,
    StudentNumber VARCHAR(20)  NULL UNIQUE,
    Email         VARCHAR(255) NULL UNIQUE,
    PasswordHash  VARCHAR(255) NOT NULL,
    RoleId        INT NOT NULL,
    ProgrammeId   INT NULL,
    IsActive      BIT NOT NULL DEFAULT 1,
    CreatedAt     DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Users_Roles     FOREIGN KEY (RoleId)     REFERENCES Roles(RoleId),
    CONSTRAINT FK_Users_Programme FOREIGN KEY (ProgrammeId) REFERENCES Programmes(ProgrammeId)
);
GO

-- ============================================================
-- TABLE 5: Attendance
-- Duplicate clock-in prevention handled at application layer
-- ============================================================
CREATE TABLE Attendance (
    AttendanceId INT IDENTITY(1,1) PRIMARY KEY,
    UserId       INT NOT NULL,
    ClassId      INT NOT NULL,
    ClockInTime  DATETIME NOT NULL DEFAULT GETDATE(),
    ClockOutTime DATETIME NULL,
    Status       VARCHAR(20) NOT NULL DEFAULT 'Present',
    IPAddress    VARCHAR(45) NULL,
    CreatedAt    DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Attendance_User  FOREIGN KEY (UserId)  REFERENCES Users(UserId),
    CONSTRAINT FK_Attendance_Class FOREIGN KEY (ClassId) REFERENCES Classes(ClassId)
);
GO

-- ============================================================
-- TABLE 6: QR Sessions (activate/expire QR links per session)
-- ============================================================
CREATE TABLE QRSessions (
    QRSessionId  INT IDENTITY(1,1) PRIMARY KEY,
    ClassId      INT NOT NULL,
    SessionToken VARCHAR(255) NOT NULL UNIQUE,
    CreatedAt    DATETIME NOT NULL DEFAULT GETDATE(),
    ExpiresAt    DATETIME NOT NULL,
    IsActive     BIT NOT NULL DEFAULT 1,

    CONSTRAINT FK_QRSession_Class FOREIGN KEY (ClassId) REFERENCES Classes(ClassId)
);
GO

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IX_Attendance_UserId   ON Attendance(UserId);
CREATE INDEX IX_Attendance_ClassId  ON Attendance(ClassId);
CREATE INDEX IX_Attendance_ClockIn  ON Attendance(ClockInTime);
CREATE INDEX IX_Users_StudentNumber ON Users(StudentNumber);
GO

-- ============================================================
-- SEED: Roles
-- ============================================================
INSERT INTO Roles (RoleName) VALUES
    ('Admin'),
    ('Student');
GO

-- ============================================================
-- SEED: Programmes
-- ============================================================
INSERT INTO Programmes (ProgrammeName, YearLevel) VALUES
    ('Cyber Security Analyst Year 1',    1),
    ('Cyber Security Analyst Returning', 2),
    ('Cyber Security Analyst Year 3',    3),
    ('Software Developer Returning',     2);
GO

-- ============================================================
-- SEED: Classes
-- Replace token values with real GUIDs before deployment
-- ============================================================
INSERT INTO Classes (ClassName, QRCodeToken) VALUES
    ('Class A', 'TOKEN-CLASS-A-REPLACE-WITH-GUID'),
    ('Class B', 'TOKEN-CLASS-B-REPLACE-WITH-GUID');
GO

-- ============================================================
-- SEED: Admin account
-- Replace hash with real bcrypt hash before deployment
-- ============================================================
INSERT INTO Users (FullName, StudentNumber, Email, PasswordHash, RoleId, ProgrammeId)
VALUES ('Administrator', NULL, 'admin@itca.ac.za', 'HASHED_PASSWORD_HERE', 1, NULL);
GO

-- ============================================================
-- SEED: Cyber Security Year 3  (ProgrammeId = 3)
-- ============================================================
INSERT INTO Users (FullName, StudentNumber, Email, PasswordHash, RoleId, ProgrammeId) VALUES
('Thandeka Dikane',         'PS2025-1021', 'PS2025-1021@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 3),
('Richard Le Court Billot', 'PS2023-1048', 'PS2023-1048@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 3),
('Xolisile Samore',         'PS2025-1040', 'PS2025-1040@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 3),
('Franco vd Merwe',         'PS2025-1005', 'PS2025-1005@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 3),
('Kamohelo Moreki',         'PS2024-1004', 'PS2024-1004@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 3),
('Kgalalelo Sehlare',       'PS2025-1043', 'PS2025-1043@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 3),
('Johan Vorster',           'PS2025-1009', 'PS2025-1009@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 3);
GO

-- ============================================================
-- SEED: Cyber Security Returning Year 2  (ProgrammeId = 2)
-- ============================================================
INSERT INTO Users (FullName, StudentNumber, Email, PasswordHash, RoleId, ProgrammeId) VALUES
('Bokang Ntetshe',           'PS2025-1016', 'PS2025-1016@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 2),
('Dumisani Mvula',           'PS2025-1026', 'PS2025-1026@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 2),
('Pheletso Motlhanke',       'PS2025-1024', 'PS2025-1024@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 2),
('Sandile Manyathi',         'PS2025-1037', 'PS2025-1037@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 2),
('Mpho Lencoe',              'PS2025-1049', 'PS2025-1049@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 2),
('Zamaswazi Nkambule',       'PS2025-1015', 'PS2025-1015@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 2),
('Jacobus Cornelius Venter', 'PS2025-1013', 'PS2025-1013@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 2),
('Simpiwe Neo Mkhontwana',   'PS2025-1031', 'PS2025-1031@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 2),
('Rorisang More',            'PS2025-1012', 'PS2025-1012@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 2),
('Onalenna Thapelo Mogotsi', 'PS2025-1044', 'PS2025-1044@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 2);
GO

-- ============================================================
-- SEED: Cyber Security Year 1  (ProgrammeId = 1)
-- NOTE: Alwande Sibiya's number PS2026-1030 was a duplicate
--       of Neo Peele. Marked as VERIFY-001 until confirmed.
-- ============================================================
INSERT INTO Users (FullName, StudentNumber, Email, PasswordHash, RoleId, ProgrammeId) VALUES
('Kay-Lene de Matos',   'PS2026-1007',  'PS2026-1007@itca.ac.za',  'HASHED_PASSWORD_HERE', 2, 1),
('Neo Molopi',          'PS2026-1006',  'PS2026-1006@itca.ac.za',  'HASHED_PASSWORD_HERE', 2, 1),
('Oratile Menoe',       'PS2026-1002',  'PS2026-1002@itca.ac.za',  'HASHED_PASSWORD_HERE', 2, 1),
('Tertius de Jager',    'PS2026-1013',  'PS2026-1013@itca.ac.za',  'HASHED_PASSWORD_HERE', 2, 1),
('Masego Garegae',      'PS2026-1026',  'PS2026-1026@itca.ac.za',  'HASHED_PASSWORD_HERE', 2, 1),
('Tsholofelo Setlhabe', 'PS2026-1008',  'PS2026-1008@itca.ac.za',  'HASHED_PASSWORD_HERE', 2, 1),
('Olebogang Phetoane',  'PS2026-1032',  'PS2026-1032@itca.ac.za',  'HASHED_PASSWORD_HERE', 2, 1),
('Neo Peele',           'PS2026-1030',  'PS2026-1030@itca.ac.za',  'HASHED_PASSWORD_HERE', 2, 1),
('Alwande Sibiya',      'VERIFY-001',   'alwande.sibiya@itca.ac.za','HASHED_PASSWORD_HERE', 2, 1);
-- ACTION REQUIRED: Confirm Alwande Sibiya's correct student number
--                  then run: UPDATE Users SET StudentNumber = 'PS2026-XXXX'
--                            WHERE StudentNumber = 'VERIFY-001'
GO

-- ============================================================
-- SEED: Software Developer Returning Year 2  (ProgrammeId = 4)
-- ============================================================
INSERT INTO Users (FullName, StudentNumber, Email, PasswordHash, RoleId, ProgrammeId) VALUES
('Bokamoso Morake',  'PS2025-1022', 'PS2025-1022@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 4),
('Bokamoso Khumalo', 'PS2025-1011', 'PS2025-1011@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 4),
('Mathapelo Zweni',  'PS2025-1004', 'PS2025-1004@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 4),
('Preston Nkoja',    'PS2025-1008', 'PS2025-1008@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 4),
('Ofentse Seroalo',  'PS2025-1003', 'PS2025-1003@itca.ac.za', 'HASHED_PASSWORD_HERE', 2, 4);
GO

-- ============================================================
-- USEFUL QUERIES  (run these separately, one at a time)
-- ============================================================

-- 1. All attendance for today
SELECT
    u.FullName,
    u.StudentNumber,
    p.ProgrammeName,
    c.ClassName,
    a.ClockInTime,
    a.ClockOutTime,
    a.Status
FROM Attendance a
JOIN Users      u ON a.UserId    = u.UserId
JOIN Classes    c ON a.ClassId   = c.ClassId
JOIN Programmes p ON u.ProgrammeId = p.ProgrammeId
WHERE CAST(a.ClockInTime AS DATE) = CAST(GETDATE() AS DATE)
ORDER BY a.ClockInTime;

-- 2. Check if a specific student is already clocked in today
--    (replace 1 with the actual UserId)
DECLARE @UserId INT = 1;
SELECT * FROM Attendance
WHERE UserId = @UserId
  AND ClockOutTime IS NULL
  AND CAST(ClockInTime AS DATE) = CAST(GETDATE() AS DATE);

-- 3. Full attendance history for a specific student
--    (replace 1 with the actual UserId)
DECLARE @UserId2 INT = 1;
SELECT
    c.ClassName,
    a.ClockInTime,
    a.ClockOutTime,
    a.Status
FROM Attendance a
JOIN Classes c ON a.ClassId = c.ClassId
WHERE a.UserId = @UserId2
ORDER BY a.ClockInTime DESC;

-- 4. Students who have NOT clocked in today (absent list)
SELECT u.FullName, u.StudentNumber, p.ProgrammeName
FROM Users u
JOIN Programmes p ON u.ProgrammeId = p.ProgrammeId
WHERE u.RoleId = 2
  AND u.IsActive = 1
  AND u.UserId NOT IN (
      SELECT UserId FROM Attendance
      WHERE CAST(ClockInTime AS DATE) = CAST(GETDATE() AS DATE)
  )
ORDER BY p.ProgrammeName, u.FullName;

-- 5. Validate a QR session token before allowing a clock-in
--    (replace the token string with the actual scanned token)
DECLARE @Token VARCHAR(255) = 'TOKEN-CLASS-A-REPLACE-WITH-GUID';
SELECT * FROM QRSessions
WHERE SessionToken = @Token
  AND IsActive = 1
  AND ExpiresAt > GETDATE();

-- ============================================================
-- END OF SCRIPT
-- ============================================================
