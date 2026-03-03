/**
 * COMPREHENSIVE SYSTEM TEST - Test toàn bộ hệ thống
 * Chạy: node scripts/test-complete-system.js
 */

const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const API_BASE_URL = 'http://localhost:3001/api/v1';
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

const results = { total: 0, passed: 0, failed: 0, errors: [] };

function log(msg, color = '') {
    const colors = { green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', blue: '\x1b[34m', reset: '\x1b[0m' };
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function test(name, testFn) {
    results.total++;
    try {
        log(`\n📋 Testing: ${name}`, 'blue');
        await testFn();
        log(`✅ ${name} - PASSED`, 'green');
        results.passed++;
        return true;
    } catch (error) {
        log(`❌ ${name} - FAILED`, 'red');
        const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error';
        log(`   Error: ${errorMsg}`, 'red');
        if (error.response?.data?.errors) {
            error.response.data.errors.forEach(err => {
                log(`   - ${err.field}: ${err.message}`, 'red');
            });
        }
        results.errors.push({ test: name, error: errorMsg });
        results.failed++;
        return false;
    }
}

// ==================== TESTS ====================

async function testStudentLogin() {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: STUDENT_EMAIL,
        password: STUDENT_PASSWORD
    });
    if (!response.data.user || !response.data.accessToken) throw new Error('Login failed');
    studentToken = response.data.accessToken;
    studentId = response.data.user._id || response.data.user.id;
    log(`   Student ID: ${studentId}`, 'blue');
}

async function testAdminLogin() {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
    });
    if (!response.data.user || !response.data.accessToken) throw new Error('Admin login failed');
    adminToken = response.data.accessToken;
    adminId = response.data.user._id || response.data.user.id;
    if (!response.data.user.roles.includes('admin')) throw new Error('User is not admin');
    log(`   Admin ID: ${adminId}`, 'blue');
}

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

    const response = await axios.post(`${API_BASE_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${studentToken}` }
    });

    if (!response.data.success || !response.data.data?.order) {
        throw new Error('Create order failed');
    }

    createdOrderId = response.data.data.order._id || response.data.data.order.id;
    const order = response.data.data.order;

    if (order.status !== 'pending') throw new Error(`Expected status 'pending', got '${order.status}'`);
    if (order.amount !== 199000) throw new Error(`Expected amount 199000, got ${order.amount}`);
    if (!order.orderNumber) throw new Error('Order number is missing');

    log(`   Order: ${order.orderNumber} (${createdOrderId})`, 'blue');
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

    log(`   Found ${orders.length} orders`, 'blue');
}

async function testGetOrderById() {
    const response = await axios.get(`${API_BASE_URL}/orders/${createdOrderId}`, {
        headers: { Authorization: `Bearer ${studentToken}` }
    });

    if (!response.data.success || !response.data.data?.order) {
        throw new Error('Get order by ID failed');
    }

    const order = response.data.data.order;
    if (order.status !== 'pending') throw new Error(`Order status should be 'pending', got '${order.status}'`);
    log(`   Order status: ${order.status}`, 'blue');
}

async function testVerifyPayment() {
    if (!createdOrderId) throw new Error('No order ID available');

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
    if (order.status !== 'paid') throw new Error(`Expected status 'paid', got '${order.status}'`);
    if (!order.subscriptionId) throw new Error('Subscription was not created');

    createdSubscriptionId = order.subscriptionId;
    log(`   Order verified, subscription: ${createdSubscriptionId}`, 'blue');
}

async function testGetActiveSubscription() {
    const response = await axios.get(`${API_BASE_URL}/subscriptions/active`, {
        headers: { Authorization: `Bearer ${studentToken}` }
    });

    if (!response.data.success) throw new Error('Get active subscription failed');
    if (!response.data.data.subscription) throw new Error('Active subscription should exist');

    const subscription = response.data.data.subscription;
    if (subscription.status !== 'active') throw new Error(`Expected status 'active', got '${subscription.status}'`);
    if (subscription.plan !== 'basic') throw new Error(`Expected plan 'basic', got '${subscription.plan}'`);

    const endDate = new Date(subscription.endDate);
    const now = new Date();
    const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    log(`   Subscription: ${subscription.plan}, ${daysLeft} days left`, 'blue');
}

async function testGetOrderStats() {
    const response = await axios.get(`${API_BASE_URL}/orders/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (!response.data.success || !response.data.data) throw new Error('Get order stats failed');
    const stats = response.data.data;
    if (typeof stats.totalRevenue !== 'number') throw new Error('totalRevenue should be a number');
    log(`   Stats: Revenue=${stats.totalRevenue}, Orders=${stats.totalOrders}`, 'blue');
}

async function testAdminGetAllOrders() {
    const response = await axios.get(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { page: 1, limit: 100 }
    });

    if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error('Admin get orders failed');
    }

    const foundOrder = response.data.data.find(o => (o._id || o.id) === createdOrderId);
    if (!foundOrder) throw new Error('Admin cannot see student order');
    log(`   Admin can see ${response.data.data.length} orders`, 'blue');
}

// ==================== MAIN ====================

async function runAllTests() {
    log('\n' + '='.repeat(60), 'blue');
    log('🚀 COMPREHENSIVE SYSTEM TEST', 'blue');
    log('='.repeat(60) + '\n', 'blue');

    try {
        await test('Student Login', testStudentLogin);
        await test('Admin Login', testAdminLogin);
        await test('Create Order', testCreateOrder);
        await test('Get Orders', testGetOrders);
        await test('Get Order By ID', testGetOrderById);
        await test('Verify Payment (Admin)', testVerifyPayment);
        await test('Get Active Subscription', testGetActiveSubscription);
        await test('Get Order Stats (Admin)', testGetOrderStats);
        await test('Admin Get All Orders', testAdminGetAllOrders);

        log('\n' + '='.repeat(60), 'blue');
        log('\n📊 TEST SUMMARY:', 'blue');
        log(`   Total Tests: ${results.total}`, 'blue');
        log(`   ✅ Passed: ${results.passed}`, 'green');
        log(`   ❌ Failed: ${results.failed}`, 'red');
        log(`   Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 'blue');

        if (results.errors.length > 0) {
            log('\n❌ ERRORS:', 'red');
            results.errors.forEach((err, idx) => {
                log(`   ${idx + 1}. ${err.test}: ${err.error}`, 'red');
            });
        }

        log('\n' + '='.repeat(60) + '\n', 'blue');

        if (results.failed === 0) {
            log('🎉 ALL TESTS PASSED! System is working correctly.', 'green');
        } else {
            log(`⚠️  ${results.failed} test(s) failed.`, 'yellow');
        }

    } catch (error) {
        log(`Fatal error: ${error.message}`, 'red');
        console.error(error);
    }

    process.exit(results.failed > 0 ? 1 : 0);
}

runAllTests();
