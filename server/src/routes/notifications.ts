import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Mock data para notificações
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

// GET /api/notifications - Listar notificações do usuário
router.get('/', authenticateToken, (req, res) => {
  try {
    // Filtrar notificações do usuário (mock)
    const userNotifications = mockNotifications.filter(n => n.userId === 'user-1');
    
    res.json({
      notifications: userNotifications,
      total: userNotifications.length,
      unread: userNotifications.filter(n => !n.read).length
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/notifications/unread-count - Contagem de não lidas
router.get('/unread-count', authenticateToken, (req, res) => {
  try {
    const userNotifications = mockNotifications.filter(n => n.userId === 'user-1');
    const unreadCount = userNotifications.filter(n => !n.read).length;
    
    res.json({ count: unreadCount });
  } catch (error) {
    console.error('Erro ao buscar contagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/notifications/:id/read - Marcar como lida
router.patch('/:id/read', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const notification = mockNotifications.find(n => n.id === id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }
    
    // Simular marcação como lida
    notification.read = true;
    
    res.json({ 
      message: 'Notificação marcada como lida',
      notification 
    });
  } catch (error) {
    console.error('Erro ao marcar como lida:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/notifications/mark-all-read - Marcar todas como lidas
router.patch('/mark-all-read', authenticateToken, (req, res) => {
  try {
    // Simular marcação de todas como lidas
    mockNotifications.forEach(n => {
      if (n.userId === 'user-1') {
        n.read = true;
      }
    });
    
    res.json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/notifications/:id - Deletar notificação
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const index = mockNotifications.findIndex(n => n.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }
    
    // Simular remoção
    mockNotifications.splice(index, 1);
    
    res.json({ message: 'Notificação deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/notifications - Criar notificação (admin)
router.post('/', authenticateToken, (req, res) => {
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
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
