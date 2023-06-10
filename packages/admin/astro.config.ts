import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import config from '@kaetram/common/config';

// https://astro.build/config
export default defineConfig({
    srcDir: './',
    output: 'server',
    adapter: node({ mode: 'standalone' }),
    server: { host: config.adminHost, port: config.adminPort },
    vite: {
        server: { strictPort: true },
        define: { globalConfig: config }
    }
});
