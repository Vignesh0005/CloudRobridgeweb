#!/usr/bin/env python3
"""
Manual barcode testing tool
"""

from barcode_scanner import BarcodeScanner

def test_manual_barcode():
    """Test a manually entered barcode."""
    print("🔧 Manual Barcode Testing Tool")
    print("=" * 40)
    
    # Initialize scanner
    api_key = "AIzaSyCCFrqS-5WoAvRoTmQb_qPDEsqlwSKZdm0"
    scanner = BarcodeScanner(api_key)
    
    while True:
        print("\nOptions:")
        print("1. Test a specific barcode")
        print("2. Show database contents")
        print("3. Clear database")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == '1':
            barcode = input("Enter the barcode number: ").strip()
            if barcode:
                print(f"\n🔍 Testing barcode: {barcode}")
                result = scanner.get_product_info(barcode)
                scanner.display_product_info(result)
        
        elif choice == '2':
            import sqlite3
            conn = sqlite3.connect('products.db')
            cursor = conn.cursor()
            cursor.execute("SELECT barcode, company, product_name FROM products")
            results = cursor.fetchall()
            conn.close()
            
            if results:
                print(f"\n📊 Database contains {len(results)} products:")
                for barcode, company, product in results:
                    print(f"   {barcode}: {company} - {product}")
            else:
                print("\n📊 Database is empty")
        
        elif choice == '3':
            confirm = input("Are you sure? (y/N): ").strip().lower()
            if confirm == 'y':
                import sqlite3
                conn = sqlite3.connect('products.db')
                cursor = conn.cursor()
                cursor.execute("DELETE FROM products")
                conn.commit()
                conn.close()
                print("✅ Database cleared")
        
        elif choice == '4':
            print("👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid choice")

if __name__ == "__main__":
    test_manual_barcode()
