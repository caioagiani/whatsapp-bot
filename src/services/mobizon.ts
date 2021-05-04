import { mobizon } from 'mobizon-node';

mobizon.setConfig({
  apiServer: process.env.MOBIZON_URL_SRV,
  apiKey: process.env.MOBIZON_API_KEY,
  format: 'json',
});

export default mobizon;
