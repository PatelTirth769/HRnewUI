const axios = require('axios');

const checkDoctype = async () => {
    try {
        const res = await axios.get('http://localhost:5173/local-api/erp-proxy/preeshe/api/resource/DocType/Assessment Criteria');
        const fields = res.data.data.fields;
        console.log('FIELDS:', JSON.stringify(fields, null, 2));
    } catch (err) {
        console.error('ERROR:', err.response?.data || err.message);
    }
};

checkDoctype();
