const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  const uriEnv = process.env.MONGO_URI || '';
  const isPlaceholder = uriEnv.includes('<') || uriEnv.includes('>');
  const primaryUri = isPlaceholder ? '' : uriEnv;
  const fallbackUri = process.env.MONGO_URI_LOCAL || 'mongodb://127.0.0.1:27017/new_project';
  try {
    const uriToUse = primaryUri || fallbackUri;
    await mongoose.connect(uriToUse);
    console.log(`MongoDB Connected: ${uriToUse.includes('127.0.0.1') ? 'local' : 'remote cluster'}`);
  } catch (err) {
    console.error('Mongo connection error:', err && err.message);
    if (primaryUri && !primaryUri.includes('127.0.0.1')) {
      try {
        await mongoose.connect(fallbackUri);
        console.log('MongoDB Connected: local fallback');
      } catch (err2) {
        console.error('Mongo local fallback error:', err2 && err2.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;