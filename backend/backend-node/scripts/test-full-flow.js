/**
 * Test toàn bộ flow login từ đầu đến cuối
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1';

async function testFullFlow() {
    console.log('🧪 Testing Full Login Flow\n');
    console.log('⚠️  QUAN TRỌNG: Backend phải đang chạy và đã restart sau khi sửa code!\n');

    // Test 1: Validation - email không hợp lệ
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 1: Validation - Email không hợp lệ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'not-an-email',
            password: '123456'
        }, { validateStatus: () => true });
        
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(res.data, null, 2));
        
        if (res.status === 422) {
            console.log('✅ PASS: Validation hoạt động đúng (422)');
        } else {
            console.log('❌ FAIL: Expected 422, got', res.status);
        }
    } catch (err) {
        console.log('❌ ERROR:', err.message);
    }

    await new Promise(r => setTimeout(r, 500));

    // Test 2: Validation - thiếu email
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 2: Validation - Thiếu email');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            password: '123456'
        }, { validateStatus: () => true });
        
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(res.data, null, 2));
        
        if (res.status === 422) {
            console.log('✅ PASS: Validation hoạt động đúng (422)');
        } else {
            console.log('❌ FAIL: Expected 422, got', res.status);
        }
    } catch (err) {
        console.log('❌ ERROR:', err.message);
    }

    await new Promise(r => setTimeout(r, 500));

    // Test 3: Login thành công
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 3: Login thành công');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@example.com',
            password: 'admin123456'
        }, { validateStatus: () => true });
        
        console.log('Status:', res.status);
        
        if (res.status === 200) {
            console.log('✅ PASS: Login thành công!');
            console.log('   User:', res.data.user?.email);
            console.log('   Roles:', res.data.user?.roles);
            console.log('   Has AccessToken:', !!res.data.accessToken);
            console.log('   Has RefreshToken:', !!res.data.refreshToken);
        } else if (res.status === 401) {
            console.log('❌ FAIL: 401 Unauthorized');
            console.log('   Error:', res.data.error);
            console.log('   Code:', res.data.code);
        } else if (res.status === 429) {
            console.log('❌ FAIL: 429 Rate Limited');
            console.log('   ⚠️  Backend cần restart để áp dụng thay đổi!');
        } else {
            console.log('❌ FAIL: Unexpected status', res.status);
            console.log('   Response:', JSON.stringify(res.data, null, 2));
        }
    } catch (err) {
        if (err.code === 'ECONNREFUSED') {
            console.log('❌ ERROR: Backend không chạy!');
            console.log('   Hãy start backend: cd backend/backend-node && npm start');
        } else {
            console.log('❌ ERROR:', err.message);
        }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Test completed!\n');
}

testFullFlow();
