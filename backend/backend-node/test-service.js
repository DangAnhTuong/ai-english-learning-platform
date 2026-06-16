const mongoose = require('mongoose');
const UserService = require('./src/services/user.service');

async function testServiceUpdate() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/englishdb_nodejs');
    const updateData = { name: 'giathune', role: 'teacher', roles: ['teacher'], status: 'active', email: 'giathu@gmail.com' };
    
    console.log("Calling UserService.updateUser with:", updateData);
    const result = await UserService.updateUser('6a05b4d5a25b79c4d2198d5b', updateData);
    
    console.log("Result:", result.user.roles);
    mongoose.disconnect();
}

testServiceUpdate().catch(console.error);
