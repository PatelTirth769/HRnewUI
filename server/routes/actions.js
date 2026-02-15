const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

const normalizeTable = (name) => String(name || '').toLowerCase();

router.get('/meta', (req, res) => {
  try {
    const table = normalizeTable(req.query.table || '');
    let Model = null;
    if (table === 'employee' || table === 'employees') {
      Model = Employee;
    }
    if (!Model) {
      return res.status(400).json({ status: 'error', message: 'Unsupported table' });
    }
    const fields = Object.keys(Model.schema.paths)
      .filter((k) => !['__v'].includes(k));
    res.json({ status: 'success', fields });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to load meta' });
  }
});

router.post('/reports', async (req, res) => {
  try {
    const {
      TemplateTable,
      OutputColumns,
      QueryFields,
      ResponseType,
      TemplateType,
    } = req.body || {};

    if (!OutputColumns || !TemplateTable) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    const table = normalizeTable(TemplateTable);
    let Model = null;
    if (table === 'employee' || table === 'employees') {
      Model = Employee;
    }

    if (!Model) {
      return res.status(400).json({ status: 'error', message: 'Unsupported table' });
    }

    const projectionFields = String(OutputColumns)
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const projection = {};
    projectionFields.forEach((f) => (projection[f] = 1));

    const filters = {};
    if (Array.isArray(QueryFields)) {
      QueryFields.forEach((qf) => {
        const field = qf && qf.FieldName;
        const value = qf && qf.Value;
        if (field && value !== undefined && value !== null && value !== '') {
          filters[field] = { $regex: String(value), $options: 'i' };
        }
      });
    }

    const data = await Model.find(filters, projection).lean();

    if (!data || data.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No data found' });
    }

    if (ResponseType === 'json' || (TemplateType || '').toLowerCase() === 'show') {
      return res.json({ status: 'success', data });
    }

    return res.json({ status: 'success', data });
  } catch (err) {
    console.error('Report generation error:', err && err.message);
    res.status(500).json({ status: 'error', message: 'Failed to generate report' });
  }
});

module.exports = router;