const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const API_BASE_URL = 'http://localhost:3001/api/v1';

async function test() {
    // Login
    const login = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'student@example.com',
        password: 'student123456'
    });
    const token = login.data.accessToken;
    
    // Test order
    const orderData = {
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
        const res = await axios.post(`${API_BASE_URL}/orders`, orderData, {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true
        });
        
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) {
            console.error('Response:', JSON.stringify(e.response.data, null, 2));
        }
    }
}

test();
