#!/usr/bin/env python3
"""
Find all barcodes on a product to help identify the correct one
"""

import cv2
import sqlite3
from pyzbar import pyzbar
from barcode_scanner import BarcodeScanner

def find_all_barcodes():
    """Find all barcodes visible to the camera."""
    print("🔍 Multi-Barcode Detection Tool")
    print("=" * 40)
    print("📷 This will detect ALL barcodes visible to the camera")
    print("🎯 Point your Vaseline product at the camera")
    print("⌨️  Press SPACE to capture, ESC to exit")
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Could not open camera")
        return
    
    detected_barcodes = set()
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Decode all barcodes
        barcodes = pyzbar.decode(frame)
        
        # Draw rectangles around detected barcodes
        for barcode in barcodes:
            (x, y, w, h) = barcode.rect
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            
            # Extract barcode data
            barcode_data = barcode.data.decode('utf-8')
            barcode_type = barcode.type
            
            # Add to detected set
            detected_barcodes.add((barcode_data, barcode_type))
            
            # Draw text
            text = f"{barcode_data} ({barcode_type})"
            cv2.putText(frame, text, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        # Show frame
        cv2.imshow('Multi-Barcode Detector - SPACE to capture, ESC to exit', frame)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord(' '):  # Space to capture
            if detected_barcodes:
                print(f"\n📊 Found {len(detected_barcodes)} unique barcodes:")
                for i, (barcode_data, barcode_type) in enumerate(detected_barcodes, 1):
                    print(f"{i}. {barcode_data} (Type: {barcode_type})")
                
                # Test each barcode
                api_key = "AIzaSyCCFrqS-5WoAvRoTmQb_qPDEsqlwSKZdm0"
                scanner = BarcodeScanner(api_key)
                
                for i, (barcode_data, barcode_type) in enumerate(detected_barcodes, 1):
                    print(f"\n🔍 Testing barcode {i}: {barcode_data}")
                    result = scanner.get_product_info(barcode_data)
                    print(f"   Company: {result['company']}")
                    print(f"   Product: {result['product_name']}")
                    
                    # Check if it's Vaseline
                    if 'vaseline' in result['product_name'].lower() or 'vaseline' in result['company'].lower():
                        print("   🎯 FOUND VASELINE PRODUCT!")
                
                print("\nPress any key to continue scanning...")
                cv2.waitKey(0)
            else:
                print("❌ No barcodes detected. Try better lighting or positioning.")
        
        elif key == 27:  # ESC to exit
            break
    
    cap.release()
    cv2.destroyAllWindows()
    
    if detected_barcodes:
        print(f"\n📋 Summary of all detected barcodes:")
        for i, (barcode_data, barcode_type) in enumerate(detected_barcodes, 1):
            print(f"{i}. {barcode_data} (Type: {barcode_type})")

if __name__ == "__main__":
    find_all_barcodes()
