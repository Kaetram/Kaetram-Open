import { defineConfig } from 'vite';

import dotenv from 'dotenv-extended';
import dotenvParseVariables from 'dotenv-parse-variables';

import { VitePWA } from 'vite-plugin-pwa';
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
            alias: { 'socket.io-client': 'socket.io-client/dist/socket.io.js' }
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
                    icons: [
                        {
                            src: '/icons/android-chrome-36x36.png',
                            sizes: '36x36',
                            type: 'image/png'
                        },
                        {
                            src: '/icons/android-chrome-48x48.png',
                            sizes: '48x48',
                            type: 'image/png'
                        },
                        {
                            src: '/icons/android-chrome-72x72.png',
                            sizes: '72x72',
                            type: 'image/png'
                        },
                        {
                            src: '/icons/android-chrome-96x96.png',
                            sizes: '96x96',
                            type: 'image/png'
                        },
                        {
                            src: '/icons/android-chrome-144x144.png',
                            sizes: '144x144',
                            type: 'image/png'
                        },
                        {
                            src: '/icons/android-chrome-192x192.png',
                            sizes: '192x192',
                            type: 'image/png'
                        },
                        {
                            src: '/icons/android-chrome-256x256.png',
                            sizes: '256x256',
                            type: 'image/png'
                        },
                        {
                            src: '/icons/android-chrome-384x384.png',
                            sizes: '384x384',
                            type: 'image/png'
                        },
                        {
                            src: '/icons/android-chrome-512x512.png',
                            sizes: '512x512',
                            type: 'image/png'
                        }
                    ],
                    screenshots: [
                        {
                            src: 'screenshot.png',
                            sizes: '750x1334',
                            type: 'image/png'
                        }
                    ],
                    categories: 'entertainment games'.split(' ')
                }
            }),
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
                plugins: 'autoprefixer postcss-preset-env postcss-custom-media'
                    .split(' ')
                    .map((plugin) => require(plugin))
            }
        }
    };
});
