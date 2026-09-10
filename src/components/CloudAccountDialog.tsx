import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Check, Cloud, LogOut, MapPinned, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { cloudSync } from '../services/cloudSync';

interface CloudAccountDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CloudAccountDialog({ open, onClose }: CloudAccountDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sync = useSyncExternalStore(cloudSync.subscribe, cloudSync.getSnapshot);
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
      setMessage(needsConfirmation ? 'Check your inbox to confirm your GeoTrainer account.' : 'Signed in. Your field log is syncing now.');
      setPassword('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
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
      setMessage(error instanceof Error ? error.message : 'The account action failed.');
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
        <div><MapPinned size={20} /><strong>GEOTRAINER</strong><span>Cloud field log</span></div>
        <button type="button" onClick={onClose} aria-label="Close account window"><X size={18} /></button>
      </header>

      {sync.email ? (
        <div className="account-signed-in">
          <span className="account-success-mark"><Check size={24} /></span>
          <h2>Your progress is protected.</h2>
          <p>GeoTrainer merges this browser’s field log with your private cloud backup.</p>
          <div className="account-identity"><small>Signed in as</small><strong>{sync.email}</strong></div>
          <div className="account-sync-row">
            <span className={`sync-state ${sync.phase}`}>{sync.phase === 'synced' ? 'Synced' : sync.phase.replace('-', ' ')}</span>
            <span>{sync.message}</span>
          </div>
          <div className="account-actions">
            <button type="button" className="auth-primary" disabled={busy || sync.phase === 'syncing'} onClick={() => void accountAction(cloudSync.syncNow)}><RefreshCw size={16} />Sync now</button>
            <button type="button" className="auth-secondary" disabled={busy} onClick={() => void accountAction(cloudSync.signOut)}><LogOut size={16} />Sign out</button>
          </div>
          {message && <p className="auth-message" role="alert">{message}</p>}
        </div>
      ) : (
        <div className="account-auth">
          <h2>{mode === 'signin' ? 'Welcome back.' : 'Protect your field log.'}</h2>
          <p>{mode === 'signin' ? 'Sign in to continue the same training history on every device.' : 'Create one private account for your attempts, bookmarks, reviews, and collections.'}</p>

          <button type="button" className="google-signin" disabled={busy} onClick={() => void accountAction(cloudSync.signInWithGoogle)}>
            <span className="google-mark" aria-hidden="true">G</span>Continue with Google
          </button>
          <div className="auth-divider"><span>or use email</span></div>

          <div className="auth-tabs" role="tablist" aria-label="Account action">
            <button type="button" role="tab" aria-selected={mode === 'signin'} onClick={() => { setMode('signin'); setMessage(''); }}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => { setMode('signup'); setMessage(''); }}>Create account</button>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void authenticate(); }}>
            <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required autoFocus /></label>
            <label>Password<input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6 characters minimum" required /></label>
            <button className="auth-primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in to GeoTrainer' : 'Create GeoTrainer account'}</button>
          </form>
          <p className="auth-message" aria-live="polite">{message || sync.message}</p>
          <div className="auth-trust"><ShieldCheck size={16} /><span>Your Street View imagery is never uploaded. Google sign-in only identifies your account.</span></div>
        </div>
      )}

      <footer><Cloud size={14} />Local-first. Your IndexedDB copy remains available offline.</footer>
    </dialog>
  );
}
