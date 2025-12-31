import React, { useEffect } from 'react';
import { Toolbar } from '../toolbar/Toolbar';
import { Sidebar } from '../sidebar/Sidebar';
import { EditorArea } from '../editor/EditorArea';
import { useAppStore } from '../../store/useAppStore';
import { ModalManager } from '../modals/ModalManager';

export const MainLayout: React.FC = () => {
    const { viewSettings } = useAppStore();

    useEffect(() => {
        if (viewSettings.isZenMode) {
            document.body.classList.add('zen-mode');
        } else {
            document.body.classList.remove('zen-mode');
        }
    }, [viewSettings.isZenMode]);

    useEffect(() => {
        // Assuming dark mode is default or we need to toggle 'data-theme'
        // Legacy handled it via body attribute
        document.body.setAttribute('data-theme', viewSettings.isDarkMode ? 'dark' : 'light');
    }, [viewSettings.isDarkMode]);

    return (
        <React.Fragment>
            <ModalManager />
            <div className="zen-hint">Press <b>Esc</b> to exit Zen Mode</div>
            <Toolbar />
            <main>
                <Sidebar />
                <EditorArea />
            </main>

            {/* Modals Placeholders - To be componentized later */}
            <div id="passwordModal" className="fixed inset-0 modal-overlay z-50 flex items-center justify-center hidden">
                <div id="modalContainer" className="bg-[#1e1e1e] p-8 rounded-xl w-full max-w-md border border-gray-800 shadow-2xl">
                    {/* Static content for parity */}
                </div>
            </div>
            {/* Other modal placeholders would go here, kept minimal for Stage 2 */}
        </React.Fragment>
    );
};
