const mongoose = require('mongoose');
const Conversation = require('./src/models/conversation');

mongoose.connect('mongodb://localhost:27017/english-learning')
  .then(async () => {
    const count = await Conversation.countDocuments();
    console.log(`Total conversations: ${count}`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
