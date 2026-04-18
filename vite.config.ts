import { reactRouter } from '@react-router/dev/vite';
import type { UserConfig } from 'vite';

export default {
  plugins: [reactRouter()],
} satisfies UserConfig;
