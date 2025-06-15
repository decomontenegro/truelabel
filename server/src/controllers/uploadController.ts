import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { z } from 'zod';

const prisma = new PrismaClient();

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `report-${uniqueSuffix}${extension}`);
  }
});

// Filtro de tipos de arquivo permitidos
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use PDF, DOC, DOCX ou imagens.'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  }
});

// Schema de validação para upload de laudo
const uploadReportSchema = z.object({
  productId: z.string().min(1, 'ID do produto é obrigatório'),
  laboratoryId: z.string().min(1, 'ID do laboratório é obrigatório').optional(),
  analysisType: z.string().min(1, 'Tipo de análise é obrigatório').optional(),
  results: z.string().optional() // JSON string que será parseado
});

// Upload de laudo laboratorial
export const uploadReport = async (req: Request, res: Response) => {
  try {
    // Validar dados do formulário
    const validatedData = uploadReportSchema.parse(req.body);
    
    if (!req.file) {
      return res.status(400).json({
        error: 'Arquivo é obrigatório'
      });
    }

    // Verificar se o produto existe
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    let product;
    if (req.user.role === 'LAB' || req.user.role === 'ADMIN') {
      // Laboratórios e admins podem fazer upload para qualquer produto
      product = await prisma.product.findUnique({
        where: { id: validatedData.productId }
      });
    } else {
      // Brands só podem fazer upload para seus próprios produtos
      product = await prisma.product.findFirst({
        where: {
          id: validatedData.productId,
          userId: req.user.id
        }
      });
    }

    if (!product) {
      // Remover arquivo se produto não encontrado
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        error: 'Produto não encontrado'
      });
    }

    // Verificar se o laboratório existe (se fornecido)
    let laboratory = null;
    if (validatedData.laboratoryId) {
      laboratory = await prisma.laboratory.findUnique({
        where: { id: validatedData.laboratoryId }
      });

      if (!laboratory) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          error: 'Laboratório não encontrado'
        });
      }
    } else {
      // Buscar o primeiro laboratório disponível como padrão
      laboratory = await prisma.laboratory.findFirst();
      if (!laboratory) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          error: 'Nenhum laboratório cadastrado no sistema'
        });
      }
    }

    // Gerar hash de verificação do arquivo
    const fileBuffer = fs.readFileSync(req.file.path);
    const verificationHash = crypto
      .createHash('sha256')
      .update(fileBuffer)
      .digest('hex');

    // Processar resultados se fornecidos
    let results = '{}';
    if (validatedData.results) {
      try {
        // Validar se é um JSON válido
        JSON.parse(validatedData.results);
        results = validatedData.results;
      } catch (error) {
        // Se não for JSON válido, encapsular em um objeto
        results = JSON.stringify({ raw: validatedData.results });
      }
    }

    // Criar registro do laudo no banco
    const report = await prisma.report.create({
      data: {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        analysisType: validatedData.analysisType || 'GENERAL',
        results: results || '{}',
        verificationHash,
        productId: validatedData.productId,
        laboratoryId: laboratory.id
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brand: true
          }
        },
        laboratory: {
          select: {
            id: true,
            name: true,
            accreditation: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Laudo enviado com sucesso',
      report: {
        id: report.id,
        fileName: report.originalName,
        analysisType: report.analysisType,
        fileSize: report.fileSize,
        product: (report as any).product,
        laboratory: (report as any).laboratory,
        createdAt: report.createdAt
      }
    });

  } catch (error) {
    // Remover arquivo em caso de erro
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    console.error('Erro no upload:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Listar laudos de um produto
export const getProductReports = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    // Verificar se o produto existe e pertence ao usuário
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId: req.user.id
      }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Produto não encontrado'
      });
    }

    const reports = await prisma.report.findMany({
      where: { productId },
      include: {
        laboratory: {
          select: {
            id: true,
            name: true,
            accreditation: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      reports: reports.map(report => ({
        id: report.id,
        fileName: report.originalName,
        analysisType: report.analysisType,
        fileSize: report.fileSize,
        isVerified: report.isVerified,
        laboratory: report.laboratory,
        createdAt: report.createdAt
      }))
    });

  } catch (error) {
    console.error('Erro ao buscar laudos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Download de laudo
export const downloadReport = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        product: {
          userId: req.user.id
        }
      }
    });

    if (!report) {
      return res.status(404).json({
        error: 'Laudo não encontrado'
      });
    }

    // Verificar se o arquivo existe
    if (!fs.existsSync(report.filePath)) {
      return res.status(404).json({
        error: 'Arquivo não encontrado no servidor'
      });
    }

    // Configurar headers para download
    res.setHeader('Content-Disposition', `attachment; filename="${report.originalName}"`);
    res.setHeader('Content-Type', report.mimeType);

    // Enviar arquivo
    res.sendFile(path.resolve(report.filePath));

  } catch (error) {
    console.error('Erro no download:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};
