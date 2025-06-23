import React from 'react';
import { Phone, Mail, MessageCircle, Clock, MapPin } from 'lucide-react';

interface ContactOptionsProps {
  whatsappNumber?: string;
  brandName?: string;
  email?: string;
  phone?: string;
  address?: string;
  businessHours?: string;
}

const ContactOptions: React.FC<ContactOptionsProps> = ({
  whatsappNumber = '5511999999999',
  brandName = 'True Label',
  email = 'suporte@truelabel.com.br',
  phone = '+55 11 9999-9999',
  address = 'São Paulo, SP - Brasil',
  businessHours = 'Segunda a Sexta, 9h às 18h'
}) => {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      `Olá! Estou entrando em contato através do sistema True Label sobre um produto da ${brandName}.`
    );
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailClick = () => {
    const subject = encodeURIComponent(`Contato - ${brandName} via True Label`);
    const body = encodeURIComponent(
      `Olá,\n\nEstou entrando em contato através do sistema True Label.\n\nMarca: ${brandName}\n\n[Descreva sua mensagem aqui]\n\nAtenciosamente,`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handlePhoneClick = () => {
    window.location.href = `tel:${phone.replace(/\D/g, '')}`;
  };

  const contactMethods = [
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      description: 'Resposta rápida via WhatsApp',
      value: whatsappNumber,
      action: handleWhatsAppClick,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100',
      badge: 'Mais Rápido'
    },
    {
      icon: Mail,
      title: 'E-mail',
      description: 'Envie-nos um e-mail detalhado',
      value: email,
      action: handleEmailClick,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100'
    },
    {
      icon: Phone,
      title: 'Telefone',
      description: 'Fale diretamente conosco',
      value: phone,
      action: handlePhoneClick,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Entre em Contato
        </h3>
        <p className="text-sm text-gray-600">
          Escolha o canal de comunicação mais conveniente para você
        </p>
      </div>

      <div className="space-y-3">
        {contactMethods.map((method, index) => (
          <button
            key={index}
            onClick={method.action}
            className={`w-full p-4 rounded-lg ${method.bgColor} ${method.hoverColor} transition-colors flex items-start space-x-4 text-left group`}
          >
            <div className={`${method.color} mt-1`}>
              <method.icon size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{method.title}</h4>
                {method.badge && (
                  <span className="text-xs px-2 py-1 bg-green-500 text-white rounded-full">
                    {method.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{method.description}</p>
              <p className={`text-sm ${method.color} mt-2 group-hover:underline`}>
                {method.value}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="border-t pt-4 space-y-3">
        <div className="flex items-start space-x-3">
          <Clock className="text-gray-400 mt-1" size={20} />
          <div>
            <h5 className="text-sm font-medium text-gray-900">Horário de Atendimento</h5>
            <p className="text-sm text-gray-600">{businessHours}</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <MapPin className="text-gray-400 mt-1" size={20} />
          <div>
            <h5 className="text-sm font-medium text-gray-900">Localização</h5>
            <p className="text-sm text-gray-600">{address}</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Dica:</strong> Para um atendimento mais rápido, tenha em mãos o código 
          do produto ou número do pedido ao entrar em contato.
        </p>
      </div>
    </div>
  );
};

export default ContactOptions;