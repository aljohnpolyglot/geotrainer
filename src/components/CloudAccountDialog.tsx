import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Check, Cloud, LogOut, MapPinned, RefreshCw, X } from 'lucide-react';
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
  const [showSyncToast, setShowSyncToast] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!sync.receipt) return;
    setShowSyncToast(true);
    const timer = window.setTimeout(() => setShowSyncToast(false), 4000);
    return () => window.clearTimeout(timer);
  }, [sync.receipt?.completedAt]);

  const authenticate = async () => {
    setBusy(true);
    setMessage('');
    try {
      const needsConfirmation = mode === 'signup'
        ? await cloudSync.signUp(email, password)
        : (await cloudSync.signIn(email, password), false);
      setMessage(needsConfirmation ? t('Check your inbox to confirm your GeoTrainer account.') : t('Signed in. Press Sync now to merge this device.'));
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

  return (<>
    <dialog ref={dialogRef} className="account-dialog" onClose={onClose} onMouseDown={(event) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}>
      <header className="account-dialog-header">
        <div><MapPinned size={20} /><strong>GEOTRAINER</strong><span>{t('Cloud progress')}</span></div>
        <button type="button" onClick={onClose} aria-label={t('Close account window')}><X size={18} /></button>
      </header>

      {sync.email ? (
        <div className="account-signed-in">
          <span className="account-success-mark"><Check size={24} /></span>
          <h2>{t('Ready for manual sync.')}</h2>
          <p>{t('GeoTrainer merges this browser’s local progress with your private cloud backup.')}</p>
          <div className="account-identity"><small>{t('Signed in as')}</small><strong>{sync.email}</strong></div>
          <div className="account-sync-row">
            <span className={`sync-state ${sync.phase}`}>{sync.phase === 'synced' ? t('Synced') : sync.phase === 'ready' ? t('Ready') : sync.phase === 'syncing' ? t('Syncing') : sync.phase.replace('-', ' ')}</span>
            <span>{t(sync.message)}</span>
          </div>
          {sync.receipt && <dl className="sync-receipt" aria-label={t('Last sync details')}>
            <div><dt>{t('Downloaded')}</dt><dd>{sync.receipt.downloadedRecords.toLocaleString()}</dd></div>
            <div><dt>{t('On this device')}</dt><dd>{sync.receipt.deviceRecords.toLocaleString()}</dd></div>
            <div><dt>{t('Merged')}</dt><dd>{sync.receipt.mergedRecords.toLocaleString()}</dd></div>
            <div><dt>{t('Added to this device')}</dt><dd>{sync.receipt.addedToDevice.toLocaleString()}</dd></div>
            <div><dt>{t('Review schedules updated')}</dt><dd>{sync.receipt.reviewSchedulesUpdated.toLocaleString()}</dd></div>
            <div><dt>{t('Review events retained')}</dt><dd>{sync.receipt.reviewEvents.toLocaleString()}</dd></div>
            <div><dt>{t('Images cached locally')}</dt><dd>{sync.receipt.cachedImages.toLocaleString()}</dd></div>
            <div><dt>{t('Upload')}</dt><dd>{sync.receipt.uploadChanged ? sync.receipt.uploadedRecords.toLocaleString() : t('Already current')}</dd></div>
          </dl>}
          <div className="account-actions">
            <button type="button" className="auth-primary" disabled={busy || sync.phase === 'syncing'} onClick={() => void accountAction(cloudSync.syncNow)}><RefreshCw size={16} />{t('Sync now')}</button>
            <button type="button" className="auth-secondary" disabled={busy} onClick={() => void accountAction(cloudSync.signOut)}><LogOut size={16} />{t('Sign out')}</button>
          </div>
          {message && <p className="auth-message" role="alert">{message}</p>}
        </div>
      ) : (
        <div className="account-auth">
          <h2>{mode === 'signin' ? t('Welcome back.') : t('Sync your progress.')}</h2>
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
        </div>
      )}

      <footer><Cloud size={14} />{t('Your progress stays available when you return.')}</footer>
    </dialog>
    {showSyncToast && sync.receipt && <div className="settings-saved-toast" role="status" aria-live="polite"><Check size={19} />{t('Sync complete')}: {sync.receipt.downloadedRecords.toLocaleString()} {t('downloaded')} · {sync.receipt.mergedRecords.toLocaleString()} {t('merged')} · {t('upload confirmed')}</div>}
  </>);
}
