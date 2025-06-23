import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ContactOptions from './ContactOptions';
import FAQSection from './FAQSection';
import SupportTicket from './SupportTicket';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatWidgetProps {
  productId?: string;
  brandName?: string;
  whatsappNumber?: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ 
  productId, 
  brandName = 'True Label',
  whatsappNumber 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'contact' | 'faq' | 'ticket'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Olá! Sou o assistente virtual da ${brandName}. Como posso ajudar você hoje?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = generateBotResponse(inputText);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 1000);
  };

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('produto') || lowerMessage.includes('autenticidade')) {
      return 'Para verificar a autenticidade do seu produto, você pode escanear o código QR presente na embalagem. Gostaria de mais informações sobre como fazer isso?';
    }
    
    if (lowerMessage.includes('problema') || lowerMessage.includes('defeito')) {
      return 'Lamento saber que está tendo problemas. Você pode abrir um ticket de suporte clicando no botão "Suporte" abaixo, ou entrar em contato diretamente via WhatsApp.';
    }
    
    if (lowerMessage.includes('whatsapp') || lowerMessage.includes('contato')) {
      setActiveView('contact');
      return 'Claro! Vou mostrar nossas opções de contato para você.';
    }
    
    if (lowerMessage.includes('pergunta') || lowerMessage.includes('dúvida')) {
      setActiveView('faq');
      return 'Vou mostrar nossa seção de perguntas frequentes. Talvez você encontre sua resposta lá!';
    }
    
    return 'Entendo sua mensagem. Você pode escolher uma das opções abaixo ou me fazer uma pergunta mais específica.';
  };

  const quickActions = [
    { label: 'Contato', action: () => setActiveView('contact') },
    { label: 'FAQ', action: () => setActiveView('faq') },
    { label: 'Abrir Ticket', action: () => setActiveView('ticket') }
  ];

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
          >
            <MessageCircle size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl z-50 ${
              isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'
            } flex flex-col`}
          >
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <h3 className="font-semibold">Suporte {brandName}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="hover:bg-blue-700 p-1 rounded transition-colors"
                >
                  {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-blue-700 p-1 rounded transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Navigation Tabs */}
                <div className="flex border-b bg-gray-50">
                  {[
                    { key: 'chat', label: 'Chat' },
                    { key: 'contact', label: 'Contato' },
                    { key: 'faq', label: 'FAQ' },
                    { key: 'ticket', label: 'Ticket' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveView(tab.key as any)}
                      className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                        activeView === tab.key
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden">
                  {activeView === 'chat' && (
                    <>
                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map(message => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.sender === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-lg ${
                                message.sender === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.text}</p>
                              <p className="text-xs mt-1 opacity-70">
                                {message.timestamp.toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Quick Actions */}
                      <div className="px-4 py-2 flex flex-wrap gap-2">
                        {quickActions.map((action, index) => (
                          <button
                            key={index}
                            onClick={action.action}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>

                      {/* Input */}
                      <div className="p-4 border-t">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage();
                          }}
                          className="flex space-x-2"
                        >
                          <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="submit"
                            disabled={!inputText.trim()}
                            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send size={20} />
                          </button>
                        </form>
                      </div>
                    </>
                  )}

                  {activeView === 'contact' && (
                    <ContactOptions 
                      whatsappNumber={whatsappNumber}
                      brandName={brandName}
                    />
                  )}

                  {activeView === 'faq' && (
                    <FAQSection productId={productId} />
                  )}

                  {activeView === 'ticket' && (
                    <SupportTicket 
                      productId={productId}
                      onSuccess={() => {
                        setActiveView('chat');
                        setMessages(prev => [...prev, {
                          id: Date.now().toString(),
                          text: 'Seu ticket foi criado com sucesso! Nossa equipe entrará em contato em breve.',
                          sender: 'bot',
                          timestamp: new Date()
                        }]);
                      }}
                    />
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;