
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export const getContent = <T = any>(slug: string): T | null => {
    try {
        const contentDir = path.join(process.cwd(), 'content');
        const filePath = path.join(contentDir, `${slug}.yaml`);

        if (!fs.existsSync(filePath)) {
            console.warn(`Content file not found: ${slug}.yaml`);
            return null;
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return yaml.load(fileContent) as T;
    } catch (e) {
        console.error(`Error reading content ${slug}:`, e);
        return null;
    }
};

export const getCollection = <T = any>(folder: string): T[] => {
    try {
        const contentDir = path.join(process.cwd(), 'content', folder);
        if (!fs.existsSync(contentDir)) return [];

        const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.yaml'));
        return files.map(file => {
            const content = fs.readFileSync(path.join(contentDir, file), 'utf-8');
            return yaml.load(content) as T;
        });
    } catch (e) {
        console.error(`Error reading collection ${folder}:`, e);
        return [];
    }
};
