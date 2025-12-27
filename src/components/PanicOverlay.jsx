import React from 'react';

export function PanicOverlay({ visible }) {
    if (!visible) return null;

    return (
        <div className="fixed inset-0 bg-[#f0f2f5] z-[10000] font-sans text-[#1c1e21]">
            <div className="bg-white border-b border-[#dddfe2] px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-sm"></div>
                    <div className="font-bold text-gray-700">Enterprise Resource Planning</div>
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                    <span className="cursor-pointer hover:underline">Dashboard</span>
                    <span className="cursor-pointer hover:underline">Reports</span>
                    <span className="cursor-pointer hover:underline">Settings</span>
                    <span className="text-blue-600 cursor-pointer hover:underline">Logout</span>
                </div>
            </div>

            <div className="max-w-[800px] mx-auto mt-10 p-5 bg-white rounded shadow-sm">
                <h2 className="text-2xl font-bold mb-6">Weekly Performance Overview</h2>
                <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>

                    <div className="mt-8 grid grid-cols-3 gap-4">
                        <div className="h-24 bg-gray-100 rounded"></div>
                        <div className="h-24 bg-gray-100 rounded"></div>
                        <div className="h-24 bg-gray-100 rounded"></div>
                    </div>

                    <div className="mt-8">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                    </div>
                </div>
                <p className="mt-8 text-xs text-center text-gray-400">Press Alt + P to exit workspace</p>
            </div>
        </div>
    );
}
