/**
 * Sync Modal Component
 * Shows progress during HU course sync
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  X,
  Globe,
  Database,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { syncFromHU } from '@/lib/scraper/firecrawl-sync';
import type { Course } from '@/types';

const SYNC_STEPS = [
  { id: 'prompt', label: 'Preparing request', icon: FileText },
  { id: 'fetch', label: 'Fetching from HU', icon: Globe },
  { id: 'parse', label: 'Parsing courses', icon: FileText },
  { id: 'fix', label: 'Fixing thesis credits', icon: Database },
  { id: 'import', label: 'Importing to tracker', icon: Database },
] as const;

type StepId = typeof SYNC_STEPS[number]['id'];

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: { success: boolean; imported: number; updated: number; message: string }) => void;
  majorId: string;
}

export function SyncModal({ isOpen, onClose, onComplete, majorId }: SyncModalProps) {
  const [currentStep, setCurrentStep] = useState<StepId>('prompt');
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [conflicts, setConflicts] = useState<Array<{ courseId: string; code: string; nameEn: string; localStatus: string }>>([]);
  const [forceOverwrite, setForceOverwrite] = useState(false);
  const [result, setResult] = useState<{ success: boolean; imported: number; updated: number; message: string } | null>(null);

  const stepOrder = SYNC_STEPS.map(s => s.id);
  const currentStepIndex = stepOrder.indexOf(currentStep);
  const stepProgress = ((currentStepIndex + 1) / stepOrder.length) * 100;

  const runSync = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setCurrentStep('prompt');
    setProgress(10);

    try {
      // Step 1: Prepare
      setCurrentStep('prompt');
      setProgress(10);
      await new Promise(r => setTimeout(r, 300));

      // Step 2: Fetch
      setCurrentStep('fetch');
      setProgress(25);
      
      const result = await syncFromHU({
        majorId,
        onProgress: (step, progress) => {
          const stepMap: Record<string, StepId> = {
            'Building Firecrawl prompt...': 'prompt',
            'Fetching from HU': 'fetch',
            'Parsing course table': 'parse',
            'Fixing thesis credits': 'fix',
            'Importing to tracker': 'import',
          };
          if (stepMap[step]) {
            setCurrentStep(stepMap[step]);
            setProgress(progress);
          }
        },
      });

      if (!result.success) {
        throw new Error(result.errors.join(', '));
      }

      // Step 3: Parse
      setCurrentStep('parse');
      setProgress(50);
      await new Promise(r => setTimeout(r, 300));

      // Step 4: Fix thesis credits
      setCurrentStep('fix');
      setProgress(70);
      await new Promise(r => setTimeout(r, 300));

      // Step 4.5: Check for conflicts (would need API call)
      // For now, we'll skip this and let the API handle it
      // In a real implementation, we'd check local status here

      // Step 5: Import
      setCurrentStep('import');
      setProgress(90);

      // Call the API to import
      const response = await fetch('/api/courses/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ majorId, forceOverwrite }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'OVERWRITE_CONFLICT') {
          setConflicts(data.conflicts || []);
          setShowOverwriteDialog(true);
          setIsLoading(false);
          return;
        }
        throw new Error(data.error || 'Sync failed');
      }

      setProgress(100);
      setCurrentStep('import');
      
      const message = `Sync complete: ${data.imported} imported, ${data.updated} updated`;
      const finalResult = {
        success: true,
        imported: data.imported,
        updated: data.updated,
        message,
      };
      
      setResult(finalResult);
      onComplete(finalResult);
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMsg);
      setResult({
        success: false,
        imported: 0,
        updated: 0,
        message: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  }, [majorId]);

  // Handle overwrite confirmation
  const handleOverwriteConfirm = () => {
    setForceOverwrite(true);
    setShowOverwriteDialog(false);
    runSync();
  };

  // Handle close
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Auto-start sync when modal opens
  useEffect(() => {
    if (isOpen) {
      runSync();
    }
  }, [isOpen, runSync]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('prompt');
      setProgress(0);
      setError(null);
      setShowOverwriteDialog(false);
      setConflicts([]);
      setForceOverwrite(false);
      setResult(null);
    }
  }, [isOpen]);
  // stepOrder is defined at the top level

  // Render the modal content
  const ModalContent = () => (
    <>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-void/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="glass-card w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="glass px-6 py-4 border-b border-glass-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="glass-strong p-2 rounded-xl"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw className="text-nebula-primary" size={24} />
              </motion.div>
              <div>
                <h3 className="font-heading text-star-white text-lg">Sync from HU</h3>
                <p className="text-starlight-dim text-sm">Fetching courses for your major</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isLoading}
              className="text-starlight-dim hover:text-star-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 border-b border-glass-border">
            <div className="space-y-3">
              {SYNC_STEPS.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = stepOrder.indexOf(step.id) < stepOrder.indexOf(currentStep);
                
                return (
                  <motion.div
                    key={step.id}
                    className={cn(
                      'flex items-center gap-3 transition-all duration-300',
                      isActive && 'scale-[1.02]'
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300',
                      isActive ? 'bg-nebula-primary/20 border border-nebula-primary' : 
                      index < stepOrder.indexOf(currentStep) ? 'bg-status-passed/20 border border-status-passed' :
                      'glass border border-glass-border'
                    )}>
                      {index < stepOrder.indexOf(currentStep) ? (
                        <CheckCircle className="text-status-passed" size={16} />
                      ) : isActive ? (
                        <motion.div
                          className="w-4 h-4 border-2 border-nebula-primary border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                      ) : (
                        <step.icon className="text-starlight-dim" size={18} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium truncate',
                        isActive ? 'text-star-white' : 'text-starlight-dim'
                      )}>
                        {step.label}
                      </p>
                      <div className="h-1.5 glass-strong rounded-full overflow-hidden mt-1">
                        <motion.div
                          className="h-full bg-nebula-primary"
                          initial={{ width: 0 }}
                          animate={{ width: isActive ? `${progress}%` : index < stepOrder.indexOf(currentStep) ? '100%' : 0 }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Status Message */}
          <div className="px-6 py-4">
            <motion.p
              className="text-center text-starlight-dim text-sm"
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {currentStep === 'prompt' && 'Preparing sync request...'}
              {currentStep === 'fetch' && 'Connecting to HU and fetching course data...'}
              {currentStep === 'parse' && 'Parsing course table...'}
              {currentStep === 'fix' && 'Checking thesis credits...'}
              {currentStep === 'import' && 'Importing courses to your tracker...'}
            </motion.p>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              className="mx-6 mb-4 glass border-status-failed/30 p-4 rounded-xl flex items-center gap-3 text-status-failed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className="flex-shrink-0" size={20} />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          {/* Result Success */}
          {result?.success && (
            <motion.div
              className="mx-6 mb-4 glass border-status-passed/30 p-4 rounded-xl flex items-center gap-3 text-status-passed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CheckCircle className="flex-shrink-0" size={20} />
              <p className="text-sm">{result.message}</p>
            </motion.div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-glass-border flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && <ModalContent />}
      </AnimatePresence>

      {/* Overwrite Confirmation Dialog */}
      <AlertDialog open={showOverwriteDialog} onOpenChange={setShowOverwriteDialog}>
        <AlertDialogContent className="glass-card max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite local changes?</AlertDialogTitle>
            <AlertDialogDescription>
              {conflicts.length} courses have local status changes that would be overwritten by HU data:
              <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {conflicts.map(c => (
                  <li key={c.courseId} className="text-sm flex items-center gap-2">
                    <span className="font-mono text-nebula-primary">{c.code}</span>
                    <span className="text-starlight-dim truncate">{c.nameEn}</span>
                    <span className="text-xs px-2 py-0.5 glass-strong rounded">
                      {c.localStatus}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-starlight-dim">
                Your local Pending/Registered/Passed/Failed status will be reset to HU data.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel onClick={() => setShowOverwriteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleOverwriteConfirm} className="btn-space-primary">
              Yes, overwrite
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}