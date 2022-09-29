import { defineConfig } from '@kaetram/config';

export default defineConfig({
    host: '0.0.0.0',
    skipDatabase: false,
    mongodbDatabase: 'kaetram_e2e'
});
