import React, { useEffect, useMemo } from 'react';
import { useAppState } from './hooks/useAppState';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header';
import Editor from './components/Editor/Editor';
import Modals from './components/Modals/Modals';
import { PanicOverlay } from './components/PanicOverlay';
import { startTutorial } from './utils/tutorial';

const IS_MAC = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

function App() {
  const { state, actions, isLoaded, isLocked, modal, showPanic, hasKey } = useAppState();

  // Handle Global Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMod = IS_MAC ? e.metaKey : e.ctrlKey;
      const key = e.key.toLowerCase();

      // Global Search: Cmd+Shift+F
      if (isMod && e.shiftKey && key === 'f') {
        e.preventDefault();
        modal.openModal('search');
      }
      // Local Search: Cmd+F
      else if (isMod && !e.shiftKey && key === 'f') {
        e.preventDefault();
        modal.openModal('search', { local: true }); // We'll adapt search modal
      }
      // Save/Download: Cmd+S
      else if (isMod && !e.shiftKey && !e.altKey && key === 's') {
        e.preventDefault();
        actions.backupNotebook();
      }
      // Toggle Preview: Cmd+Shift+P
      else if (isMod && e.shiftKey && key === 'p') {
        e.preventDefault();
        actions.updateSettings({ isPreviewMode: !state.settings.isPreviewMode });
      }
      // Info: Cmd+/
      else if (isMod && key === '/') {
        e.preventDefault();
        modal.openModal('info');
      }
      // Share: Cmd+Shift+S
      else if (isMod && e.shiftKey && key === 's') {
        e.preventDefault();
        modal.openModal('share');
      }
      // Encryption: Cmd+Shift+L
      else if (isMod && e.shiftKey && key === 'l') {
        e.preventDefault();
        modal.openModal('security');
      }
      // New Scratch / Clear All: Cmd+Shift+Delete/Backspace
      else if (isMod && e.shiftKey && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        modal.openModal('confirm-delete', { id: 'ALL' });
      }
      // Theme: Cmd+Shift+D
      else if (isMod && e.shiftKey && key === 'd') {
        e.preventDefault();
        actions.updateSettings({ theme: state.settings.theme === 'dark' ? 'light' : 'dark' });
      }
      // Copy All: Cmd+Alt+C
      else if (isMod && e.altKey && key === 'c') {
        e.preventDefault();
        actions.copyCurrentTab();
      }
      // Line Numbers: Cmd+H
      else if (isMod && key === 'h') {
        e.preventDefault();
        actions.updateSettings({ showLineNumbers: !state.settings.showLineNumbers });
      }
      // Graph View: Alt+G
      else if (e.altKey && key === 'g') {
        e.preventDefault();
        modal.openModal('graph');
      }
      // Mac specific toggles
      else if (IS_MAC && e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey) {
        if (key === 'e') { e.preventDefault(); actions.updateSettings({ isZen: !state.settings.isZen }); }
        else if (key === 'j') { e.preventDefault(); actions.updateSettings({ isTypewriterMode: !state.settings.isTypewriterMode }); }
        else if (key === 'k') { e.preventDefault(); actions.togglePanic(); }
      }
      // Windows Alt toggles
      else if (!IS_MAC && e.altKey && !e.metaKey && !e.shiftKey && !e.ctrlKey) {
        if (key === 'z') { e.preventDefault(); actions.updateSettings({ isZen: !state.settings.isZen }); }
        else if (key === 't') { e.preventDefault(); actions.updateSettings({ isTypewriterMode: !state.settings.isTypewriterMode }); }
        else if (key === 'p') { e.preventDefault(); actions.togglePanic(); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, actions, modal]);

  // Zen & Theme Effects
  useEffect(() => {
    document.body.classList.toggle('zen-mode', state.settings.isZen);
    document.body.setAttribute('data-theme', state.settings.theme);

    if (state.settings.isZen) {
      const hint = document.querySelector('.zen-hint');
      if (hint) {
        hint.classList.remove('faded');
        const timeout = setTimeout(() => {
          hint.classList.add('faded');
        }, 3000);
        return () => clearTimeout(timeout);
      }
    }
  }, [state.settings.isZen, state.settings.theme]);

  // Handle Tutorial Auto-Start (Legacy logic)
  useEffect(() => {
    if (isLoaded && state.tabs.length === 1 && state.tabs[0].title === 'Untitled' && state.tabs[0].content === '') {
      // Optional: auto-trigger logic if desired, but typically we let user trigger.
      // Legacy code didn't auto-start, just configured labels.
    }
  }, [isLoaded]);

  const activeTab = useMemo(() => {
    const findNote = (items) => {
      for (const item of items) {
        if (item.id === state.activeTabId) return item;
        if (item.children) {
          const found = findNote(item.children);
          if (found) return found;
        }
      }
    };
    return findNote(state.tabs);
  }, [state.tabs, state.activeTabId]);

  const wordCount = useMemo(() => {
    if (!activeTab || !activeTab.content) return 0;
    return activeTab.content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, [activeTab]);

  if (!isLoaded) return <div className="h-screen bg-ez-bg flex items-center justify-center text-ez-meta">Loading...</div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-ez-bg text-ez-text font-sans">
      <Header
        settings={state.settings}
        actions={actions}
        onOpenModal={modal.openModal}
        wordCount={wordCount}
        isLocked={hasKey || isLocked}
      />
      <main className="flex flex-1 overflow-hidden relative">
        <Sidebar
          tabs={state.tabs}
          activeId={state.activeTabId}
          collapsed={state.collapsedFolders}
          actions={actions}
          onOpenModal={modal.openModal}
        />
        <Editor
          activeTabId={state.activeTabId}
          tabs={state.tabs}
          actions={actions}
          settings={state.settings}
        />
      </main>

      <Modals
        activeModal={modal.activeModal}
        onClose={modal.closeModal}
        onOpenModal={modal.openModal}
        modalData={modal.modalData}
        state={state}
        actions={actions}
        hasKey={hasKey}
        isLocked={isLocked}
      />

      {showPanic && <PanicOverlay onExit={actions.togglePanic} />}
    </div>
  );
}

export default App;
