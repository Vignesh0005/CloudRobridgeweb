#!/usr/bin/env python3
"""
Demo script for AI-Powered Barcode Scanner
Tests the functionality without requiring a webcam.
"""

import os
import sys
from barcode_scanner import BarcodeScanner

def demo_with_sample_barcodes():
    """Demo the scanner with sample barcodes."""
    print("🧪 AI-Powered Barcode Scanner Demo")
    print("=" * 40)
    
    # Get API key
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("⚠️  GEMINI_API_KEY environment variable not found.")
        api_key = input("Please enter your Google Gemini API key: ").strip()
        
        if not api_key:
            print("❌ No API key provided. Exiting...")
            sys.exit(1)
    
    # Initialize scanner
    try:
        scanner = BarcodeScanner(api_key)
    except Exception as e:
        print(f"❌ Failed to initialize scanner: {e}")
        sys.exit(1)
    
    # Sample barcodes for testing
    sample_barcodes = [
        "0123456789012",  # Common UPC format
        "123456789012",   # Another UPC format
        "9780143007234",  # ISBN format
    ]
    
    print("\n🔍 Testing with sample barcodes...")
    print("Note: These are sample barcodes. Real barcodes will provide better results.\n")
    
    for i, barcode in enumerate(sample_barcodes, 1):
        print(f"\n--- Test {i}: Barcode {barcode} ---")
        
        try:
            # Get product information
            product_info = scanner.get_product_info(barcode)
            
            # Display results
            scanner.display_product_info(product_info)
            
        except Exception as e:
            print(f"❌ Error processing barcode {barcode}: {e}")
        
        # Ask to continue
        if i < len(sample_barcodes):
            input("\nPress Enter to test next barcode...")
    
    print("\n🎉 Demo completed!")
    print("\nTo use the full scanner with webcam:")
    print("  python barcode_scanner.py")

if __name__ == "__main__":
    demo_with_sample_barcodes()
