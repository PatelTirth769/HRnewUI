const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

const fallbackModules = [
	{ moduleKey: 'master', title: 'Master', order: 1, adminOnly: true },
	{ moduleKey: 'elcLetters', title: 'ELC & Letters', order: 2, adminOnly: true },
	{ moduleKey: 'erpPayroll', title: 'ERP Payroll', order: 3, adminOnly: false },
	{ moduleKey: 'hr', title: 'HR', order: 4, adminOnly: false },
	{ moduleKey: 'recruitment', title: 'Recruitment', order: 5, adminOnly: false },
	{ moduleKey: 'performance', title: 'Performance', order: 6, adminOnly: false },
	{ moduleKey: 'shiftAttendance', title: 'Shift & Attendance', order: 7, adminOnly: false },
	{ moduleKey: 'leave', title: 'Leave', order: 8, adminOnly: false },
	{ moduleKey: 'assets', title: 'Assets', order: 9, adminOnly: false },
	{ moduleKey: 'accounting', title: 'Accounting', order: 10, adminOnly: false },
];

function mergeWithDefaults(modules) {
	const byKey = new Map();
	modules.forEach((m) => {
		if (m && m.moduleKey) {
			byKey.set(m.moduleKey, m);
		}
	});

	fallbackModules.forEach((defaults) => {
		if (!byKey.has(defaults.moduleKey)) {
			byKey.set(defaults.moduleKey, defaults);
		}
	});

	return Array.from(byKey.values());
}

function normalizeModule(doc) {
	const data = doc.data ? doc.data() : doc;
	return {
		moduleKey: data.moduleKey || data.key || doc.id,
		title: data.title || data.name || data.moduleKey || doc.id,
		order: Number(data.order || 0),
		adminOnly: Boolean(data.adminOnly),
		active: data.active !== false,
	};
}

router.get('/', async (_req, res) => {
	try {
		const snapshot = await db.collection('navigation').get();
		let modules = snapshot.docs.map(normalizeModule).filter((m) => m.active);

		if (modules.length === 0) {
			modules = fallbackModules;
		} else {
			modules = mergeWithDefaults(modules);
		}

		modules.sort((a, b) => (a.order || 0) - (b.order || 0));
		res.json(modules);
	} catch (err) {
		console.error('Error fetching navigation from Firebase:', err);
		res.json(fallbackModules);
	}
});

module.exports = router;
