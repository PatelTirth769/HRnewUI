const mongoose = require('mongoose');
require('dotenv').config({ path: './ser/.env' });
const User = require('../models/User');

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'info@careanywhere.com' });
        if (user) {
            console.log('USER_FOUND: ' + user.email + ' ROLE: ' + user.role);
        } else {
            console.log('USER_NOT_FOUND');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
