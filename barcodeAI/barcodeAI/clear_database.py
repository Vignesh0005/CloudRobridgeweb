#!/usr/bin/env python3
"""
Clear the database to start fresh
"""

import sqlite3
import os

def clear_database():
    """Clear all data from the products database."""
    db_path = "products.db"
    
    if not os.path.exists(db_path):
        print("❌ Database file not found")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get current count
        cursor.execute("SELECT COUNT(*) FROM products")
        count = cursor.fetchone()[0]
        print(f"📊 Current database has {count} products")
        
        # Clear all data
        cursor.execute("DELETE FROM products")
        conn.commit()
        
        # Verify deletion
        cursor.execute("SELECT COUNT(*) FROM products")
        new_count = cursor.fetchone()[0]
        
        conn.close()
        
        if new_count == 0:
            print("✅ Database cleared successfully!")
            return True
        else:
            print("❌ Failed to clear database")
            return False
            
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        return False

if __name__ == "__main__":
    print("🗑️  Database Cleanup Tool")
    print("=" * 30)
    
    confirm = input("Are you sure you want to clear all product data? (y/N): ").strip().lower()
    if confirm == 'y':
        clear_database()
    else:
        print("❌ Operation cancelled")
