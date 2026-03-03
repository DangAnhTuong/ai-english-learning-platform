/**
 * Test script để kiểm tra login API
 * Chạy: node scripts/test-login.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';

async function testLogin() {
    try {
        console.log('🧪 Testing Login API...\n');
        console.log(`📍 API URL: ${API_URL}/auth/login\n`);

        // Test 1: Login với email và password hợp lệ
        console.log('Test 1: Login với email và password hợp lệ');
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email: 'admin@example.com',
                password: 'admin123456'
            });
            console.log('✅ SUCCESS:', {
                status: response.status,
                hasUser: !!response.data.user,
                hasAccessToken: !!response.data.accessToken,
                hasRefreshToken: !!response.data.refreshToken
            });
        } catch (error) {
            console.log('❌ FAILED:', {
                status: error.response?.status,
                error: error.response?.data || error.message
            });
        }

        console.log('\n---\n');

        // Test 2: Login với email không tồn tại
        console.log('Test 2: Login với email không tồn tại');
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email: 'nonexistent@example.com',
                password: 'password123'
            });
            console.log('❌ UNEXPECTED SUCCESS:', response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ CORRECT: 401 Unauthorized');
                console.log('   Error:', error.response.data);
            } else {
                console.log('❌ WRONG STATUS:', error.response?.status);
            }
        }

        console.log('\n---\n');

        // Test 3: Login với password sai
        console.log('Test 3: Login với password sai');
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email: 'admin@example.com',
                password: 'wrongpassword'
            });
            console.log('❌ UNEXPECTED SUCCESS:', response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ CORRECT: 401 Unauthorized');
                console.log('   Error:', error.response.data);
            } else {
                console.log('❌ WRONG STATUS:', error.response?.status);
            }
        }

        console.log('\n---\n');

        // Test 4: Login với email không hợp lệ (validation)
        console.log('Test 4: Login với email không hợp lệ');
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email: 'not-an-email',
                password: 'password123'
            });
            console.log('❌ UNEXPECTED SUCCESS:', response.data);
        } catch (error) {
            if (error.response?.status === 422) {
                console.log('✅ CORRECT: 422 Validation Error');
                console.log('   Errors:', error.response.data.errors);
            } else {
                console.log('❌ WRONG STATUS:', error.response?.status);
            }
        }

        console.log('\n---\n');

        // Test 5: Login thiếu email
        console.log('Test 5: Login thiếu email');
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                password: 'password123'
            });
            console.log('❌ UNEXPECTED SUCCESS:', response.data);
        } catch (error) {
            if (error.response?.status === 422) {
                console.log('✅ CORRECT: 422 Validation Error');
                console.log('   Errors:', error.response.data.errors);
            } else {
                console.log('❌ WRONG STATUS:', error.response?.status);
            }
        }

        console.log('\n✅ Test completed!\n');
    } catch (error) {
        console.error('❌ Test script error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('⚠️  Backend không chạy! Hãy start backend trước: npm start');
        }
        process.exit(1);
    }
}

testLogin();
