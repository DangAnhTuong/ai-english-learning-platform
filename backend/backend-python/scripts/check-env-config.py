#!/usr/bin/env python3
"""
Script kiểm tra cấu hình environment variables cho Python backend
Chạy: python scripts/check-env-config.py
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load .env từ thư mục hiện tại hoặc parent
env_paths = [
    Path(__file__).parent.parent / '.env',  # backend-python/.env
    Path(__file__).parent / '.env',         # app/.env
    Path.cwd() / '.env',                    # Current working directory
]

env_loaded = False
for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path)
        print(f"✅ Loaded .env from: {env_path}")
        env_loaded = True
        break

if not env_loaded:
    print("⚠️  No .env file found!")
    print("💡 Please create .env file from env.example:")
    print("   cp env.example .env")

required_vars = {
    'OPENAI_API_KEY': os.getenv('OPENAI_API_KEY'),
    'HOST': os.getenv('HOST', '0.0.0.0'),
    'PORT': os.getenv('PORT', '8000'),
}

optional_vars = {
    'DEEPGRAM_API_KEY': os.getenv('DEEPGRAM_API_KEY'),
    'CONVERSATION_AUDIO_PATH': os.getenv('CONVERSATION_AUDIO_PATH'),
    'AUDIO_STORAGE_PATH': os.getenv('AUDIO_STORAGE_PATH'),
    'ALLOWED_ORIGINS': os.getenv('ALLOWED_ORIGINS'),
    'DEBUG': os.getenv('DEBUG', 'false'),
}

print('\n' + '=' * 60)
print('🔍 Kiểm tra Environment Variables cho Python Backend')
print('=' * 60)

has_errors = False
has_warnings = False

# Check required variables
print('\n📋 Required Variables:')
for key, value in required_vars.items():
    if not value or value == '':
        print(f'  ❌ {key}: MISSING')
        has_errors = True
    elif key == 'OPENAI_API_KEY':
        # Mask API key
        masked = value[:7] + '...' + value[-4:] if len(value) > 11 else '***'
        print(f'  ✅ {key}: {masked}')
    else:
        print(f'  ✅ {key}: {value}')

# Check optional variables
print('\n📋 Optional Variables:')
for key, value in optional_vars.items():
    if not value or value == '':
        print(f'  ⚠️  {key}: NOT SET (optional)')
        has_warnings = True
    else:
        if key == 'DEEPGRAM_API_KEY':
            masked = value[:7] + '...' + value[-4:] if len(value) > 11 else '***'
            print(f'  ✅ {key}: {masked}')
        else:
            print(f'  ✅ {key}: {value}')

# Check OpenAI API key format
openai_key = os.getenv('OPENAI_API_KEY', '')
if openai_key:
    if not openai_key.startswith('sk-'):
        print('\n⚠️  WARNING: OPENAI_API_KEY không đúng format (nên bắt đầu với "sk-")')
        has_warnings = True

# Check Deepgram API key format
deepgram_key = os.getenv('DEEPGRAM_API_KEY', '')
if deepgram_key:
    if len(deepgram_key) < 20:
        print('\n⚠️  WARNING: DEEPGRAM_API_KEY có vẻ không đúng format')
        has_warnings = True

print('\n' + '=' * 60)

if has_errors:
    print('\n❌ Có lỗi: Một số biến bắt buộc chưa được cấu hình!')
    print('💡 Vui lòng kiểm tra file .env trong thư mục backend-python/')
    sys.exit(1)
elif has_warnings:
    print('\n⚠️  Cảnh báo: Một số biến tùy chọn chưa được cấu hình')
    print('💡 Hệ thống vẫn có thể hoạt động nhưng một số tính năng có thể bị hạn chế')
    sys.exit(0)
else:
    print('\n✅ Tất cả các biến môi trường đã được cấu hình đúng!')
    sys.exit(0)
