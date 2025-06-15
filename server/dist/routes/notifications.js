"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const mockNotifications = [
    {
        id: '1',
        title: 'Produto Validado',
        message: 'Seu produto "Whey Protein Premium" foi validado com sucesso!',
        type: 'success',
        read: false,
        createdAt: new Date().toISOString(),
        userId: 'user-1',
        data: { productId: 'product-1' }
    },
    {
        id: '2',
        title: 'Novo Relatório',
        message: 'Um novo relatório foi enviado pelo laboratório XYZ.',
        type: 'info',
        read: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        userId: 'user-1',
        data: { reportId: 'report-1' }
    },
    {
        id: '3',
        title: 'QR Code Gerado',
        message: 'QR Code gerado para o produto "Iogurte Grego Natural".',
        type: 'success',
        read: true,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        userId: 'user-1',
        data: { productId: 'product-2' }
    }
];
router.get('/', auth_1.authenticateToken, (req, res) => {
    try {
        const userNotifications = mockNotifications.filter(n => n.userId === 'user-1');
        res.json({
            notifications: userNotifications,
            total: userNotifications.length,
            unread: userNotifications.filter(n => !n.read).length
        });
    }
    catch (error) {
        console.error('Erro ao buscar notificações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
router.get('/unread-count', auth_1.authenticateToken, (req, res) => {
    try {
        const userNotifications = mockNotifications.filter(n => n.userId === 'user-1');
        const unreadCount = userNotifications.filter(n => !n.read).length;
        res.json({ count: unreadCount });
    }
    catch (error) {
        console.error('Erro ao buscar contagem:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
router.patch('/:id/read', auth_1.authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const notification = mockNotifications.find(n => n.id === id);
        if (!notification) {
            return res.status(404).json({ error: 'Notificação não encontrada' });
        }
        notification.read = true;
        res.json({
            message: 'Notificação marcada como lida',
            notification
        });
    }
    catch (error) {
        console.error('Erro ao marcar como lida:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
router.patch('/mark-all-read', auth_1.authenticateToken, (req, res) => {
    try {
        mockNotifications.forEach(n => {
            if (n.userId === 'user-1') {
                n.read = true;
            }
        });
        res.json({ message: 'Todas as notificações foram marcadas como lidas' });
    }
    catch (error) {
        console.error('Erro ao marcar todas como lidas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
router.delete('/:id', auth_1.authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const index = mockNotifications.findIndex(n => n.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Notificação não encontrada' });
        }
        mockNotifications.splice(index, 1);
        res.json({ message: 'Notificação deletada com sucesso' });
    }
    catch (error) {
        console.error('Erro ao deletar notificação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
router.post('/', auth_1.authenticateToken, (req, res) => {
    try {
        const { title, message, type, userId, data } = req.body;
        if (!title || !message) {
            return res.status(400).json({ error: 'Título e mensagem são obrigatórios' });
        }
        const newNotification = {
            id: Date.now().toString(),
            title,
            message,
            type: type || 'info',
            read: false,
            createdAt: new Date().toISOString(),
            userId: userId || 'user-1',
            data: data || {}
        };
        mockNotifications.unshift(newNotification);
        res.status(201).json({
            message: 'Notificação criada com sucesso',
            notification: newNotification
        });
    }
    catch (error) {
        console.error('Erro ao criar notificação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map