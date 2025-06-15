"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCertificationTimeline = exports.generateBadge = exports.verifyCertification = exports.configureAlertSettings = exports.markAlertAsRead = exports.getCertificationAlerts = exports.getCertificationStatistics = exports.getExpiringCertifications = exports.getProductCertifications = exports.deleteCertification = exports.updateCertification = exports.createCertification = exports.getCertificationById = exports.getCertifications = void 0;
const asyncHandler_1 = require("../middleware/asyncHandler");
const mockCertifications = [
    {
        id: '1',
        name: 'ISO 9001:2015',
        type: 'ISO',
        issuingBody: 'Bureau Veritas',
        issueDate: '2024-01-15',
        expiryDate: '2025-01-15',
        certificateNumber: 'BV-ISO-9001-2024-001',
        status: 'ACTIVE',
        documentUrl: '/uploads/certifications/iso-9001-certificate.pdf',
        scope: 'Quality Management System',
        productId: '1',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '2',
        name: 'HACCP Certification',
        type: 'HACCP',
        issuingBody: 'SGS',
        issueDate: '2024-02-01',
        expiryDate: '2025-02-01',
        certificateNumber: 'SGS-HACCP-2024-002',
        status: 'ACTIVE',
        documentUrl: '/uploads/certifications/haccp-certificate.pdf',
        scope: 'Food Safety Management',
        productId: '1',
        createdAt: new Date(),
        updatedAt: new Date()
    }
];
exports.getCertifications = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, type, status, search } = req.query;
    let filtered = [...mockCertifications];
    if (type) {
        filtered = filtered.filter(cert => cert.type === type);
    }
    if (status) {
        filtered = filtered.filter(cert => cert.status === status);
    }
    if (search) {
        const searchStr = search.toString().toLowerCase();
        filtered = filtered.filter(cert => cert.name.toLowerCase().includes(searchStr) ||
            cert.certificateNumber.toLowerCase().includes(searchStr));
    }
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedCerts = filtered.slice(startIndex, endIndex);
    res.json({
        certifications: paginatedCerts,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: filtered.length,
            totalPages: Math.ceil(filtered.length / Number(limit))
        }
    });
});
exports.getCertificationById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const certification = mockCertifications.find(cert => cert.id === id);
    if (!certification) {
        return res.status(404).json({ message: 'Certificação não encontrada' });
    }
    res.json({ certification });
});
exports.createCertification = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const newCertification = {
        id: Date.now().toString(),
        ...req.body,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
    };
    mockCertifications.push(newCertification);
    res.status(201).json({
        certification: newCertification,
        message: 'Certificação criada com sucesso'
    });
});
exports.updateCertification = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const index = mockCertifications.findIndex(cert => cert.id === id);
    if (index === -1) {
        return res.status(404).json({ message: 'Certificação não encontrada' });
    }
    mockCertifications[index] = {
        ...mockCertifications[index],
        ...req.body,
        updatedAt: new Date()
    };
    res.json({
        certification: mockCertifications[index],
        message: 'Certificação atualizada com sucesso'
    });
});
exports.deleteCertification = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const index = mockCertifications.findIndex(cert => cert.id === id);
    if (index === -1) {
        return res.status(404).json({ message: 'Certificação não encontrada' });
    }
    mockCertifications.splice(index, 1);
    res.json({ message: 'Certificação removida com sucesso' });
});
exports.getProductCertifications = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { productId } = req.params;
    const productCerts = mockCertifications.filter(cert => cert.productId === productId);
    res.json({ certifications: productCerts });
});
exports.getExpiringCertifications = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { days = 30 } = req.query;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Number(days));
    const expiringCerts = mockCertifications.filter(cert => {
        const expiryDate = new Date(cert.expiryDate);
        return expiryDate <= futureDate && expiryDate >= new Date();
    });
    res.json({
        certifications: expiringCerts,
        count: expiringCerts.length,
        daysAhead: Number(days)
    });
});
exports.getCertificationStatistics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { productId, brandId } = req.query;
    let filtered = [...mockCertifications];
    if (productId) {
        filtered = filtered.filter(cert => cert.productId === productId);
    }
    const total = filtered.length;
    const active = filtered.filter(cert => cert.status === 'ACTIVE').length;
    const expired = filtered.filter(cert => cert.status === 'EXPIRED').length;
    const expiringSoon = filtered.filter(cert => {
        const expiryDate = new Date(cert.expiryDate);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
    }).length;
    const byType = filtered.reduce((acc, cert) => {
        acc[cert.type] = (acc[cert.type] || 0) + 1;
        return acc;
    }, {});
    res.json({
        total,
        active,
        expired,
        expiringSoon,
        byType,
        lastUpdated: new Date()
    });
});
exports.getCertificationAlerts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { productId, isRead } = req.query;
    const mockAlerts = [
        {
            id: '1',
            type: 'EXPIRING_SOON',
            certificationId: '1',
            certificationName: 'ISO 9001:2015',
            message: 'A certificação ISO 9001:2015 expira em 30 dias',
            daysUntilExpiry: 30,
            isRead: false,
            createdAt: new Date(),
            productId: '1'
        },
        {
            id: '2',
            type: 'EXPIRING_SOON',
            certificationId: '2',
            certificationName: 'HACCP Certification',
            message: 'A certificação HACCP expira em 45 dias',
            daysUntilExpiry: 45,
            isRead: false,
            createdAt: new Date(),
            productId: '1'
        }
    ];
    let filtered = [...mockAlerts];
    if (productId) {
        filtered = filtered.filter(alert => alert.productId === productId);
    }
    if (isRead !== undefined) {
        filtered = filtered.filter(alert => alert.isRead === (isRead === 'true'));
    }
    res.json({ alerts: filtered });
});
exports.markAlertAsRead = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { alertId } = req.params;
    res.json({ message: 'Alerta marcado como lido' });
});
exports.configureAlertSettings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { expirationWarningDays, emailNotifications, dashboardNotifications } = req.body;
    res.json({
        message: 'Configurações de alerta atualizadas com sucesso',
        settings: {
            expirationWarningDays,
            emailNotifications,
            dashboardNotifications
        }
    });
});
exports.verifyCertification = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { certificateNumber } = req.body;
    const certification = mockCertifications.find(cert => cert.id === id);
    if (!certification) {
        return res.status(404).json({ message: 'Certificação não encontrada' });
    }
    const isValid = certificateNumber ?
        certification.certificateNumber === certificateNumber :
        true;
    res.json({
        isValid,
        certification: isValid ? certification : null,
        verifiedAt: new Date(),
        message: isValid ? 'Certificação válida' : 'Certificação inválida'
    });
});
exports.generateBadge = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { certificationId, style, size, format } = req.body;
    const certification = mockCertifications.find(cert => cert.id === certificationId);
    if (!certification) {
        return res.status(404).json({ message: 'Certificação não encontrada' });
    }
    const badge = {
        id: Date.now().toString(),
        certificationId,
        certificationName: certification.name,
        style: style || 'default',
        size: size || 'medium',
        format: format || 'png',
        url: `/api/certifications/badges/${Date.now()}.${format || 'png'}`,
        embedCode: `<img src="https://truelabel.com.br/badges/${Date.now()}.${format || 'png'}" alt="${certification.name}" />`,
        createdAt: new Date()
    };
    res.json({
        badge,
        message: 'Badge gerado com sucesso'
    });
});
exports.getCertificationTimeline = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const certification = mockCertifications.find(cert => cert.id === id);
    if (!certification) {
        return res.status(404).json({ message: 'Certificação não encontrada' });
    }
    const timeline = {
        certificationId: id,
        events: [
            {
                id: '1',
                type: 'CREATED',
                date: certification.createdAt,
                description: 'Certificação adicionada ao sistema',
                user: 'Sistema'
            },
            {
                id: '2',
                type: 'ISSUED',
                date: certification.issueDate,
                description: `Certificado emitido por ${certification.issuingBody}`,
                user: certification.issuingBody
            },
            {
                id: '3',
                type: 'DOCUMENT_UPLOADED',
                date: new Date(certification.issueDate),
                description: 'Documento do certificado enviado',
                user: 'Admin'
            }
        ]
    };
    res.json(timeline);
});
//# sourceMappingURL=certificationController.js.map