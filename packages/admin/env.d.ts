/// <reference types="astro/client" />

import type config from '@kaetram/common/config';

declare global {
    let globalConfig: typeof config;
}

export {};
