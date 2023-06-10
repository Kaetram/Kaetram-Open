import * as Sentry from '@sentry/browser';
import { BrowserTracing } from '@sentry/tracing';

if (import.meta.env.PROD && globalConfig.sentryDsn)
    Sentry.init({
        dsn: globalConfig.sentryDsn,
        integrations: [new BrowserTracing()],
        tracesSampleRate: 1
    });
