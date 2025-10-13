#!/usr/bin/env python3
"""
Environment Setup Script for Robridge AI Integration
Creates .env file with your configuration
"""

import os
import sys

def create_env_file():
    """Create .env file with current configuration"""
    print("🔧 Setting up environment configuration...")
    
    # Get current configuration from server.py
    try:
        with open('server.py', 'r') as f:
            content = f.read()
        
        # Extract current API key
        if 'OPENAI_API_KEY = os.getenv("OPENAI_API_KEY"' in content:
            print("✅ Server.py is configured to use environment variables")
        else:
            print("⚠️  Server.py may still have hardcoded API key")
    except Exception as e:
        print(f"❌ Error reading server.py: {e}")
    
    # Create .env content
    env_content = """# Robridge AI Integration Environment Variables
# Update these values with your actual configuration

# OpenAI Configuration
OPENAI_API_KEY=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

# Server Configuration
AI_SERVER_PORT=5000
WEB_SERVER_PORT=3001

# ESP32 Configuration (update these in your Arduino code)
ESP32_SERVER_IP=10.68.154.150
ESP32_WIFI_SSID=Barista
ESP32_WIFI_PASSWORD=q7rfdrg4
"""
    
    try:
        # Create .env file
        with open('.env', 'w') as f:
            f.write(env_content)
        print("✅ .env file created successfully")
        print("📝 Current configuration:")
        print("   - OpenAI API Key: Set (from server.py)")
        print("   - AI Server Port: 5000")
        print("   - Web Server Port: 3001")
        print("   - ESP32 Server IP: 10.68.154.150")
        print("   - WiFi SSID: Barista")
        return True
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")
        return False

def update_server_py_for_env():
    """Update server.py to properly load environment variables"""
    print("🔧 Updating server.py for environment variables...")
    
    try:
        with open('server.py', 'r') as f:
            content = f.read()
        
        # Check if already updated
        if 'os.getenv("OPENAI_API_KEY"' in content:
            print("✅ server.py already configured for environment variables")
            return True
        
        # Update the API key line
        updated_content = content.replace(
            'OPENAI_API_KEY = "sk-proj-',
            'OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "sk-proj-'
        )
        
        # Add closing quote and default
        updated_content = updated_content.replace(
            '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"',
            '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")'
        )
        
        # Add os import if not present
        if "import os" not in updated_content:
            updated_content = updated_content.replace(
                "import re",
                "import re\nimport os"
            )
        
        with open('server.py', 'w') as f:
            f.write(updated_content)
        
        print("✅ server.py updated for environment variables")
        return True
        
    except Exception as e:
        print(f"❌ Failed to update server.py: {e}")
        return False

def get_your_ip():
    """Get your current IP address"""
    print("🔍 Getting your current IP address...")
    
    try:
        import socket
        # Connect to a remote server to get local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        print(f"✅ Your current IP address: {ip}")
        return ip
    except Exception as e:
        print(f"❌ Could not determine IP address: {e}")
        print("   Please manually update the ESP32 code with your laptop's IP")
        return None

def main():
    """Main setup function"""
    print("🚀 Robridge AI Integration - Environment Setup")
    print("="*60)
    
    # Get your IP
    your_ip = get_your_ip()
    
    # Create .env file
    success = create_env_file()
    
    if success:
        print("\n✅ Environment setup complete!")
        print("\n📋 Next steps:")
        print("1. ✅ .env file created with current configuration")
        print("2. 🔧 Update ESP32 code with your IP address:")
        if your_ip:
            print(f"   - Change serverIP to: {your_ip}")
        else:
            print("   - Find your laptop's IP address and update serverIP")
        print("3. 🚀 Run: python start_ai_system.py")
        print("4. 📱 Upload updated ESP32 code to your device")
    else:
        print("\n❌ Environment setup failed!")
        print("Please check the errors above and try again.")

if __name__ == "__main__":
    main()

