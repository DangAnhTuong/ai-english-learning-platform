/**
 * Debug script để test order creation và xem lỗi chi tiết
 */

const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const API_BASE_URL = 'http://localhost:3001/api/v1';
const STUDENT_EMAIL = 'student@example.com';
const STUDENT_PASSWORD = 'student123456';

async function debugOrderCreation() {
    try {
        // 1. Login
        console.log('1. Logging in as student...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: STUDENT_EMAIL,
            password: STUDENT_PASSWORD
        });
        
        const token = loginResponse.data.accessToken;
        console.log('✅ Login successful');
        
        // 2. Test order creation
        console.log('\n2. Testing order creation...');
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
        
        console.log('Order data:', JSON.stringify(orderData, null, 2));
        
        try {
            const response = await axios.post(`${API_BASE_URL}/orders`, orderData, {
                headers: { Authorization: `Bearer ${token}` },
                validateStatus: () => true
            });
            
            console.log('\nResponse status:', response.status);
            console.log('Response data:', JSON.stringify(response.data, null, 2));
            
            if (response.status === 201 || response.status === 200) {
                console.log('\n✅ Order created successfully!');
                console.log('Order ID:', response.data.data?.order?._id || response.data.data?.order?.id);
            } else {
                console.log('\n❌ Order creation failed');
                if (response.data.errors) {
                    console.log('Validation errors:');
                    response.data.errors.forEach(err => {
                        console.log(`  - ${err.field}: ${err.message}`);
                    });
                }
            }
        } catch (error) {
            console.log('\n❌ Error:', error.message);
            if (error.response) {
                console.log('Status:', error.response.status);
                console.log('Data:', JSON.stringify(error.response.data, null, 2));
            }
        }
        
    } catch (error) {
        console.error('Fatal error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

debugOrderCreation();
