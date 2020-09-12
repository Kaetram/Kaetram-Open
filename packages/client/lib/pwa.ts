import log from '../ts/lib/log';

interface DeferredPrompt extends Event {
    prompt: () => void;
    userChoice: Promise<{
        outcome: 'accepted';
    }>;
}
let deferredPrompt: DeferredPrompt;

export default async function install(): Promise<void> {
    if (deferredPrompt) {
        try {
            if (localStorage.getItem('prompted') !== 'true') deferredPrompt.prompt();
        } finally {
            const choiceResult = await deferredPrompt.userChoice;

            localStorage.setItem('prompted', 'true');
            if (choiceResult.outcome === 'accepted') {
                // PWA has been installed
            } else {
                // User chose not to install PWA
            }

            deferredPrompt = null;
        }
    }
}

// Check compatibility for the browser we're running this in
if ('serviceWorker' in navigator) {
    // ? Maybe prompt user before refreshing
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    });

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        deferredPrompt = e;
    });

    window.addEventListener('load', async () => {
        if (navigator.serviceWorker.controller)
            log.info('[PWA Builder] active service worker found, no need to register');
        else {
            // Register the service worker
            try {
                const reg = await navigator.serviceWorker.register('sw.js', {
                    scope: '../'
                });

                log.info(
                    `[PWA Builder] Service worker has been registered for scope: ${reg.scope}`
                );

                reg.onupdatefound = () => {
                    const installingWorker = reg.installing;
                    installingWorker.onstatechange = () => {
                        switch (installingWorker.state) {
                            case 'installed':
                                // if (navigator.serviceWorker.controller);
                                break;
                        }
                    };
                };
            } catch (err) {
                log.error('[SW ERROR]', err);
            }
        }
    });
}
