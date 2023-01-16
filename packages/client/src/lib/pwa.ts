import log from './log';

import { registerSW } from 'virtual:pwa-register';

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
        await deferredPrompt.prompt().catch((error: Error) => log.error('[SW ERROR]', error));

    let { outcome } = await deferredPrompt.userChoice;

    localStorage.setItem('prompted', 'true');
    if (outcome === 'accepted') {
        // PWA has been installed
    }
    // User chose not to install PWA
    else;

    deferredPrompt = null;
}

function init(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt.
        event.preventDefault();

        deferredPrompt = event;
    });

    registerSW({ immediate: true });
}

// Check compatibility for the browser and environment we're running this in.
if (import.meta.env.PROD && 'serviceWorker' in navigator) init();
