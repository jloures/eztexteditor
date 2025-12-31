import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export const StoreSync = () => {
    const { noteId } = useParams<{ noteId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { activeTabId, activateItem } = useAppStore();

    // 1. Sync URL -> Store
    // When URL params change, update the store's active item
    useEffect(() => {
        if (noteId && noteId !== activeTabId) {
            // Validate if ID exists? For now, we trust URL or Sidebar logic handles validity
            // Or at least try to activate it. If invalid, the logical component (Sidebar) might not show it selected.
            activateItem(noteId);
        } else if (!noteId && activeTabId) {
            // If URL is root '/', redirect to activeTabId (or 'welcome')
            navigate(`/${activeTabId}`, { replace: true });
        }
    }, [noteId, activateItem, navigate, activeTabId]);

    // 2. Sync Store -> URL
    // When store's activeTabId changes (e.g. user clicked Sidebar), update URL
    useEffect(() => {
        const currentPathId = location.pathname.split('/').pop();
        if (activeTabId && activeTabId !== currentPathId) {
            navigate(`/${activeTabId}`);
        }
    }, [activeTabId, navigate, location]);

    return null; // Logic only component
};
