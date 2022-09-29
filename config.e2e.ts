import { defineConfig } from '@kaetram/config';

export default defineConfig({
    host: '127.0.0.1',
    skipDatabase: false,
    mongodbDatabase: 'kaetram_e2e'
});
