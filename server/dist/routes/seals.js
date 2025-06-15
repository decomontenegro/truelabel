"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const BRAZILIAN_SEALS = [
    {
        id: 'anvisa',
        name: 'ANVISA',
        purpose: 'Registro / Autorização',
        category: 'REGULATORY',
        isRequired: true,
        validatingEntity: 'ANVISA',
        description: 'Obrigatório para suplementos alimentares',
        verificationCriteria: ['Registro válido na ANVISA', 'Número de registro ativo'],
        documentationRequired: ['Certificado de registro ANVISA'],
        validityPeriod: 60,
        renewalRequired: true,
        isActive: true
    },
    {
        id: 'sif',
        name: 'SIF',
        purpose: 'Serviço de Inspeção Federal',
        category: 'REGULATORY',
        isRequired: true,
        validatingEntity: 'MAPA',
        description: 'Controle sanitário de produtos de origem animal',
        verificationCriteria: ['Estabelecimento registrado no SIF', 'Inspeção em dia'],
        documentationRequired: ['Certificado SIF', 'Relatório de inspeção'],
        validityPeriod: 12,
        renewalRequired: true,
        isActive: true
    },
    {
        id: 'iso22000',
        name: 'ISO 22000',
        purpose: 'Gestão de segurança de alimentos',
        category: 'QUALITY',
        isRequired: false,
        validatingEntity: 'Organismos Certificadores Acreditados',
        description: 'Sistema de gestão de segurança de alimentos',
        verificationCriteria: ['Certificação válida', 'Auditoria em dia'],
        documentationRequired: ['Certificado ISO 22000', 'Relatório de auditoria'],
        validityPeriod: 36,
        renewalRequired: true,
        isActive: true
    },
    {
        id: 'haccp',
        name: 'HACCP (APPCC)',
        purpose: 'Análise de Perigos e Pontos Críticos de Controle',
        category: 'QUALITY',
        isRequired: false,
        validatingEntity: 'Organismos Certificadores',
        description: 'Sistema preventivo de controle de segurança alimentar',
        verificationCriteria: ['Plano HACCP implementado', 'Monitoramento ativo'],
        documentationRequired: ['Certificado HACCP', 'Plano de controle'],
        validityPeriod: 24,
        renewalRequired: true,
        isActive: true
    },
    {
        id: 'gmp',
        name: 'GMP',
        purpose: 'Boas Práticas de Fabricação',
        category: 'QUALITY',
        isRequired: false,
        validatingEntity: 'Organismos Certificadores Internacionais',
        description: 'Certificação internacional de boas práticas',
        verificationCriteria: ['Certificação GMP válida', 'Inspeção aprovada'],
        documentationRequired: ['Certificado GMP', 'Relatório de inspeção'],
        validityPeriod: 24,
        renewalRequired: true,
        isActive: true
    },
    {
        id: 'organico-brasil',
        name: 'Orgânico Brasil (MAPA)',
        purpose: 'Certifica alimentos 100% orgânicos',
        category: 'ORGANIC',
        isRequired: false,
        validatingEntity: 'MAPA',
        description: 'Selo obrigatório para produtos orgânicos no Brasil',
        verificationCriteria: ['Certificação orgânica válida', 'Rastreabilidade completa'],
        documentationRequired: ['Certificado orgânico MAPA', 'Plano orgânico'],
        validityPeriod: 12,
        renewalRequired: true,
        isActive: true
    },
    {
        id: 'ibd-organico',
        name: 'IBD Orgânico',
        purpose: 'Certificação nacional e internacional',
        category: 'ORGANIC',
        isRequired: false,
        validatingEntity: 'IBD Certificações',
        description: 'Certificação orgânica reconhecida internacionalmente',
        verificationCriteria: ['Certificação IBD válida', 'Auditoria anual'],
        documentationRequired: ['Certificado IBD', 'Relatório de auditoria'],
        validityPeriod: 12,
        renewalRequired: true,
        isActive: true
    },
    {
        id: 'ecocert',
        name: 'Ecocert',
        purpose: 'Certificação internacional de ingredientes naturais',
        category: 'ORGANIC',
        isRequired: false,
        validatingEntity: 'Ecocert Brasil',
        description: 'Certificação internacional para produtos naturais e orgânicos',
        verificationCriteria: ['Certificação Ecocert válida', 'Conformidade internacional'],
        documentationRequired: ['Certificado Ecocert', 'Relatório de conformidade'],
        validityPeriod: 12,
        renewalRequired: true,
        isActive: true
    },
    {
        id: 'vegano-svb',
        name: 'Selo Vegano (SVB)',
        purpose: 'Ausência de ingredientes de origem animal',
        category: 'ETHICAL',
        isRequired: false,
        validatingEntity: 'Sociedade Vegetariana Brasileira',
        description: 'Certifica produtos livres de ingredientes animais',
        verificationCriteria: ['Análise de ingredientes', 'Processo produtivo verificado'],
        documentationRequired: ['Certificado SVB', 'Lista de ingredientes'],
        validityPeriod: 24,
        renewalRequired: true,
        isActive: true
    },
    {
        id: 'peta-cruelty-free',
        name: 'PETA Cruelty-Free',
        purpose: 'Produto não testado em animais',
        category: 'ETHICAL',
        isRequired: false,
        validatingEntity: 'PETA',
        description: 'Certifica que o produto não foi testado em animais',
        verificationCriteria: ['Declaração de não teste', 'Política empresarial'],
        documentationRequired: ['Certificado PETA', 'Declaração assinada'],
        validityPeriod: 12,
        renewalRequired: true,
        isActive: true
    },
    {
        id: 'fair-trade',
        name: 'Fair Trade / Comércio Justo',
        purpose: 'Condições dignas para produtores',
        category: 'ETHICAL',
        isRequired: false,
        validatingEntity: 'Fairtrade International',
        description: 'Garante condições justas de trabalho e comércio',
        verificationCriteria: ['Cadeia de custódia verificada', 'Condições de trabalho'],
        documentationRequired: ['Certificado Fair Trade', 'Relatório social'],
        validityPeriod: 36,
        renewalRequired: true,
        isActive: true
    },
    {
        id: 'eureciclo',
        name: 'Eureciclo',
        purpose: 'Logística reversa de embalagens',
        category: 'ENVIRONMENTAL',
        isRequired: false,
        validatingEntity: 'Eureciclo',
        description: 'Compensação ambiental de embalagens',
        verificationCriteria: ['Certificados de reciclagem', 'Compensação ambiental'],
        documentationRequired: ['Certificado Eureciclo', 'Relatório de compensação'],
        validityPeriod: 12,
        renewalRequired: true,
        isActive: true
    },
    {
        id: 'carbon-free',
        name: 'Carbon Free / Carbono Neutro',
        purpose: 'Compensação das emissões de CO2',
        category: 'ENVIRONMENTAL',
        isRequired: false,
        validatingEntity: 'Organismos Certificadores Ambientais',
        description: 'Produto com emissões de carbono compensadas',
        verificationCriteria: ['Cálculo de pegada de carbono', 'Compensação verificada'],
        documentationRequired: ['Certificado Carbon Free', 'Relatório de compensação'],
        validityPeriod: 12,
        renewalRequired: true,
        isActive: true
    }
];
const productSealSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    sealId: zod_1.z.string(),
    certificateNumber: zod_1.z.string().optional(),
    issuedDate: zod_1.z.string().optional(),
    expiryDate: zod_1.z.string().optional(),
    validatingLaboratory: zod_1.z.string().optional(),
    documentUrl: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional()
});
router.get('/seals', (req, res) => {
    try {
        const { isRequired, isActive, category } = req.query;
        let filteredSeals = BRAZILIAN_SEALS;
        if (isRequired !== undefined) {
            filteredSeals = filteredSeals.filter(seal => seal.isRequired === (isRequired === 'true'));
        }
        if (isActive !== undefined) {
            filteredSeals = filteredSeals.filter(seal => seal.isActive === (isActive === 'true'));
        }
        if (category) {
            filteredSeals = filteredSeals.filter(seal => seal.category === category);
        }
        res.json(filteredSeals);
    }
    catch (error) {
        console.error('Erro ao buscar selos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
router.get('/seals/:id', (req, res) => {
    try {
        const { id } = req.params;
        const seal = BRAZILIAN_SEALS.find(s => s.id === id);
        if (!seal) {
            return res.status(404).json({ error: 'Selo não encontrado' });
        }
        res.json(seal);
    }
    catch (error) {
        console.error('Erro ao buscar selo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
router.get('/product-seals', auth_1.authenticateToken, async (req, res) => {
    try {
        const { productId } = req.query;
        const where = {};
        if (productId) {
            where.productId = productId;
        }
        const productSeals = await prisma.productSeal.findMany({
            where,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        brand: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        const enrichedSeals = productSeals.map(productSeal => {
            const sealData = BRAZILIAN_SEALS.find(s => s.id === productSeal.sealId);
            return {
                ...productSeal,
                seal: sealData
            };
        });
        res.json(enrichedSeals);
    }
    catch (error) {
        console.error('Erro ao buscar selos de produtos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
router.post('/product-seals', auth_1.authenticateToken, async (req, res) => {
    try {
        const validatedData = productSealSchema.parse(req.body);
        const product = await prisma.product.findUnique({
            where: { id: validatedData.productId }
        });
        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        const seal = BRAZILIAN_SEALS.find(s => s.id === validatedData.sealId);
        if (!seal) {
            return res.status(404).json({ error: 'Selo não encontrado' });
        }
        const existingSeal = await prisma.productSeal.findFirst({
            where: {
                productId: validatedData.productId,
                sealId: validatedData.sealId
            }
        });
        if (existingSeal) {
            return res.status(400).json({ error: 'Este selo já foi adicionado ao produto' });
        }
        const productSeal = await prisma.productSeal.create({
            data: {
                ...validatedData,
                issuedDate: validatedData.issuedDate ? new Date(validatedData.issuedDate) : null,
                expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
                status: 'PENDING'
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        brand: true
                    }
                }
            }
        });
        const enrichedSeal = {
            ...productSeal,
            seal
        };
        res.status(201).json(enrichedSeal);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
        }
        console.error('Erro ao adicionar selo ao produto:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
router.put('/product-seals/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const productSeal = await prisma.productSeal.findUnique({
            where: { id }
        });
        if (!productSeal) {
            return res.status(404).json({ error: 'Selo do produto não encontrado' });
        }
        const updatedSeal = await prisma.productSeal.update({
            where: { id },
            data: {
                ...updateData,
                issuedDate: updateData.issuedDate ? new Date(updateData.issuedDate) : undefined,
                expiryDate: updateData.expiryDate ? new Date(updateData.expiryDate) : undefined,
                updatedAt: new Date()
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        brand: true
                    }
                }
            }
        });
        const seal = BRAZILIAN_SEALS.find(s => s.id === updatedSeal.sealId);
        const enrichedSeal = {
            ...updatedSeal,
            seal
        };
        res.json(enrichedSeal);
    }
    catch (error) {
        console.error('Erro ao atualizar selo do produto:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
router.delete('/product-seals/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const productSeal = await prisma.productSeal.findUnique({
            where: { id }
        });
        if (!productSeal) {
            return res.status(404).json({ error: 'Selo do produto não encontrado' });
        }
        await prisma.productSeal.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Erro ao remover selo do produto:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
exports.default = router;
//# sourceMappingURL=seals.js.map