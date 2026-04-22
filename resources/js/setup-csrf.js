// Ensure CSRF token and headers are attached to AJAX requests.
const tokenMeta = typeof document !== 'undefined' ? document.head.querySelector('meta[name="csrf-token"]') : null;
const CSRF_TOKEN = tokenMeta ? tokenMeta.content : null;
window.csrfToken = CSRF_TOKEN;

(function attachCsrf() {
    if (typeof window === 'undefined') return;

    // Patch fetch to include CSRF token, Accept header, and credentials by default
    if (window.fetch) {
        try {
            const originalFetch = window.fetch.bind(window);
            window.fetch = (input, init = {}) => {
                init = init || {};
                init.headers = Object.assign({}, init.headers || {});

                if (CSRF_TOKEN && !init.headers['X-CSRF-TOKEN'] && !init.headers['x-csrf-token']) {
                    init.headers['X-CSRF-TOKEN'] = CSRF_TOKEN;
                }

                if (!init.headers['X-Requested-With']) {
                    init.headers['X-Requested-With'] = 'XMLHttpRequest';
                }

                if (!init.headers['Accept']) {
                    init.headers['Accept'] = 'application/json';
                }

                if (!init.credentials) {
                    init.credentials = 'same-origin';
                }

                return originalFetch(input, init);
            };
        } catch (e) {
            // noop
        }
    }

    // If axios is present, set default headers
    try {
        if (window.axios) {
            if (CSRF_TOKEN) {
                window.axios.defaults.headers.common['X-CSRF-TOKEN'] = CSRF_TOKEN;
            }
            window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        }
    } catch (e) {
        // noop
    }

    // If jQuery is present, configure ajaxSetup
    try {
        if (window.jQuery) {
            window.jQuery.ajaxSetup({
                headers: {
                    'X-CSRF-TOKEN': CSRF_TOKEN,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                xhrFields: {
                    withCredentials: true
                }
            });
        }
    } catch (e) {
        // noop
    }
})();
