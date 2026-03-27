export function runWhenIdle(fn) {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(fn, { timeout: 2000 });
    } else {
        setTimeout(fn, 1);
    }
}
