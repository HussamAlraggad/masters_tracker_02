/**
 * Auth Components - Guest entry, Sign in, Sign up, Upgrade flow
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Lock, 
  Mail, 
  GraduationCap, 
  ArrowRight, 
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  Info,
  Target,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MajorConfig, ThesisPattern } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

interface AuthFormProps {
  mode: 'guest' | 'signin' | 'signup' | 'upgrade';
  majors: MajorConfig[];
  onGuestEnter: (majorId: string) => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, majorId: string, thesisTrackId: string) => Promise<void>;
  onUpgrade: (email: string, password: string) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
  guestMajorId?: string;
}

export function AuthForm({
  mode,
  majors,
  onGuestEnter,
  onSignIn,
  onSignUp,
  onUpgrade,
  onBack,
  isLoading,
  guestMajorId,
}: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedMajor, setSelectedMajor] = useState(guestMajorId || majors[0]?.id || '');
  const [selectedThesis, setSelectedThesis] = useState('9hr');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (mode !== 'guest') {
      if (!email) newErrors.email = 'Email is required';
      else if (!validateEmail(email)) newErrors.email = 'Invalid email format';
      
      if (!password) newErrors.password = 'Password is required';
      else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      
      if (mode === 'signup' || mode === 'upgrade') {
        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if ((mode === 'guest' || mode === 'signup') && !selectedMajor) {
      newErrors.major = 'Please select a major';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      if (mode === 'guest') {
        await onGuestEnter(selectedMajor);
      } else if (mode === 'signin') {
        await onSignIn(email, password);
      } else if (mode === 'signup') {
        await onSignUp(email, password, selectedMajor, selectedThesis);
      } else if (mode === 'upgrade') {
        await onUpgrade(email, password);
      }
      toast.success('Welcome to Masters Tracker!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    }
  };

  const majorOptions = majors.map(m => ({
    value: m.id,
    label: m.name,
    description: m.nameAr,
    thesisTracks: m.thesisPatterns,
  }));

  const selectedMajorConfig = majors.find(m => m.id === selectedMajor);
  const thesisOptions = selectedMajorConfig?.thesisPatterns || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md"
    >
      {/* Back button */}
      {(mode === 'signin' || mode === 'signup' || mode === 'upgrade') && (
        <motion.button
          onClick={onBack}
          className="mb-6 glass px-4 py-2 rounded-xl flex items-center gap-2 text-starlight-dim hover:text-star-white transition-colors"
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowRight className="rotate-180" size={18} />
          <span>Back</span>
        </motion.button>
      )}

      <Card className="glass-card">
        <CardHeader className="text-center pb-4">
          <motion.div
            className="glass-strong p-4 rounded-2xl inline-flex"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 15 }}
          >
            <GraduationCap className="text-nebula-primary" size={32} />
          </motion.div>
          <CardTitle className="text-star-white font-heading mt-4">
            {mode === 'guest' ? 'Continue as Guest' : mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription className="text-starlight-dim">
            {mode === 'guest' 
              ? 'Your data will be saved locally and cleared when you close the browser'
              : mode === 'signin'
              ? 'Sign in to access your progress across devices'
              : mode === 'signup'
              ? 'Create an account to sync your progress forever'
              : 'Upgrade your guest account to save progress permanently'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mode selector for initial screen */}
            {mode === 'guest' && (
              <Tabs defaultValue="guest" onValueChange={v => {}} className="w-full">
                <TabsList className="glass-strong p-1 rounded-lg">
                  <TabsTrigger value="guest" className="flex-1">
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="text-nebula-primary" size={16} />
                      Guest
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="auth" className="flex-1">
                    <span className="flex items-center justify-center gap-2">
                      <User className="text-star-white" size={16} />
                      Sign In
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {/* Major Selection */}
            {(mode === 'guest' || mode === 'signup') && (
              <div className="space-y-2">
                <Label className="text-starlight-dim text-sm">Select Your Major</Label>
                <Select value={selectedMajor} onValueChange={(value: string | null) => value && setSelectedMajor(value)}>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Choose your major..." />
                  </SelectTrigger>
                  <SelectContent className="glass-strong">
                    {majorOptions.map(major => (
                      <SelectItem key={major.value} value={major.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{major.label}</span>
                          <span className="text-starlight-dim text-xs">{major.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.major && (
                  <p className="text-status-failed text-sm">{errors.major}</p>
                )}
              </div>
            )}

            {/* Thesis Track Selection */}
            {(mode === 'signup' || mode === 'upgrade') && thesisOptions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-starlight-dim text-sm">Thesis Track</Label>
                <RadioGroup value={selectedThesis} onValueChange={setSelectedThesis} className="space-y-2">
                  {thesisOptions.map(track => (
                    <div key={track.id} className="glass p-3 rounded-xl border border-glass-border">
                      <RadioGroupItem value={track.id} className="flex items-center gap-3 w-full" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-star-white">{track.label}</span>
                          <Badge variant="outline" className="text-xs text-nebula-primary">
                            {track.credits} credits
                          </Badge>
                        </div>
                        <p className="text-starlight-dim text-sm mt-1">{track.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Email */}
            {(mode !== 'guest') && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-starlight-dim text-sm">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-starlight-muted" size={18} />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="glass-input pl-10"
                    disabled={isLoading}
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && (
                  <p className="text-status-failed text-sm flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.email}
                  </p>
                )}
              </div>
            )}

            {/* Password */}
            {(mode !== 'guest') && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-starlight-dim text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-starlight-muted" size={18} />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input pl-10 pr-10"
                    disabled={isLoading}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-starlight-muted hover:text-star-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <Lock size={18} /> : <Lock size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-status-failed text-sm flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.password}
                  </p>
                )}
              </div>
            )}

            {/* Confirm Password */}
            {(mode === 'signup' || mode === 'upgrade') && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-starlight-dim text-sm">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-starlight-muted" size={18} />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input pl-10"
                    disabled={isLoading}
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-status-failed text-sm flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Guest mode info */}
            {mode === 'guest' && (
              <motion.div
                className="glass border-status-pending/30 p-4 rounded-xl flex items-start gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Info className="text-status-pending flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-starlight-dim">
                  <p className="font-medium text-status-pending">Guest Mode</p>
                  <p>Data saved in browser only. Cleared on tab close. <br />Create an account anytime to keep your progress forever.</p>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full btn-space-primary gap-2"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <motion.div className="w-5 h-5 border-2 border-star-white/30 border-t-nebula-primary rounded-full animate-spin" />
                  <span>Please wait...</span>
                </>
              ) : mode === 'guest' ? (
                <>
                  <Sparkles size={18} />
                  <span>Enter as Guest</span>
                </>
              ) : mode === 'signin' ? (
                <>
                  <ArrowRight size={18} />
                  <span>Sign In</span>
                </>
              ) : mode === 'signup' ? (
                <>
                  <User size={18} />
                  <span>Create Account</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Upgrade Account</span>
                </>
              )}
            </Button>

            {/* Switch mode links */}
            <AnimatePresence mode="wait">
              {mode === 'signin' && (
                <p className="text-center text-starlight-dim text-sm">
                  Don't have an account?{' '}
                  <button
                    onClick={() => {}}
                    className="text-nebula-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </p>
              )}
              {mode === 'signup' && (
                <p className="text-center text-starlight-dim text-sm">
                  Already have an account?{' '}
                  <button
                    onClick={onBack}
                    className="text-nebula-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </AnimatePresence>
          </form>
        </CardContent>
      </Card>

      {/* Features preview */}
      <motion.div
        className="mt-8 grid grid-cols-3 gap-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="glass p-4 rounded-xl">
          <GraduationCap className="text-nebula-primary mx-auto mb-2" size={24} />
          <p className="text-star-white font-medium text-sm">Track Progress</p>
          <p className="text-starlight-dim text-xs mt-1">Visual orbital course map</p>
        </div>
        <div className="glass p-4 rounded-xl">
          <Target className="text-status-passed mx-auto mb-2" size={24} />
          <p className="text-star-white font-medium text-sm">Plan Semesters</p>
          <p className="text-starlight-dim text-xs mt-1">Pick 2-3 courses per term</p>
        </div>
        <div className="glass p-4 rounded-xl">
          <Brain className="text-status-registered mx-auto mb-2" size={24} />
          <p className="text-star-white font-medium text-sm">Smart Suggestions</p>
          <p className="text-starlight-dim text-xs mt-1">AI-powered recommendations</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Guest Banner (shows when in guest mode)
// ============================================================

interface GuestBannerProps {
  onUpgrade: () => void;
  onDismiss: () => void;
}

export function GuestBanner({ onUpgrade, onDismiss }: GuestBannerProps) {
  return (
    <motion.div
      className="glass border-nebula-primary/30 p-4 rounded-xl flex items-center justify-between"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex items-center gap-3">
        <div className="glass-strong p-2 rounded-lg">
          <Sparkles className="text-nebula-primary" size={20} />
        </div>
        <div>
          <p className="text-star-white font-medium">Guest Mode Active</p>
          <p className="text-starlight-dim text-sm">Your progress is saved locally and will be lost when you close this tab.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          <X size={14} />
        </Button>
        <Button onClick={onUpgrade} className="btn-space-primary gap-1" size="sm">
          <Sparkles size={14} />
          Create Account
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================================
// Major Selector (for first-time setup)
// ============================================================

interface MajorSelectorProps {
  majors: MajorConfig[];
  onSelect: (majorId: string, thesisTrackId: string) => void;
  isGuest?: boolean;
}

export function MajorSelector({ majors, onSelect, isGuest }: MajorSelectorProps) {
  const [selectedMajor, setSelectedMajor] = useState(majors[0]?.id || '');
  const [selectedThesis, setSelectedThesis] = useState('9hr');

  const majorConfig = majors.find(m => m.id === selectedMajor);
  const thesisOptions = majorConfig?.thesisPatterns || [];

  return (
    <motion.div
      className="w-full max-w-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="glass-card">
        <CardHeader className="text-center pb-4">
          <motion.div
            className="glass-strong p-4 rounded-2xl inline-flex"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <GraduationCap className="text-nebula-primary" size={32} />
          </motion.div>
          <CardTitle className="text-star-white font-heading mt-4">
            {isGuest ? 'Choose Your Major (Guest)' : 'Select Your Program'}
          </CardTitle>
          <CardDescription className="text-starlight-dim">
            This helps us show the right courses and thesis options for your degree
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Major Selection */}
          <div className="space-y-3">
            <Label className="text-starlight-dim text-sm">Master's Program</Label>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {majors.map(major => (
                <motion.button
                  key={major.id}
                  onClick={() => setSelectedMajor(major.id)}
                  className={cn(
                    'glass p-4 rounded-xl text-left transition-all',
                    'hover:border-nebula-primary/50 hover:shadow-lg',
                    selectedMajor === major.id && 'border-nebula-primary bg-nebula-primary/5'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="glass-strong p-3 rounded-xl">
                      <GraduationCap className="text-nebula-primary" size={24} />
                    </div>
                    <div>
                      <p className="font-medium text-star-white">{major.name}</p>
                      <p className="text-starlight-dim text-sm">{major.nameAr}</p>
                    </div>
                  </div>
                  {selectedMajor === major.id && (
                    <CheckCircle className="absolute top-2 right-2 text-nebula-primary" size={20} />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Thesis Track Selection */}
          <div className="space-y-3">
            <Label className="text-starlight-dim text-sm">Thesis Track</Label>
            <div className="space-y-2">
              {thesisOptions.map(track => (
                <motion.button
                  key={track.id}
                  onClick={() => setSelectedThesis(track.id)}
                  className={cn(
                    'glass p-4 rounded-xl flex items-center gap-4 transition-all',
                    'hover:border-nebula-primary/50',
                    selectedThesis === track.id && 'border-nebula-primary bg-nebula-primary/5'
                  )}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RadioGroupItem value={track.id} className="flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-star-white">{track.label}</span>
                      <Badge variant="outline" className="text-xs text-nebula-primary">
                        {track.credits} credits
                      </Badge>
                    </div>
                    <p className="text-starlight-dim text-sm">{track.description}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Continue Button */}
          <Button
            onClick={() => onSelect(selectedMajor, selectedThesis)}
            className="w-full btn-space-primary gap-2"
            size="lg"
          >
            <ArrowRight size={18} />
            <span>{isGuest ? 'Continue as Guest' : 'Save & Continue'}</span>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}