import { renderHook, act } from '@testing-library/react';
import { useAppState } from './useAppState';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('useAppState Logic', () => {
    beforeEach(() => {
        window.location.hash = '';
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialize with empty state or default note', async () => {
        const { result } = renderHook(() => useAppState());

        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.state.tabs.length).toBeGreaterThan(0);
        expect(result.current.isLoaded).toBe(true);
    });

    it('createTab should enforce uniqueness', async () => {
        const { result } = renderHook(() => useAppState());

        await act(async () => { await Promise.resolve(); });

        // Clear initial
        act(() => {
            result.current.actions.setState(prev => ({ ...prev, tabs: [] }));
        });

        act(() => {
            result.current.actions.createTab('note');
        });
        expect(result.current.state.tabs[0].title).toBe('Untitled');

        act(() => {
            result.current.actions.createTab('note');
        });
        expect(result.current.state.tabs[1].title).toBe('Untitled 2');
    });

    it('should persist state to URL', async () => {
        const { result } = renderHook(() => useAppState());
        await act(async () => { await Promise.resolve(); });

        act(() => {
            result.current.actions.updateTabContent(result.current.state.activeTabId, 'Hello World');
        });

        await act(async () => {
            vi.runAllTimers();
        });

        expect(window.location.hash).not.toBe('');
    });
});
