#!/usr/bin/env python3
"""
Scraper for https://aimaqaqshamy.kz/
Downloads the latest 30 articles with their images and metadata
"""

import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime
from urllib.parse import urljoin, urlparse
import time
import re


class AimaqScraper:
    def __init__(self, base_url="https://aimaqaqshamy.kz", output_dir="scraped_data"):
        self.base_url = base_url
        self.output_dir = output_dir
        self.images_dir = os.path.join(output_dir, "images")
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

        # Create output directories
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.images_dir, exist_ok=True)

    def get_article_links(self, num_articles=30):
        """Get links to the latest articles"""
        print(f"Fetching article links from {self.base_url}...")
        article_links = []
        page = 1

        while len(article_links) < num_articles:
            url = f"{self.base_url}/page/{page}/" if page > 1 else self.base_url
            print(f"Scanning page {page}...")

            try:
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                soup = BeautifulSoup(response.content, 'html.parser')

                # Find all article posts using the bs-blog-post class
                article_divs = soup.find_all('div', class_='bs-blog-post')

                for article_div in article_divs:
                    # Find the link inside the article div
                    link = article_div.find('a', href=True)
                    if link:
                        href = link.get('href', '')

                        # Filter valid article URLs
                        if (href and
                            self.base_url in href and
                            '/page/' not in href and
                            '/category/' not in href and
                            '/author/' not in href and
                            href != self.base_url and
                            href != self.base_url + '/' and
                            href not in article_links):

                            article_links.append(href)
                            print(f"  Found article {len(article_links)}: {href}")

                            if len(article_links) >= num_articles:
                                break

                if len(article_links) >= num_articles:
                    break

                page += 1
                time.sleep(1)  # Be polite to the server

                # Safety check to avoid infinite loop
                if page > 10:
                    print("Reached page limit")
                    break

            except Exception as e:
                print(f"Error fetching page {page}: {e}")
                break

        return article_links[:num_articles]

    def download_image(self, image_url, article_slug):
        """Download an image and return the local path"""
        try:
            # Get filename from URL
            parsed_url = urlparse(image_url)
            filename = os.path.basename(parsed_url.path)

            # Create a unique filename with article slug
            filename = f"{article_slug}_{filename}"
            filepath = os.path.join(self.images_dir, filename)

            # Skip if already downloaded
            if os.path.exists(filepath):
                print(f"    Image already exists: {filename}")
                return filepath

            # Download image
            print(f"    Downloading image: {filename}")
            response = self.session.get(image_url, timeout=30)
            response.raise_for_status()

            with open(filepath, 'wb') as f:
                f.write(response.content)

            return filepath

        except Exception as e:
            print(f"    Error downloading image {image_url}: {e}")
            return None

    def scrape_article(self, article_url):
        """Scrape a single article with all its data"""
        print(f"\nScraping: {article_url}")

        try:
            response = self.session.get(article_url, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            article_data = {
                'url': article_url,
                'scraped_at': datetime.now().isoformat()
            }

            # Extract data from Schema.org JSON-LD
            json_ld_scripts = soup.find_all('script', type='application/ld+json')
            for json_ld_script in json_ld_scripts:
                try:
                    json_data = json.loads(json_ld_script.string)

                    # Handle @graph structure or array of schema objects or single object
                    items_to_check = []
                    if isinstance(json_data, dict) and '@graph' in json_data:
                        items_to_check = json_data['@graph']
                    elif isinstance(json_data, list):
                        items_to_check = json_data
                    else:
                        items_to_check = [json_data]

                    for item in items_to_check:
                        item_type = item.get('@type', '')

                        # Look for WebPage, NewsArticle, or Article types
                        if item_type in ['WebPage', 'NewsArticle', 'Article']:
                            # Extract title
                            if not article_data.get('title'):
                                article_data['title'] = item.get('name', '') or item.get('headline', '')

                            # Extract dates
                            if not article_data.get('date_published'):
                                article_data['date_published'] = item.get('datePublished', '')
                            if not article_data.get('date_modified'):
                                article_data['date_modified'] = item.get('dateModified', '')

                            # Extract author
                            if not article_data.get('author'):
                                author_data = item.get('author', {})
                                if isinstance(author_data, dict):
                                    article_data['author'] = author_data.get('name', 'admin')
                                elif isinstance(author_data, str):
                                    article_data['author'] = author_data
                                else:
                                    article_data['author'] = 'admin'

                            # Get thumbnail/primary image
                            if not article_data.get('thumbnail_url'):
                                # Try thumbnailUrl first (direct URL string)
                                thumbnail_url = item.get('thumbnailUrl', '')
                                if thumbnail_url and isinstance(thumbnail_url, str):
                                    article_data['thumbnail_url'] = thumbnail_url
                                else:
                                    # Try image field (can be dict, list, or string)
                                    image_data = item.get('image', '')
                                    if isinstance(image_data, str) and image_data:
                                        article_data['thumbnail_url'] = image_data
                                    elif isinstance(image_data, dict):
                                        article_data['thumbnail_url'] = image_data.get('url', '')
                                    elif isinstance(image_data, list) and len(image_data) > 0:
                                        article_data['thumbnail_url'] = image_data[0].get('url', '') if isinstance(image_data[0], dict) else image_data[0]

                except json.JSONDecodeError as e:
                    print(f"  Error parsing JSON-LD: {e}")

            # Fallback: Extract title from h1
            if 'title' not in article_data or not article_data['title']:
                h1 = soup.find('h1')
                if h1:
                    article_data['title'] = h1.get_text(strip=True)

            # Extract article content
            # Look for main article content area
            article_body = soup.find('article') or soup.find('div', class_=re.compile(r'entry-content|post-content|article-content'))

            if article_body:
                # Extract text content
                paragraphs = article_body.find_all('p')
                article_data['content'] = '\n\n'.join([p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True)])

                # Extract all images in the article
                images = article_body.find_all('img')
                article_data['images'] = []

                # Create slug from URL for image naming
                article_slug = article_url.rstrip('/').split('/')[-1][:50]

                for img in images:
                    img_url = img.get('src', '')
                    if img_url:
                        # Handle relative URLs
                        img_url = urljoin(self.base_url, img_url)

                        # Download image
                        local_path = self.download_image(img_url, article_slug)

                        article_data['images'].append({
                            'url': img_url,
                            'local_path': local_path,
                            'alt': img.get('alt', ''),
                            'width': img.get('width', ''),
                            'height': img.get('height', '')
                        })

            # Also download thumbnail if not already in images
            if 'thumbnail_url' in article_data:
                thumbnail_found = any(img['url'] == article_data['thumbnail_url'] for img in article_data.get('images', []))
                if not thumbnail_found:
                    article_slug = article_url.rstrip('/').split('/')[-1][:50]
                    local_path = self.download_image(article_data['thumbnail_url'], article_slug)
                    if local_path:
                        if 'images' not in article_data:
                            article_data['images'] = []
                        article_data['images'].insert(0, {
                            'url': article_data['thumbnail_url'],
                            'local_path': local_path,
                            'alt': 'Thumbnail',
                            'is_thumbnail': True
                        })

            print(f"  ✓ Title: {article_data.get('title', 'N/A')}")
            print(f"  ✓ Date: {article_data.get('date_published', 'N/A')}")
            print(f"  ✓ Images: {len(article_data.get('images', []))}")
            print(f"  ✓ Content length: {len(article_data.get('content', ''))} chars")

            return article_data

        except Exception as e:
            print(f"  ✗ Error scraping article: {e}")
            return None

    def scrape_articles(self, num_articles=30):
        """Main method to scrape multiple articles"""
        print(f"Starting scrape of {num_articles} articles from {self.base_url}\n")
        print("=" * 70)

        # Get article links
        article_links = self.get_article_links(num_articles)
        print(f"\n✓ Found {len(article_links)} article links\n")
        print("=" * 70)

        # Scrape each article
        articles = []
        for i, link in enumerate(article_links, 1):
            print(f"\n[{i}/{len(article_links)}]")
            article_data = self.scrape_article(link)
            if article_data:
                articles.append(article_data)
            time.sleep(2)  # Be polite to the server

        # Save to JSON
        output_file = os.path.join(self.output_dir, 'articles.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(articles, f, ensure_ascii=False, indent=2)

        print("\n" + "=" * 70)
        print(f"✓ Scraping complete!")
        print(f"✓ Scraped {len(articles)} articles")
        print(f"✓ Data saved to: {output_file}")
        print(f"✓ Images saved to: {self.images_dir}")
        print("=" * 70)

        # Print summary
        total_images = sum(len(article.get('images', [])) for article in articles)
        print(f"\nSummary:")
        print(f"  Articles: {len(articles)}")
        print(f"  Images: {total_images}")
        print(f"  Output directory: {self.output_dir}")

        return articles


def main():
    scraper = AimaqScraper(
        base_url="https://aimaqaqshamy.kz",
        output_dir="scraped_data"
    )
    scraper.scrape_articles(num_articles=30)


if __name__ == "__main__":
    main()
