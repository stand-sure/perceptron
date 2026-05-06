import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` must match your GitHub Pages repo path, e.g. "/perceptron/" for
// stand-sure/perceptron. If you fork to a different repo name, update this
// (or set to "/" if you're serving from a custom domain or user/org site).
export default defineConfig({
  plugins: [react()],
  base: '/perceptron/',
});
