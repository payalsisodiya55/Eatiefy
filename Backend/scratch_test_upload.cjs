const { ensureUploadStorageReady } = require('./src/services/storage.service.js');
const { config } = require('./src/config/env.js');

async function test() {
  console.log('uploadStorageRoot:', config.uploadStorageRoot);
  try {
    const root = await ensureUploadStorageReady('test');
    console.log('Storage is ready! Path:', root);
  } catch (err) {
    console.error('Failed to ensure storage is ready:', err);
  }
}
test();
