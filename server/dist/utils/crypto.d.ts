export declare const encryptField: (text: string) => string;
export declare const decryptField: (encryptedData: string) => string;
export declare const hashData: (data: string) => string;
export declare const generateSecureToken: (length?: number) => string;
export declare const generateApiKey: () => {
    key: string;
    hash: string;
};
export declare const hashPassword: (password: string) => Promise<string>;
export declare const verifyPassword: (password: string, hash: string) => Promise<boolean>;
export declare const generateOTP: (length?: number) => string;
export declare const generateCSRFToken: () => string;
export declare const verifyCSRFToken: (token: string, sessionToken: string) => boolean;
export declare const signData: (data: string, secret: string) => string;
export declare const verifySignature: (data: string, signature: string, secret: string) => boolean;
export declare const maskPII: (data: string, visibleChars?: number) => string;
export declare const maskEmail: (email: string) => string;
export declare const maskPhone: (phone: string) => string;
export declare const maskCPF: (cpf: string) => string;
export declare const secureCompare: (a: string, b: string) => boolean;
export declare const generateSessionId: () => string;
export declare const deriveKey: (password: string, salt: Buffer) => Buffer;
export declare const encryptFile: (buffer: Buffer) => Promise<{
    encrypted: Buffer;
    key: string;
    iv: string;
}>;
export declare const decryptFile: (encrypted: Buffer, key: string, iv: string) => Promise<Buffer>;
declare const _default: {
    encryptField: (text: string) => string;
    decryptField: (encryptedData: string) => string;
    hashData: (data: string) => string;
    generateSecureToken: (length?: number) => string;
    generateApiKey: () => {
        key: string;
        hash: string;
    };
    hashPassword: (password: string) => Promise<string>;
    verifyPassword: (password: string, hash: string) => Promise<boolean>;
    generateOTP: (length?: number) => string;
    generateCSRFToken: () => string;
    verifyCSRFToken: (token: string, sessionToken: string) => boolean;
    signData: (data: string, secret: string) => string;
    verifySignature: (data: string, signature: string, secret: string) => boolean;
    maskPII: (data: string, visibleChars?: number) => string;
    maskEmail: (email: string) => string;
    maskPhone: (phone: string) => string;
    maskCPF: (cpf: string) => string;
    secureCompare: (a: string, b: string) => boolean;
    generateSessionId: () => string;
    deriveKey: (password: string, salt: Buffer) => Buffer;
    encryptFile: (buffer: Buffer) => Promise<{
        encrypted: Buffer;
        key: string;
        iv: string;
    }>;
    decryptFile: (encrypted: Buffer, key: string, iv: string) => Promise<Buffer>;
};
export default _default;
//# sourceMappingURL=crypto.d.ts.map