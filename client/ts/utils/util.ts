/**
 * New version of the Bind Polyfill
 */

export const isInt = (n) => {
    return n % 1 === 0;
};

export const TRANSITIONEND = 'transitionend webkitTransitionEnd oTransitionEnd';

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (() => {
        return (
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame || // comment out if FF4 is slow (it caps framerate at ~30fps: https://bugzilla.mozilla.org/show_bug.cgi?id=630127)
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            ((callback: FrameRequestCallback) =>
                window.setTimeout(callback, 17))
        );
    })();
}
