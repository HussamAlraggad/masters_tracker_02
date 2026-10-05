/**
 * Sync Button Component
 * Triggers the HU course sync modal
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Download, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SyncModal } from './SyncModal';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

interface SyncButtonProps {
  majorId: string;
  isGuest: boolean;
  disabled?: boolean;
  className?: string;
}

export function SyncButton({ majorId, isGuest, disabled, className }: SyncButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    success: boolean;
    imported: number;
    updated: number;
    message: string;
  } | null>(null);

  const handleSyncComplete = (result: { success: boolean; imported: number; updated: number; message: string }) => {
    setLastSyncResult(result);
    setIsModalOpen(false);
  };

  const handleOpenModal = () => {
    if (isGuest) {
      alert('Sync requires an account. Please sign up or sign in to sync courses from HU.');
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Button
              onClick={handleOpenModal}
              disabled={disabled || isGuest}
              className={cn(
                'btn-space-secondary gap-2',
                'relative overflow-hidden',
                className
              )}
              size="sm"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Sync from HU</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" align="center">
            <p className="text-sm">Sync courses from HU</p>
            {isGuest && <p className="text-xs text-starlight-dim mt-1">Requires account</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Last sync result toast */}
      {lastSyncResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            'fixed bottom-6 left-6 z-50 glass-strong px-4 py-3 rounded-xl shadow-2xl',
            'flex items-center gap-3 max-w-md'
          )}
        >
          <div className="flex-1">
            <p className="font-medium text-star-white">
              {lastSyncResult.success ? 'Sync Complete' : 'Sync Failed'}
            </p>
            <p className="text-starlight-dim text-sm">
              {lastSyncResult.message}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLastSyncResult(null)}
            className="text-starlight-dim hover:text-star-white"
          >
            <AlertCircle className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Sync Modal */}
      <SyncModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={setLastSyncResult}
        majorId={majorId}
      />
    </>
  );
}