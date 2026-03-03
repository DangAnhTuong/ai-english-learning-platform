/**
 * Script kiểm tra cấu hình environment variables
 * Chạy: node scripts/check-env-config.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const requiredVars = {
    // Server
    PORT: process.env.PORT || '1444',
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // Database
    MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI,
    
    // JWT
    JWT_SECRET: process.env.JWT_SECRET,
    REFRESH_SECRET: process.env.REFRESH_SECRET,
    
    // Security
    PWD_PEPPER: process.env.PWD_PEPPER,
    SESSION_SECRET: process.env.SESSION_SECRET,
    
    // Audio Generation (TTS)
    PYTHON_API_URL: process.env.PYTHON_API_URL || 'http://localhost:8000',
    
    // Conversation Config
    CONVERSATION_MIN_LINES: process.env.CONVERSATION_MIN_LINES || '2',
    CONVERSATION_MAX_LINES: process.env.CONVERSATION_MAX_LINES || '10',
    CONVERSATION_MIN_PARTICIPANTS: process.env.CONVERSATION_MIN_PARTICIPANTS || '2',
    CONVERSATION_MAX_PARTICIPANTS: process.env.CONVERSATION_MAX_PARTICIPANTS || '5'
};

const optionalVars = {
    FRONTEND_URL: process.env.FRONTEND_URL,
    CORS_ALLOWLIST: process.env.CORS_ALLOWLIST,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_USER: process.env.SMTP_USER,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
};

console.log('\n🔍 Kiểm tra Environment Variables\n');
console.log('='.repeat(60));

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log('\n📋 Required Variables:');
Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value || value === '') {
        console.log(`  ❌ ${key}: MISSING`);
        hasErrors = true;
    } else if (key.includes('SECRET') || key.includes('PEPPER')) {
        // Mask sensitive values
        const masked = value.length > 10 ? value.substring(0, 4) + '...' + value.substring(value.length - 4) : '***';
        console.log(`  ✅ ${key}: ${masked}`);
    } else {
        console.log(`  ✅ ${key}: ${value}`);
    }
});

// Check optional variables
console.log('\n📋 Optional Variables:');
Object.entries(optionalVars).forEach(([key, value]) => {
    if (!value || value === '') {
        console.log(`  ⚠️  ${key}: NOT SET (optional)`);
        hasWarnings = true;
    } else {
        console.log(`  ✅ ${key}: ${value}`);
    }
});

// Check Python API connection
console.log('\n🔗 Python API Connection:');
const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
console.log(`  URL: ${pythonApiUrl}`);

// Note about Python backend env vars
console.log('\n📝 Lưu ý về Python Backend:');
console.log('  Các API keys sau cần được cấu hình trong backend-python/.env:');
console.log('  - OPENAI_API_KEY (required cho TTS)');
console.log('  - DEEPGRAM_API_KEY (optional, cho Deepgram TTS)');
console.log('  - CONVERSATION_AUDIO_PATH (optional, default: ./conversation_audio)');

console.log('\n' + '='.repeat(60));

if (hasErrors) {
    console.log('\n❌ Có lỗi: Một số biến bắt buộc chưa được cấu hình!');
    console.log('💡 Vui lòng kiểm tra file .env trong thư mục backend-node/');
    process.exit(1);
} else if (hasWarnings) {
    console.log('\n⚠️  Cảnh báo: Một số biến tùy chọn chưa được cấu hình');
    console.log('💡 Hệ thống vẫn có thể hoạt động nhưng một số tính năng có thể bị hạn chế');
    process.exit(0);
} else {
    console.log('\n✅ Tất cả các biến môi trường đã được cấu hình đúng!');
    process.exit(0);
}
