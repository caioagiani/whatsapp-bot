import { mobizon } from 'mobizon-node';

if (!process.env.MOBIZON_API_KEY) {
  console.warn('⚠️  MOBIZON_API_KEY not set — SMS commands will not work.');
}

mobizon.setConfig({
  apiServer: process.env.MOBIZON_URL_SRV,
  apiKey: process.env.MOBIZON_API_KEY,
  format: 'json',
});

export default mobizon;
