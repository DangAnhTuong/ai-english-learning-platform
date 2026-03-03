/**
 * Integration test for hardening sync endpoints.
 * Run: node scripts/test-hardening-sync.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123456';

const state = {
    token: null,
    createdPlanId: null,
    createdTopicId: null
};

const assert = (condition, message) => {
    if (!condition) throw new Error(message);
};

const getErrorMessage = (error) => error?.response?.data?.error || error.message;

async function loginAdmin() {
    const res = await axios.post(`${API_URL}/auth/login`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
    });

    const token = res?.data?.data?.accessToken || res?.data?.accessToken;
    assert(token, 'Login thanh cong nhung khong nhan duoc access token');
    state.token = token;
    console.log('OK: Login admin');
}

function authHeaders() {
    return { Authorization: `Bearer ${state.token}` };
}

async function testPlanCrud() {
    const uniqueCode = `TEST_PLAN_${Date.now()}`;

    const createRes = await axios.post(`${API_URL}/subscriptions/plans`, {
        code: uniqueCode,
        name: 'Test Plan Hardening',
        type: 'premium',
        price: 321000,
        currency: 'VND',
        duration: 30,
        durationLabel: '30 ngay',
        features: ['feature A', 'feature B'],
        isPopular: false,
        order: 999,
        isActive: true
    }, { headers: authHeaders() });

    const created = createRes?.data?.data;
    assert(created?.id, 'Tao plan that bai');
    state.createdPlanId = created.id;
    console.log('OK: Create plan');

    const updateRes = await axios.put(`${API_URL}/subscriptions/plans/${state.createdPlanId}`, {
        price: 333000,
        discount: 15,
        isPopular: true
    }, { headers: authHeaders() });

    const updated = updateRes?.data?.data;
    assert(updated?.price === 333000, 'Cap nhat plan that bai');
    assert(updated?.isPopular === true, 'Cap nhat isPopular that bai');
    console.log('OK: Update plan');

    await axios.delete(`${API_URL}/subscriptions/plans/${state.createdPlanId}`, {
        headers: authHeaders()
    });

    const plansRes = await axios.get(`${API_URL}/subscriptions/plans`, {
        headers: authHeaders(),
        params: { includeInactive: true }
    });
    const deletedPlan = (plansRes?.data?.data || []).find((item) => item.id === state.createdPlanId);
    assert(deletedPlan && deletedPlan.isActive === false, 'Xoa plan (soft delete) that bai');
    console.log('OK: Delete plan');
}

async function testTopicCrud() {
    const uniqueTopicName = `Test Topic ${Date.now()}`;

    const createRes = await axios.post(`${API_URL}/conversations/topics`, {
        name: uniqueTopicName,
        description: 'Topic for integration test',
        icon: '💬',
        color: '#1677ff',
        order: 999,
        isActive: true
    }, { headers: authHeaders() });

    const created = createRes?.data?.data;
    assert(created?.id, 'Tao topic that bai');
    state.createdTopicId = created.id;
    console.log('OK: Create topic');

    const updateRes = await axios.put(`${API_URL}/conversations/topics/${state.createdTopicId}`, {
        description: 'Updated description',
        order: 1000
    }, { headers: authHeaders() });
    const updated = updateRes?.data?.data;
    assert(updated?.description === 'Updated description', 'Cap nhat topic that bai');
    console.log('OK: Update topic');

    await axios.delete(`${API_URL}/conversations/topics/${state.createdTopicId}`, {
        headers: authHeaders()
    });

    const topicsRes = await axios.get(`${API_URL}/conversations/topics/admin`, {
        headers: authHeaders(),
        params: { includeInactive: true }
    });
    const deletedTopic = (topicsRes?.data?.data || []).find((item) => item.id === state.createdTopicId);
    assert(deletedTopic && deletedTopic.isActive === false, 'Xoa topic (soft delete) that bai');
    console.log('OK: Delete topic');
}

async function cleanup() {
    if (!state.token) return;
    try {
        if (state.createdPlanId) {
            await axios.delete(`${API_URL}/subscriptions/plans/${state.createdPlanId}`, { headers: authHeaders() });
        }
    } catch (_e) {
        // no-op cleanup best effort
    }
    try {
        if (state.createdTopicId) {
            await axios.delete(`${API_URL}/conversations/topics/${state.createdTopicId}`, { headers: authHeaders() });
        }
    } catch (_e) {
        // no-op cleanup best effort
    }
}

async function main() {
    console.log(`Running hardening sync tests against: ${API_URL}`);
    try {
        await loginAdmin();
        await testPlanCrud();
        await testTopicCrud();
        console.log('SUCCESS: Hardening sync tests passed');
    } catch (error) {
        console.error(`FAILED: ${getErrorMessage(error)}`);
        process.exitCode = 1;
    } finally {
        await cleanup();
    }
}

main();

