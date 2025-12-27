
// Helper for encryption
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: salt as any, iterations: 100000, hash: "SHA-256" },
        baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
}

export async function encryptText(text: string, password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const encodedText = new TextEncoder().encode(text);
    const encryptedContent = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encodedText);
    const combined = new Uint8Array(salt.length + iv.length + encryptedContent.byteLength);
    combined.set(salt, 0); combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedContent), salt.length + iv.length);
    return btoa(String.fromCharCode(...combined)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function decryptText(encryptedBase64: string, password: string): Promise<string | null> {
    try {
        const combined = new Uint8Array(atob(encryptedBase64.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => c.charCodeAt(0)));
        const salt = combined.slice(0, 16); const iv = combined.slice(16, 28); const data = combined.slice(28);
        const key = await deriveKey(password, salt);
        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
        return new TextDecoder().decode(decrypted);
    } catch (e) { return null; }
}

export async function encodeToUrl(text: string): Promise<string> {
    const encoded = btoa(unescape(encodeURIComponent(text)));
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function decodeFromUrl(base64: string): Promise<string | null> {
    try {
        return decodeURIComponent(escape(atob(base64.replace(/-/g, '+').replace(/_/g, '/'))));
    }
    catch (e) { return null; }
}
