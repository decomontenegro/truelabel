import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// Gerar código único para QR
export const generateUniqueCode = (): string => {
  return uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();
};

// Gerar QR code para produto
export const generateQRCode = async (productId: string): Promise<string> => {
  const uniqueCode = generateUniqueCode();
  const validationUrl = `${process.env.QR_CODE_BASE_URL}/${uniqueCode}`;
  
  try {
    // Criar diretório para QR codes se não existir
    const qrDir = path.join(process.env.UPLOAD_PATH || './uploads', 'qr-codes');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    // Gerar QR code como arquivo
    const qrPath = path.join(qrDir, `${uniqueCode}.png`);
    await QRCode.toFile(qrPath, validationUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return uniqueCode;
  } catch (error) {
    console.error('Erro ao gerar QR code:', error);
    throw new Error('Falha ao gerar QR code');
  }
};

// Gerar QR code como string base64
export const generateQRCodeBase64 = async (data: string): Promise<string> => {
  try {
    const qrString = await QRCode.toString(data, {
      type: 'svg',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrString;
  } catch (error) {
    console.error('Erro ao gerar QR code base64:', error);
    throw new Error('Falha ao gerar QR code');
  }
};

// Gerar QR code como buffer
export const generateQRCodeBuffer = async (data: string): Promise<Buffer> => {
  try {
    const buffer = await QRCode.toBuffer(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return buffer;
  } catch (error) {
    console.error('Erro ao gerar QR code buffer:', error);
    throw new Error('Falha ao gerar QR code');
  }
};
