const mongoose = require('mongoose');
require('dotenv').config({ path: './ser/.env' });
const Role = require('../models/Role');

async function updatePermissions() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const adminPerms = [
            'view_dashboard',
            'manage_onboarding',
            'manage_templates',
            'manage_users',
            'manage_roles',
            'system_settings'
        ];
        
        const hrManagerPerms = [
            'view_dashboard',
            'manage_onboarding',
            'manage_templates',
            'view_users'
        ];
        
        await Role.updateOne({ name: 'Administrator' }, { $set: { permissions: adminPerms } });
        await Role.updateOne({ name: 'HR Manager' }, { $set: { permissions: hrManagerPerms } });
        
        const adminRole = await Role.findOne({ name: 'Administrator' });
        console.log('--- UPDATED ADMINISTRATOR ROLE ---');
        console.log(JSON.stringify(adminRole, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updatePermissions();
