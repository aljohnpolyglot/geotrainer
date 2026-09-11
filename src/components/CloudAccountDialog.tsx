import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Check, Cloud, LogOut, MapPinned, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { cloudSync } from '../services/cloudSync';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

interface CloudAccountDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CloudAccountDialog({ open, onClose }: CloudAccountDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sync = useSyncExternalStore(cloudSync.subscribe, cloudSync.getSnapshot);
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const authenticate = async () => {
    setBusy(true);
    setMessage('');
    try {
      const needsConfirmation = mode === 'signup'
        ? await cloudSync.signUp(email, password)
        : (await cloudSync.signIn(email, password), false);
      setMessage(needsConfirmation ? t('Check your inbox to confirm your GeoTrainer account.') : t('Signed in. Your field log is syncing now.'));
      setPassword('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('Authentication failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const accountAction = async (action: () => Promise<void>) => {
    setBusy(true);
    setMessage('');
    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('The account action failed.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="account-dialog" onClose={onClose} onMouseDown={(event) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}>
      <header className="account-dialog-header">
        <div><MapPinned size={20} /><strong>GEOTRAINER</strong><span>{t('Cloud field log')}</span></div>
        <button type="button" onClick={onClose} aria-label={t('Close account window')}><X size={18} /></button>
      </header>

      {sync.email ? (
        <div className="account-signed-in">
          <span className="account-success-mark"><Check size={24} /></span>
          <h2>{t('Your progress is protected.')}</h2>
          <p>{t('GeoTrainer merges this browser’s field log with your private cloud backup.')}</p>
          <div className="account-identity"><small>{t('Signed in as')}</small><strong>{sync.email}</strong></div>
          <div className="account-sync-row">
            <span className={`sync-state ${sync.phase}`}>{sync.phase === 'synced' ? t('Synced') : sync.phase.replace('-', ' ')}</span>
            <span>{sync.message}</span>
          </div>
          <div className="account-actions">
            <button type="button" className="auth-primary" disabled={busy || sync.phase === 'syncing'} onClick={() => void accountAction(cloudSync.syncNow)}><RefreshCw size={16} />{t('Sync now')}</button>
            <button type="button" className="auth-secondary" disabled={busy} onClick={() => void accountAction(cloudSync.signOut)}><LogOut size={16} />{t('Sign out')}</button>
          </div>
          {message && <p className="auth-message" role="alert">{message}</p>}
        </div>
      ) : (
        <div className="account-auth">
          <h2>{mode === 'signin' ? t('Welcome back.') : t('Protect your field log.')}</h2>
          <p>{mode === 'signin' ? t('Sign in to continue the same training history on every device.') : t('Create one private account for your attempts, clues, reviews, and collections.')}</p>

          <button type="button" className="google-signin" disabled={busy} onClick={() => void accountAction(cloudSync.signInWithGoogle)}>
            <span className="google-mark" aria-hidden="true">G</span>{t('Continue with Google')}
          </button>
          <div className="auth-divider"><span>{t('or use email')}</span></div>

          <div className="auth-tabs" role="tablist" aria-label={t('Account action')}>
            <button type="button" role="tab" aria-selected={mode === 'signin'} onClick={() => { setMode('signin'); setMessage(''); }}>{t('Sign in')}</button>
            <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => { setMode('signup'); setMessage(''); }}>{t('Create account')}</button>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void authenticate(); }}>
            <label>{t('Email address')}<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required autoFocus /></label>
            <label>{t('Password')}<input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t('6 characters minimum')} required /></label>
            <button className="auth-primary" type="submit" disabled={busy}>{busy ? t('Please wait…') : mode === 'signin' ? t('Sign in to GeoTrainer') : t('Create GeoTrainer account')}</button>
          </form>
          <p className="auth-message" aria-live="polite">{message || sync.message}</p>
          <div className="auth-trust"><ShieldCheck size={16} /><span>{t('Your Street View imagery is never uploaded. Google sign-in only identifies your account.')}</span></div>
        </div>
      )}

      <footer><Cloud size={14} />{t('Local-first. Your IndexedDB copy remains available offline.')}</footer>
    </dialog>
  );
}
