const mongoose = require('mongoose');
require('dotenv').config({ path: './ser/.env' });
const User = require('../models/User');
const Role = require('../models/Role');

async function setup() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log('Setting up Roles...');
        const roles = [
            { name: 'Administrator', description: 'Full system access' },
            { name: 'HR Manager', description: 'Manage employees and onboarding' },
            { name: 'HR User', description: 'View and update onboarding details' },
            { name: 'Employee', description: 'Access to self-service portal' }
        ];
        
        for (const r of roles) {
            await Role.updateOne({ name: r.name }, { $set: r }, { upsert: true });
            console.log(`- Role: ${r.name}`);
        }
        
        console.log('Setting up Users...');
        const users = [
            { 
                email: 'info@preeshe.com', 
                username: 'info', 
                role: 'Administrator', 
                password: 'password123', // Just a placeholder
                status: 'active' 
            }
        ];
        
        for (const u of users) {
           await User.updateOne({ email: u.email }, { $set: u }, { upsert: true });
           console.log(`- User: ${u.email} (Role: ${u.role})`);
        }
        
        console.log('--- SETUP COMPLETE ---');
        process.exit(0);
    } catch (err) {
        console.error('Setup failed:', err);
        process.exit(1);
    }
}

setup();
