#!/usr/bin/env python3
"""
Debug script to test specific barcode lookups
"""

import os
from barcode_scanner import BarcodeScanner

def debug_barcode(barcode):
    """Debug a specific barcode lookup."""
    print(f"\n🔍 Debugging barcode: {barcode}")
    print("=" * 50)
    
    # Initialize scanner
    api_key = "AIzaSyCCFrqS-5WoAvRoTmQb_qPDEsqlwSKZdm0"
    scanner = BarcodeScanner(api_key)
    
    # Check database first
    print("1. Checking database...")
    db_result = scanner.fetch_from_db(barcode)
    if db_result:
        print("✅ Found in database:")
        for key, value in db_result.items():
            print(f"   {key}: {value}")
        return db_result
    
    # Query Gemini AI
    print("2. Querying Gemini AI...")
    gemini_result = scanner.query_gemini(barcode)
    print("✅ Gemini response:")
    for key, value in gemini_result.items():
        print(f"   {key}: {value}")
    
    # Save to database
    if gemini_result['company'] != 'Unknown':
        print("3. Saving to database...")
        scanner.save_to_db(
            barcode,
            gemini_result['company'],
            gemini_result['product_name'],
            gemini_result['product_type'],
            gemini_result['benefits']
        )
        print("✅ Saved to database")
    
    return gemini_result

def main():
    """Test specific barcodes."""
    print("🔧 Barcode Debug Tool")
    print("=" * 30)
    
    # Test the problematic barcode
    test_barcode = input("Enter barcode to debug (or press Enter for default): ").strip()
    if not test_barcode:
        test_barcode = "8902080002788"  # Default test barcode
    
    result = debug_barcode(test_barcode)
    
    print(f"\n📊 Final Result for {test_barcode}:")
    print("-" * 40)
    for key, value in result.items():
        print(f"{key}: {value}")

if __name__ == "__main__":
    main()
