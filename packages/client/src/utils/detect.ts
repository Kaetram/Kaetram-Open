export const isIpad = (): boolean => {
    return /ipad/i.test(navigator.userAgent.toLowerCase());
};

export const isAndroid = (): boolean => {
    return /Android/i.test(navigator.userAgent);
};

export const isWindows = (): boolean => {
    return userAgentContains('Windows');
};

export const isFirefox = (): boolean => {
    return userAgentContains('Firefox');
};

export const isSafari = (): boolean => {
    return userAgentContains('Safari') && !userAgentContains('Chrome');
};

export const isOpera = (): boolean => {
    return userAgentContains('Opera');
};

interface IEDocument extends Document {
    documentMode: unknown | undefined;
}

export const isInternetExplorer = (): boolean => {
    return false || !!(document as IEDocument).documentMode;
};

export const isEdge = (): boolean => {
    return !isInternetExplorer() && !!window.StyleMedia;
};

export const isFirefoxAndroid = (): boolean => {
    return userAgentContains('Android') && userAgentContains('Firefox');
};

export const userAgentContains = (string: string): boolean => {
    return navigator.userAgent.indexOf(string) !== -1;
};

export const getUserAgent = (): string => {
    return navigator.userAgent.toString();
};

export const isTablet = (): boolean => {
    const userAgent = navigator.userAgent.toLowerCase(),
        isAppleTablet = /ipad/i.test(userAgent),
        isAndroidTablet = /android/i.test(userAgent);

    return (isAppleTablet || isAndroidTablet) && window.innerWidth >= 640;
};

export const isMobile = (): boolean => {
    return window.innerWidth < 1000;
};

export const iOSVersion = (): number => {
    if (window.MSStream) {
        // There is some iOS in Windows Phone...
        // https://msdn.microsoft.com/en-us/library/hh869301(v=vs.85).aspx
        return;
    }

    const match = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);

    if (match !== undefined && match !== null) {
        const version = [
            parseInt(match[1], 10),
            parseInt(match[2], 10),
            parseInt(match[3] || '0', 10)
        ];
        return parseFloat(version.join('.'));
    }

    return;
};

export const androidVersion = (): string => {
    const userAgent = navigator.userAgent.split('Android');

    if (userAgent.length > 1) return userAgent[1].split(';')[0];
};

export const supportsWebGL = (): boolean => {
    //var canvas = document.createElement('canvas'),
    //    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    return false;
};

export const isAppleDevice = (): boolean => {
    const devices = [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ];

    if (navigator.platform)
        while (devices.length) if (navigator.platform === devices.pop()) return true;

    return false;
};

// Older mobile devices will default to non-centred camera mode
export const isOldAndroid = (): boolean => {
    return parseFloat(androidVersion()) < 6.0;
};

export const isOldApple = (): boolean => {
    return iOSVersion() < 9.0;
};

export const useCenteredCamera = (): boolean => {
    return isOldAndroid() || isOldApple() || isIpad();
};
