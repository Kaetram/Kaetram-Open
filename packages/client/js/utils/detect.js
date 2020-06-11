export const isIpad = () => {
    return /ipad/i.test(navigator.userAgent.toLowerCase());
};

export const isAndroid = () => {
    return /Android/i.test(navigator.userAgent);
};

export const isWindows = () => {
    return userAgentContains('Windows');
};

export const isFirefox = () => {
    return userAgentContains('Firefox');
};

export const isSafari = () => {
    return userAgentContains('Safari') && !userAgentContains('Chrome');
};

export const isOpera = () => {
    return userAgentContains('Opera');
};

export const isInternetExplorer = () => {
    return false || !!document.documentMode;
};

export const isEdge = () => {
    return !isInternetExplorer() && !!window.StyleMedia;
};

export const isFirefoxAndroid = () => {
    return userAgentContains('Android') && userAgentContains('Firefox');
};

export const userAgentContains = (string) => {
    return navigator.userAgent.indexOf(string) !== -1;
};

export const getUserAgent = () => {
    return navigator.userAgent.toString();
};

export const isTablet = () => {
    var userAgent = navigator.userAgent.toLowerCase(),
        isAppleTablet = /ipad/i.test(userAgent),
        isAndroidTablet = /android/i.test(userAgent);

    return (isAppleTablet || isAndroidTablet) && window.innerWidth >= 640;
};

export const isMobile = () => {
    return window.innerWidth < 1000;
};

export const iOSVersion = () => {
    if (window.MSStream) {
        // There is some iOS in Windows Phone...
        // https://msdn.microsoft.com/en-us/library/hh869301(v=vs.85).aspx
        return '';
    }
    var match = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/),
        version;

    if (match !== undefined && match !== null) {
        version = [
            parseInt(match[1], 10),
            parseInt(match[2], 10),
            parseInt(match[3] || 0, 10),
        ];
        return parseFloat(version.join('.'));
    }

    return '';
};

export const androidVersion = () => {
    var userAgent = navigator.userAgent.split('Android'),
        version;

    if (userAgent.length > 1) version = userAgent[1].split(';')[0];

    return version;
};

export const supportsWebGL = () => {
    //var canvas = document.createElement('canvas'),
    //    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    return false;
};

export const isAppleDevice = () => {
    var devices = [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod',
    ];

    if (!!navigator.platform)
        while (devices.length)
            if ((navigator.platform = devices.pop())) return true;

    return false;
};

// Older mobile devices will default to non-centred camera mode
export const isOldAndroid = () => {
    return parseFloat(androidVersion() < 6.0);
};

export const isOldApple = () => {
    return parseFloat(iOSVersion() < 9.0);
};

export const useCenteredCamera = () => {
    return isOldAndroid() || isOldApple() || isIpad();
};
