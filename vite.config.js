import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    define: {
        global: 'globalThis',
    },
    plugins: [
        laravel({
            input: [
                'resources/sass/app.scss',
                'resources/js/app.js',
            ],
            refresh: true,
        }),
    ],
    input: [
        'resources/css/app.css',
        'resources/css/light-mode.css',
        'resources/css/dark-mode.css',
    ]
});
