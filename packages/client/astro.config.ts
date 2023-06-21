import { fileURLToPath } from 'node:url';

import { description, name } from '../../package.json';

import { locales, defaultLocale, dir, t, type Locale } from '@kaetram/common/i18n';
import { defineConfig } from 'astro/config';
import config, { exposedConfig } from '@kaetram/common/config';
import webmanifest from 'astro-webmanifest';
import { i18n } from 'astro-i18n-aut';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';
import partytown from '@astrojs/partytown';
import critters from 'astro-critters';
import compress from 'astro-compress';
import compressor from 'astro-compressor';
import glsl from 'vite-plugin-glsl';
import { VitePWA as pwa } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { internalIpV4 } from 'internal-ip';
import { imageSize } from 'image-size';
import sass from 'sass';

export let env = exposedConfig('name', 'host', 'ssl', 'serverId', 'sentryDsn');

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

// https://astro.build/config
export default defineConfig({
    srcDir: './',
    site: 'https://kaetram.com',
    trailingSlash: 'always',
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
            locales: Object.fromEntries(
                Object.entries(locales).map(([locale, lang]) => [
                    locale,
                    {
                        lang,
                        dir: dir(locale as Locale),
                        name: t('meta.name', { lng: locale }),
                        description: t('meta.description', { lng: locale })
                    }
                ])
            ),
            config: {
                insertAppleTouchLinks: true,
                iconPurpose: ['any', 'maskable']
            }
        }),
        partytown({ config: { debug: false } }),
        i18n({ locales, defaultLocale }),
        sitemap({ i18n: { locales, defaultLocale } }),
        robotsTxt({ host: true }),
        critters({ logger: 2 }),
        compress({ logger: 1 }),
        compressor({ gzip: true, brotli: true })
    ],
    server: { host: true, port: 9000 },
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
                        'width($image)'(image: sass.types.String) {
                            let { width } = getImageSize(image.getValue());

                            return new sass.types.Number(width!);
                        },
                        'height($image)'(image: sass.types.String) {
                            let { height } = getImageSize(image.getValue());

                            return new sass.types.Number(height!);
                        }
                    }
                }
            }
        }
    }
});
