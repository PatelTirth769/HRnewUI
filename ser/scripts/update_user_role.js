const mongoose = require('mongoose');
require('dotenv').config({ path: './ser/.env' });
const User = require('../models/User');

async function update() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const result = await User.updateOne(
            { email: 'info@preeshe.com' },
            { $set: { role: 'Employee' } }
        );
        console.log('Update result:', result);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

update();
