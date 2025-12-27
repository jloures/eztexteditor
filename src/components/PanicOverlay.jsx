import React from 'react';

export function PanicOverlay({ onExit }) {
    return (
        <div className="fixed inset-0 bg-[#f0f2f5] z-[10000] font-sans text-[#1c1e21] overflow-hidden select-none">
            <div className="bg-white border-b border-[#dddfe2] px-10 py-5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-sm"></div>
                    <div className="font-bold text-gray-700 tracking-tight text-lg">Enterprise Resource Planning</div>
                </div>
                <div className="flex gap-6 text-sm text-gray-400 font-medium">
                    <span>Dashboard</span>
                    <span>Reports</span>
                    <span>Inventory</span>
                    <span>Analytics</span>
                    <span className="text-blue-600 font-bold cursor-pointer" onClick={onExit}>Logout</span>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto flex flex-col items-center justify-start h-full pt-20">
                <div className="w-full bg-white p-12 rounded-lg border border-gray-200">
                    <h2 className="text-3xl font-bold mb-10 text-gray-800 border-b pb-6">Weekly Performance Overview</h2>
                    <div className="space-y-6">
                        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                        <div className="h-4 bg-gray-100 rounded w-5/6"></div>

                        <div className="mt-12 grid grid-cols-3 gap-8">
                            <div className="h-32 bg-gray-50 rounded-lg border border-gray-100 flex flex-col p-4">
                                <div className="h-3 bg-gray-200 w-1/2 mb-auto"></div>
                                <div className="h-8 bg-blue-100 w-3/4"></div>
                            </div>
                            <div className="h-32 bg-gray-50 rounded-lg border border-gray-100 flex flex-col p-4">
                                <div className="h-3 bg-gray-200 w-1/2 mb-auto"></div>
                                <div className="h-8 bg-green-100 w-2/3"></div>
                            </div>
                            <div className="h-32 bg-gray-50 rounded-lg border border-gray-100 flex flex-col p-4">
                                <div className="h-3 bg-gray-200 w-1/2 mb-auto"></div>
                                <div className="h-8 bg-orange-100 w-1/2"></div>
                            </div>
                        </div>

                        <div className="mt-12">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
                            <div className="space-y-3">
                                <div className="h-3 bg-gray-50 rounded w-full"></div>
                                <div className="h-3 bg-gray-50 rounded w-full"></div>
                                <div className="h-3 bg-gray-50 rounded w-4/5"></div>
                            </div>
                        </div>
                    </div>
                    <p className="mt-20 text-[10px] uppercase font-bold tracking-[0.2em] text-gray-300 text-center">
                        Secure Workspace Active &bull; Press <span className="text-gray-400">Alt + P</span> to exit
                    </p>
                </div>
            </div>
        </div>
    );
}
