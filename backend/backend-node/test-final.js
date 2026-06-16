require('dotenv').config();
const mongoose = require('mongoose');
const UserService = require('./src/services/user.service');

async function testFinal() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/englishdb_nodejs');
    const updateData = { name: 'tuongne', role: 'teacher', roles: ['teacher'], status: 'active', email: 'tuongne@gmail.com' };
    
    console.log("Calling UserService.updateUser with:", updateData);
    const result = await UserService.updateUser('69ca7e3be4dc25f2f7332770', updateData);
    
    console.log("Result:", result.user.roles);
    mongoose.disconnect();
}

testFinal().catch(console.error);
