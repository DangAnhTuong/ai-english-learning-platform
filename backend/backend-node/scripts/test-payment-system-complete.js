/**
 * COMPREHENSIVE TEST SCRIPT - Payment & Order System
 * Test toàn bộ flow từ tạo order đến subscription
 * 
 * Chạy: node scripts/test-payment-system-complete.js
 * 
 * Yêu cầu:
 * - Backend đang chạy trên port 3001
 * - MongoDB đang chạy
 * - Có tài khoản admin và student trong database
 */

const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const API_BASE_URL = 'http://localhost:3001/api/v1';
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/englishdb_nodejs';

// Test credentials
const STUDENT_EMAIL = 'student@example.com';
const STUDENT_PASSWORD = 'student123456';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123456';

let studentToken = '';
let adminToken = '';
let studentId = '';
let adminId = '';
let createdOrderId = '';
let createdSubscriptionId = '';

// Test results
const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

// Colors
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const blue = '\x1b[34m';
const reset = '\x1b[0m';

function log(message, color = reset) {
    console.log(`${color}${message}${reset}`);
}

function logSuccess(msg) { log(`✅ ${msg}`, green); }
function logError(msg) { log(`❌ ${msg}`, red); }
function logInfo(msg) { log(`ℹ️  ${msg}`, blue); }
function logWarning(msg) { log(`⚠️  ${msg}`, yellow); }

async function test(name, testFn) {
    results.total++;
    try {
        logInfo(`\n📋 Testing: ${name}`);
        await testFn();
        logSuccess(`${name} - PASSED`);
        results.passed++;
        return true;
    } catch (error) {
        logError(`${name} - FAILED`);
        const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
        logError(`   Error: ${errorMsg}`);
        results.errors.push({ test: name, error: errorMsg });
        results.failed++;
        return false;
    }
}

// ==================== CONNECTION TESTS ====================

async function testMongoConnection() {
    await mongoose.connect(MONGODB_URI);
    logSuccess(`Connected to MongoDB: ${MONGODB_URI}`);
}

async function testBackendConnection() {
    try {
        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
            validateStatus: () => true // Accept any status
        });
        // Any response means backend is running
        logSuccess('Backend is running');
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            throw new Error('Backend is not running on port 3001');
        }
        // Other errors are OK (401 means backend is running)
        logSuccess('Backend is running');
    }
}

// ==================== AUTHENTICATION TESTS ====================

async function testStudentLogin() {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: STUDENT_EMAIL,
        password: STUDENT_PASSWORD
    });

    if (!response.data.user || !response.data.accessToken) {
        throw new Error('Login failed - missing user or token');
    }

    studentToken = response.data.accessToken;
    studentId = response.data.user._id || response.data.user.id;
    logInfo(`Student ID: ${studentId}`);
}

async function testAdminLogin() {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
    });

    if (!response.data.user || !response.data.accessToken) {
        throw new Error('Admin login failed');
    }

    adminToken = response.data.accessToken;
    adminId = response.data.user._id || response.data.user.id;
    
    if (!response.data.user.roles.includes('admin')) {
        throw new Error('User does not have admin role');
    }
    logInfo(`Admin ID: ${adminId}`);
}

// ==================== ORDER TESTS ====================

async function testCreateOrder() {
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
        const response = await axios.post(`${API_BASE_URL}/orders`, orderData, {
            headers: { Authorization: `Bearer ${studentToken}` },
            validateStatus: () => true
        });

        if (response.status !== 201 && response.status !== 200) {
            const errorMsg = response.data?.error || response.data?.message || JSON.stringify(response.data);
            throw new Error(`Create order failed: ${errorMsg}`);
        }

        if (!response.data.success || !response.data.data?.order) {
            throw new Error('Create order failed - invalid response');
        }

        createdOrderId = response.data.data.order._id || response.data.data.order.id;
        const order = response.data.data.order;

        // Validate order fields
        if (order.status !== 'pending') {
            throw new Error(`Expected status 'pending', got '${order.status}'`);
        }
        if (order.amount !== 199000) {
            throw new Error(`Expected amount 199000, got ${order.amount}`);
        }
        if (!order.orderNumber) {
            throw new Error('Order number is missing');
        }

        logInfo(`Order created: ${order.orderNumber} (${createdOrderId})`);
    } catch (error) {
        if (error.response) {
            const errorData = error.response.data;
            let errorMsg = errorData?.error || errorData?.message || 'Validation error';
            if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                errorMsg += ': ' + errorData.errors.map(e => `${e.field}: ${e.message}`).join(', ');
            } else {
                // Log full response for debugging
                console.error('Full error response:', JSON.stringify(errorData, null, 2));
            }
            throw new Error(`Create order failed: ${errorMsg}`);
        }
        throw error;
    }
}

async function testGetOrders() {
    const response = await axios.get(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${studentToken}` },
        params: { page: 1, limit: 10 }
    });

    if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error('Get orders failed');
    }

    const orders = response.data.data;
    const foundOrder = orders.find(o => (o._id || o.id) === createdOrderId);

    if (!foundOrder) {
        throw new Error('Created order not found in list');
    }

    logInfo(`Found ${orders.length} orders`);
}

async function testGetOrderById() {
    const response = await axios.get(`${API_BASE_URL}/orders/${createdOrderId}`, {
        headers: { Authorization: `Bearer ${studentToken}` }
    });

    if (!response.data.success || !response.data.data?.order) {
        throw new Error('Get order by ID failed');
    }

    const order = response.data.data.order;
    if (order.status !== 'pending') {
        throw new Error(`Order status should be 'pending', got '${order.status}'`);
    }

    logInfo(`Order status: ${order.status}`);
}

async function testOrderValidation() {
    if (!studentToken) {
        logWarning('Skipping validation test - no student token');
        return;
    }

    const response = await axios.post(`${API_BASE_URL}/orders`, {
        package: { name: '' }, // Invalid: empty name
        amount: -100 // Invalid: negative amount
    }, {
        headers: { Authorization: `Bearer ${studentToken}` },
        validateStatus: () => true // Accept any status code
    });

    if (response.status === 422) {
        logInfo('Validation working correctly - returned 422');
        return;
    }

    // If we get here, validation didn't work as expected
    throw new Error(`Expected 422 validation error, got ${response.status}`);
}

async function testOrderPermissions() {
    if (!studentToken || !createdOrderId) {
        logWarning('Skipping permission test - missing token or order ID');
        return;
    }

    const response = await axios.post(
        `${API_BASE_URL}/orders/${createdOrderId}/verify`,
        {},
        {
            headers: { Authorization: `Bearer ${studentToken}` },
            validateStatus: () => true // Accept any status code
        }
    );

    // Student should get 403 or 401
    if (response.status === 403 || response.status === 401) {
        logInfo('Permission check working correctly');
        return;
    }

    // If we get here, permission check failed
    throw new Error(`Expected 403/401, got ${response.status}`);
}

// ==================== PAYMENT VERIFICATION TESTS ====================

async function testVerifyPayment() {
    if (!createdOrderId) {
        throw new Error('No order ID available for verification');
    }

    const response = await axios.post(
        `${API_BASE_URL}/orders/${createdOrderId}/verify`,
        { transactionId: `TXN${Date.now()}` },
        {
            headers: { Authorization: `Bearer ${adminToken}` }
        }
    );

    if (!response.data.success || !response.data.data?.order) {
        throw new Error('Verify payment failed');
    }

    const order = response.data.data.order;

    // Validate order status
    if (order.status !== 'paid') {
        throw new Error(`Expected status 'paid', got '${order.status}'`);
    }

    // Validate subscription was created
    if (!order.subscriptionId) {
        throw new Error('Subscription was not created');
    }

    createdSubscriptionId = order.subscriptionId;
    logInfo(`Order verified, subscription created: ${createdSubscriptionId}`);
}

async function testVerifyAlreadyPaidOrder() {
    // Try to verify the same order again
    try {
        await axios.post(
            `${API_BASE_URL}/orders/${createdOrderId}/verify`,
            {},
            {
                headers: { Authorization: `Bearer ${adminToken}` },
                validateStatus: () => true
            }
        );

        throw new Error('Should not be able to verify already paid order');
    } catch (error) {
        if (error.response?.status === 400) {
            logInfo('Cannot verify already paid order - working correctly');
            return;
        }
        throw error;
    }
}

// ==================== SUBSCRIPTION TESTS ====================

async function testGetActiveSubscription() {
    const response = await axios.get(`${API_BASE_URL}/subscriptions/active`, {
        headers: { Authorization: `Bearer ${studentToken}` }
    });

    if (!response.data.success) {
        throw new Error('Get active subscription failed');
    }

    if (!response.data.data.subscription) {
        throw new Error('Active subscription should exist after order verification');
    }

    const subscription = response.data.data.subscription;

    // Validate subscription
    if (subscription.status !== 'active') {
        throw new Error(`Expected status 'active', got '${subscription.status}'`);
    }

    if (subscription.plan !== 'basic') {
        throw new Error(`Expected plan 'basic', got '${subscription.plan}'`);
    }

    // Check dates
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 25 || daysLeft > 35) {
        throw new Error(`Expected ~30 days left, got ${daysLeft}`);
    }

    logInfo(`Subscription active: ${subscription.plan}, ${daysLeft} days left`);
}

async function testGetSubscriptionHistory() {
    const response = await axios.get(`${API_BASE_URL}/subscriptions/history`, {
        headers: { Authorization: `Bearer ${studentToken}` }
    });

    if (!response.data.success || !Array.isArray(response.data.data.subscriptions)) {
        throw new Error('Get subscription history failed');
    }

    const subscriptions = response.data.data.subscriptions;
    const foundSub = subscriptions.find(s => (s._id || s.id).toString() === createdSubscriptionId.toString());

    if (!foundSub) {
        throw new Error('Created subscription not found in history');
    }

    logInfo(`Found ${subscriptions.length} subscriptions in history`);
}

// ==================== ADMIN TESTS ====================

async function testGetOrderStats() {
    const response = await axios.get(`${API_BASE_URL}/orders/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (!response.data.success || !response.data.data) {
        throw new Error('Get order stats failed');
    }

    const stats = response.data.data;

    if (typeof stats.totalRevenue !== 'number') {
        throw new Error('totalRevenue should be a number');
    }

    if (typeof stats.totalOrders !== 'number') {
        throw new Error('totalOrders should be a number');
    }

    logInfo(`Stats: Revenue=${stats.totalRevenue}, Orders=${stats.totalOrders}`);
}

async function testAdminGetAllOrders() {
    const response = await axios.get(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { page: 1, limit: 10 }
    });

    if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error('Admin get orders failed');
    }

    // Admin should see all orders, including student's order
    const foundOrder = response.data.data.find(o => (o._id || o.id) === createdOrderId);

    if (!foundOrder) {
        throw new Error('Admin cannot see student order');
    }

    logInfo(`Admin can see ${response.data.data.length} orders`);
}

// ==================== EDGE CASES ====================

async function testUpdateOrderStatusToFailed() {
    // Create a new order
    const orderData = {
        package: { name: 'Gói Test', duration: 30, plan: 'basic' },
        amount: 100000,
        currency: 'VND'
    };

    const createResponse = await axios.post(`${API_BASE_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${studentToken}` }
    });

    const testOrderId = createResponse.data.data.order._id || createResponse.data.data.order.id;

    // Update to failed
    const response = await axios.put(
        `${API_BASE_URL}/orders/${testOrderId}/status`,
        { status: 'failed' },
        {
            headers: { Authorization: `Bearer ${adminToken}` }
        }
    );

    if (!response.data.success || response.data.data.order.status !== 'failed') {
        throw new Error('Update order status to failed failed');
    }

    logInfo('Order status updated to failed successfully');
}

// ==================== MAIN TEST RUNNER ====================

async function runAllTests() {
    log('\n' + '='.repeat(60), blue);
    log('🚀 COMPREHENSIVE PAYMENT & ORDER SYSTEM TEST', blue);
    log('='.repeat(60) + '\n', blue);

    try {
        // Connection tests
        await test('MongoDB Connection', testMongoConnection);
        await test('Backend Connection', testBackendConnection);

        // Authentication
        await test('Student Login', testStudentLogin);
        await test('Admin Login', testAdminLogin);

        // Order creation (only if student login succeeded)
        if (studentToken) {
            await test('Create Order', testCreateOrder);
            await test('Get Orders', testGetOrders);
            await test('Get Order By ID', testGetOrderById);
            await test('Order Validation', testOrderValidation);
            await test('Order Permissions', testOrderPermissions);

            // Payment verification (only if order was created)
            if (createdOrderId) {
                await test('Verify Payment (Admin)', testVerifyPayment);
                await test('Verify Already Paid Order', testVerifyAlreadyPaidOrder);

                // Subscription (only if payment was verified)
                if (createdSubscriptionId) {
                    await test('Get Active Subscription', testGetActiveSubscription);
                    await test('Get Subscription History', testGetSubscriptionHistory);
                }
            }

            // Edge cases
            await test('Update Order Status To Failed', testUpdateOrderStatusToFailed);
        } else {
            logWarning('Skipping order tests - student login failed');
        }

        // Admin features (always test if admin login succeeded)
        if (adminToken) {
            await test('Get Order Stats (Admin)', testGetOrderStats);
            await test('Admin Get All Orders', testAdminGetAllOrders);
        }

        // Summary
        log('\n' + '='.repeat(60), blue);
        log('\n📊 TEST SUMMARY:', blue);
        log(`   Total Tests: ${results.total}`, blue);
        log(`   ✅ Passed: ${results.passed}`, green);
        log(`   ❌ Failed: ${results.failed}`, red);
        log(`   Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, blue);

        if (results.errors.length > 0) {
            log('\n❌ ERRORS:', red);
            results.errors.forEach((err, idx) => {
                log(`   ${idx + 1}. ${err.test}: ${err.error}`, red);
            });
        }

        log('\n' + '='.repeat(60) + '\n', blue);

        if (results.failed === 0) {
            logSuccess('🎉 ALL TESTS PASSED! System is working correctly.');
        } else {
            logError(`⚠️  ${results.failed} test(s) failed. Please review errors above.`);
        }

    } catch (error) {
        logError(`Fatal error: ${error.message}`);
        console.error(error);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            logInfo('Disconnected from MongoDB');
        }
    }

    process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests();
