import { defineConfig } from 'vite';

import config, { type Config } from '@kaetram/common/config';

import { VitePWA as pwa } from 'vite-plugin-pwa';
import legacy from '@vitejs/plugin-legacy';
import { createHtmlPlugin } from 'vite-plugin-html';

import { name, version, description } from 'kaetram/package.json';

let exposed = ['name', 'host', 'ssl', 'worldSwitch', 'serverId'] as const;

interface ExposedConfig extends Pick<Config, typeof exposed[number]> {
    debug: boolean;
    version: string;
    port: number;
    hub: string | false;
}

declare global {
    interface Window {
        config: ExposedConfig;
    }
}

function loadEnv(isProduction: boolean): ExposedConfig {
    let env = {} as ExposedConfig,
        {
            clientRemoteHost,
            clientRemotePort,
            hubEnabled,
            hubHost,
            hubPort,
            host,
            socketioPort,
            ssl,
            worldSwitch
        } = config;

    for (let key of exposed) env[key] = config[key] as never;

    let clientHost = clientRemoteHost || (hubEnabled ? hubHost : host),
        clientPort = clientRemotePort || (hubEnabled ? hubPort : socketioPort),
        hub = ssl ? `https://${clientHost}` : `http://${clientHost}:${clientPort}`;

    return Object.assign(env, {
        version,
        debug: !isProduction,
        host: clientHost,
        port: clientPort,
        hub: hubEnabled && hub,
        worldSwitch: hubEnabled && worldSwitch
    });
}

export default defineConfig(({ mode }) => {
    let isProduction = mode === 'production',
        env = loadEnv(isProduction);

    return {
        plugins: [
            pwa({
                // Service worker disabled for now.
                selfDestroying: true,
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
            createHtmlPlugin({
                minify: isProduction && { processScripts: ['application/ld+json'] }
            })
        ],
        build: {
            sourcemap: true,
            chunkSizeWarningLimit: 4e3
        },
        server: { port: 9000 },
        define: { 'window.config': env }
    };
});
