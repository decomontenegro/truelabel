"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQRCodeAccesses = exports.validateQRCode = exports.generateQRCode = void 0;
const client_1 = require("@prisma/client");
const qrcode_1 = __importDefault(require("qrcode"));
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const generateQRSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid('ID do produto inválido')
});
const generateQRCode = async (req, res) => {
    try {
        const { productId } = generateQRSchema.parse(req.body);
        const where = { id: productId };
        if (req.user.role !== 'ADMIN') {
            where.userId = req.user.id;
        }
        const product = await prisma.product.findFirst({ where });
        if (!product) {
            return res.status(404).json({
                error: 'Produto não encontrado'
            });
        }
        let qrCode = product.qrCode;
        if (qrCode) {
            console.log(`⚠️  QR Code já existe para produto ${product.name}: ${qrCode}`);
        }
        else {
            const randomBytes = crypto_1.default.randomBytes(16).toString('hex');
            const uniqueString = `${product.id}-${product.sku}-${randomBytes}-${Date.now()}`;
            qrCode = crypto_1.default
                .createHash('sha256')
                .update(uniqueString)
                .digest('hex')
                .substring(0, 16);
            await prisma.product.update({
                where: { id: productId },
                data: { qrCode }
            });
            console.log(`✅ Novo QR Code gerado para produto ${product.name}: ${qrCode}`);
        }
        const baseUrl = process.env.QR_CODE_BASE_URL || 'http://localhost:3000/validation';
        const validationUrl = `${baseUrl}/${qrCode}`;
        const qrCodeImage = await qrcode_1.default.toDataURL(validationUrl, {
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 256
        });
        return res.json({
            qrCode,
            validationUrl,
            qrCodeImage,
            product: {
                id: product.id,
                name: product.name,
                brand: product.brand,
                sku: product.sku
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: error.errors
            });
        }
        console.error('Erro ao gerar QR code:', error);
        return res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
};
exports.generateQRCode = generateQRCode;
const validateQRCode = async (req, res) => {
    try {
        const { qrCode } = req.params;
        if (!qrCode) {
            return res.status(400).json({
                error: 'Código QR é obrigatório'
            });
        }
        const product = await prisma.product.findUnique({
            where: { qrCode },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                validations: {
                    where: {
                        status: 'APPROVED'
                    },
                    include: {
                        report: {
                            include: {
                                laboratory: {
                                    select: {
                                        name: true,
                                        accreditation: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        validatedAt: 'desc'
                    },
                    take: 1
                }
            }
        });
        if (!product) {
            return res.status(404).json({
                error: 'Produto não encontrado',
                message: 'Este código QR não corresponde a nenhum produto validado.'
            });
        }
        await prisma.qRCodeAccess.create({
            data: {
                qrCode,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
            }
        });
        const latestValidation = product.validations[0];
        const response = {
            product: {
                id: product.id,
                name: product.name,
                brand: product.brand,
                category: product.category,
                sku: product.sku,
                description: product.description,
                claims: product.claims,
                nutritionalInfo: product.nutritionalInfo,
                imageUrl: product.imageUrl,
                status: product.status,
                batchNumber: product.batchNumber
            },
            brand: {
                name: product.user.name,
                email: product.user.email
            },
            validation: latestValidation ? {
                id: latestValidation.id,
                status: latestValidation.status,
                claimsValidated: latestValidation.claimsValidated,
                summary: latestValidation.summary,
                validatedAt: latestValidation.validatedAt,
                laboratory: latestValidation.report?.laboratory || {
                    name: 'Laboratório não especificado',
                    accreditation: 'N/A'
                }
            } : null,
            isValidated: latestValidation?.status === 'APPROVED',
            lastUpdated: latestValidation?.validatedAt || product.updatedAt,
            accessedAt: new Date().toISOString()
        };
        return res.json(response);
    }
    catch (error) {
        console.error('Erro na validação do QR code:', error);
        return res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
};
exports.validateQRCode = validateQRCode;
const getQRCodeAccesses = async (req, res) => {
    try {
        const { productId } = req.params;
        const where = { id: productId };
        if (req.user.role !== 'ADMIN') {
            where.userId = req.user.id;
        }
        const product = await prisma.product.findFirst({ where });
        if (!product || !product.qrCode) {
            return res.status(404).json({
                error: 'Produto não encontrado ou QR code não gerado'
            });
        }
        const accesses = await prisma.qRCodeAccess.findMany({
            where: {
                qrCode: product.qrCode
            },
            orderBy: {
                accessedAt: 'desc'
            },
            take: 100
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayAccesses = accesses.filter(access => access.accessedAt >= today).length;
        const thisWeek = new Date();
        thisWeek.setDate(thisWeek.getDate() - 7);
        const weekAccesses = accesses.filter(access => access.accessedAt >= thisWeek).length;
        return res.json({
            accesses: accesses.map(access => ({
                id: access.id,
                ipAddress: access.ipAddress,
                userAgent: access.userAgent,
                location: access.location,
                accessedAt: access.accessedAt
            })),
            statistics: {
                total: accesses.length,
                today: todayAccesses,
                thisWeek: weekAccesses
            }
        });
    }
    catch (error) {
        console.error('Erro ao buscar acessos:', error);
        return res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
};
exports.getQRCodeAccesses = getQRCodeAccesses;
//# sourceMappingURL=qrController.js.map