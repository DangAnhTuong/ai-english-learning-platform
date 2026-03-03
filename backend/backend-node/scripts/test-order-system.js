/**
 * Test script cho Order & Subscription System
 * Chạy: node scripts/test-order-system.js
 */

const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Get MongoDB URI from environment or use default
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/englishdb_nodejs';

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test data
let testUserToken = '';
let testAdminToken = '';
let testUserId = '';
let testAdminId = '';
let createdOrderId = '';
let createdSubscriptionId = '';

// Colors for console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// Test helper
async function test(name, testFn) {
    try {
        logInfo(`\n📋 Testing: ${name}`);
        await testFn();
        logSuccess(`${name} - PASSED`);
        return true;
    } catch (error) {
        logError(`${name} - FAILED`);
        console.error('Error details:', error.response?.data || error.message);
        return false;
    }
}

// Connect to database
async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        logSuccess(`Connected to MongoDB: ${MONGODB_URI}`);
    } catch (error) {
        logError('Failed to connect to MongoDB');
        logError(`Error: ${error.message}`);
        throw error;
    }
}

// Test 1: Login as user
async function testUserLogin() {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'student@example.com',
        password: 'student123456'
    });

    if (response.data.user && response.data.accessToken) {
        testUserToken = response.data.accessToken;
        testUserId = response.data.user._id || response.data.user.id;
        return true;
    }
    throw new Error('Login failed');
}

// Test 2: Login as admin
async function testAdminLogin() {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'admin@example.com',
        password: 'admin123456'
    });

    if (response.data.user && response.data.accessToken) {
        testAdminToken = response.data.accessToken;
        testAdminId = response.data.user._id || response.data.user.id;
        return true;
    }
    throw new Error('Admin login failed');
}

// Test 3: Create Order
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
        }
    };

    const response = await axios.post(`${API_BASE_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${testUserToken}` }
    });

    if (response.data.success && response.data.data.order) {
        createdOrderId = response.data.data.order._id || response.data.data.order.id;
        logInfo(`Created order ID: ${createdOrderId}`);
        return true;
    }
    throw new Error('Create order failed');
}

// Test 4: Get Orders
async function testGetOrders() {
    const response = await axios.get(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
        params: { page: 1, limit: 10 }
    });

    if (response.data.success && Array.isArray(response.data.data)) {
        logInfo(`Found ${response.data.data.length} orders`);
        return true;
    }
    throw new Error('Get orders failed');
}

// Test 5: Get Order By ID
async function testGetOrderById() {
    if (!createdOrderId) {
        throw new Error('No order ID available');
    }

    const response = await axios.get(`${API_BASE_URL}/orders/${createdOrderId}`, {
        headers: { Authorization: `Bearer ${testUserToken}` }
    });

    if (response.data.success && response.data.data.order) {
        logInfo(`Order status: ${response.data.data.order.status}`);
        return true;
    }
    throw new Error('Get order by ID failed');
}

// Test 6: Verify Payment (Admin)
async function testVerifyPayment() {
    if (!createdOrderId) {
        throw new Error('No order ID available');
    }

    const response = await axios.post(
        `${API_BASE_URL}/orders/${createdOrderId}/verify`,
        { transactionId: `TXN${Date.now()}` },
        {
            headers: { Authorization: `Bearer ${testAdminToken}` }
        }
    );

    if (response.data.success && response.data.data.order) {
        const order = response.data.data.order;
        if (order.status === 'paid' && order.subscriptionId) {
            createdSubscriptionId = order.subscriptionId;
            logInfo(`Order verified, subscription created: ${createdSubscriptionId}`);
            return true;
        }
    }
    throw new Error('Verify payment failed');
}

// Test 7: Get Active Subscription
async function testGetActiveSubscription() {
    const response = await axios.get(`${API_BASE_URL}/subscriptions/active`, {
        headers: { Authorization: `Bearer ${testUserToken}` }
    });

    if (response.data.success) {
        if (response.data.data.subscription) {
            logInfo(`Subscription plan: ${response.data.data.subscription.plan}`);
            logInfo(`Subscription status: ${response.data.data.subscription.status}`);
            return true;
        } else {
            logWarning('No active subscription found');
            return true; // This is valid
        }
    }
    throw new Error('Get active subscription failed');
}

// Test 8: Get Subscription History
async function testGetSubscriptionHistory() {
    const response = await axios.get(`${API_BASE_URL}/subscriptions/history`, {
        headers: { Authorization: `Bearer ${testUserToken}` }
    });

    if (response.data.success && Array.isArray(response.data.data.subscriptions)) {
        logInfo(`Found ${response.data.data.subscriptions.length} subscriptions in history`);
        return true;
    }
    throw new Error('Get subscription history failed');
}

// Test 9: Get Order Stats (Admin)
async function testGetOrderStats() {
    const response = await axios.get(`${API_BASE_URL}/orders/stats`, {
        headers: { Authorization: `Bearer ${testAdminToken}` }
    });

    if (response.data.success && response.data.data) {
        logInfo(`Total revenue: ${response.data.data.totalRevenue}`);
        logInfo(`Total orders: ${response.data.data.totalOrders}`);
        return true;
    }
    throw new Error('Get order stats failed');
}

// Test 10: Update Order Status (Admin)
async function testUpdateOrderStatus() {
    // Create a new order first
    const orderData = {
        package: {
            name: 'Gói 3 Tháng',
            duration: 90,
            plan: 'premium'
        },
        amount: 499000,
        currency: 'VND',
        paymentMethod: 'bank_transfer'
    };

    const createResponse = await axios.post(`${API_BASE_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${testUserToken}` }
    });

    const newOrderId = createResponse.data.data.order._id || createResponse.data.data.order.id;

    // Update status to failed
    const response = await axios.put(
        `${API_BASE_URL}/orders/${newOrderId}/status`,
        { status: 'failed' },
        {
            headers: { Authorization: `Bearer ${testAdminToken}` }
        }
    );

    if (response.data.success && response.data.data.order.status === 'failed') {
        logInfo('Order status updated to failed');
        return true;
    }
    throw new Error('Update order status failed');
}

// Test 11: Validation Tests
async function testValidation() {
    try {
        // Test invalid order data
        await axios.post(`${API_BASE_URL}/orders`, {
            package: { name: '' }, // Invalid: empty name
            amount: -100 // Invalid: negative amount
        }, {
            headers: { Authorization: `Bearer ${testUserToken}` }
        });
        throw new Error('Validation should have failed');
    } catch (error) {
        if (error.response && error.response.status === 422) {
            logInfo('Validation working correctly');
            return true;
        }
        throw error;
    }
}

// Test 12: Permission Tests
async function testPermissions() {
    // Test: Student cannot verify payment
    try {
        await axios.post(
            `${API_BASE_URL}/orders/${createdOrderId}/verify`,
            {},
            {
                headers: { Authorization: `Bearer ${testUserToken}` }
            }
        );
        throw new Error('Permission check should have failed');
    } catch (error) {
        if (error.response && (error.response.status === 403 || error.response.status === 401)) {
            logInfo('Permission check working correctly');
            return true;
        }
        throw error;
    }
}

// Main test runner
async function runTests() {
    log('\n🚀 Starting Order & Subscription System Tests\n', 'blue');

    const results = {
        passed: 0,
        failed: 0,
        total: 0
    };

    try {
        // Connect to database
        await connectDB();

        // Run tests
        const tests = [
            ['User Login', testUserLogin],
            ['Admin Login', testAdminLogin],
            ['Create Order', testCreateOrder],
            ['Get Orders', testGetOrders],
            ['Get Order By ID', testGetOrderById],
            ['Validation Tests', testValidation],
            ['Permission Tests', testPermissions],
            ['Verify Payment (Admin)', testVerifyPayment],
            ['Get Active Subscription', testGetActiveSubscription],
            ['Get Subscription History', testGetSubscriptionHistory],
            ['Get Order Stats (Admin)', testGetOrderStats],
            ['Update Order Status (Admin)', testUpdateOrderStatus],
        ];

        for (const [name, testFn] of tests) {
            results.total++;
            const passed = await test(name, testFn);
            if (passed) {
                results.passed++;
            } else {
                results.failed++;
            }
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Summary
        log('\n' + '='.repeat(50), 'blue');
        log(`\n📊 Test Summary:`, 'blue');
        log(`   Total: ${results.total}`, 'blue');
        log(`   ✅ Passed: ${results.passed}`, 'green');
        log(`   ❌ Failed: ${results.failed}`, 'red');
        log(`   Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 'blue');
        log('\n' + '='.repeat(50) + '\n', 'blue');

        if (results.failed === 0) {
            logSuccess('🎉 All tests passed!');
        } else {
            logError(`⚠️  ${results.failed} test(s) failed`);
        }

    } catch (error) {
        logError(`Fatal error: ${error.message}`);
        console.error(error);
    } finally {
        await mongoose.disconnect();
        logInfo('Disconnected from MongoDB');
        process.exit(results.failed > 0 ? 1 : 0);
    }
}

// Run tests
runTests();
