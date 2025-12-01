/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#0f172a', // Slate 900
                secondary: '#3b82f6', // Blue 500
                accent: '#f59e0b', // Amber 500
                'navy': {
                    800: '#1e3a8a',
                    900: '#1e3a8a', // Darker blue
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
