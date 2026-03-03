/**
 * Test validation chi tiết
 */

const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const API_BASE_URL = 'http://localhost:3001/api/v1';

async function test() {
    console.log('=== TEST VALIDATION DETAILED ===\n');
    
    // 1. Login
    console.log('1. Logging in...');
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'student@example.com',
        password: 'student123456'
    });
    const token = loginRes.data.accessToken;
    console.log('✅ Login OK\n');
    
    // 2. Test với data đầy đủ
    console.log('2. Testing with full valid data...');
    const validData = {
        package: {
            name: 'Gói 1 Tháng',
            duration: 30,
            plan: 'basic'
        },
        amount: 199000,
        currency: 'VND',
        paymentMethod: 'bank_transfer',
        transferContent: 'HOCPHI GOI1THANG',
        bankInfo: {
            bankName: 'MB Bank',
            accountNo: '1234567890',
            accountName: 'Test Account'
        },
        discount: 0
    };
    
    try {
        const res = await axios.post(`${API_BASE_URL}/orders`, validData, {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true
        });
        
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(res.data, null, 2));
        
        if (res.status === 201 || res.status === 200) {
            console.log('\n✅ Order created successfully!');
            console.log('Order ID:', res.data.data?.order?._id || res.data.data?.order?.id);
        } else if (res.status === 422) {
            console.log('\n❌ Validation failed');
            if (res.data.errors && Array.isArray(res.data.errors)) {
                console.log('Validation errors:');
                res.data.errors.forEach(err => {
                    console.log(`  - ${err.field}: ${err.message}`);
                });
            } else {
                console.log('No errors array in response!');
                console.log('Full response:', JSON.stringify(res.data, null, 2));
            }
        } else if (res.status === 403) {
            console.log('\n❌ Permission denied');
            console.log('Response:', JSON.stringify(res.data, null, 2));
        } else {
            console.log('\n❌ Unexpected status:', res.status);
            console.log('Response:', JSON.stringify(res.data, null, 2));
        }
    } catch (error) {
        console.error('\n❌ Request failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
    
    // 3. Test với data thiếu
    console.log('\n\n3. Testing with missing required field...');
    const invalidData = {
        package: {
            name: 'Gói 1 Tháng',
            // duration missing
            plan: 'basic'
        },
        amount: 199000
    };
    
    try {
        const res = await axios.post(`${API_BASE_URL}/orders`, invalidData, {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true
        });
        
        console.log('Status:', res.status);
        if (res.status === 422) {
            if (res.data.errors && Array.isArray(res.data.errors)) {
                console.log('✅ Validation errors returned correctly:');
                res.data.errors.forEach(err => {
                    console.log(`  - ${err.field}: ${err.message}`);
                });
            } else {
                console.log('❌ No errors array in response!');
                console.log('Response:', JSON.stringify(res.data, null, 2));
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

test();
