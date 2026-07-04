/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            screens: {
                'sm': '480px',
                'md': '768px',
                'lg': '1024px',
                'xl': '1280px',
                '2xl': '1536px',
            },
            spacing: {
                'sidebar': '280px',
                'sidebar-tablet': '240px',
            },
            minHeight: {
                'touch': '2.75rem',
            },
            minWidth: {
                'touch': '2.75rem',
            },
            colors: {
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    dark: 'var(--color-primary-dark)',
                    light: 'var(--color-primary-light)',
                },
                bg: {
                    page: 'var(--bg-page)',
                    primary: 'var(--bg-primary)',
                    secondary: 'var(--bg-secondary)',
                    tertiary: 'var(--bg-tertiary)',
                },
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    tertiary: 'var(--text-tertiary)',
                    muted: 'var(--text-muted)',
                },
                border: {
                    DEFAULT: 'var(--border-color)',
                    light: 'var(--border-light)',
                },
                glass: {
                    bg: 'var(--glass-bg)',
                    border: 'var(--glass-border)',
                    'border-hover': 'var(--glass-border-hover)',
                },
                success: 'var(--color-success)',
                warning: 'var(--color-warning)',
                danger: 'var(--color-danger)',
                info: 'var(--color-info)',
            },
            borderRadius: {
                glass: 'var(--glass-radius)',
                'glass-sm': 'var(--glass-radius-sm)',
                'glass-lg': 'var(--glass-radius-lg)',
            },
            boxShadow: {
                'glass-sm': 'var(--glass-shadow-sm)',
                glass: 'var(--glass-shadow)',
                'glass-lg': 'var(--glass-shadow-lg)',
                'glass-hover': 'var(--glass-shadow-hover)',
            },
            backdropBlur: {
                glass: '12px',
                'glass-sm': '6px',
                'glass-lg': '20px',
            },
        },
    },
    plugins: [],
}