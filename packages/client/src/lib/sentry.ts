import { init, BrowserTracing } from '@sentry/browser';

if (import.meta.env.PROD && globalConfig.sentryDsn)
    init({
        dsn: globalConfig.sentryDsn,
        integrations: [new BrowserTracing()],
        tracesSampleRate: 1
    });
