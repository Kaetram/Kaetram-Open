import log from '../src/lib/log';

/**
 * The `BeforeInstallPromptEvent` is fired at the `Window.onbeforeinstallprompt` handler
 * before a user is prompted to "install" a web site to a home screen on mobile.
 */
interface BeforeInstallPromptEvent extends Event {
    /**
     * Returns an array of `DOMString` items containing the platforms on which the event was
     * dispatched. This is provided for user agents that want to present a choice of versions
     * to the user such as, for example, "web" or "play" which would allow the user to chose
     * between a web version or an Android version.
     */
    readonly platforms: string[];

    /**
     * Returns a `Promise` that resolves to a `DOMString`
     * containing either "accepted" or "dismissed".
     */
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;

    /**
     * Allows a developer to show the install prompt at a time of their own choosing.
     * This method returns a Promise.
     */
    prompt(): Promise<void>;
}
declare global {
    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent;
    }
}

let deferredPrompt: BeforeInstallPromptEvent | null;

export default async function install(): Promise<void> {
    if (!deferredPrompt) return;

    if (localStorage.getItem('prompted') !== 'true')
        await deferredPrompt.prompt().catch((err) => {
            log.error('[SW ERROR]', err);
        });

    const { outcome } = await deferredPrompt.userChoice;

    localStorage.setItem('prompted', 'true');
    if (outcome === 'accepted') {
        // PWA has been installed
    }
    // User chose not to install PWA
    else;

    deferredPrompt = null;
}

async function init(): Promise<void> {
    window.addEventListener('beforeinstallprompt', (event) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt.
        event.preventDefault();

        deferredPrompt = event;
    });

    const { Workbox } = await import('workbox-window');

    const wb = new Workbox('/service-worker.js');

    wb.register();
}

// Check compatibility for the browser and environment we're running this in.
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) init();
