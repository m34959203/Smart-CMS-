#!/usr/bin/env python3
"""
Debug JSON-LD extraction logic
"""

import requests
from bs4 import BeautifulSoup
import json

url = "https://aimaqaqshamy.kz/mughalimdi-kez-kelgen-zhazatajym-zhaghdaj-ueshin-zhazalaw-orynsyz-aereket/"

response = requests.get(url)
soup = BeautifulSoup(response.content, 'html.parser')

json_ld_scripts = soup.find_all('script', type='application/ld+json')

for i, json_ld_script in enumerate(json_ld_scripts, 1):
    print(f"\n{'='*70}")
    print(f"PROCESSING SCRIPT {i}")
    print('='*70)

    json_data = json.loads(json_ld_script.string)

    # Handle @graph structure
    items_to_check = []
    if isinstance(json_data, dict) and '@graph' in json_data:
        print("Found @graph structure")
        items_to_check = json_data['@graph']
    elif isinstance(json_data, list):
        print("Found list structure")
        items_to_check = json_data
    else:
        print("Found single object")
        items_to_check = [json_data]

    print(f"Items to check: {len(items_to_check)}")

    for j, item in enumerate(items_to_check, 1):
        item_type = item.get('@type', 'Unknown')
        print(f"\n  Item {j}: @type = {item_type}")

        if item_type in ['WebPage', 'NewsArticle', 'Article']:
            print(f"    ✓ Matched type!")

            # Check for different fields
            fields_to_check = [
                'name', 'headline', 'title',
                'datePublished', 'dateModified',
                'thumbnailUrl', 'image', 'author'
            ]

            for field in fields_to_check:
                if field in item:
                    value = item[field]
                    if isinstance(value, str):
                        print(f"    {field}: {value[:100]}...")
                    else:
                        print(f"    {field}: {type(value).__name__} = {value}")
