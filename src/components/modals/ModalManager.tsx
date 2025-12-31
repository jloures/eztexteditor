import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { SearchModal } from './SearchModal';
import { PanicOverlay } from './PanicOverlay';

export const ModalManager: React.FC = () => {
    const { viewSettings } = useAppStore();
    const { activeModal } = viewSettings;

    if (!activeModal) return null;

    return (
        <React.Fragment>
            {activeModal === 'search' && <SearchModal />}
            {activeModal === 'panic' && <PanicOverlay />}
            {/* Add Settings/Graph placeholders later */}
        </React.Fragment>
    );
};
