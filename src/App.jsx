import React, { useEffect, useMemo } from 'react';
import { useAppState } from './hooks/useAppState';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header';
import Editor from './components/Editor/Editor';
import Modals from './components/Modals/Modals';
import { PanicOverlay } from './components/PanicOverlay';
import { startTutorial } from './utils/tutorial';

function App() {
  const { state, actions, isLoaded, isLocked, modal, showPanic, hasKey } = useAppState();

  // Global Effects
  useEffect(() => {
    if (state.settings.isZen) {
      document.body.classList.add('zen-mode');
    } else {
      document.body.classList.remove('zen-mode');
    }
  }, [state.settings.isZen]);

  useEffect(() => {
    if (state.settings.theme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [state.settings.theme]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt+P : Panic
      if (e.altKey && e.code === 'KeyP') {
        e.preventDefault();
        actions.togglePanic();
      }
      // Alt+Z : Zen
      if (e.altKey && e.code === 'KeyZ') {
        e.preventDefault();
        actions.updateSettings({ isZen: !state.settings.isZen });
      }
      // Alt+G : Graph
      if (e.altKey && e.code === 'KeyG') {
        e.preventDefault();
        modal.openModal('graph');
      }
      // Cmd+K : Search
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyK') {
        e.preventDefault();
        modal.openModal('search');
      }
      // Esc : Exit Zen or Close Modal
      if (e.code === 'Escape') {
        if (modal.activeModal) {
          modal.closeModal();
        } else if (state.settings.isZen) {
          actions.updateSettings({ isZen: false });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, modal, state.settings.isZen, showPanic]);

  // Tutorial Auto-Start
  useEffect(() => {
    if (isLoaded && !modal.activeModal && !isLocked) {
      // Simple check to debounce basic initial load
      const hasSeen = localStorage.getItem('ez_has_seen_tutorial');
      if (!hasSeen) {
        setTimeout(() => {
          startTutorial();
          localStorage.setItem('ez_has_seen_tutorial', 'true');
        }, 1000);
      }
    }
  }, [isLoaded, modal.activeModal, isLocked]);

  // Calculate Word Count
  const currentTab = useMemo(() => {
    if (!state.activeTabId) return null;
    const find = (items) => {
      for (const item of items) {
        if (item.id === state.activeTabId) return item;
        if (item.children) {
          const res = find(item.children);
          if (res) return res;
        }
      }
      return null;
    };
    return find(state.tabs);
  }, [state.tabs, state.activeTabId]);

  const wordCount = useMemo(() => {
    if (!currentTab || !currentTab.content) return 0;
    return currentTab.content.trim().split(/\s+/).filter(w => w.length > 0).length;
  }, [currentTab]);

  if (!isLoaded) return <div className="flex items-center justify-center h-screen bg-ez-bg text-ez-meta">Loading...</div>;

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
        closeModal={modal.closeModal}
        modalData={modal.modalData}
        actions={actions}
        tabs={state.tabs}
      />

      <PanicOverlay visible={showPanic} />
    </div>
  );
}

export default App;
