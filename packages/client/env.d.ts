/// <reference types="astro/client" />
/// <reference types="vite-plugin-pwa/client" />

import type { env } from './astro.config';
import type Game from './src/game';

declare global {
    interface Window {
        /**
         * The active game runtime. Automation and accessibility integrations use
         * this stable bridge instead of reaching into framework internals.
         */
        readonly game?: Game;
    }

    let globalConfig: typeof env & {
        version: string;
        minor: string;
        port: number;
        hub: string | false;
        sentryDsn: string;
        acceptLicense: boolean;
    };

    declare module '*.vert' {
        let src: string;
        export default src;
    }

    declare module '*.frag' {
        let src: string;
        export default src;
    }
}

export {};
