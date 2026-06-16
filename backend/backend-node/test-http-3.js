const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('./src/models/userSchema');
const Jwt = require('./src/utils/jwt');

async function testHttp() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/englishdb_nodejs');
    const admin = await User.findOne({ email: 'admin@gmail.com' });
    
    // Generate token correctly
    const payload = {
        sub: admin._id,
        roles: admin.roles,
        tv: admin.tokenVersion
    };
    
    const token = Jwt.signAccess(payload);
    mongoose.disconnect();
    
    console.log("Got token. Making request to update tuongne...");
    
    try {
        const updateRes = await axios.put('http://localhost:3001/api/v1/admin/users/69ca7e3be4dc25f2f7332770', {
            name: 'tuongne',
            role: 'teacher',
            roles: ['teacher'],
            status: 'active',
            email: 'tuongne@gmail.com'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Update success:", updateRes.data);
    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}

testHttp().catch(console.error);
