// Helper script to get your current public IP address for MongoDB Atlas whitelisting
const https = require('https');

https.get('https://api.ipify.org?format=json', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const ip = JSON.parse(data).ip;
      console.log('\n🌐 Your current public IP address is:', ip);
      console.log('\n📝 Steps to fix MongoDB Atlas connection:');
      console.log('   1. Go to: https://cloud.mongodb.com/v2#/security/network/list');
      console.log('   2. Click "Add IP Address"');
      console.log('   3. Enter IP:', ip);
      console.log('   4. Click "Confirm"');
      console.log('\n   OR temporarily allow all IPs (for testing only):');
      console.log('   - Enter: 0.0.0.0/0 (less secure, use only for testing)\n');
    } catch (err) {
      console.error('Error parsing response:', err.message);
    }
  });
}).on('error', (err) => {
  console.error('Could not fetch IP:', err.message);
  console.log('\n📝 Manual steps:');
  console.log('   1. Visit: https://whatismyipaddress.com/');
  console.log('   2. Copy your public IP address');
  console.log('   3. Go to MongoDB Atlas: https://cloud.mongodb.com/v2#/security/network/list');
  console.log('   4. Add your IP to the whitelist\n');
});

