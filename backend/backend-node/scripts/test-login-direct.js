/**
 * Test login trực tiếp với delay để tránh rate limit
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testLogin() {
    try {
        console.log('🧪 Testing Login API (with delays)...\n');
        console.log(`📍 API URL: ${API_URL}/auth/login\n`);

        // Wait a bit để reset rate limit
        console.log('⏳ Waiting 2 seconds to avoid rate limit...\n');
        await sleep(2000);

        // Test 1: Login với email và password hợp lệ
        console.log('Test 1: Login với email và password hợp lệ');
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email: 'admin@example.com',
                password: 'admin123456'
            }, {
                validateStatus: () => true // Don't throw on any status
            });
            
            if (response.status === 200) {
                console.log('✅ SUCCESS:', {
                    status: response.status,
                    hasUser: !!response.data.user,
                    hasAccessToken: !!response.data.accessToken,
                    hasRefreshToken: !!response.data.refreshToken,
                    userEmail: response.data.user?.email,
                    userRoles: response.data.user?.roles
                });
            } else {
                console.log('❌ FAILED:', {
                    status: response.status,
                    error: response.data
                });
            }
        } catch (error) {
            console.log('❌ ERROR:', {
                status: error.response?.status,
                error: error.response?.data || error.message
            });
        }

        await sleep(1000);

        // Test 2: Validation - email không hợp lệ
        console.log('\nTest 2: Validation - email không hợp lệ');
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email: 'not-an-email',
                password: '123456'
            }, {
                validateStatus: () => true
            });
            
            if (response.status === 422) {
                console.log('✅ CORRECT: 422 Validation Error');
                console.log('   Errors:', response.data.errors);
            } else {
                console.log('❌ WRONG STATUS:', response.status);
                console.log('   Response:', response.data);
            }
        } catch (error) {
            console.log('❌ ERROR:', error.message);
        }

        await sleep(1000);

        // Test 3: Validation - thiếu email
        console.log('\nTest 3: Validation - thiếu email');
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                password: '123456'
            }, {
                validateStatus: () => true
            });
            
            if (response.status === 422) {
                console.log('✅ CORRECT: 422 Validation Error');
                console.log('   Errors:', response.data.errors);
            } else {
                console.log('❌ WRONG STATUS:', response.status);
                console.log('   Response:', response.data);
            }
        } catch (error) {
            console.log('❌ ERROR:', error.message);
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
