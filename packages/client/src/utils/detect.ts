export let userAgentContains = (string: string): boolean => navigator.userAgent.includes(string);

export let isIpad = (): boolean => /ipad/i.test(navigator.userAgent.toLowerCase());

export let isSafari = (): boolean => userAgentContains('Safari') && !userAgentContains('Chrome');

declare global {
    interface Document {
        /** The documentMode is an IE only property. */
        documentMode: number;
    }
}

export let isInternetExplorer = (): boolean => !!document.documentMode;

export let isEdge = (): boolean => !isInternetExplorer() && !!window.StyleMedia;

export let getUserAgent = (): string => navigator.userAgent.toString();

export function isTablet(): boolean {
    let userAgent = navigator.userAgent.toLowerCase(),
        isAppleTablet = /ipad/i.test(userAgent),
        isAndroidTablet = /android/i.test(userAgent);

    return (isAppleTablet || isAndroidTablet) && window.innerWidth >= 640;
}

export let isMobile = (): boolean => window.innerWidth < 1000;

export function iOSVersion(): number | undefined {
    if (window.MSStream)
        // There is some iOS in Windows Phone...
        // https://msdn.microsoft.com/en-us/library/hh869301(v=vs.85).aspx
        return;

    let match = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+?)/);

    if (match !== undefined && match !== null) {
        let version = [
            parseInt(match[1], 10),
            parseInt(match[2], 10),
            parseInt(match[3] || '0', 10)
        ];
        return parseFloat(version.join('.'));
    }
}

export let androidVersion = (): number | undefined => {
    let userAgent = navigator.userAgent.split('Android');

    if (userAgent.length > 1) return parseFloat(userAgent[1].split(';')[0]);
};

export let supportsWebGL = (): boolean =>
    // let canvas = document.createElement('canvas'),
    //     gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    false;

export function isAppleDevice(): boolean {
    let devices = [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ];

    if (navigator.platform)
        while (devices.length > 0) if (navigator.platform === devices.pop()) return true;

    return false;
}

// Older mobile devices will default to non-centred camera mode
export let isOldAndroid = (): boolean => {
    let version = androidVersion();

    return !!version && version < 6;
};

export let isOldApple = (): boolean => {
    let version = iOSVersion();

    return !!version && version < 9;
};

export let useCenteredCamera = (): boolean => isOldAndroid() || isOldApple() || isIpad();
