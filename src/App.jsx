import React, { useEffect, useMemo } from 'react';
import { useAppState } from './hooks/useAppState';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header';
import Editor from './components/Editor/Editor';
import Modals from './components/Modals/Modals';

function App() {
  const { state, actions, isLoaded, isLocked, modal, showPanic } = useAppState();

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
  }, [actions, modal, state.settings.isZen]);

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
      {/* Panic Overlay */}
      {showPanic && (
        <div className="fixed inset-0 z-[9999] bg-gray-100 flex items-center justify-center flex-col">
          <div className="w-full h-12 bg-white border-b border-gray-300 mb-8" />
          <div className="max-w-2xl text-gray-800 text-center">
            <h1 className="text-2xl font-bold mb-4">Work in Progress</h1>
            <p>Nothing to see here.</p>
            <button onClick={actions.togglePanic} className="mt-8 px-4 py-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-300 rounded">Exit</button>
          </div>
        </div>
      )}

      <Header
        settings={state.settings}
        actions={actions}
        onOpenModal={modal.openModal}
        wordCount={wordCount}
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
    </div>
  );
}

export default App;
