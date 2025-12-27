
// Basic URL safe Base64 encoding/decoding matching the original app
export const encodeToUrl = (text) => {
    const encoded = btoa(unescape(encodeURIComponent(text)));
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const decodeFromUrl = (base64) => {
    try {
        return decodeURIComponent(escape(atob(base64.replace(/-/g, '+').replace(/_/g, '/'))));
    } catch (e) {
        return null;
    }
};

// Encryption Utilities
const PBKDF2_ITERATIONS = 100000;

export const deriveKey = async (password, salt) => {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: PBKDF2_ITERATIONS,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
};

export const encryptText = async (text, password) => {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        enc.encode(text)
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    // Convert to base64url
    return encodeToUrl(String.fromCharCode(...combined));
};

export const decryptText = async (base64, password) => {
    try {
        // Decode base64url to string -> Uint8Array
        const decodedStr = decodeURIComponent(escape(atob(base64.replace(/-/g, '+').replace(/_/g, '/'))));
        const combined = new Uint8Array(decodedStr.length);
        for (let i = 0; i < decodedStr.length; i++) {
            combined[i] = decodedStr.charCodeAt(i);
        }

        if (combined.length < 28) throw new Error("Invalid data");

        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const data = combined.slice(28);

        const key = await deriveKey(password, salt);
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            data
        );

        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error("Decryption failed", e);
        return null;
    }
};
