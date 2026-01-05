@echo off
REM Script to install dependencies and run the scraper on Windows

echo ======================================
echo АЙМАҚ АҚШАМЫ Article Scraper
echo ======================================
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -q -r requirements.txt

echo.
echo Starting scraper...
echo ======================================
echo.

REM Run scraper
python scrape_aimaq.py

echo.
echo ======================================
echo Done! Check the 'scraped_data' folder for results.
echo ======================================
pause
