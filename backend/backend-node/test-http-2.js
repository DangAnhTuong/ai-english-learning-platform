const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('./src/models/userSchema');

async function testHttp() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/englishdb_nodejs');
    const admin = await User.findOne({ email: 'admin@gmail.com' });
    
    // Generate token like auth.service.js
    const payload = {
        id: admin._id,
        roles: admin.roles,
        tokenVersion: admin.tokenVersion
    };
    
    const token = jwt.sign(payload, 'superkey@2003%pklaxxii$fh54335234fdsfgsfdg', {
        expiresIn: '15m'
    });
    
    mongoose.disconnect();
    
    console.log("Got token. Making request...");
    
    try {
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

testHttp().catch(console.error);
