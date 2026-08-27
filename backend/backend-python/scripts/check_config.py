#!/usr/bin/env python3
"""
Configuration checker for English Learning AI API
Usage: python check_config.py
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

def check_env_file():
    """Check if .env file exists and load it"""
    env_paths = [
        Path(__file__).parent / '.env',
        Path.cwd() / '.env',
    ]
    
    for env_path in env_paths:
        if env_path.exists():
            print(f"✅ Found .env file: {env_path}")
            load_dotenv(env_path)
            return True
    
    print("❌ No .env file found!")
    print("💡 Please create .env file from env.example:")
    print("   cp env.example .env")
    return False

def check_api_keys():
    """Check if API keys are configured"""
    print("\n🔑 Checking API Keys...")
    
    # Check OpenAI API Key
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key and openai_key != "your_openai_api_key_here":
        print("✅ OPENAI_API_KEY: Configured")
    else:
        print("❌ OPENAI_API_KEY: Not configured or using placeholder")
        print("   Get your key from: https://platform.openai.com/api-keys")
    
    # Check Deepgram API Key
    deepgram_key = os.getenv("DEEPGRAM_API_KEY")
    if deepgram_key and deepgram_key != "your_deepgram_api_key_here":
        print("✅ DEEPGRAM_API_KEY: Configured")
    else:
        print("❌ DEEPGRAM_API_KEY: Not configured or using placeholder")
        print("   Get your key from: https://console.deepgram.com/")
    
    return bool(openai_key and openai_key != "your_openai_api_key_here" and 
                deepgram_key and deepgram_key != "your_deepgram_api_key_here")

def check_server_config():
    """Check server configuration"""
    print("\n🌐 Checking Server Configuration...")
    
    host = os.getenv("HOST", "0.0.0.0")
    port = os.getenv("PORT", "8000")
    debug = os.getenv("DEBUG", "false")
    
    print(f"✅ HOST: {host}")
    print(f"✅ PORT: {port}")
    print(f"✅ DEBUG: {debug}")
    
    return True

def check_cors_config():
    """Check CORS configuration"""
    print("\n🔒 Checking CORS Configuration...")
    
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
    origins = [origin.strip() for origin in allowed_origins.split(",")]
    
    print(f"✅ ALLOWED_ORIGINS: {len(origins)} origins configured")
    for origin in origins:
        print(f"   - {origin}")
    
    return True

def main():
    print("🔍 English Learning AI API - Configuration Checker")
    print("=" * 50)
    
    # Check .env file
    if not check_env_file():
        sys.exit(1)
    
    # Check API keys
    api_keys_ok = check_api_keys()
    
    # Check server config
    check_server_config()
    
    # Check CORS config
    check_cors_config()
    
    print("\n" + "=" * 50)
    
    if api_keys_ok:
        print("🎉 All configurations look good!")
        print("💡 You can now start the backend:")
        print("   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    else:
        print("⚠️  Some API keys are missing!")
        print("💡 Please configure your API keys in the .env file")
        print("📖 See env.setup.md for detailed instructions")
        sys.exit(1)

if __name__ == "__main__":
    main() 