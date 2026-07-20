import { ref } from 'vue';

const STORAGE_KEY = 'appTheme';

function preferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
}

export const appTheme = ref(preferredTheme());

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', theme === 'dark' ? '#101419' : '#f7f4ee');
}

export function setAppTheme(theme) {
    appTheme.value = theme === 'dark' ? 'dark' : 'light';
    localStorage.setItem(STORAGE_KEY, appTheme.value);
    applyTheme(appTheme.value);
}

export function toggleAppTheme() {
    setAppTheme(appTheme.value === 'dark' ? 'light' : 'dark');
}

applyTheme(appTheme.value);
