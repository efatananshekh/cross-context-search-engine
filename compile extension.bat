@echo off
title Customer Dashboard Launcher - Configuration Tool
color 0F

echo ============================================================
echo        Customer Dashboard Launcher - Configuration Tool
echo ============================================================
echo.
echo This tool will configure the extension for your website.
echo.

:: Get the current directory
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo Current directory: %CD%
echo.

:: Check if files exist
if not exist "manifest.json" (
    echo ERROR: manifest.json not found in current directory.
    pause
    exit /b 1
)

if not exist "background.js" (
    echo ERROR: background.js not found in current directory.
    pause
    exit /b 1
)

if not exist "content.js" (
    echo ERROR: content.js not found in current directory.
    pause
    exit /b 1
)

echo ============================================================
echo STEP 1: Enter your source website domain
echo ============================================================
echo.
echo This is where the extension will extract phone numbers FROM.
echo.
echo Example: cs.yourcompany.com
echo.
echo Do NOT include https:// or trailing slash
echo.
set /p USER_DOMAIN="Enter source domain: "

if "%USER_DOMAIN%"=="" (
    echo ERROR: No domain entered.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo STEP 2: Enter the case view path
echo ============================================================
echo.
echo This is the URL path where case pages are located.
echo.
echo Example: inquiry-center/cases/view
echo.
echo Do NOT include leading or trailing slashes
echo.
set /p USER_CASE_PATH="Enter case view path: "

if "%USER_CASE_PATH%"=="" (
    echo ERROR: No case path entered.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo STEP 3: Enter the customer center path
echo ============================================================
echo.
echo This is the URL path where customer center pages are located.
echo.
echo Example: customer-center
echo.
echo Do NOT include leading or trailing slashes
echo.
set /p USER_CUSTOMER_PATH="Enter customer center path: "

if "%USER_CUSTOMER_PATH%"=="" (
    echo ERROR: No customer path entered.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo STEP 4: Enter your dashboard URL
echo ============================================================
echo.
echo This is where the phone number will be sent TO.
echo.
echo Example: http://YOUR_DASHBOARD_IP:3000/public/dashboard/YOUR_DASHBOARD_ID
echo.
set /p DASHBOARD_URL="Enter dashboard URL: "

if "%DASHBOARD_URL%"=="" (
    echo ERROR: No dashboard URL entered.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo STEP 5: Verify your configuration
echo ============================================================
echo.
echo Source Domain: %USER_DOMAIN%
echo Case View Path: %USER_CASE_PATH%
echo Customer Center Path: %USER_CUSTOMER_PATH%
echo Dashboard URL: %DASHBOARD_URL%
echo.
echo Full URL patterns:
echo   https://%USER_DOMAIN%/%USER_CASE_PATH%/*
echo   https://%USER_DOMAIN%/%USER_CUSTOMER_PATH%/*
echo.
echo Phone numbers will be sent to:
echo   %DASHBOARD_URL%?phone=XXXXXXXXXXX
echo.
echo Is this correct? (Y/N)
set /p CONFIRM="> "

if /i not "%CONFIRM%"=="Y" (
    echo Configuration cancelled.
    pause
    exit /b 0
)

echo.
echo ============================================================
echo Applying configuration...
echo ============================================================

:: Create backup of original files
echo Creating backups...
if exist "manifest.json" (
    if not exist "manifest.json.bak" (
        copy "manifest.json" "manifest.json.bak" > nul
        echo manifest.json.bak created
    )
)
if exist "background.js" (
    if not exist "background.js.bak" (
        copy "background.js" "background.js.bak" > nul
        echo background.js.bak created
    )
)

:: Configure manifest.json
echo Configuring manifest.json...

powershell -Command "$path = '%CD%\manifest.json'; $content = Get-Content $path -Raw -Encoding UTF8; $content = $content -replace 'https://YOUR_DOMAIN_HERE/YOUR_CASE_PATH_HERE/\*', 'https://%USER_DOMAIN%/%USER_CASE_PATH%/*'; $content = $content -replace 'https://YOUR_DOMAIN_HERE/YOUR_CUSTOMER_PATH_HERE/\*', 'https://%USER_DOMAIN%/%USER_CUSTOMER_PATH%/*'; $content = $content -replace 'YOUR_DOMAIN_HERE', '%USER_DOMAIN%'; $content = $content -replace 'YOUR_CASE_PATH_HERE', '%USER_CASE_PATH%'; $content = $content -replace 'YOUR_CUSTOMER_PATH_HERE', '%USER_CUSTOMER_PATH%'; Set-Content $path -Value $content -NoNewline -Encoding UTF8" 2> nul

if errorlevel 1 (
    echo ERROR: Failed to configure manifest.json.
    goto :error_exit
)
echo manifest.json configured.

:: Configure background.js
echo Configuring background.js...

powershell -Command "$path = '%CD%\background.js'; $content = Get-Content $path -Raw -Encoding UTF8; $content = $content -replace 'const DASHBOARD_URL = \"YOUR_DASHBOARD_URL_HERE\";', 'const DASHBOARD_URL = \"%DASHBOARD_URL%\";'; $content = $content -replace 'const SOURCE_DOMAIN = \"YOUR_DOMAIN_HERE\";', 'const SOURCE_DOMAIN = \"%USER_DOMAIN%\";'; $content = $content -replace 'const CASE_PATH = \"YOUR_CASE_PATH_HERE\";', 'const CASE_PATH = \"%USER_CASE_PATH%\";'; $content = $content -replace 'const CUSTOMER_PATH = \"YOUR_CUSTOMER_PATH_HERE\";', 'const CUSTOMER_PATH = \"%USER_CUSTOMER_PATH%\";'; Set-Content $path -Value $content -NoNewline -Encoding UTF8" 2> nul

if errorlevel 1 (
    echo ERROR: Failed to configure background.js.
    goto :error_exit
)
echo background.js configured.

:: Verify configuration
echo.
echo ============================================================
echo Verifying configuration...
echo ============================================================

findstr /C:"%USER_DOMAIN%" "manifest.json" > nul
if errorlevel 1 (
    echo WARNING: Domain may not be correctly set in manifest.json
) else (
    echo OK: manifest.json contains your domain
)

findstr /C:"%USER_CASE_PATH%" "manifest.json" > nul
if errorlevel 1 (
    echo WARNING: Case path may not be correctly set in manifest.json
) else (
    echo OK: manifest.json contains your case path
)

findstr /C:"%USER_CUSTOMER_PATH%" "manifest.json" > nul
if errorlevel 1 (
    echo WARNING: Customer path may not be correctly set in manifest.json
) else (
    echo OK: manifest.json contains your customer path
)

findstr /C:"%DASHBOARD_URL%" "background.js" > nul
if errorlevel 1 (
    echo WARNING: Dashboard URL may not be correctly set in background.js
) else (
    echo OK: background.js contains your dashboard URL
)

echo.
echo ============================================================
echo Configuration Complete!
echo ============================================================
echo.
echo Your extension is now configured for:
echo   Source Domain: %USER_DOMAIN%
echo   Case View Path: /%USER_CASE_PATH%/
echo   Customer Center Path: /%USER_CUSTOMER_PATH%/
echo   Dashboard URL: %DASHBOARD_URL%
echo.
echo ============================================================
echo NEXT STEPS:
echo ============================================================
echo.
echo 1. Open Chrome and go to: chrome://extensions/
echo 2. Enable "Developer mode" (top right)
echo 3. Click "Load unpacked"
echo 4. Select this folder: %CD%
echo 5. The extension "Customer Dashboard Launcher" will appear
echo.
echo To test: Navigate to https://%USER_DOMAIN%/%USER_CASE_PATH%/[case-id]
echo The dashboard should automatically open with the customer's phone number.
echo.
echo ============================================================
pause
exit /b 0

:error_exit
echo.
echo ============================================================
echo ERROR: Configuration failed.
echo ============================================================
echo.
echo Your original files have been preserved as .bak files.
echo.
echo Please configure manually:
echo.
echo === manifest.json ===
echo Replace YOUR_DOMAIN_HERE with %USER_DOMAIN%
echo Replace YOUR_CASE_PATH_HERE with %USER_CASE_PATH%
echo Replace YOUR_CUSTOMER_PATH_HERE with %USER_CUSTOMER_PATH%
echo.
echo === background.js ===
echo Set DASHBOARD_URL = "%DASHBOARD_URL%"
echo Set SOURCE_DOMAIN = "%USER_DOMAIN%"
echo Set CASE_PATH = "%USER_CASE_PATH%"
echo Set CUSTOMER_PATH = "%USER_CUSTOMER_PATH%"
echo.
echo Then reload the extension at chrome://extensions/
echo.
pause
exit /b 1