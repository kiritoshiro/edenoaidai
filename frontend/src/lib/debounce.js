// Delays `fn` until `wait` ms have passed without another call.
// `cancel()` drops a pending call, e.g. when the view is left mid-typing.
export function debounce(fn, wait) {
    let timeout;
    function debounced(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), wait);
    }
    debounced.cancel = () => clearTimeout(timeout);
    return debounced;
}
