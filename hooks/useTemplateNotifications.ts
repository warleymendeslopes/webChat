'use client';

import { FacebookTemplate } from '@/types/templates';
import { useCallback, useEffect, useState } from 'react';

interface TemplateNotification {
  id: string;
  templateId: string;
  status: FacebookTemplate['status'];
  rejectionReason?: string;
  timestamp: Date;
}

export function useTemplateNotifications(companyId: string) {
  const [notifications, setNotifications] = useState<TemplateNotification[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  // Adicionar notificação
  const addNotification = useCallback((notification: Omit<TemplateNotification, 'id' | 'timestamp'>) => {
    const newNotification: TemplateNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Manter apenas 5 notificações
  }, []);

  // Remover notificação
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Limpar todas as notificações
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Polling para verificar mudanças de status
  const startPolling = useCallback(() => {
    if (!companyId) return;
    
    setIsPolling(prev => {
      if (prev) return prev; // Já está rodando
      console.log('🔄 Starting template status polling');
      return true;
    });
  }, [companyId]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    console.log('⏹️ Stopping template status polling');
  }, []);

  // Verificar mudanças de status periodicamente
  useEffect(() => {
    if (!isPolling || !companyId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/templates/sync-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Adicionar notificações para templates que mudaram de status
          data.results?.forEach((result: any) => {
            if (result.status === 'synced' && result.newStatus !== 'pending') {
              // Usar setNotifications diretamente para evitar dependência
              setNotifications(prev => {
                const newNotification: TemplateNotification = {
                  templateId: result.templateId,
                  status: result.newStatus,
                  rejectionReason: result.rejectionReason,
                  id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  timestamp: new Date(),
                };
                return [newNotification, ...prev.slice(0, 4)];
              });
            }
          });
        }
      } catch (error) {
        console.error('Error polling template status:', error);
      }
    }, 30000); // Poll a cada 30 segundos

    return () => clearInterval(pollInterval);
  }, [isPolling, companyId]);

  // Auto-remove notificações antigas
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setNotifications(prev => 
        prev.filter(n => 
          Date.now() - n.timestamp.getTime() < 300000 // 5 minutos
        )
      );
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    startPolling,
    stopPolling,
    isPolling,
  };
}
