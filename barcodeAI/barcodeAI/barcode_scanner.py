#!/usr/bin/env python3
"""
Pure AI-Powered Barcode Scanner Application

This application scans barcodes using a webcam and provides detailed product information
using Google's Gemini AI API for real-time analysis.

Features:
- Real-time barcode scanning using webcam
- Pure AI analysis with Google's Gemini AI
- No database caching - fresh AI analysis every time
- Structured JSON responses
- Clean error handling

Author: AI Assistant
Date: 2024
"""

import cv2
import sqlite3
import json
import google.generativeai as genai
from pyzbar import pyzbar
import os
import sys
from typing import Dict, Optional, Tuple
import time


class BarcodeScanner:
    """Main class for the pure AI-powered barcode scanner application."""
    
    def __init__(self, api_key: str, db_path: str = "products.db"):
        """
        Initialize the barcode scanner.
        
        Args:
            api_key (str): Google Gemini API key
            db_path (str): Path to SQLite database file
        """
        self.api_key = api_key
        self.db_path = db_path
        self.cap = None
        
        # Initialize Gemini AI
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Pure AI system - no database needed
        print("🧠 Pure AI-Powered Barcode Scanner initialized")
    
    def _init_database(self) -> None:
        """Initialize SQLite database and create products table if it doesn't exist."""
        try:
            conn = sqlite3.connect(self.db_path)
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
            
            conn.commit()
            conn.close()
            print(f"✅ Database initialized successfully at {self.db_path}")
            
        except sqlite3.Error as e:
            print(f"❌ Database initialization error: {e}")
            sys.exit(1)
    
    def scan_barcode(self) -> Optional[str]:
        """
        Capture barcode from webcam using OpenCV and pyzbar.
        
        Returns:
            Optional[str]: Barcode number if found, None otherwise
        """
        try:
            # Initialize webcam
            self.cap = cv2.VideoCapture(0)
            
            if not self.cap.isOpened():
                print("❌ Error: Could not open webcam")
                return None
            
            print("📷 Camera opened. Point barcode at camera and press 'q' to quit...")
            
            while True:
                # Capture frame
                ret, frame = self.cap.read()
                if not ret:
                    print("❌ Error: Could not read from camera")
                    break
                
                # Display frame
                cv2.imshow('Barcode Scanner - Press Q to quit', frame)
                
                # Decode barcodes
                barcodes = pyzbar.decode(frame)
                
                for barcode in barcodes:
                    # Extract barcode data
                    barcode_data = barcode.data.decode('utf-8')
                    barcode_type = barcode.type
                    
                    print(f"📊 Barcode detected: {barcode_data} (Type: {barcode_type})")
                    print(f"🔍 Raw barcode data: {repr(barcode.data)}")
                    
                    # Clean up
                    self.cap.release()
                    cv2.destroyAllWindows()
                    return barcode_data
                
                # Check for quit key
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    print("👋 Exiting scanner...")
                    break
            
            # Clean up
            self.cap.release()
            cv2.destroyAllWindows()
            return None
            
        except Exception as e:
            print(f"❌ Barcode scanning error: {e}")
            if self.cap:
                self.cap.release()
            cv2.destroyAllWindows()
            return None
    
    def fetch_from_db(self, barcode: str) -> Optional[Dict[str, str]]:
        """
        Fetch product details from SQLite database.
        
        Args:
            barcode (str): Barcode number to search for
            
        Returns:
            Optional[Dict[str, str]]: Product details if found, None otherwise
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT company, product_name, product_type, benefits 
                FROM products WHERE barcode = ?
            ''', (barcode,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                return {
                    'company': result[0],
                    'product_name': result[1],
                    'product_type': result[2],
                    'benefits': result[3]
                }
            return None
            
        except sqlite3.Error as e:
            print(f"❌ Database fetch error: {e}")
            return None
    
    def query_gemini(self, barcode: str) -> Dict[str, str]:
        """
        Query Gemini API for product information using barcode.
        
        Args:
            barcode (str): Barcode number to query
            
        Returns:
            Dict[str, str]: Product details from Gemini AI
        """
        try:
            prompt = f"""
            You are a barcode scanner that provides helpful product information. Analyze barcode {barcode} and give useful details.
            
            ANALYSIS APPROACH:
            1. Try to identify the specific product if possible
            2. If you don't know the exact product, provide the most likely product based on barcode patterns
            3. Use your knowledge of common products and manufacturers
            4. Provide helpful information rather than just saying "not found"
            5. Be informative but don't make up completely false information
            
            BARCODE PATTERN ANALYSIS:
            - 8901030xxx = Unilever India (Vaseline, Dove, Lux, Ponds, etc.)
            - 8901063xxx = ITC Limited (Sunfeast, Bingo, Classmate, etc.)
            - 8902080xxx = Hindustan Unilever (personal care, food, household)
            - 3574669909136 = European product (357 prefix)
            - 044000037019 = Oreo cookies (Nabisco)
            - 7622201428501 = Kraft/Heinz products (ketchup, mac & cheese, etc.)
            - 7682807488507 = Nature's Promise products (organic foods)
            
            For barcode {barcode}:
            - Identify the most likely product based on manufacturer and barcode pattern
            - Provide specific product information when possible
            - Give helpful benefits and uses
            - Be informative and useful
            
            Return ONLY a JSON response:
            {{
                "company": "Manufacturer name",
                "product_name": "Most likely product name", 
                "product_type": "Product category",
                "benefits": "Detailed benefits and uses of this product"
            }}
            
            Provide helpful, informative responses. Be useful rather than just saying "not found".
            """
            
            response = self.model.generate_content(prompt)
            
            # Extract JSON from response
            response_text = response.text.strip()
            
            # Clean the response text (remove markdown code blocks if present)
            cleaned_text = response_text.strip()
            if cleaned_text.startswith('```json'):
                cleaned_text = cleaned_text[7:]  # Remove ```json
            if cleaned_text.startswith('```'):
                cleaned_text = cleaned_text[3:]   # Remove ```
            if cleaned_text.endswith('```'):
                cleaned_text = cleaned_text[:-3]  # Remove trailing ```
            cleaned_text = cleaned_text.strip()
            
            # Try to parse as JSON
            try:
                product_info = json.loads(cleaned_text)
                
                # Ensure all required fields are present
                required_fields = ['company', 'product_name', 'product_type', 'benefits']
                for field in required_fields:
                    if field not in product_info:
                        product_info[field] = "Unknown"
                
                return product_info
                
            except json.JSONDecodeError:
                print(f"⚠️  Gemini returned non-JSON response: {response_text}")
                # Fallback: try to extract JSON from response
                import re
                json_match = re.search(r'\{.*\}', cleaned_text, re.DOTALL)
                if json_match:
                    try:
                        product_info = json.loads(json_match.group())
                        required_fields = ['company', 'product_name', 'product_type', 'benefits']
                        for field in required_fields:
                            if field not in product_info:
                                product_info[field] = "Unknown"
                        return product_info
                    except json.JSONDecodeError:
                        pass
                
                # If all parsing fails, return informative unknown values
                return {
                    'company': 'Unknown Manufacturer',
                    'product_name': 'Product Not Found in Database',
                    'product_type': 'Unknown Product Type',
                    'benefits': 'Product information not available'
                }
                
        except Exception as e:
            print(f"❌ Gemini API error: {e}")
            return {
                'company': 'API Error - Unable to Query',
                'product_name': 'Product Information Unavailable',
                'product_type': 'Cannot Determine Product Type',
                'benefits': 'Unable to retrieve product benefits due to API error'
            }
    
    def save_to_db(self, barcode: str, company: str, product_name: str, 
                   product_type: str, benefits: str) -> bool:
        """
        Save product details to SQLite database.
        
        Args:
            barcode (str): Barcode number
            company (str): Company name
            product_name (str): Product name
            product_type (str): Product type/category
            benefits (str): Product benefits
            
        Returns:
            bool: True if saved successfully, False otherwise
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO products 
                (barcode, company, product_name, product_type, benefits)
                VALUES (?, ?, ?, ?, ?)
            ''', (barcode, company, product_name, product_type, benefits))
            
            conn.commit()
            conn.close()
            print(f"💾 Product saved to database: {product_name}")
            return True
            
        except sqlite3.Error as e:
            print(f"❌ Database save error: {e}")
            return False
    
    def get_product_info(self, barcode: str) -> Dict[str, str]:
        """
        Get product information for a given barcode.
        Pure AI analysis - no database usage.
        
        Args:
            barcode (str): Barcode number
            
        Returns:
            Dict[str, str]: Product information from AI
        """
        print(f"\n🔍 Analyzing barcode: {barcode}")
        
        # Pure AI analysis - no database involvement
        print("🤖 AI-Powered Analysis...")
        gemini_result = self.query_gemini(barcode)
        
        # No database saving - pure AI system
        print("✨ Pure AI response - no database storage")
        
        return gemini_result
    
    def display_product_info(self, product_info: Dict[str, str]) -> None:
        """
        Display product information in a formatted way.
        
        Args:
            product_info (Dict[str, str]): Product information to display
        """
        print("\n" + "="*50)
        print("📦 PRODUCT INFORMATION")
        print("="*50)
        print(f"🏢 Company: {product_info['company']}")
        print(f"📝 Product: {product_info['product_name']}")
        print(f"🏷️  Type: {product_info['product_type']}")
        print(f"✨ Benefits: {product_info['benefits']}")
        print("="*50)
    
    def main(self) -> None:
        """Main application loop."""
        print("🚀 AI-Powered Barcode Scanner Starting...")
        print("=" * 50)
        
        while True:
            try:
                # Scan barcode
                barcode = self.scan_barcode()
                
                if barcode is None:
                    print("👋 No barcode detected or user quit. Exiting...")
                    break
                
                # Get product information
                product_info = self.get_product_info(barcode)
                
                # Display results
                self.display_product_info(product_info)
                
                # Ask if user wants to scan another
                print("\n🔄 Press Enter to scan another barcode, or type 'quit' to exit:")
                user_input = input().strip().lower()
                if user_input == 'quit':
                    break
                    
            except KeyboardInterrupt:
                print("\n👋 Application interrupted by user. Exiting...")
                break
            except Exception as e:
                print(f"❌ Unexpected error: {e}")
                continue
        
        print("👋 Thank you for using AI-Powered Barcode Scanner!")


def main():
    """Main entry point of the application."""
    print("🤖 AI-Powered Barcode Scanner")
    print("=" * 40)
    
    # Get API key
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("⚠️  GEMINI_API_KEY environment variable not found.")
        api_key = input("Please enter your Google Gemini API key: ").strip()
        
        if not api_key:
            print("❌ No API key provided. Exiting...")
            sys.exit(1)
    
    # Initialize and run scanner
    try:
        scanner = BarcodeScanner(api_key)
        scanner.main()
    except Exception as e:
        print(f"❌ Failed to initialize scanner: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
