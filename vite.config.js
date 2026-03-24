import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { viteSingleFile } from 'vite-plugin-singlefile';

const singleFile = process.env.SINGLE_FILE === '1';

export default defineConfig({
    plugins: [
        wasm(),
        topLevelAwait(),
        ...(singleFile ? [viteSingleFile()] : []),
    ],
    build: {
        target: 'esnext',
        outDir: singleFile ? 'dist-single' : 'dist',
        assetsInlineLimit: singleFile ? Infinity : 4096,
    },
    server: {
        port: 3000,
    },
});
