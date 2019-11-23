var install = function() {
    if (deferredPrompt) {
        try {
            deferredPrompt.prompt();
        } catch(err) {}
        deferredPrompt.userChoice.then(function(choiceResult) {

            if (choiceResult.outcome === 'accepted')
                log.info('Your PWA has been installed');
            else
                log.info('User chose to not install your PWA');

            deferredPrompt = null;
        });
    }
};

window.addEventListener('beforeinstallprompt', function(e) {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();

    // Stash the event so it can be triggered later.
    deferredPrompt = e;
});

var isUpdateAvailable = new Promise(function(resolve, reject) {
    // This is the "Offline page" service worker

    // Add this below content to your HTML page, or add the js file to your page at the very top to register service worker

    // Check compatibility for the browser we're running this in
    if ('serviceWorker' in navigator) {
        if (navigator.serviceWorker.controller)
            log.info('[PWA Builder] active service worker found, no need to register');
        else {
            // Register the service worker
            navigator.serviceWorker.register('sw.js', {
                    scope: '../'
                }).then(function(reg) {
                    log.info('[PWA Builder] Service worker has been registered for scope: ' + reg.scope);

                    reg.onupdatefound = function() {
                        var installingWorker = reg.installing;
                        installingWorker.onstatechange = function() {
                            switch (installingWorker.state) {
                                case 'installed':
                                    if (navigator.serviceWorker.controller);
                                    break;
                            }
                        };
                    };
                })
                .catch(function(err) {
                    log.error('[SW ERROR]', err)
                });
        }    
    }
});