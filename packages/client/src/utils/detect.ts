export const userAgentContains = (string: string): boolean => navigator.userAgent.includes(string);

export const isIpad = (): boolean => /ipad/i.test(navigator.userAgent.toLowerCase());

export const isSafari = (): boolean => userAgentContains('Safari') && !userAgentContains('Chrome');

declare global {
    interface Document {
        /** The documentMode is an IE only property. */
        documentMode: number;
    }
}

export const isInternetExplorer = (): boolean => !!document.documentMode;

export const isEdge = (): boolean => !isInternetExplorer() && !!window.StyleMedia;

export const getUserAgent = (): string => navigator.userAgent.toString();

export function isTablet(): boolean {
    const userAgent = navigator.userAgent.toLowerCase(),
        isAppleTablet = /ipad/i.test(userAgent),
        isAndroidTablet = /android/i.test(userAgent);

    return (isAppleTablet || isAndroidTablet) && window.innerWidth >= 640;
}

export const isMobile = (): boolean => window.innerWidth < 1000;

export function iOSVersion(): number | undefined {
    if (window.MSStream)
        // There is some iOS in Windows Phone...
        // https://msdn.microsoft.com/en-us/library/hh869301(v=vs.85).aspx
        return;

    const match = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);

    if (match !== undefined && match !== null) {
        const version = [
            parseInt(match[1], 10),
            parseInt(match[2], 10),
            parseInt(match[3] || '0', 10)
        ];
        return parseFloat(version.join('.'));
    }
}

export const androidVersion = (): number | undefined => {
    const userAgent = navigator.userAgent.split('Android');

    if (userAgent.length > 1) return parseFloat(userAgent[1].split(';')[0]);
};

export const supportsWebGL = (): boolean =>
    // const canvas = document.createElement('canvas'),
    //     gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    false;

export function isAppleDevice(): boolean {
    const devices = [
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
export const isOldAndroid = (): boolean => {
    const version = androidVersion();

    return !!version && version < 6;
};

export const isOldApple = (): boolean => {
    const version = iOSVersion();

    return !!version && version < 9;
};

export const useCenteredCamera = (): boolean => isOldAndroid() || isOldApple() || isIpad();
