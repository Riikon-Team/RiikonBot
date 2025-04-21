import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const displayCurrentTime = () => {
    const date = new Date()
    return [date.getDate(), date.getMonth(), date.getFullYear()].join("/") + " " + [date.getHours(), date.getMinutes()].join(":")
}

export const getAllPrefixCommands = async () => {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const packagesDir = path.join(path.dirname(__dirname), 'packages');
    const pkgNames = fs.readdirSync(packagesDir);
    const result = []

    for (const pkgName of pkgNames) {
        const prefixPath = path.join(packagesDir, pkgName, 'prefixCommands', 'index.js');

        if (fs.existsSync(prefixPath)) {
            const module = await import(`file://${prefixPath}`);
            if (typeof module.getAllPrefixCommands === 'function') {
                result.push(...module.getAllPrefixCommands())
            }
        }
    };
    return result
}   