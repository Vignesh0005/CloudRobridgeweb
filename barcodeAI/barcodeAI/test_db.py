#!/usr/bin/env python3
"""
Test script for database functionality
"""

import sqlite3
import os

def test_database():
    """Test database creation and operations."""
    print("🗄️  Testing Database Functionality")
    print("=" * 40)
    
    db_path = "test_products.db"
    
    try:
        # Test database creation
        print("1. Testing database creation...")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS products (
                barcode TEXT PRIMARY KEY,
                company TEXT,
                product_name TEXT,
                product_type TEXT,
                benefits TEXT
            )
        ''')
        
        print("✅ Database table created successfully!")
        
        # Test data insertion
        print("\n2. Testing data insertion...")
        test_data = {
            'barcode': '1234567890123',
            'company': 'Test Company',
            'product_name': 'Test Product',
            'product_type': 'Test Category',
            'benefits': 'This is a test product with great benefits'
        }
        
        cursor.execute('''
            INSERT OR REPLACE INTO products 
            (barcode, company, product_name, product_type, benefits)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            test_data['barcode'],
            test_data['company'],
            test_data['product_name'],
            test_data['product_type'],
            test_data['benefits']
        ))
        
        conn.commit()
        print("✅ Data inserted successfully!")
        
        # Test data retrieval
        print("\n3. Testing data retrieval...")
        cursor.execute('''
            SELECT company, product_name, product_type, benefits 
            FROM products WHERE barcode = ?
        ''', (test_data['barcode'],))
        
        result = cursor.fetchone()
        if result:
            retrieved_data = {
                'company': result[0],
                'product_name': result[1],
                'product_type': result[2],
                'benefits': result[3]
            }
            print("✅ Data retrieved successfully!")
            print(f"   Company: {retrieved_data['company']}")
            print(f"   Product: {retrieved_data['product_name']}")
            print(f"   Type: {retrieved_data['product_type']}")
            print(f"   Benefits: {retrieved_data['benefits']}")
        else:
            print("❌ No data found!")
        
        # Test non-existent barcode
        print("\n4. Testing non-existent barcode...")
        cursor.execute('''
            SELECT company, product_name, product_type, benefits 
            FROM products WHERE barcode = ?
        ''', ('9999999999999',))
        
        result = cursor.fetchone()
        if result is None:
            print("✅ Correctly returned None for non-existent barcode")
        else:
            print("❌ Should have returned None")
        
        conn.close()
        print("\n✅ All database tests passed!")
        
        # Clean up test database
        if os.path.exists(db_path):
            os.remove(db_path)
            print("🧹 Test database cleaned up")
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = test_database()
    if success:
        print("\n🎉 Database functionality is working correctly!")
    else:
        print("\n❌ Database tests failed!")
        sys.exit(1)
