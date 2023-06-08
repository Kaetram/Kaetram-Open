import { fileURLToPath } from 'node:url';

import { description, name } from '../../package.json';

import config, { type Config } from '@kaetram/common/config';
import glsl from 'vite-plugin-glsl';
import { defineConfig } from 'astro/config';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { VitePWA as pwa } from 'vite-plugin-pwa';
import { internalIpV4 } from 'internal-ip';
import { imageSize } from 'image-size';
import sass from 'sass';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';
import critters from 'astro-critters';
import compress from 'astro-compress';
import webmanifest from 'astro-webmanifest';
import compressor from 'astro-compressor';

let expose = ['name', 'host', 'ssl', 'serverId', 'sentryDsn'] as const;

interface ExposedConfig extends Pick<Config, typeof expose[number]> {
    version: string;
    minor: string;
    port: number;
    hub: string | false;
    sentryDsn: string;
}

declare global {
    let globalConfig: ExposedConfig;
}

let env = {} as ExposedConfig;

for (let key of expose) env[key] = config[key] as never;

let clientHost = config.clientRemoteHost || (config.hubEnabled ? config.hubHost : config.host),
    clientPort = config.clientRemotePort || (config.hubEnabled ? config.hubPort : config.port),
    hub = config.ssl ? `https://${clientHost}` : `http://${clientHost}:${clientPort}`;

Object.assign(env, {
    version: config.gver,
    minor: config.minor,
    host: clientHost,
    port: clientPort,
    hub: config.hubEnabled && hub
});

let ipv4 = await internalIpV4(),
    plugins = [
        glsl(),
        pwa({
            registerType: 'autoUpdate',
            workbox: {
                cacheId: name,
                globDirectory: 'dist',
                globPatterns: ['**/*.{js,css,svg,png,jpg,jpeg,gif,webp,woff,woff2,ttf,eot,ico}'],
                navigateFallback: null
            }
        })
    ];

if (config.sentryDsn && !config.debugging)
    plugins.push(
        sentryVitePlugin({
            include: '.',
            org: config.sentryOrg,
            project: config.sentryProject,
            authToken: config.sentryAuthToken,
            sourcemaps: { assets: './dist/**' }
        })
    );

let imageCache = new Map<string, { width?: number; height?: number }>();
function getImageSize(image: string) {
    if (!imageCache.has(image)) {
        let path = fileURLToPath(new URL(`public/img/interface/${image}.png`, import.meta.url)),
            size = imageSize(path);

        imageCache.set(image, size);
    }

    return imageCache.get(image)!;
}

export default defineConfig({
    srcDir: './',
    site: 'https://kaetram.com',
    integrations: [
        webmanifest({
            icon: 'public/icon.png',
            name: config.name,
            description,
            categories: ['entertainment', 'games'],
            lang: 'en-US',
            dir: 'ltr',
            start_url: '/',
            theme_color: '#000000',
            background_color: '#000000',
            display: 'fullscreen',
            orientation: 'landscape-primary',
            locales: {
                ro: { name: 'Kaetram', lang: 'ro-RO' }
            },
            config: {
                insertAppleTouchLinks: true,
                iconPurpose: ['any', 'badge', 'maskable']
            }
        }),
        sitemap({
            i18n: {
                defaultLocale: 'en',
                locales: { en: 'en-US', ro: 'ro-RO' }
            }
        }),
        robotsTxt({ host: true }),
        critters({ logger: 2 }),
        compress({ logger: 1 }),
        compressor({ gzip: true, brotli: true })
    ],
    server: { host: '0.0.0.0', port: 9000 },
    vite: {
        plugins,
        build: { sourcemap: true },
        server: {
            strictPort: true,
            hmr: { protocol: 'ws', host: ipv4, port: 5183 }
        },
        define: { globalConfig: env },
        css: {
            preprocessorOptions: {
                scss: {
                    functions: {
                        'width($image)': (image: sass.types.String) => {
                            let { width } = getImageSize(image.getValue());

                            return new sass.types.Number(width!);
                        },
                        'height($image)': (image: sass.types.String) => {
                            let { height } = getImageSize(image.getValue());

                            return new sass.types.Number(height!);
                        }
                    }
                }
            }
        }
    }
});
