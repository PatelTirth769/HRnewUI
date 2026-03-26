const axios = require('axios');

async function testFetch() {
    try {
        // 1. Generate cookie
        const loginRes = await axios.post('http://localhost:3636/erp-proxy/preeshe/api/method/login', {
            usr: 'administrator',
            pwd: 'admin' // If we know or we don't, I will just use the frontend's login endpoint. Wait, no I can't guess pwd.
        }).catch(() => null);

        // Instead of generating a cookie, I will ask the local proxy if there's any active system. 
        // Oh wait! The proxy doesn't store cookies globally, it relies on req.headers.cookie
    } catch (e) {
        console.error(e);
    }
}
testFetch();
