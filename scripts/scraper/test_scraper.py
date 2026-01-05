#!/usr/bin/env python3
"""
Quick test version of the scraper - downloads only 2 articles
"""

from scrape_aimaq import AimaqScraper

def main():
    print("\n" + "="*70)
    print("QUICK TEST - Downloading 2 articles")
    print("="*70 + "\n")

    scraper = AimaqScraper(
        base_url="https://aimaqaqshamy.kz",
        output_dir="scraped_data_test"
    )

    # Test with just 2 articles
    articles = scraper.scrape_articles(num_articles=2)

    print("\n" + "="*70)
    print("TEST RESULTS")
    print("="*70)

    if articles:
        print(f"✓ Successfully scraped {len(articles)} articles")
        print(f"\nFirst article:")
        print(f"  Title: {articles[0].get('title', 'N/A')}")
        print(f"  Date: {articles[0].get('date_published', 'N/A')}")
        print(f"  Images: {len(articles[0].get('images', []))}")
        print(f"  Content length: {len(articles[0].get('content', ''))} characters")
        print("\n✓ Test passed! You can now run the full scraper.")
    else:
        print("✗ Test failed - no articles scraped")

if __name__ == "__main__":
    main()
