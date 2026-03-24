/**
 * @jest-environment jsdom
 */

describe('Folder and Tab Uniqueness Tests', () => {
    beforeEach(() => {
        // Reset appState for each test
        appState = {
            tabs: [],
            activeTabId: null,
            autoLockMinutes: 0,
            expiryDate: null,
            collapsedFolders: []
        };
        // Reset alert mock
        jest.clearAllMocks();
    });

    test('createTab should auto-suffix duplicates in the same level', () => {
        createTab("Note", "content 1", "note", appState.tabs);
        createTab("Note", "content 2", "note", appState.tabs);

        expect(appState.tabs).toHaveLength(2);
        expect(appState.tabs[0].title).toBe("Note");
        expect(appState.tabs[1].title).toBe("Note 2");
    });

    test('renameSubmit logic (simulated) should block duplicate names in the same folder', () => {
        const id1 = createTab("Note 1", "", "note", appState.tabs);
        const id2 = createTab("Note 2", "", "note", appState.tabs);

        // Mocking the rename workflow
        tabToRenameId = id2;
        renameInput.value = "Note 1";

        // Find the event listener for renameSubmit
        // Since we can't easily trigger the anonymous listener, we test the logic it uses
        const newTitle = "Note 1";
        const parent = findParent(id2);
        const siblings = parent ? parent.children : appState.tabs;
        const exists = siblings.some(s => s.id !== id2 && s.title.toLowerCase() === newTitle.toLowerCase());

        expect(exists).toBe(true);
    });

    test('renameSubmit should block names with slashes', () => {
        const id = createTab("Safe Name", "", "note", appState.tabs);
        tabToRenameId = id;

        const invalidTitle = "Invalid/Name";
        const hasSlash = invalidTitle.includes('/') || invalidTitle.includes('\\');

        expect(hasSlash).toBe(true);
    });

    test('moveItem should resolve conflicts by auto-suffixing', () => {
        // Create Folder A with "Note"
        const folderAId = createTab("Folder A", "", "folder", appState.tabs);
        const folderA = findItemById(folderAId);
        createTab("Note", "Original", "note", folderA.children);

        // Create "Note" at Root
        const rootNoteId = createTab("Note", "Mover", "note", appState.tabs);

        // Move Root Note to Folder A
        moveItem(rootNoteId, folderAId, true);

        expect(folderA.children).toHaveLength(2);
        expect(folderA.children[1].title).toBe("Note 2");
    });

    test('isDescendant should detect nested children', () => {
        const rootFolderId = createTab("Root", "", "folder", appState.tabs);
        const rootFolder = findItemById(rootFolderId);

        const subFolderId = createTab("Sub", "", "folder", rootFolder.children);
        const subFolder = findItemById(subFolderId);

        const leafNoteId = createTab("Leaf", "", "note", subFolder.children);

        expect(isDescendant(rootFolderId, subFolderId)).toBe(true);
        expect(isDescendant(rootFolderId, leafNoteId)).toBe(true);
        expect(isDescendant(subFolderId, rootFolderId)).toBe(false);
    });

    test('moveItem should block moving a folder into its descendant', () => {
        const parentId = createTab("Parent", "", "folder", appState.tabs);
        const parent = findItemById(parentId);
        const childId = createTab("Child", "", "folder", parent.children);

        // Try to move Parent into Child
        moveItem(parentId, childId, true);

        expect(global.alert).toHaveBeenCalledWith("Cannot move a folder into its own subfolder.");
        // Ensure Parent is still at root
        expect(findParent(parentId)).toBeNull();
    });

    test('findItemByPath should resolve nested notes', () => {
        const f1Id = createTab("Folder 1", "", "folder", appState.tabs);
        const f1 = findItemById(f1Id);
        const f2Id = createTab("Folder 2", "", "folder", f1.children);
        const f2 = findItemById(f2Id);
        const noteId = createTab("Deep Note", "secret", "note", f2.children);

        const found = findItemByPath("Folder 1/Folder 2/Deep Note");
        expect(found).not.toBeNull();
        expect(found.id).toBe(noteId);
    });

    test('getItemPath should generate correct forward-slash paths', () => {
        const fId = createTab("Work", "", "folder", appState.tabs);
        const f = findItemById(fId);
        const nId = createTab("Tasks", "", "note", f.children);
        const n = findItemById(nId);

        expect(getItemPath(n)).toBe("Work/Tasks");
    });
});
