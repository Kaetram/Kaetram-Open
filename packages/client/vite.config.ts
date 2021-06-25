import { defineConfig } from 'vite';

import dotenv from 'dotenv-extended';
import dotenvParseVariables from 'dotenv-parse-variables';

import { VitePWA } from 'vite-plugin-pwa';
import legacy from '@vitejs/plugin-legacy';
import { minifyHtml } from 'vite-plugin-html';
import compress from 'vite-plugin-compress';

import { name, description } from 'kaetram/package.json';

export default defineConfig(({ command }) => {
    const isProduction = command === 'build';

    const brotli = false;
    const env = dotenvParseVariables(dotenv.load());

    return {
        cacheDir: '.cache',
        resolve: {
            alias: isProduction
                ? undefined
                : { 'socket.io-client': 'socket.io-client/dist/socket.io.js' }
        },
        plugins: [
            VitePWA({
                registerType: 'autoUpdate',
                workbox: { cacheId: name },
                manifest: {
                    name: 'Kaetram',
                    short_name: 'Kaetram',
                    description,
                    display: 'fullscreen',
                    background_color: '#000000',
                    theme_color: '#000000',
                    icons: [36, 48, 72, 96, 144, 192, 256, 384, 512].map((size) => {
                        const sizes = `${size}x${size}`;

                        return {
                            src: `/icons/android-chrome-${sizes}.png`,
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
            sourcemap: true,
            brotliSize: brotli
        },
        server: { port: 9000 },
        define: { 'process.env': env },
        css: {
            postcss: {
                plugins: ['autoprefixer', 'postcss-preset-env', 'postcss-custom-media'].map(
                    (plugin) => require(plugin)
                )
            }
        }
    };
});
