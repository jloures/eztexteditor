import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

export const PanicOverlay: React.FC = () => {
    const { closeModal } = useAppStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeModal();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [closeModal]);

    // Use pure HTML/CSS structure from legacy
    return (
        <div id="panicOverlay" style={{ display: 'block', position: 'fixed', inset: 0, background: '#f0f2f5', zIndex: 10000 }}>
            <div className="panic-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', background: '#1877f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '24px' }}>f</div>
                    <div className="search-bar" style={{ background: '#f0f2f5', padding: '8px 12px', borderRadius: '20px', width: '240px', color: '#65676b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                        <i className="fas fa-search"></i> Search Facebook
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '24px', color: '#65676b' }}>
                    <i className="fas fa-home" style={{ color: '#1877f2' }}></i>
                    <i className="fas fa-user-friends"></i>
                    <i className="fas fa-tv"></i>
                    <i className="fas fa-store"></i>
                    <i className="fas fa-users"></i>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="circle-btn" style={{ width: '40px', height: '40px', background: '#e4e6eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-bars"></i></div>
                    <div className="circle-btn" style={{ width: '40px', height: '40px', background: '#e4e6eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-bell"></i></div>
                    <div className="circle-btn" style={{ width: '40px', height: '40px', background: '#e4e6eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-caret-down"></i></div>
                </div>
            </div>

            <div className="panic-content">
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', background: '#ddd', borderRadius: '50%' }}></div>
                    <div>
                        <div style={{ fontWeight: '600', color: '#050505' }}>User Name</div>
                        <div style={{ fontSize: '12px', color: '#65676b' }}>2 mins ago · <i className="fas fa-globe-americas"></i></div>
                    </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                    Just finished a great project! #productivity #worklife
                </div>
                <div style={{ height: '300px', background: '#ddd', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#65676b' }}>
                    [Image Content Placeholder]
                </div>
            </div>

            <div className="fixed bottom-4 right-4 text-xs text-gray-400">
                Press ESC to return
            </div>
        </div>
    );
};
