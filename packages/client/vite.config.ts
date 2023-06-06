import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { description, name } from '../../package.json';
import config, { type Config } from '../common/config';

import ViteLegacy from '@vitejs/plugin-legacy';
import glsl from 'vite-plugin-glsl';
import { defineConfig } from 'vite';
import { ViteMinifyPlugin } from 'vite-plugin-minify';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { internalIpV4 } from 'internal-ip';
import size from 'image-size';
import sass from 'sass';
import postcssFontPie from 'postcss-fontpie';
import postcssCustomMedia from 'postcss-custom-media';
import postcssPresetEnv from 'postcss-preset-env';
import autoprefixer from 'autoprefixer';

let expose = ['name', 'host', 'ssl', 'serverId', 'sentryDsn'] as const;

interface ExposedConfig extends Pick<Config, typeof expose[number]> {
    debug: boolean;
    version: string;
    minor: string;
    port: number;
    hub: string | false;
    sentryDsn: string;
}

declare global {
    interface Window {
        config: ExposedConfig;
    }
}

function loadEnv(isProduction: boolean): ExposedConfig {
    let env = {} as ExposedConfig,
        {
            gver,
            minor,
            clientRemoteHost,
            clientRemotePort,
            hubEnabled,
            hubHost,
            hubPort,
            host,
            port,
            ssl
        } = config;

    for (let key of expose) env[key] = config[key] as never;

    let clientHost = clientRemoteHost || (hubEnabled ? hubHost : host),
        clientPort = clientRemotePort || (hubEnabled ? hubPort : port),
        hub = ssl ? `https://${clientHost}` : `http://${clientHost}:${clientPort}`;

    return Object.assign(env, {
        debug: !isProduction,
        version: gver,
        minor,
        host: clientHost,
        port: clientPort,
        hub: hubEnabled && hub
    });
}

export default defineConfig(async ({ mode }) => {
    let isProduction = mode === 'production',
        env = loadEnv(isProduction),
        ipv4 = await internalIpV4(),
        plugins = [
            glsl(),
            VitePWA({
                registerType: 'autoUpdate',
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
            ViteLegacy(),
            ViteMinifyPlugin({ processScripts: ['application/ld+json'] })
        ];

    if (config.sentryDsn && !config.debugging)
        plugins.push(
            sentryVitePlugin({
                include: '.',
                org: config.sentryOrg,
                project: config.sentryProject,
                authToken: config.sentryAuthToken,
                sourcemaps: {
                    // Specify the directory containing build artifacts
                    assets: './dist/**'
                }
            })
        );

    return {
        appType: 'mpa',
        plugins,
        build: {
            sourcemap: true,
            chunkSizeWarningLimit: 4e3,
            rollupOptions: {
                input: {
                    index: path.resolve(__dirname, 'index.html'),
                    privacy: path.resolve(__dirname, 'privacy.html'),
                    reset: path.resolve(__dirname, 'reset/index.html')
                }
            }
        },
        server: {
            host: '0.0.0.0',
            port: 9000,
            strictPort: true,
            hmr: {
                protocol: 'ws',
                host: ipv4!,
                port: 5183
            }
        },
        define: { 'window.config': env },
        css: {
            postcss: {
                plugins: [
                    postcssFontPie({
                        fontTypes: {
                            AdvoCut: 'sans-serif',
                            KerrieFont: 'sans-serif',
                            DorfScratch: 'sans-serif'
                        },
                        srcUrlToFilename: (url) =>
                            fileURLToPath(new URL(`public/${url}`, import.meta.url))
                    }),
                    postcssCustomMedia(),
                    postcssPresetEnv(),
                    autoprefixer()
                ]
            },
            preprocessorOptions: {
                scss: {
                    functions: {
                        'width($image)': (image: sass.types.Number) => {
                            let { width } = size(
                                fileURLToPath(
                                    new URL(
                                        `public/img/interface/${image.getValue()}`,
                                        import.meta.url
                                    )
                                )
                            );

                            return new sass.types.Number(width!, 'px');
                        },
                        'height($image)': (image: sass.types.Number) => {
                            let { height } = size(
                                fileURLToPath(
                                    new URL(
                                        `public/img/interface/${image.getValue()}`,
                                        import.meta.url
                                    )
                                )
                            );

                            return new sass.types.Number(height!, 'px');
                        },
                        'better-width($image)': (image: sass.types.Number) => {
                            let { width } = size(
                                fileURLToPath(
                                    new URL(
                                        `public/img/interface/${image.getValue()}.png`,
                                        import.meta.url
                                    )
                                )
                            );

                            return new sass.types.Number(width!);
                        },
                        'better-height($image)': (image: sass.types.Number) => {
                            let { height } = size(
                                fileURLToPath(
                                    new URL(
                                        `public/img/interface/${image.getValue()}.png`,
                                        import.meta.url
                                    )
                                )
                            );

                            return new sass.types.Number(height!);
                        }
                    }
                }
            }
        }
    };
});
