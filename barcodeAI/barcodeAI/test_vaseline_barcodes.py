#!/usr/bin/env python3
"""
Test common Vaseline barcode patterns
"""

from barcode_scanner import BarcodeScanner

def test_vaseline_barcodes():
    """Test some common Vaseline barcode patterns."""
    print("🧴 Testing Common Vaseline Barcodes")
    print("=" * 40)
    
    # Initialize scanner
    api_key = "AIzaSyCCFrqS-5WoAvRoTmQb_qPDEsqlwSKZdm0"
    scanner = BarcodeScanner(api_key)
    
    # Common Vaseline barcode patterns (these are examples - your actual barcode might be different)
    test_barcodes = [
        "8901030978456",  # The one you're having issues with
        "8901030978457",  # Similar pattern
        "8901030978458",  # Similar pattern
        "8901030978459",  # Similar pattern
        "8901030978460",  # Similar pattern
        # Add more if you know them
    ]
    
    print("🔍 Testing barcode patterns similar to what you scanned...")
    
    for barcode in test_barcodes:
        print(f"\n--- Testing: {barcode} ---")
        try:
            result = scanner.get_product_info(barcode)
            print(f"Company: {result['company']}")
            print(f"Product: {result['product_name']}")
            print(f"Type: {result['product_type']}")
            
            # Check if it contains Vaseline
            if ('vaseline' in result['product_name'].lower() or 
                'vaseline' in result['company'].lower() or
                'petroleum' in result['product_name'].lower() or
                'jelly' in result['product_name'].lower()):
                print("🎯 POTENTIAL VASELINE PRODUCT FOUND!")
                
        except Exception as e:
            print(f"❌ Error testing {barcode}: {e}")
    
    print("\n" + "="*50)
    print("💡 TIPS:")
    print("1. Make sure you're scanning the main product barcode, not a promotional code")
    print("2. Check if there are multiple barcodes on the packaging")
    print("3. Try scanning different angles")
    print("4. The barcode might be on the bottom or side of the product")
    print("5. Some products have barcodes on the cap or label")

if __name__ == "__main__":
    test_vaseline_barcodes()
