import type { Tab } from '../types';

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const createTab = (title = "Untitled", content = "", type: 'note' | 'folder' = 'note'): Tab => {
    return {
        id: generateId(),
        title,
        content,
        type,
        children: type === 'folder' ? [] : undefined
    };
};

export const findItemById = (id: string, items: Tab[]): Tab | null => {
    for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
            const found = findItemById(id, item.children);
            if (found) return found;
        }
    }
    return null;
};

export const removeItemById = (id: string, items: Tab[]): { item: Tab, newItems: Tab[] } | null => {
    // Returns { item, newItems } if found, or null. Does immutable update.
    // Helper to clone and remove
    const clone = deepClone(items);

    // Recursive removal
    const removeRec = (list: Tab[]): Tab | null => {
        for (let i = 0; i < list.length; i++) {
            if (list[i].id === id) {
                return list.splice(i, 1)[0];
            }
            if (list[i].children) {
                const found = removeRec(list[i].children!);
                if (found) return found;
            }
        }
        return null;
    };

    const removed = removeRec(clone);
    return removed ? { item: removed, newItems: clone } : null;
};

const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const insertAfter = (item: Tab, targetId: string, list: Tab[]): boolean => {
    const idx = list.findIndex(i => i.id === targetId);
    if (idx !== -1) {
        list.splice(idx + 1, 0, item);
        return true;
    }
    for (const i of list) {
        if (i.children) {
            if (insertAfter(item, targetId, i.children)) return true;
        }
    }
    return false;
};

export const moveItem = (sourceId: string, targetId: string, isTargetFolder: boolean, tabs: Tab[]): Tab[] => {
    const result = removeItemById(sourceId, tabs);
    if (!result) return tabs;

    const { item, newItems } = result;

    if (isTargetFolder) {
        // Find folder and push
        const folder = findItemById(targetId, newItems);
        if (folder && folder.children) {
            folder.children.push(item);
        } else {
            // Fallback if folder not found (shouldn't happen)
            newItems.push(item);
        }
    } else {
        // Insert after target
        insertAfter(item, targetId, newItems);
    }
    return newItems;
};
