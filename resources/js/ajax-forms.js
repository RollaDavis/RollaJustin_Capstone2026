document.addEventListener('DOMContentLoaded', () => {
    const csrfToken = window.csrfToken || (document.head.querySelector('meta[name="csrf-token"]') || {}).content;

    const submitAjaxForm = async (container) => {
        // Clear previous errors
        container.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        container.querySelectorAll('.invalid-feedback').forEach(el => el.remove());

        const action = container.getAttribute('data-action') || container.getAttribute('action') || '';
        const method = (container.getAttribute('data-method') || container.getAttribute('method') || 'POST').toUpperCase();

        const formData = new FormData();
        // collect inputs inside container
        container.querySelectorAll('input[name], select[name], textarea[name]').forEach((el) => {
            const name = el.getAttribute('name');
            if (!name) return;
            if ((el.type === 'checkbox' || el.type === 'radio')) {
                if (el.checked) {
                    formData.append(name, el.value);
                }
            } else {
                formData.append(name, el.value ?? '');
            }
        });

        const opts = {
            method,
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            },
            credentials: 'same-origin'
        };

        if (method !== 'GET') {
            opts.body = formData;
        }

        try {
            const resp = await fetch(action, opts);

            if (resp.status === 422) {
                const payload = await resp.json().catch(() => ({}));
                const errors = payload.errors || {};
                Object.keys(errors).forEach((field) => {
                    const fieldEls = container.querySelectorAll('[name="' + field + '"]');
                    if (fieldEls.length === 0) return;
                    fieldEls.forEach((fieldEl) => {
                        fieldEl.classList.add('is-invalid');
                        const msg = document.createElement('div');
                        msg.className = 'invalid-feedback';
                        msg.textContent = (errors[field] || []).join(' ');
                        if (fieldEl.parentNode) fieldEl.parentNode.appendChild(msg);
                    });
                });
                return;
            }

            // If redirected by server (non-AJAX redirect), follow
            if (resp.redirected) {
                window.location.href = resp.url;
                return;
            }

            // Try parse JSON for success signals
            const data = await resp.json().catch(() => null);

            if (data && data.redirect) {
                window.location.href = data.redirect;
                return;
            }

            if (data && data.url) {
                window.location.href = data.url;
                return;
            }

            // default: reload to update authenticated state
            if (resp.ok) {
                window.location.reload();
                return;
            }

            // otherwise, show generic error
            const errText = await resp.text().catch(() => 'Request failed');
            alert(errText);
        } catch (err) {
            console.error(err);
            alert('Request failed');
        }
    };

    // attach submit handlers
    document.querySelectorAll('[data-ajax-form]').forEach((container) => {
        // find submit buttons
        container.querySelectorAll('[data-ajax-submit]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                submitAjaxForm(container);
            });
        });
    });

    // global helper for logout links with data-ajax-logout attribute
    document.querySelectorAll('[data-ajax-logout]').forEach((el) => {
        el.addEventListener('click', async (e) => {
            e.preventDefault();
            const url = el.getAttribute('data-action') || el.getAttribute('href') || '/logout';
            try {
                const resp = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json'
                    },
                    credentials: 'same-origin'
                });

                if (resp.redirected) {
                    window.location.href = resp.url;
                    return;
                }

                if (resp.ok) {
                    window.location.reload();
                    return;
                }

                const txt = await resp.text().catch(() => 'Logout failed');
                alert(txt);
            } catch (err) {
                console.error(err);
                alert('Logout failed');
            }
        });
    });
});
