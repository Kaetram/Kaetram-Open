import { defineConfig } from 'vite';

import config, { Config } from '../common/config';

import { VitePWA as pwa } from 'vite-plugin-pwa';
import legacy from '@vitejs/plugin-legacy';
import { minifyHtml } from 'vite-plugin-html';
import compress from 'vite-plugin-compress';

import { name, description } from 'kaetram/package.json';

declare global {
    interface Window {
        config: Config;
    }
}

type ConfigKeys = keyof Config;

export default defineConfig(({ command }) => {
    let isProduction = command === 'build',
        brotli = false,
        expose: ConfigKeys[] = [
            'name',
            'host',
            'socketioPort',
            'gver',
            'ssl',
            'worldSwitch',
            'hubEnabled',
            'hubPort'
        ],
        env = {} as Config;

    for (let key of expose) env[key] = config[key] as never;

    return {
        cacheDir: '.cache',
        resolve: {
            alias: isProduction
                ? undefined
                : { 'socket.io-client': 'socket.io-client/dist/socket.io.js' }
        },
        plugins: [
            pwa({
                registerType: 'autoUpdate',
                includeAssets: '**/*',
                workbox: { cacheId: name },
                manifest: {
                    name: config.name,
                    short_name: config.name,
                    description,
                    display: 'fullscreen',
                    background_color: '#000000',
                    theme_color: '#000000',
                    icons: [192, 512].map((size) => {
                        let sizes = `${size}x${size}`;

                        return {
                            src: `/img/icons/android-chrome-${sizes}.png`,
                            sizes,
                            type: 'image/png',
                            purpose: 'any maskable'
                        };
                    }),
                    screenshots: [
                        {
                            src: 'screenshot.png',
                            sizes: '750x1334',
                            type: 'image/png'
                        }
                    ],
                    categories: ['entertainment', 'games']
                }
            }),
            legacy(),
            minifyHtml(isProduction && { processScripts: ['application/ld+json'] }),
            compress({ brotli })
        ],
        build: {
            sourcemap: false,
            brotliSize: brotli,
            chunkSizeWarningLimit: 4e3
        },
        server: { port: 9000 },
        define: { 'window.config': env }
    };
});
