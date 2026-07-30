export function reportError(error) {
    globalThis.Sentry?.captureException?.(error);
    console.error(error);
}
