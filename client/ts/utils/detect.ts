const Detect: { [key: string]: any } = {};

Detect.isIpad = () => {
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
    // @ts-ignore
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

Detect.userAgentContains = function(string) {
    return navigator.userAgent.indexOf(string) !== -1;
};

Detect.getUserAgent = () => {
    return navigator.userAgent.toString();
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

Detect.iOSVersion = () => {
    if (window.MSStream) {
        // There is some iOS in Windows Phone...
        // https://msdn.microsoft.com/en-us/library/hh869301(v=vs.85).aspx
        return '';
    }
    const match: any = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
    let version;

    if (match !== undefined && match !== null) {
        version = [
            parseInt(match[1], 10),
            parseInt(match[2], 10),
            parseInt(match[3] || 0, 10)
        ];
        return parseFloat(version.join('.'));
    }

    return '';
};

Detect.androidVersion = () => {
    const userAgent = navigator.userAgent.split('Android');
    let version;

    if (userAgent.length > 1) version = userAgent[1].split(';')[0];

    return version;
};

Detect.isAppleDevice = () => {
    const devices = [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ];

    if (navigator.platform)
        while (devices.length)
            if (navigator.platform === devices.pop()) return true;

    return false;
};

// Older mobile devices will default to non-centred camera mode
Detect.isOldAndroid = () => {
    return parseFloat(Detect.androidVersion()) < 6.0;
};

Detect.isOldApple = () => {
    return parseFloat(Detect.iOSVersion()) < 9.0;
};

Detect.useCenteredCamera = () => {
    return Detect.isOldAndroid() || Detect.isOldApple() || Detect.isIpad();
};

export default Detect;
