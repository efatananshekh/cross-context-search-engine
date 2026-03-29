
                CUSTOMER DASHBOARD LAUNCHER - USER MANUAL



1. OVERVIEW


Customer Dashboard Launcher is a Chrome extension that bridges your case 
management system with a dashboard. It extracts phone numbers from case pages 
and customer center pages, then sends them to a dashboard URL as a parameter.


2. WHAT YOU NEED TO KNOW BEFORE INSTALLATION


You need to know FOUR things:

| Item | Description | Example |
|------|-------------|---------|
| Source Domain | Where your case pages are hosted | cs.yourcompany.com |
| Case Path | The URL path before the case ID | inquiry-center/cases/view |
| Customer Path | The URL path for customer center | customer-center |
| Dashboard URL | Where to send the phone number | http://YOUR_IP:3000/dashboard/ID |


3. INSTALLATION


3.1 Automatic Configuration (Windows)

1. Double-click configure.bat
2. Enter your source domain
3. Enter your case view path
4. Enter your customer center path
5. Enter your dashboard URL
6. Type Y to confirm

3.2 Manual Configuration

Open manifest.json and replace:
- YOUR_DOMAIN_HERE with your domain
- YOUR_CASE_PATH_HERE with your case view path
- YOUR_CUSTOMER_PATH_HERE with your customer center path

Open background.js and replace:
- YOUR_DASHBOARD_URL_HERE with your dashboard URL
- YOUR_DOMAIN_HERE with your domain
- YOUR_CASE_PATH_HERE with your case view path
- YOUR_CUSTOMER_PATH_HERE with your customer center path

3.3 Load in Chrome

1. Go to chrome://extensions/
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the extension folder


4. DAILY USAGE


1. Open Chrome
2. Navigate to any case page or customer center page
3. Extension automatically detects phone number
4. Dashboard tab opens in background
5. Dashboard shows customer data
6. Switch to another case tab
7. Dashboard updates automatically


5. TROUBLESHOOTING


Problem: Dashboard does not open
Solution: Verify dashboard URL is correct in background.js

Problem: Phone number not detected
Solution: Open browser console (F12) to see logs

Problem: Multiple dashboard tabs opening
Solution: Close all dashboard tabs and refresh the case page

Problem: configure.bat fails
Solution: Right-click and select "Run as Administrator"


6. CUSTOMIZATION


Change phone pattern: Edit content.js patterns array
Change dashboard tab: Edit background.js "tab" parameter
Change update delay: Edit background.js UPDATE_DELAY variable


7. VERSION HISTORY


Version 1.1 - Current
- Supports both case view and customer center pages
- Configuration batch script included

Version 1.0 - Initial release


END OF MANUAL
