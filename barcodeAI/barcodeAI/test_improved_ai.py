#!/usr/bin/env python3
"""
Test the improved AI barcode detection system
"""

from barcode_scanner import BarcodeScanner

def test_improved_system():
    """Test the improved AI system with various barcodes."""
    print("🧠 Testing Improved AI Barcode Detection")
    print("=" * 50)
    
    # Initialize scanner
    api_key = "AIzaSyCCFrqS-5WoAvRoTmQb_qPDEsqlwSKZdm0"
    scanner = BarcodeScanner(api_key)
    
    # Test cases
    test_cases = [
        ("8901030978456", "Your problematic barcode"),
        ("1234567890123", "Random unknown barcode"),
        ("9876543210987", "Another random barcode"),
        ("8901030978456", "Your barcode again (should show database result)")
    ]
    
    for i, (barcode, description) in enumerate(test_cases, 1):
        print(f"\n🔍 Test {i}: {description}")
        print(f"Barcode: {barcode}")
        print("-" * 40)
        
        result = scanner.get_product_info(barcode)
        scanner.display_product_info(result)
        
        # Check if it was saved to database
        db_result = scanner.fetch_from_db(barcode)
        if db_result:
            print("💾 Status: Saved to database")
        else:
            print("💾 Status: Not saved (insufficient information)")

if __name__ == "__main__":
    test_improved_system()
