/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Modern Dark Theme Base (Zinc/Neutral) aliased as Slate for compatibility
                slate: {
                    50: '#fafafa',
                    100: '#f4f4f5',
                    200: '#e4e4e7',
                    300: '#d4d4d8',
                    400: '#a1a1aa',
                    500: '#71717a',
                    600: '#52525b',
                    700: '#3f3f46',
                    800: '#27272a',
                    900: '#18181b',
                    950: '#09090b', // Deep void black
                },
                primary: '#09090b', // Zinc 950
                secondary: '#3b82f6', // Blue 500
                accent: '#f59e0b', // Amber 500
                // Refined Metallic/Champagne Gold Palette
                gold: {
                    50: '#fbf9f5',
                    100: '#f5f0e6',
                    200: '#ebe0c8',
                    300: '#dfcfa9', // Champagne
                    400: '#d4bf8a',
                    500: '#c9af6b', // Main Metallic Gold
                    600: '#b3964c', // Rich Gold
                    700: '#8f7335',
                    800: '#73592b',
                    900: '#5e4924',
                    950: '#362812',
                },
                'navy': {
                    800: '#1e3a8a',
                    900: '#1e3a8a',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #2a8af6 0deg, #a853ba 180deg, #e92a67 360deg)',
            }
        },
    },
    plugins: [],
}
