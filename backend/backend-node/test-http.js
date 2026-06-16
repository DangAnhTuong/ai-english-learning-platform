const axios = require('axios');

async function testHttpUpdate() {
    try {
        // First, get an admin token
        const loginRes = await axios.post('http://localhost:3001/api/v1/auth/login', {
            email: 'admin@gmail.com',
            password: 'YourStrongPassword123!' // default from README
        });
        const token = loginRes.data.data.accessToken;
        
        console.log("Logged in!");
        
        const updateRes = await axios.put('http://localhost:3001/api/v1/admin/users/6a05b4d5a25b79c4d2198d5b', {
            name: 'giathune',
            role: 'teacher',
            roles: ['teacher'],
            status: 'active',
            email: 'giathu@gmail.com'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Update success:", updateRes.data);
    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}

testHttpUpdate();
