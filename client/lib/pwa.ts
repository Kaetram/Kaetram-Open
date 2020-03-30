let deferredPrompt = null;

export default () => {
    if (deferredPrompt) {
        try {
            if (localStorage.getItem('prompted') !== 'true')
                deferredPrompt.prompt();
        } catch (err) {}
        deferredPrompt.userChoice.then((choiceResult) => {
            localStorage.setItem('prompted', 'true');
            if (choiceResult.outcome === 'accepted') {
                // PWA has been installed
            } else {
                // User chose not to install PWA
            }

            deferredPrompt = null;
        });
    }
};

// Check compatibility for the browser we're running this in
if ('serviceWorker' in navigator) {
    let refreshing;
    // ? Maybe prompt user before force refreshing
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload(true);
    });
}

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    deferredPrompt = e;
});

window.addEventListener('load', () => {
    if (navigator.serviceWorker.controller)
        console.info(
            '[PWA Builder] active service worker found, no need to register'
        );
    else {
        // Register the service worker
        navigator.serviceWorker
            .register('sw.js', {
                scope: '../'
            })
            .then((reg) => {
                console.info(
                    '[PWA Builder] Service worker has been registered for scope: ' +
                        reg.scope
                );

                reg.onupdatefound = () => {
                    const installingWorker = reg.installing;
                    installingWorker.onstatechange = () => {
                        switch (installingWorker.state) {
                            case 'installed':
                                if (navigator.serviceWorker.controller)
                                    // XXX: Installed;
                                    break;
                        }
                    };
                };
            })
            .catch((err) => {
                console.error('[SW ERROR]', err);
            });
    }
});
