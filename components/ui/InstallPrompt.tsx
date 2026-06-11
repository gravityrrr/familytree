'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'vamshavrksha-install-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

function isDismissed(): boolean {
  try {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) return false;
    const timestamp = parseInt(dismissed, 10);
    if (Date.now() - timestamp < DISMISS_DURATION) return true;
    localStorage.removeItem(DISMISS_KEY);
    return false;
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  } catch {
    // ignore
  }
}

function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as any).standalone === true)
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Android / Chrome: Listen for beforeinstallprompt
  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowAndroidBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // iOS: Show instructions banner
  useEffect(() => {
    if (!mounted) return;
    if (isStandalone() || isDismissed()) return;

    if (isIOSDevice()) {
      // Small delay so it doesn't flash immediately on load
      const timer = setTimeout(() => setShowIOSBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowAndroidBanner(false);
      }
    } catch {
      // ignore
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    dismiss();
    setShowAndroidBanner(false);
    setShowIOSBanner(false);
  }, []);

  if (!mounted) return null;

  // Android Install Banner
  if (showAndroidBanner) {
    return (
      <div className="fixed bottom-[100px] left-4 right-4 z-50 animate-slide-up sm:left-auto sm:right-6 sm:max-w-sm">
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-black/40 p-5 overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600" />
          
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6 text-brand-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Install VamshaVrksha
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                Add VamshaVrksha to your home screen for the best experience — faster access, full screen, and works offline.
              </p>
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-bold shadow-md shadow-brand-500/30 hover:shadow-lg hover:shadow-brand-500/40 transition-all active:scale-[0.97] disabled:opacity-60"
              >
                {isInstalling ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Installing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Install App
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // iOS Install Banner — with step-by-step instructions
  if (showIOSBanner) {
    return (
      <div className="fixed bottom-[100px] left-4 right-4 z-50 animate-slide-up sm:left-auto sm:right-6 sm:max-w-sm">
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-black/40 p-5 overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600" />
          
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6 text-brand-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Install VamshaVrksha
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                Add to your home screen for the best experience:
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2.5">
                  <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                    <Share className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Tap the <strong>Share</strong> button in the toolbar
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2.5">
                  <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Select <strong>Add to Home Screen</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
