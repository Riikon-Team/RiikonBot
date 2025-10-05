import { webcrypto } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const { subtle } = webcrypto;

const stringToArrayBuffer = (str) => {
    const encoder = new TextEncoder();
    return encoder.encode(str);
};

const arrayBufferToString = (buffer) => {
    const decoder = new TextDecoder();
    return decoder.decode(buffer);
};

const arrayBufferToHex = (buffer) => {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

const hexToArrayBuffer = (hex) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Number.parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes.buffer;
};

export const encryptFile = async (sourcePath, key, destinationPath) => {
    try {
        const sourceExists = await fs.access(sourcePath).then(() => true).catch(() => false);
        if (!sourceExists) {
            return {
                success: false,
                message: `File nguồn không tồn tại: ${sourcePath}`
            };
        }

        const destDir = path.dirname(destinationPath);
        await fs.mkdir(destDir, { recursive: true });

        const keyMaterial = await subtle.importKey(
            'raw',
            stringToArrayBuffer(key),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        const salt = webcrypto.getRandomValues(new Uint8Array(16));
        const derivedKey = await subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );

        const iv = webcrypto.getRandomValues(new Uint8Array(12));

        const sourceData = await fs.readFile(sourcePath);
        const encrypted = await subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            derivedKey,
            sourceData
        );

        const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);

        await fs.writeFile(destinationPath, Buffer.from(combined));

        console.log(`✅ Mã hóa thành công: ${sourcePath} → ${destinationPath}`);

        return {
            success: true,
            message: `Mã hóa thành công: ${path.basename(sourcePath)} → ${path.basename(destinationPath)}`,
            salt: arrayBufferToHex(salt),
            iv: arrayBufferToHex(iv),
            size: {
                original: sourceData.length,
                encrypted: combined.length
            }
        };

    } catch (error) {
        console.error('❌ Lỗi mã hóa file:', error);
        return {
            success: false,
            message: `Lỗi mã hóa: ${error.message}`
        };
    }
};

export const decryptFile = async (encryptedPath, key, outputPath) => {
    try {
        const encryptedExists = await fs.access(encryptedPath).then(() => true).catch(() => false);
        if (!encryptedExists) {
            return {
                success: false,
                message: `File mã hóa không tồn tại: ${encryptedPath}`
            };
        }

        const outputDir = path.dirname(outputPath);
        await fs.mkdir(outputDir, { recursive: true });

        const encryptedData = await fs.readFile(encryptedPath);
        const encryptedArray = new Uint8Array(encryptedData);

        if (encryptedArray.length < 28) { 
            return {
                success: false,
                message: 'File mã hóa không hợp lệ (quá ngắn)'
            };
        }

        const salt = encryptedArray.slice(0, 16);
        const iv = encryptedArray.slice(16, 28);
        const encrypted = encryptedArray.slice(28);

        const keyMaterial = await subtle.importKey(
            'raw',
            stringToArrayBuffer(key),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        const derivedKey = await subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        const decrypted = await subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            derivedKey,
            encrypted
        );

        await fs.writeFile(outputPath, Buffer.from(decrypted));

        console.log(`✅ Giải mã thành công: ${encryptedPath} → ${outputPath}`);

        return {
            success: true,
            message: `Giải mã thành công: ${path.basename(encryptedPath)} → ${path.basename(outputPath)}`,
            size: {
                encrypted: encryptedData.length,
                decrypted: decrypted.byteLength
            }
        };

    } catch (error) {
        console.error('❌ Lỗi giải mã file:', error);

        let errorMessage = 'Lỗi giải mã';
        if (error.message.includes('decryption failed')) {
            errorMessage = 'Sai khóa giải mã hoặc file bị hỏng';
        } else if (error.message.includes('Unsupported state')) {
            errorMessage = 'File mã hóa không hợp lệ';
        } else {
            errorMessage = `Lỗi giải mã: ${error.message}`;
        }

        return {
            success: false,
            message: errorMessage
        };
    }
};

export const encodeText = async (text, secretKey) => {
    try {
        const keyMaterial = await subtle.importKey(
            'raw',
            stringToArrayBuffer(secretKey),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        const salt = webcrypto.getRandomValues(new Uint8Array(16));
        const derivedKey = await subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );

        const iv = webcrypto.getRandomValues(new Uint8Array(12));

        const encrypted = await subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            derivedKey,
            stringToArrayBuffer(text)
        );

        const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);

        return arrayBufferToHex(combined);

    } catch (error) {
        console.error('❌ Lỗi mã hóa text:', error);
        throw new Error(`Lỗi mã hóa text: ${error.message}`);
    }
};

export const decodeText = async (encryptedHex, secretKey) => {
    try {
        const combined = hexToArrayBuffer(encryptedHex);
        const combinedArray = new Uint8Array(combined);

        if (combinedArray.length < 28) {
            throw new Error('Dữ liệu mã hóa không hợp lệ');
        }

        const salt = combinedArray.slice(0, 16);
        const iv = combinedArray.slice(16, 28);
        const encrypted = combinedArray.slice(28);

        const keyMaterial = await subtle.importKey(
            'raw',
            stringToArrayBuffer(secretKey),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        const derivedKey = await subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        const decrypted = await subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            derivedKey,
            encrypted
        );

        return arrayBufferToString(decrypted);

    } catch (error) {
        console.error('❌ Lỗi giải mã text:', error);
        throw new Error(`Lỗi giải mã text: ${error.message}`);
    }
};

export const generateSecureKey = (length = 32) => {
    const bytes = webcrypto.getRandomValues(new Uint8Array(length));
    return arrayBufferToHex(bytes);
};

export const hashString = async (input) => {
    const hashBuffer = await subtle.digest('SHA-256', stringToArrayBuffer(input));
    return arrayBufferToHex(hashBuffer);
};

export const getFileChecksum = async (filePath, algorithm = 'sha256') => {
    try {
        const fileData = await fs.readFile(filePath);
        const hashBuffer = await subtle.digest(algorithm.toUpperCase(), fileData);
        return arrayBufferToHex(hashBuffer);
    } catch (error) {
        throw new Error(`Lỗi tính checksum: ${error.message}`);
    }
};