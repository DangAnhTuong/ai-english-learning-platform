const mongoose = require('mongoose');

(async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/english-learning');
        const Topic = require('./src/models/conversationTopic');
        const Conversation = require('./src/models/conversation');

        const topics = await Topic.find({}).sort({ order: 1 });
        const convs = await Conversation.find({});

        console.log('========================================================');
        console.log('✅ TOTAL TOPICS IN DATABASE:', topics.length);
        topics.forEach(t => {
            console.log(`   ${t.icon} [${t.name}] - ${t.description} (order: ${t.order})`);
        });

        console.log('\n========================================================');
        console.log('✅ TOTAL CONVERSATIONS IN DATABASE:', convs.length);
        convs.forEach(c => {
            console.log(`   - ${c.title}`);
            console.log(`     Topic: ${c.topic} | Level: ${c.level} | Lines: ${c.lines.length} | Audio: ${c.audioGenerationStatus}`);
        });
        console.log('========================================================');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
