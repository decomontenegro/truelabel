"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadReport = exports.getProductReports = exports.uploadReport = exports.upload = void 0;
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = process.env.UPLOAD_PATH || './uploads';
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path_1.default.extname(file.originalname);
        cb(null, `report-${uniqueSuffix}${extension}`);
    }
});
const fileFilter = (req, file, cb) => {
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
    }
    else {
        cb(new Error('Tipo de arquivo não permitido. Use PDF, DOC, DOCX ou imagens.'), false);
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760')
    }
});
const uploadReportSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1, 'ID do produto é obrigatório'),
    laboratoryId: zod_1.z.string().min(1, 'ID do laboratório é obrigatório').optional(),
    analysisType: zod_1.z.string().min(1, 'Tipo de análise é obrigatório').optional(),
    results: zod_1.z.string().optional()
});
const uploadReport = async (req, res) => {
    try {
        const validatedData = uploadReportSchema.parse(req.body);
        if (!req.file) {
            return res.status(400).json({
                error: 'Arquivo é obrigatório'
            });
        }
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized'
            });
        }
        let product;
        if (req.user.role === 'LAB' || req.user.role === 'ADMIN') {
            product = await prisma.product.findUnique({
                where: { id: validatedData.productId }
            });
        }
        else {
            product = await prisma.product.findFirst({
                where: {
                    id: validatedData.productId,
                    userId: req.user.id
                }
            });
        }
        if (!product) {
            fs_1.default.unlinkSync(req.file.path);
            return res.status(404).json({
                error: 'Produto não encontrado'
            });
        }
        let laboratory = null;
        if (validatedData.laboratoryId) {
            laboratory = await prisma.laboratory.findUnique({
                where: { id: validatedData.laboratoryId }
            });
            if (!laboratory) {
                fs_1.default.unlinkSync(req.file.path);
                return res.status(404).json({
                    error: 'Laboratório não encontrado'
                });
            }
        }
        else {
            laboratory = await prisma.laboratory.findFirst();
            if (!laboratory) {
                fs_1.default.unlinkSync(req.file.path);
                return res.status(404).json({
                    error: 'Nenhum laboratório cadastrado no sistema'
                });
            }
        }
        const fileBuffer = fs_1.default.readFileSync(req.file.path);
        const verificationHash = crypto_1.default
            .createHash('sha256')
            .update(fileBuffer)
            .digest('hex');
        let results = '{}';
        if (validatedData.results) {
            try {
                JSON.parse(validatedData.results);
                results = validatedData.results;
            }
            catch (error) {
                results = JSON.stringify({ raw: validatedData.results });
            }
        }
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
                product: report.product,
                laboratory: report.laboratory,
                createdAt: report.createdAt
            }
        });
    }
    catch (error) {
        if (req.file) {
            fs_1.default.unlinkSync(req.file.path);
        }
        if (error instanceof zod_1.z.ZodError) {
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
exports.uploadReport = uploadReport;
const getProductReports = async (req, res) => {
    try {
        const { productId } = req.params;
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized'
            });
        }
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
    }
    catch (error) {
        console.error('Erro ao buscar laudos:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
};
exports.getProductReports = getProductReports;
const downloadReport = async (req, res) => {
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
        if (!fs_1.default.existsSync(report.filePath)) {
            return res.status(404).json({
                error: 'Arquivo não encontrado no servidor'
            });
        }
        res.setHeader('Content-Disposition', `attachment; filename="${report.originalName}"`);
        res.setHeader('Content-Type', report.mimeType);
        res.sendFile(path_1.default.resolve(report.filePath));
    }
    catch (error) {
        console.error('Erro no download:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
};
exports.downloadReport = downloadReport;
//# sourceMappingURL=uploadController.js.map