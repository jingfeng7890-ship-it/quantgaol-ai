@echo off
echo [DEPLOY] Starting Production Deployment...
echo --------------------------------------------------
echo [1/3] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Dependencies installation failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Building Next.js application...
echo This may take a few minutes...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Deployment Check Complete.
echo --------------------------------------------------
echo [SUCCESS] Application is ready for production.
echo [INFO] To start the server, run: npm run start
echo [INFO] Please ensure 'full_schema_deployment.sql' has been run in Supabase SQL Editor.
echo --------------------------------------------------
pause
