#!/usr/bin/env python3
"""
Example script for importing scraped articles into a database
Adapt this to your specific database schema
"""

import json
import os
from datetime import datetime


class ArticleImporter:
    """
    Example importer class - adapt to your database
    Supports: PostgreSQL, MySQL, SQLite, MongoDB
    """

    def __init__(self, articles_file='scraped_data/articles.json'):
        self.articles_file = articles_file
        self.articles = []

    def load_articles(self):
        """Load articles from JSON file"""
        print(f"Loading articles from {self.articles_file}...")
        with open(self.articles_file, 'r', encoding='utf-8') as f:
            self.articles = json.load(f)
        print(f"✓ Loaded {len(self.articles)} articles")
        return self.articles

    # Example 1: SQLite/PostgreSQL/MySQL (using SQLAlchemy or raw SQL)
    def import_to_sql(self, connection):
        """
        Example for SQL databases

        Usage with SQLite:
            import sqlite3
            conn = sqlite3.connect('your_database.db')
            importer.import_to_sql(conn)

        Usage with PostgreSQL/MySQL:
            import psycopg2  # or import mysql.connector
            conn = psycopg2.connect("your_connection_string")
            importer.import_to_sql(conn)
        """
        cursor = connection.cursor()

        # Create table (example schema)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT,
                author TEXT,
                date_published TIMESTAMP,
                date_modified TIMESTAMP,
                original_url TEXT UNIQUE,
                thumbnail_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS article_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                article_id INTEGER,
                image_url TEXT,
                local_path TEXT,
                alt_text TEXT,
                width INTEGER,
                height INTEGER,
                is_thumbnail BOOLEAN DEFAULT 0,
                FOREIGN KEY (article_id) REFERENCES articles(id)
            )
        """)

        # Insert articles
        for article in self.articles:
            try:
                # Insert article
                cursor.execute("""
                    INSERT OR IGNORE INTO articles
                    (title, content, author, date_published, date_modified, original_url, thumbnail_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    article.get('title', ''),
                    article.get('content', ''),
                    article.get('author', 'admin'),
                    article.get('date_published'),
                    article.get('date_modified'),
                    article.get('url'),
                    article.get('thumbnail_url')
                ))

                # Get article ID
                article_id = cursor.lastrowid

                # Insert images
                for image in article.get('images', []):
                    cursor.execute("""
                        INSERT INTO article_images
                        (article_id, image_url, local_path, alt_text, width, height, is_thumbnail)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        article_id,
                        image.get('url'),
                        image.get('local_path'),
                        image.get('alt', ''),
                        image.get('width') or None,
                        image.get('height') or None,
                        image.get('is_thumbnail', False)
                    ))

                print(f"✓ Imported: {article.get('title', 'Untitled')}")

            except Exception as e:
                print(f"✗ Error importing article: {e}")

        connection.commit()
        print(f"\n✓ Import complete!")

    # Example 2: MongoDB
    def import_to_mongodb(self, collection):
        """
        Example for MongoDB

        Usage:
            from pymongo import MongoClient
            client = MongoClient('mongodb://localhost:27017/')
            db = client['your_database']
            collection = db['articles']
            importer.import_to_mongodb(collection)
        """
        for article in self.articles:
            try:
                # Prepare document
                doc = {
                    'title': article.get('title', ''),
                    'content': article.get('content', ''),
                    'author': article.get('author', 'admin'),
                    'date_published': article.get('date_published'),
                    'date_modified': article.get('date_modified'),
                    'original_url': article.get('url'),
                    'thumbnail_url': article.get('thumbnail_url'),
                    'images': article.get('images', []),
                    'scraped_at': article.get('scraped_at'),
                    'created_at': datetime.now()
                }

                # Insert or update
                collection.update_one(
                    {'original_url': doc['original_url']},
                    {'$set': doc},
                    upsert=True
                )

                print(f"✓ Imported: {article.get('title', 'Untitled')}")

            except Exception as e:
                print(f"✗ Error importing article: {e}")

        print(f"\n✓ Import complete!")

    # Example 3: JSON file for static site generators (like Next.js, Gatsby)
    def export_for_static_site(self, output_dir='public/articles'):
        """
        Export articles as individual JSON files for static sites

        Each article gets its own file: public/articles/article-slug.json
        """
        os.makedirs(output_dir, exist_ok=True)

        # Create index file
        index = []

        for article in self.articles:
            # Create slug from URL
            slug = article['url'].rstrip('/').split('/')[-1]

            # Create article file
            article_file = os.path.join(output_dir, f"{slug}.json")
            with open(article_file, 'w', encoding='utf-8') as f:
                json.dump(article, f, ensure_ascii=False, indent=2)

            # Add to index
            index.append({
                'slug': slug,
                'title': article.get('title'),
                'date_published': article.get('date_published'),
                'thumbnail_url': article.get('thumbnail_url')
            })

            print(f"✓ Exported: {slug}.json")

        # Save index
        index_file = os.path.join(output_dir, 'index.json')
        with open(index_file, 'w', encoding='utf-8') as f:
            json.dump(index, f, ensure_ascii=False, indent=2)

        print(f"\n✓ Export complete! Files in {output_dir}")

    def print_summary(self):
        """Print summary of loaded articles"""
        if not self.articles:
            print("No articles loaded")
            return

        print("\n" + "=" * 70)
        print("ARTICLES SUMMARY")
        print("=" * 70)

        total_images = sum(len(article.get('images', [])) for article in self.articles)

        print(f"\nTotal articles: {len(self.articles)}")
        print(f"Total images: {total_images}")

        print("\nArticles:")
        for i, article in enumerate(self.articles, 1):
            print(f"\n{i}. {article.get('title', 'Untitled')}")
            print(f"   Date: {article.get('date_published', 'N/A')}")
            print(f"   Images: {len(article.get('images', []))}")
            print(f"   Content: {len(article.get('content', ''))} chars")


# Example usage scripts
def example_sqlite():
    """Example: Import to SQLite database"""
    import sqlite3

    importer = ArticleImporter('scraped_data/articles.json')
    importer.load_articles()

    # Connect to database
    conn = sqlite3.connect('articles.db')

    # Import
    importer.import_to_sql(conn)

    conn.close()
    print("\n✓ Data imported to articles.db")


def example_mongodb():
    """Example: Import to MongoDB"""
    from pymongo import MongoClient

    importer = ArticleImporter('scraped_data/articles.json')
    importer.load_articles()

    # Connect to MongoDB
    client = MongoClient('mongodb://localhost:27017/')
    db = client['aimaq_news']
    collection = db['articles']

    # Import
    importer.import_to_mongodb(collection)

    print("\n✓ Data imported to MongoDB")


def example_static_export():
    """Example: Export for static site"""
    importer = ArticleImporter('scraped_data/articles.json')
    importer.load_articles()

    # Export
    importer.export_for_static_site('public/articles')


if __name__ == "__main__":
    print("Article Importer - Example Usage\n")
    print("Choose import method:")
    print("1. SQLite database")
    print("2. MongoDB")
    print("3. Static site export")
    print("4. Show summary only")

    choice = input("\nEnter choice (1-4): ").strip()

    if choice == "1":
        example_sqlite()
    elif choice == "2":
        try:
            example_mongodb()
        except ImportError:
            print("Error: pymongo not installed. Install with: pip install pymongo")
    elif choice == "3":
        example_static_export()
    elif choice == "4":
        importer = ArticleImporter('scraped_data/articles.json')
        importer.load_articles()
        importer.print_summary()
    else:
        print("Invalid choice")
