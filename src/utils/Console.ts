import fs from 'fs';

// Bun native colors support
const colors = {
    gray: (text: string) => `\x1b[90m${text}\x1b[0m`,
    blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
    green: (text: string) => `\x1b[32m${text}\x1b[0m`,
    red: (text: string) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
};

const writeToLog = (message: string): void => {
    try {
        fs.appendFileSync('./terminal.log', message + '\n', 'utf-8');
    } catch (err) {
        // Ignore file write errors
    }
};

export const info = (...message: string[]): void => {
    const time = new Date().toLocaleTimeString();
    const logMessage = `${colors.gray(`[${time}]`)} ${colors.blue('[Info]')} ${message.join(' ')}`;
    
    console.info(logMessage);
    writeToLog(`[${time}] [Info] ${message.join(' ')}`);
};

export const success = (...message: string[]): void => {
    const time = new Date().toLocaleTimeString();
    const logMessage = `${colors.gray(`[${time}]`)} ${colors.green('[OK]')} ${message.join(' ')}`;
    
    console.info(logMessage);
    writeToLog(`[${time}] [OK] ${message.join(' ')}`);
};

export const error = (...message: string[]): void => {
    const time = new Date().toLocaleTimeString();
    const logMessage = `${colors.gray(`[${time}]`)} ${colors.red('[Error]')} ${message.join(' ')}`;
    
    console.error(logMessage);
    writeToLog(`[${time}] [Error] ${message.join(' ')}`);
};

export const warn = (...message: string[]): void => {
    const time = new Date().toLocaleTimeString();
    const logMessage = `${colors.gray(`[${time}]`)} ${colors.yellow('[Warning]')} ${message.join(' ')}`;
    
    console.warn(logMessage);
    writeToLog(`[${time}] [Warning] ${message.join(' ')}`);
};
