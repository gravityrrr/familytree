'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, LogOut, Lock, Share2, Printer, Eye, LayoutGrid, Image, ChevronRight, Shield, Palette } from 'lucide-react';

export default function SettingsPage() {
  return <ProtectedRoute><ToastProvider><SettingsContent /></ToastProvider></ProtectedRoute>;
}

function SettingsContent() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDates, setShowDates] = useState(true);
  const [compactLayout, setCompactLayout] = useState(false);
  const [showPhotos, setShowPhotos] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShowDates(localStorage.getItem('tree-show-dates') !== 'false');
      setCompactLayout(localStorage.getItem('tree-compact') === 'true');
      setShowPhotos(localStorage.getItem('tree-show-photos') !== 'false');
    }
  }, []);

  const toggleSetting = (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    localStorage.setItem(key, value.toString());
  };

  const handleChangePassword = async () => {
    if (!newPassword) return;
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      showToast('Password updated');
    } catch {
      showToast('Failed to update password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen-safe bg-mesh">
      <header className="sticky-header px-4 sm:px-6 py-3 flex items-center gap-3 safe-top">
        <button onClick={() => router.back()} className="p-2 rounded-xl transition-colors press hover:bg-[var(--surface-soft)]">
          <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
        </button>
        <h1 className="text-base font-bold text-[var(--text-primary)]">Settings</h1>
      </header>

      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-4 animate-fade-in-up pb-12">
        <section className="card rounded-xl p-5">
          <h2 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Account</h2>
          <div className="flex items-center gap-4">
            <Avatar firstName={user?.email?.charAt(0) || '?'} lastName="" size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user?.email}</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Signed in</p>
            </div>
          </div>
        </section>

        <section className="card rounded-xl p-5">
          <h2 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Palette className="w-3.5 h-3.5" /> Appearance
          </h2>
          <ThemeToggle />
        </section>

        <section className="card rounded-xl p-5">
          <h2 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" /> Security
          </h2>
          <div className="space-y-3">
            <Input type="password" label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" id="settings-password" />
            <Button onClick={handleChangePassword} loading={changingPassword} disabled={!newPassword} size="sm" variant="secondary">
              <Lock className="w-3.5 h-3.5" /> Update Password
            </Button>
          </div>
        </section>

        <section className="card rounded-xl p-5">
          <h2 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Tree Display</h2>
          <div className="space-y-1">
            {[
              { key: 'tree-show-dates', label: 'Show dates on nodes', icon: Eye, value: showDates, setter: setShowDates },
              { key: 'tree-compact', label: 'Compact layout', icon: LayoutGrid, value: compactLayout, setter: setCompactLayout },
              { key: 'tree-show-photos', label: 'Show photos', icon: Image, value: showPhotos, setter: setShowPhotos },
            ].map(({ key, label, icon: Icon, value, setter }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl transition-colors hover:bg-[var(--surface-soft)]">
                <span className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
                  <Icon className="w-4 h-4 text-[var(--text-muted)]" />{label}
                </span>
                <div className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${value ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-700'}`} onClick={() => toggleSetting(key, !value, setter)}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${value ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <button onClick={() => window.print()} className="w-full flex items-center gap-3 p-4 card rounded-xl hover-lift press text-left">
            <div className="w-9 h-9 rounded-xl bg-[var(--surface-soft)] flex items-center justify-center border border-[var(--border)]"><Printer className="w-4 h-4 text-[var(--text-muted)]" /></div>
            <span className="text-sm font-medium text-[var(--text-primary)] flex-1">Export as PDF</span>
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]/60" />
          </button>
          <button onClick={async () => { await navigator.clipboard.writeText(window.location.origin + '/tree'); showToast('Link copied!'); }} className="w-full flex items-center gap-3 p-4 card rounded-xl hover-lift press text-left">
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/25 flex items-center justify-center"><Share2 className="w-4 h-4 text-brand-500" /></div>
            <span className="text-sm font-medium text-[var(--text-primary)] flex-1">Share Tree Link</span>
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]/60" />
          </button>
          <button onClick={async () => { await signOut(); router.push('/login'); }} className="w-full flex items-center gap-3 p-4 card rounded-xl hover-lift press text-left group">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center"><LogOut className="w-4 h-4 text-red-500" /></div>
            <span className="text-sm font-medium text-red-600 dark:text-red-400 flex-1">Sign Out</span>
            <ChevronRight className="w-4 h-4 text-red-200 dark:text-red-400/60" />
          </button>
        </section>
      </div>
    </div>
  );
}
