#!/usr/bin/env python3
"""
Setup script for AI-Powered Barcode Scanner
"""

import subprocess
import sys
import os

def install_requirements():
    """Install required packages."""
    print("📦 Installing required packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ All packages installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install packages: {e}")
        return False

def check_camera():
    """Check if camera is available."""
    print("📷 Checking camera availability...")
    try:
        import cv2
        cap = cv2.VideoCapture(0)
        if cap.isOpened():
            print("✅ Camera is available!")
            cap.release()
            return True
        else:
            print("⚠️  Camera could not be opened. Please check camera permissions.")
            return False
    except ImportError:
        print("⚠️  OpenCV not installed. Run the setup first.")
        return False

def setup_api_key():
    """Help user set up API key."""
    print("\n🔑 Setting up Google Gemini API Key...")
    print("1. Visit: https://makersuite.google.com/app/apikey")
    print("2. Create a new API key")
    print("3. Copy the API key")
    
    api_key = input("\nEnter your Gemini API key (or press Enter to skip): ").strip()
    
    if api_key:
        # Create .env file
        with open('.env', 'w') as f:
            f.write(f"GEMINI_API_KEY={api_key}\n")
        print("✅ API key saved to .env file")
        return True
    else:
        print("⚠️  Skipped API key setup. You'll be prompted when running the app.")
        return False

def main():
    """Main setup function."""
    print("🚀 AI-Powered Barcode Scanner Setup")
    print("=" * 40)
    
    # Install requirements
    if not install_requirements():
        sys.exit(1)
    
    # Check camera
    check_camera()
    
    # Setup API key
    setup_api_key()
    
    print("\n🎉 Setup complete!")
    print("\nTo run the application:")
    print("  python barcode_scanner.py")
    print("\nFor help, see README.md")

if __name__ == "__main__":
    main()
