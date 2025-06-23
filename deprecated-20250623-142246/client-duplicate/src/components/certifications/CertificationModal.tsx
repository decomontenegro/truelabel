import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ArrowTopRightOnSquareIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { Certification, CERTIFICATION_INFO } from '@/types/certifications';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CertificationModalProps {
  certification: Certification | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CertificationModal: React.FC<CertificationModalProps> = ({
  certification,
  isOpen,
  onClose
}) => {
  if (!certification) return null;

  const info = CERTIFICATION_INFO[certification.type];

  const getStatusBadge = () => {
    const statusConfig = {
      [CertificationStatus.ACTIVE]: {
        label: 'Ativo',
        color: 'bg-green-100 text-green-800'
      },
      [CertificationStatus.EXPIRED]: {
        label: 'Expirado',
        color: 'bg-red-100 text-red-800'
      },
      [CertificationStatus.SUSPENDED]: {
        label: 'Suspenso',
        color: 'bg-red-100 text-red-800'
      },
      [CertificationStatus.REVOKED]: {
        label: 'Revogado',
        color: 'bg-red-100 text-red-800'
      },
      [CertificationStatus.PENDING]: {
        label: 'Pendente',
        color: 'bg-yellow-100 text-yellow-800'
      },
      [CertificationStatus.RENEWAL]: {
        label: 'Em Renovação',
        color: 'bg-blue-100 text-blue-800'
      }
    };

    const config = statusConfig[certification.status];
    return (
      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', config.color)}>
        {config.label}
      </span>
    );
  };

  const getDaysUntilExpiry = () => {
    if (!certification.expiryDate) return null;
    
    const expiryDate = new Date(certification.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return <span className="text-red-600">Expirado há {Math.abs(daysUntilExpiry)} dias</span>;
    } else if (daysUntilExpiry === 0) {
      return <span className="text-red-600">Expira hoje</span>;
    } else if (daysUntilExpiry <= 30) {
      return <span className="text-yellow-600">Expira em {daysUntilExpiry} dias</span>;
    } else {
      return <span className="text-gray-600">Válido por {daysUntilExpiry} dias</span>;
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4 sm:pr-6 sm:pt-6">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fechar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-16 sm:w-16">
                    <span className="text-2xl sm:text-3xl" role="img" aria-label={info.name}>
                      {info.icon}
                    </span>
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {info.name}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">{info.description}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-200 pt-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                        {getStatusBadge()}
                        {getDaysUntilExpiry()}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Número de Registro</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">{certification.registrationNumber}</dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Data de Emissão</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {format(new Date(certification.issueDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Data de Validade</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {format(new Date(certification.expiryDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Órgão Emissor</dt>
                      <dd className="mt-1 text-sm text-gray-900">{info.issuer}</dd>
                    </div>

                    {certification.scope && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Escopo</dt>
                        <dd className="mt-1 text-sm text-gray-900">{certification.scope}</dd>
                      </div>
                    )}
                  </dl>

                  {info.requirements && info.requirements.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900">Requisitos da Certificação</h4>
                      <ul className="mt-2 list-disc list-inside text-sm text-gray-600 space-y-1">
                        {info.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    {certification.documentUrl && (
                      <a
                        href={certification.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                        Baixar Certificado
                      </a>
                    )}

                    {(certification.verificationUrl || info.verificationUrl) && (
                      <a
                        href={certification.verificationUrl || info.verificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
                        Verificar no Site Oficial
                      </a>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};