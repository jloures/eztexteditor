import { useEffect } from 'react';
import { useStore } from '../store';

export const useShortcuts = (
    toggleSearch: () => void
) => {
    const {
        settings, updateSettings, togglePanicMode,
        isPanicMode
    } = useStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Panic Mode (Alt + P)
            if (e.altKey && (e.key === 'p' || e.key === 'P')) {
                e.preventDefault();
                togglePanicMode();
            }

            if (isPanicMode && e.key === 'Escape') {
                togglePanicMode();
            }

            // Search (Cmd + K or Cmd + P)
            if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'p')) {
                e.preventDefault();
                toggleSearch();
            }

            // Zen Mode (Alt + Z)
            if (e.altKey && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                updateSettings({ isZen: !settings.isZen });
            }

            if (settings.isZen && e.key === 'Escape') {
                updateSettings({ isZen: false });
            }

            // Save (Cmd + S) - handled by auto-save but prevent browser default
            if ((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                // Trigger immediate save if needed, but debouncer handles it
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [settings, isPanicMode, togglePanicMode, updateSettings, toggleSearch]);
};
