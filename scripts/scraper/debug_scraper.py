#!/usr/bin/env python3
"""
Debug version to see what JSON-LD data is actually on the page
"""

import requests
from bs4 import BeautifulSoup
import json

url = "https://aimaqaqshamy.kz/mughalimdi-kez-kelgen-zhazatajym-zhaghdaj-ueshin-zhazalaw-orynsyz-aereket/"

print(f"Fetching: {url}\n")

response = requests.get(url)
soup = BeautifulSoup(response.content, 'html.parser')

print("="*70)
print("JSON-LD SCRIPTS FOUND:")
print("="*70)

json_ld_scripts = soup.find_all('script', type='application/ld+json')
print(f"\nFound {len(json_ld_scripts)} JSON-LD script(s)\n")

for i, script in enumerate(json_ld_scripts, 1):
    print(f"\n--- Script {i} ---")
    try:
        data = json.loads(script.string)
        print(json.dumps(data, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Error: {e}")

print("\n" + "="*70)
print("IMAGES IN ARTICLE BODY:")
print("="*70)

article_body = soup.find('article') or soup.find('div', class_='entry-content')
if article_body:
    images = article_body.find_all('img')
    print(f"\nFound {len(images)} image(s)\n")
    for i, img in enumerate(images, 1):
        print(f"{i}. {img.get('src', 'N/A')}")
        print(f"   Alt: {img.get('alt', 'N/A')}")
else:
    print("\nArticle body not found!")

print("\n" + "="*70)
print("DATE METADATA:")
print("="*70)

# Check for date in meta tags
meta_tags = soup.find_all('meta')
for meta in meta_tags:
    if 'date' in str(meta).lower() or 'time' in str(meta).lower():
        print(meta)
