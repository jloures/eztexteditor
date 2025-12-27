import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const startTutorial = () => {
    const driverObj = driver({
        showProgress: true,
        steps: [
            { element: '#sidebar', popover: { title: 'File Explorer', description: 'Manage your notes and folders here. Drag and drop to organize.' } },
            { element: '#editor-area', popover: { title: 'Editor Area', description: 'Write your content here using Markdown. Support for Math, Mermaid diagrams, and Wiki-links.' } },
            { element: '#header-toolbar', popover: { title: 'Toolbar', description: 'Access settings, switch themes, and toggle modes (Zen, Preview, etc.).' } },
            { element: '#word-count', popover: { title: 'Word Count', description: 'Track your writing progress.' } },
            { popover: { title: 'Shortcuts', description: 'Press Cmd+K for Search, Alt+P for Panic Mode, and Alt+Z for Zen Mode.' } }
        ]
    });

    driverObj.drive();
};
