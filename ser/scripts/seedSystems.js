/**
 * Seed script: Insert initial systems into MongoDB.
 * Run once: node scripts/seedSystems.js
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const System = require('../models/System');

const schoolerUrl = process.env.SCHOOLER_ERP_URL || 'https://3iinfotech.hrhovercraft.in';

const systems = [
    {
        name: 'Schooler',
        code: 'schooler',
        erpNextUrl: schoolerUrl,
        status: 'active',
        order: 1,
    },
];

async function seed() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('MONGO_URI not defined in .env');
        process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    for (const sys of systems) {
        const existing = await System.findOne({ code: sys.code });
        if (existing) {
            console.log(`System "${sys.code}" already exists — skipping`);
        } else {
            await System.create(sys);
            console.log(`Created system: ${sys.name} (${sys.code})`);
        }
    }

    console.log('Seeding complete!');
    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
});
