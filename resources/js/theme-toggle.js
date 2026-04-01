const STORAGE_KEY = 'theme-preference';
const DARK_CLASS = 'theme-dark';

const getStoredPreference = () => {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
};

const setStoredPreference = (value) => {
    try {
        localStorage.setItem(STORAGE_KEY, value);
    } catch {
        // Ignore storage write failures in private browsing or restricted contexts.
    }
};

const applyTheme = (isDark) => {
    document.documentElement.classList.toggle(DARK_CLASS, isDark);
};

const getInitialTheme = () => {
    const stored = getStoredPreference();

    if (stored === 'dark') {
        return true;
    }

    if (stored === 'light') {
        return false;
    }

    return false;
};

const updateTogglePresentation = (isDark) => {
    const label = document.getElementById('darkModeToggleLabel');
    const icon = document.getElementById('darkModeToggleIcon');

    if (label) {
        label.textContent = isDark ? 'Disable dark mode' : 'Enable dark mode';
    }

    if (icon) {
        icon.className = isDark ? 'bi bi-sun' : 'bi bi-moon-stars';
    }
};

const initializeThemeToggle = () => {
    let isDark = getInitialTheme();

    applyTheme(isDark);
    updateTogglePresentation(isDark);

    const toggle = document.getElementById('darkModeToggle');

    if (!toggle) {
        return;
    }

    toggle.addEventListener('click', () => {
        isDark = !isDark;
        applyTheme(isDark);
        setStoredPreference(isDark ? 'dark' : 'light');
        updateTogglePresentation(isDark);
    });
};

document.addEventListener('DOMContentLoaded', initializeThemeToggle);
