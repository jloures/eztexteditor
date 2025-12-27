import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const startTutorial = () => {
  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: 'rgba(0, 0, 0, 0.75)',
    steps: [
      {
        element: 'header',
        popover: {
          title: 'Welcome to EZ Text Editor',
          description: 'A secure, private Markdown editor where 100% of your data stays in your browser and URL.',
          side: "bottom",
          align: 'start'
        }
      },
      {
        element: '#sidebar',
        popover: {
          title: 'Note Sidebar',
          description: 'Manage your notes and folders here. All changes are saved instantly to the URL.',
          side: "right",
          align: 'start'
        }
      },
      {
        element: '#new-btn', // Need to add this ID to Header
        popover: {
          title: 'Create New Note',
          description: 'Click here to start a fresh note or use the "+" button in the sidebar.',
          side: "bottom",
          align: 'center'
        }
      },
      {
        element: '#editor-area',
        popover: {
          title: 'The Editor',
          description: 'Write your Markdown here. We support GFM, LaTeX, Mermaid diagrams, and Wiki links [[like this]].',
          side: "bottom",
          align: 'center'
        }
      },
      {
        element: '#preview-toggle', // Need to add ID
        popover: {
          title: 'Live Preview',
          description: 'Toggle between the editor and a beautiful live preview of your Markdown.',
          side: "bottom",
          align: 'center'
        }
      },
      {
        element: '#security-btn', // Need to add ID
        popover: {
          title: 'Security Settings',
          description: 'Configure auto-lock and other security preferences to keep your notes private.',
          side: "bottom",
          align: 'center'
        }
      },
      {
        element: '#lock-btn', // Need to add ID
        popover: {
          title: 'Encryption',
          description: 'Enable symmetric password encryption for your notes. This happens 100% locally.',
          side: "bottom",
          align: 'center'
        }
      },
      {
        element: '#share-btn', // Need to add ID
        popover: {
          title: 'Share & Sync',
          description: 'Since all data is in the URL, sharing this link shares the entire state of your editor!',
          side: "bottom",
          align: 'center'
        }
      },
      {
        element: '#info-btn', // Need to add ID
        popover: {
          title: 'Shortcuts & Help',
          description: 'You can always come back to this tutorial and see all keyboard shortcuts here.',
          side: "bottom",
          align: 'center'
        }
      },
    ]
  });

  driverObj.drive();
};
