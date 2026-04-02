import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, cpSync } from 'fs';

const singleFile = process.env.SINGLE_FILE === '1';
const isExtension = process.env.BUILD_TARGET === 'extension';

const extensionCopyPlugin = () => ({
    name: 'copy-extension-files',
    closeBundle() {
        const out = 'dist-extension';
        copyFileSync('manifest.json', resolve(out, 'manifest.json'));
        copyFileSync('popup.html', resolve(out, 'popup.html'));
        copyFileSync('popup.js', resolve(out, 'popup.js'));
        mkdirSync(resolve(out, 'icons'), { recursive: true });
        cpSync('icons', resolve(out, 'icons'), { recursive: true });
    }
});

export default defineConfig({
    plugins: [
        wasm(),
        topLevelAwait(),
        ...(singleFile ? [viteSingleFile()] : []),
        ...(isExtension ? [extensionCopyPlugin()] : []),
    ],
    base: isExtension ? './' : process.env.BASE_PATH || '/',
    build: {
        target: 'esnext',
        outDir: singleFile ? 'dist-single' : isExtension ? 'dist-extension' : 'dist',
        assetsInlineLimit: singleFile ? Infinity : 4096,
    },
    server: {
        port: 3000,
    },
});
