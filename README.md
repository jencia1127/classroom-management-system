# Classroom Management System

A classroom management application built with React, Spring Boot, and MySQL.

## Features

### Teacher
- Add, edit, and delete students.
- Mark attendance and view attendance summaries.
- Record marks with automatic percentages and letter grades.
- View individual student progress reports.
- Manage lesson plans.
- Manage assignments and due dates.
- Manage weekly class schedules.

### Student
- View their own attendance and marks.
- View assignments and class schedules.

## Technologies

- React and Vite
- Java and Spring Boot
- Spring Security
- Spring Data JPA
- MySQL
- CSS

Authentication uses server-side sessions.
Passwords are hashed with BCrypt.
State-changing requests use CSRF protection.

## Project folders

- backend: Spring Boot REST API
- frontend: React application

## Requirements

- JDK compatible with the backend pom.xml; Java target is 21
- Node.js and npm compatible with the frontend package.json
- MySQL
- Internet access for the first dependency download

## Database setup

Start MySQL and execute:

```sql
CREATE DATABASE IF NOT EXISTS classroom_db;
```

The backend expects MySQL at localhost:3306 with username root.
Change application.properties if your local configuration differs.

Tables are created or updated by Hibernate on startup.

## Run the backend on Windows

Open PowerShell in the backend folder:

```powershell
$dbCredential = Get-Credential -UserName root -Message "Enter your MySQL root password"
$env:DB_PASSWORD = $dbCredential.GetNetworkCredential().Password
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=demo"
```

Backend address: http://localhost:8080

Keep this terminal running.

## Run the frontend on Windows

Open another PowerShell terminal in the frontend folder:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the Local address printed by Vite, usually http://localhost:5173.

The Vite development proxy forwards /api requests to the backend.

## Demo accounts

The demo profile creates missing demo accounts.

| Role | Username | Password |
|---|---|---|
| Teacher | teacher | TeacherDemo@123 |
| Student | student | StudentDemo@123 |

These credentials are for local demonstrations.

The student account is created only if a student with database ID 2
already exists. It links to that student.

On a fresh database:
1. Start with the demo profile.
2. Log in as teacher.
3. Add demonstration students.
4. Check the ID column for student ID 2.
5. Restart the backend with the demo profile after ID 2 exists.

If student IDs already exist or have been deleted, update the student ID
in DemoAccountConfig.java to the intended existing demo student before
creating the student account. Existing accounts are not overwritten.

## Build checks

Frontend:

```powershell
npm.cmd run build
```

Backend:

```powershell
.\mvnw.cmd -DskipTests package
```

The backend command compiles and packages the application but skips tests.

## Calculations

Attendance percentage:
present days / marked days × 100.

Unmarked days are excluded.

Overall marks percentage:
total obtained marks / total maximum marks × 100.

Grade thresholds:
- A+: 90% and above
- A: 80% to below 90%
- B: 70% to below 80%
- C: 60% to below 70%
- D: 50% to below 60%
- F: below 50%

## Current scope

- One shared classroom workspace.
- Student accounts are linked through backend configuration.
- No self-registration or password reset interface.
- Assignments support publishing tasks, not uploading submissions.
- Schedule overlaps are currently allowed.
- Parent accounts and PDF report export are not implemented.

Database records are stored locally in MySQL and are not included in
the source repository.