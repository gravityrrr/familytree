'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, LogOut, Lock, Share2, Printer, Eye, LayoutGrid, Image } from 'lucide-react';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <SettingsContent />
      </ToastProvider>
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Tree display settings (persisted in localStorage)
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
    } finally { setChangingPassword(false); }
  };

  const handleExportPdf = () => window.print();

  const handleShareLink = async () => {
    const url = window.location.origin + '/tree';
    await navigator.clipboard.writeText(url);
    showToast('Tree link copied to clipboard');
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-base font-semibold text-gray-900">Settings</h1>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Account */}
        <section className="bg-white rounded-card border border-gray-100 p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Account</h2>
          <div className="flex items-center gap-3">
            <Avatar firstName={user?.email?.charAt(0) || '?'} lastName="" size="lg" />
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500">Signed in</p>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="bg-white rounded-card border border-gray-100 p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
            <Lock className="w-4 h-4" /> Security
          </h2>
          <Input type="password" label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" id="settings-password" />
          <Button onClick={handleChangePassword} loading={changingPassword} disabled={!newPassword} size="sm">
            Update Password
          </Button>
        </section>

        {/* Tree display */}
        <section className="bg-white rounded-card border border-gray-100 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Tree Display</h2>
          {[
            { key: 'tree-show-dates', label: 'Show dates on nodes', icon: Eye, value: showDates, setter: setShowDates },
            { key: 'tree-compact', label: 'Compact layout', icon: LayoutGrid, value: compactLayout, setter: setCompactLayout },
            { key: 'tree-show-photos', label: 'Show photos', icon: Image, value: showPhotos, setter: setShowPhotos },
          ].map(({ key, label, icon: Icon, value, setter }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2 text-sm text-gray-700"><Icon className="w-4 h-4 text-gray-400" />{label}</span>
              <input type="checkbox" checked={value} onChange={(e) => toggleSetting(key, e.target.checked, setter)} className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand" />
            </label>
          ))}
        </section>

        {/* Actions */}
        <section className="space-y-3">
          <Button variant="secondary" className="w-full justify-start gap-2" onClick={handleExportPdf}>
            <Printer className="w-4 h-4" /> Export as PDF
          </Button>
          <Button variant="secondary" className="w-full justify-start gap-2" onClick={handleShareLink}>
            <Share2 className="w-4 h-4" /> Share Tree Link
          </Button>
          <Button variant="danger" className="w-full justify-start gap-2" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </section>
      </div>
    </div>
  );
}
