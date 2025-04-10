import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// Custom wellness colors
				wellness: {
					cream: '#f8f5ea',
					yellow: '#ffd766',
					mint: '#9ad9d0',
					coral: '#ffc0a1',
					navy: '#2b3c4e',
					peach: '#ffd0bc',
					darkText: '#2a2a2a'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-12px)' }
				},
				'fade-in-up': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'pulse-light': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				},
				'scale-up': {
					'0%': { transform: 'scale(0.95)' },
					'100%': { transform: 'scale(1)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 6s ease-in-out infinite',
				'fade-in-up': 'fade-in-up 0.7s ease-out',
				'pulse-light': 'pulse-light 2s ease-in-out infinite',
				'scale-up': 'scale-up 0.5s ease-out'
			},
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
				serif: ['Playfair Display', 'serif'],
			},
			backgroundImage: {
				'gradient-primary': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
				'gradient-secondary': 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
				'gradient-hero': 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)',
				'gradient-card': 'linear-gradient(to bottom right, rgba(255,255,255,0.8), rgba(255,255,255,0.4))',
				'gradient-wellness': 'linear-gradient(to bottom, #f8f5ea, #ffd766)',
				'gradient-mint': 'linear-gradient(to bottom, #9ad9d0, #f8f5ea)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
