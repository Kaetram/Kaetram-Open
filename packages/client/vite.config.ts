import { defineConfig } from 'vite';

import dotenv from 'dotenv-extended';
import dotenvParseVariables from 'dotenv-parse-variables';

import { VitePWA as pwa } from 'vite-plugin-pwa';
import legacy from '@vitejs/plugin-legacy';
import { minifyHtml } from 'vite-plugin-html';
import compress from 'vite-plugin-compress';

import { name, description } from 'kaetram/package.json';

export default defineConfig(({ command }) => {
    let isProduction = command === 'build',
        brotli = false,
        env = dotenvParseVariables(dotenv.load());

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
                    name: 'Kaetram',
                    short_name: 'Kaetram',
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
        define: { 'process.env': env }
    };
});
