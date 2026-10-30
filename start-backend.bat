@echo off
title BioLoop Backend Server (Port 8080)
echo ==============================================================
echo              Starting BioLoop Backend API Server
echo ==============================================================
echo Database URL: jdbc:postgresql://localhost:5433/demodb
echo Database User: postgres
echo Server URL:   http://localhost:8080
echo.

cd /d "%~dp0backend"

set MAVEN_EXEC=mvn
where mvn >nul 2>nul
if %ERRORLEVEL% equ 0 goto RUN_MAVEN

if exist "%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.10.0-bin\39q0qgmngdu329psje7bjgne79\apache-maven-3.10.0\bin\mvn.cmd" (
    set MAVEN_EXEC="%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.10.0-bin\39q0qgmngdu329psje7bjgne79\apache-maven-3.10.0\bin\mvn.cmd"
    goto RUN_MAVEN
)

if exist "mvnw.cmd" (
    set MAVEN_EXEC=mvnw.cmd
    goto RUN_MAVEN
)

:RUN_MAVEN
echo Compiling backend classes...
call %MAVEN_EXEC% compile -DskipTests
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Maven compilation failed.
    pause
    exit /b %ERRORLEVEL%
)

echo Starting Spring Boot Backend API...
if not exist "%~dp0backend\target\jvm-args.txt" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\generate-jvm-args.ps1"
)

if exist "%~dp0backend\target\jvm-args.txt" (
    java @"%~dp0backend\target\jvm-args.txt"
) else (
    call %MAVEN_EXEC% spring-boot:run
)

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Spring Boot backend failed to start.
    echo Please make sure PostgreSQL is running on port 5433 and database 'demodb' exists.
    pause
)
