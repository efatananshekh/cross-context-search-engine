================================================================================
                    CUSTOMER DASHBOARD LAUNCHER - README
================================================================================

================================================================================
PROJECT OVERVIEW
================================================================================

Customer Dashboard Launcher is a Chrome extension that extracts phone numbers 
from case view pages and customer center pages, then sends them to a dashboard 
URL for automatic customer data loading.

================================================================================
WHAT YOU NEED
================================================================================

You need four things:

1. SOURCE DOMAIN - Where to extract phone numbers FROM
2. CASE VIEW PATH - The URL path for case pages
3. CUSTOMER CENTER PATH - The URL path for customer pages
4. DASHBOARD URL - Where to SEND the phone number TO

================================================================================
QUICK INSTALLATION
================================================================================

STEP 1: Download all files to a folder

STEP 2: Double-click configure.bat

STEP 3: Follow the prompts to enter your:
        - Source domain
        - Case view path
        - Customer center path
        - Dashboard URL

STEP 4: Load in Chrome:
        - Go to chrome://extensions/
        - Enable Developer mode
        - Click "Load unpacked"
        - Select the folder

================================================================================
HOW IT WORKS
================================================================================

1. You open a case page
2. Extension finds the phone number in the shipping/delivery section
3. Extension updates the dashboard URL with ?phone=NUMBER
4. Dashboard shows that customer's data
5. When you switch tabs, dashboard updates automatically

================================================================================
FILES IN THIS PACKAGE
================================================================================

LICENSE              - MIT License
README.txt           - This quick start guide
MANUAL.txt           - Complete user manual
configure.bat        - Configuration helper script (Windows)
manifest.json        - Extension configuration
background.js        - Service worker (runs in background)
content.js           - Content script (extracts phone numbers)

================================================================================
For complete documentation, see MANUAL.txt
================================================================================