import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { useStore } from './store';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { SearchModal } from './components/modals/SearchModal';
import { useShortcuts } from './hooks/useShortcuts';

import { usePersistence } from './hooks/usePersistence';

function App() {
  usePersistence();
  const { settings, isPanicMode } = useStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useShortcuts(() => setIsSearchOpen(!isSearchOpen));

  // Sync body classes for Zen/Panic mode
  useEffect(() => {
    if (settings.isZen) document.body.classList.add('zen-mode');
    else document.body.classList.remove('zen-mode');
  }, [settings.isZen]);

  return (
    <div className={`min-h-screen text-[var(--text-color)] bg-[var(--bg-color)] flex flex-col`}>
      <Header />

      <main className="flex flex-1 overflow-hidden relative">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div id="editor-container">
          {/* Editor and Preview will replace this placeholder */}
          <Editor />
          <Preview />
        </div>
      </main>

      {/* Panic Overlay */}
      {isPanicMode && (
        <div id="panicOverlay" className="fixed inset-0 bg-white z-[10000] p-10 block">
          <h1 className="text-3xl mb-4">Work</h1>
          <p>Nothing to see here.</p>
        </div>
      )}

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}

export default App;
