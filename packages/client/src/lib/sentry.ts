import * as Sentry from '@sentry/browser';
import { BrowserTracing } from '@sentry/tracing';

if (window.config.sentryDsn)
    Sentry.init({
        dsn: window.config.sentryDsn,
        integrations: [new BrowserTracing()],
        tracesSampleRate: 1
    });
