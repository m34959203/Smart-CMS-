#!/bin/bash

# Script to install dependencies and run the scraper

echo "======================================"
echo "АЙМАҚ АҚШАМЫ Article Scraper"
echo "======================================"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -q -r requirements.txt

echo ""
echo "Starting scraper..."
echo "======================================"
echo ""

# Run scraper
python scrape_aimaq.py

echo ""
echo "======================================"
echo "Done! Check the 'scraped_data' folder for results."
echo "======================================"
