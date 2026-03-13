const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/cyberDB');
        const res = await mongoose.connection.collection('users').updateMany({}, { $set: { role: 'admin' } });
        console.log('Updated users to admin:', res.modifiedCount);
    } catch (e) {
        console.error('DB Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

run();
