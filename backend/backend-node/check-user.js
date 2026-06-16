const mongoose = require('mongoose');
const User = require('./src/models/userSchema');

async function checkUser() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/englishdb_nodejs');
    const user = await User.findById('69ca7e3be4dc25f2f7332770');
    console.log("User:", user);
    mongoose.disconnect();
}

checkUser().catch(console.error);
