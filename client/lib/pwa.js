var deferredPrompt = null;

var install = function() {
    if (deferredPrompt) {
        try {
            deferredPrompt.prompt();
        } catch(err) {}
        deferredPrompt.userChoice.then(function(choiceResult) {

            if (choiceResult.outcome === 'accepted')
                log.info('PWA has been installed');
            else
                log.info('User chose not to install PWA');

            deferredPrompt = null;
        });
    }
};

window.addEventListener('beforeinstallprompt', function(e) {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    deferredPrompt = e;
});

// Check compatibility for the browser we're running this in
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
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
    });
}
