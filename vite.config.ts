import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import type { UserConfig } from 'vite';

export default {
  plugins: [tailwindcss(), reactRouter()],
} satisfies UserConfig;
