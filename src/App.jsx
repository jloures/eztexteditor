import React, { useEffect } from 'react';
import { useAppState } from './hooks/useAppState';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header';
import Editor from './components/Editor/Editor';
import Modals from './components/Modals/Modals';

function App() {
  const { state, actions, isLoaded, isLocked } = useAppState();

  // Zen mode class
  useEffect(() => {
    if (state.settings.isZen) {
      document.body.classList.add('zen-mode');
    } else {
      document.body.classList.remove('zen-mode');
    }
  }, [state.settings.isZen]);

  // Dark mode
  useEffect(() => {
    // Logic for dark mode - mostly handled by CSS variable but class needs to be on body
    // Original uses data-theme="dark" on body
    document.body.setAttribute('data-theme', 'dark'); // Default
    // Add logic if theme switcher is implemented
  }, []);

  if (!isLoaded) return <div className="flex items-center justify-center h-screen bg-ez-bg text-ez-meta">Loading...</div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-ez-bg text-ez-text font-sans">
      <Header settings={state.settings} />
      <main className="flex flex-1 overflow-hidden relative">
        <Sidebar
          tabs={state.tabs}
          activeId={state.activeTabId}
          collapsed={state.collapsedFolders}
          actions={actions}
        />
        <Editor
          activeTabId={state.activeTabId}
          tabs={state.tabs}
          actions={actions}
          settings={state.settings}
        />
      </main>
      <Modals actions={actions} />
    </div>
  );
}

export default App;
