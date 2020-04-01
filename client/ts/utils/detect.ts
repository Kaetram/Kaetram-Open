const Detect: {
    getUserAgent?: () => string;
    userAgentContains?: (string: string) => boolean;
    isIPad?: () => boolean;
    isAndroid?: () => boolean;
    isWindows?: () => boolean;
    isFirefox?: () => boolean;
    isSafari?: () => boolean;
    isOpera?: () => boolean;
    isInternetExplorer?: () => boolean;
    isEdge?: () => boolean;
    isFirefoxAndroid?: () => boolean;
    isTablet?: () => boolean;
    isAppleDevice?: () => boolean;
    isOldAndroid?: () => boolean;
    isOldApple?: () => boolean;
    isMobile?: () => boolean;
    iOSVersion?: () => string;
    androidVersion?: () => string;
    useCenteredCamera?: () => boolean;
    supportsWebGL?: () => boolean;
} = {};

Detect.getUserAgent = () => {
    return navigator.userAgent.toString();
};

Detect.userAgentContains = (string) => {
    return navigator.userAgent.indexOf(string) !== -1;
};

Detect.isIPad = () => {
    return /ipad/i.test(navigator.userAgent.toLowerCase());
};

Detect.isAndroid = () => {
    return /Android/i.test(navigator.userAgent);
};

Detect.isWindows = () => {
    return Detect.userAgentContains('Windows');
};

Detect.isFirefox = () => {
    return Detect.userAgentContains('Firefox');
};

Detect.isSafari = () => {
    return (
        Detect.userAgentContains('Safari') &&
        !Detect.userAgentContains('Chrome')
    );
};

Detect.isOpera = () => {
    return Detect.userAgentContains('Opera');
};

Detect.isInternetExplorer = () => {
    return false || !!document.documentMode;
};

Detect.isEdge = () => {
    return !Detect.isInternetExplorer() && !!window.StyleMedia;
};

Detect.isFirefoxAndroid = () => {
    return (
        Detect.userAgentContains('Android') &&
        Detect.userAgentContains('Firefox')
    );
};

Detect.isTablet = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAppleTablet = /ipad/i.test(userAgent);
    const isAndroidTablet = /android/i.test(userAgent);

    return (isAppleTablet || isAndroidTablet) && window.innerWidth >= 640;
};

Detect.isMobile = () => {
    return window.innerWidth < 1000;
};

Detect.isAppleDevice = () => {
    const devices = [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod',
    ];

    if (navigator.platform) {
        while (devices.length) {
            if (navigator.platform === devices.pop()) return true;
        }
    }

    return false;
};

// Older mobile devices will default to non-centred camera mode
Detect.isOldAndroid = () => {
    return parseFloat(Detect.androidVersion()) < 6.0;
};

Detect.isOldApple = () => {
    return parseFloat(Detect.iOSVersion()) < 9.0;
};

Detect.iOSVersion = () => {
    if (window.MSStream) {
        // There is some iOS in Windows Phone...
        // https://msdn.microsoft.com/en-us/library/hh869301(v=vs.85).aspx
        return '';
    }
    const match = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
    let version;

    if (match !== undefined && match !== null) {
        version = [
            parseInt(match[1], 10),
            parseInt(match[2], 10),
            parseInt(match[3] || '0', 10),
        ];
        return version.join('.');
    }

    return '';
};

Detect.androidVersion = () => {
    const userAgent = navigator.userAgent.split('Android');
    let version;

    if (userAgent.length > 1) [version] = userAgent[1].split(';');

    return version;
};

Detect.useCenteredCamera = () => {
    return Detect.isOldAndroid() || Detect.isOldApple() || Detect.isIPad();
};

Detect.supportsWebGL = () => {
    // const canvas = document.createElement('canvas');
    // const gl =
    //     canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    return false;
};

export default Detect;
