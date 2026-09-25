import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Check, Cloud, Download, LogOut, MapPinned, RefreshCw, Upload, X } from 'lucide-react';
import { cloudSync } from '../services/cloudSync';
import { applyPortableBackup, currentPortableOwner, downloadPortableBackup, portableOwnerMismatch, readPortableBackup, type PortableExportReceipt, type PortableImportReceipt } from '../services/portableBackup';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

interface CloudAccountDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CloudAccountDialog({ open, onClose }: CloudAccountDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sync = useSyncExternalStore(cloudSync.subscribe, cloudSync.getSnapshot);
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const [section, setSection] = useState<'cloud' | 'export' | 'import'>('cloud');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [showSyncToast, setShowSyncToast] = useState(false);
  const [exportReceipt, setExportReceipt] = useState<PortableExportReceipt>();
  const [importReceipt, setImportReceipt] = useState<PortableImportReceipt>();

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
      const needsConfirmation = authMode === 'signup'
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

  const exportBackup = async () => {
    setBusy(true); setMessage('');
    try { setExportReceipt(await downloadPortableBackup()); setMessage(t('Backup downloaded. Keep the file private.')); }
    catch { setMessage(t('Could not create the backup file.')); }
    finally { setBusy(false); }
  };

  const importBackup = async (file?: File) => {
    if (!file) return;
    setBusy(true); setMessage(''); setImportReceipt(undefined);
    try {
      const backup = await readPortableBackup(file);
      const owner = await currentPortableOwner();
      if (portableOwnerMismatch(backup, owner)) {
        const ownerLabel = backup.ownerEmail || t('Unknown account');
        const accepted = window.confirm(`${t('This backup belongs to another account.')}\n${t('Backup account')}: ${ownerLabel}\n\n${t('Import it anyway? Existing progress will be merged.')}`);
        if (!accepted) { setMessage(t('Import canceled. No data was changed.')); return; }
      }
      setImportReceipt(await applyPortableBackup(backup)); setMessage(t('Backup merged. Existing progress was kept.'));
    }
    catch (error) {
      const reason = error instanceof Error && ['Choose a .geotrainer backup file.', 'This is not a valid GeoTrainer backup.', 'Unsupported GeoTrainer backup version.', 'The backup account information is invalid.'].includes(error.message) ? error.message : 'Could not import the backup file.';
      setMessage(t(reason));
    }
    finally { setBusy(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const fileSize = (bytes: number) => bytes < 1_000_000 ? `${Math.max(1, Math.round(bytes / 1000)).toLocaleString()} KB` : `${new Intl.NumberFormat(ui, { maximumFractionDigits: 1 }).format(bytes / 1_000_000)} MB`;

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
        <div><MapPinned size={20} /><strong>GEOTRAINER</strong><span>{t('Sync & backup')}</span></div>
        <button type="button" onClick={onClose} aria-label={t('Close account window')}><X size={18} /></button>
      </header>

      <div className="backup-tabs" role="tablist" aria-label={t('Choose sync or backup')}>
        <button type="button" role="tab" aria-selected={section === 'cloud'} onClick={() => { setSection('cloud'); setMessage(''); }}><Cloud size={16} />{t(sync.email ? 'Cloud sync' : 'Sign in')}</button>
        <button type="button" role="tab" aria-selected={section === 'export'} onClick={() => { setSection('export'); setMessage(''); }}><Download size={16} />{t('Export')}</button>
        <button type="button" role="tab" aria-selected={section === 'import'} onClick={() => { setSection('import'); setMessage(''); }}><Upload size={16} />{t('Import')}</button>
      </div>

      {section === 'cloud' && (sync.email ? (
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
          <h2>{authMode === 'signin' ? t('Welcome back.') : t('Sync your progress.')}</h2>
          <p>{authMode === 'signin' ? t('Sign in to continue the same training history on every device.') : t('Create one private account for your attempts, clues, reviews, and collections.')}</p>

          <button type="button" className="google-signin" disabled={busy} onClick={() => void accountAction(cloudSync.signInWithGoogle)}>
            <span className="google-mark" aria-hidden="true">G</span>{t('Continue with Google')}
          </button>
          <div className="auth-divider"><span>{t('or use email')}</span></div>

          <div className="auth-tabs" role="tablist" aria-label={t('Account action')}>
            <button type="button" role="tab" aria-selected={authMode === 'signin'} onClick={() => { setAuthMode('signin'); setMessage(''); }}>{t('Sign in')}</button>
            <button type="button" role="tab" aria-selected={authMode === 'signup'} onClick={() => { setAuthMode('signup'); setMessage(''); }}>{t('Create account')}</button>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void authenticate(); }}>
            <label>{t('Email address')}<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required autoFocus /></label>
            <label>{t('Password')}<input type="password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t('6 characters minimum')} required /></label>
            <button className="auth-primary" type="submit" disabled={busy}>{busy ? t('Please wait…') : authMode === 'signin' ? t('Sign in to GeoTrainer') : t('Create GeoTrainer account')}</button>
          </form>
          <p className="auth-message" aria-live="polite">{message || sync.message}</p>
        </div>
      ))}

      {section === 'export' && <div className="account-transfer">
        <span className="account-tool-mark"><Download size={24} /></span>
        <h2>{t('Export this device')}</h2>
        <p>{t('Download one .geotrainer file containing all local progress and saved photos. You can keep it in Drive, OneDrive, or another safe place.')}</p>
        {exportReceipt && <dl className="sync-receipt" aria-label={t('Export details')}>
          <div><dt>{t('Records included')}</dt><dd>{exportReceipt.records.toLocaleString()}</dd></div>
          <div><dt>{t('Photos included')}</dt><dd>{exportReceipt.photos.toLocaleString()}</dd></div>
          <div><dt>{t('File size')}</dt><dd>{fileSize(exportReceipt.bytes)}</dd></div>
          <div><dt>{t('File')}</dt><dd title={exportReceipt.fileName}>{exportReceipt.fileName}</dd></div>
        </dl>}
        <button type="button" className="auth-primary" disabled={busy} onClick={() => void exportBackup()}><Download size={16} />{busy ? t('Preparing backup…') : t('Download .geotrainer file')}</button>
        <p className="backup-privacy-note">{t('This file contains your private learning history and photos. Store it somewhere you trust.')}</p>
        <p className="auth-message" role="status" aria-live="polite">{message}</p>
      </div>}

      {section === 'import' && <div className="account-transfer">
        <span className="account-tool-mark"><Upload size={24} /></span>
        <h2>{t('Merge a backup')}</h2>
        <p>{t('Choose a .geotrainer file from another device. GeoTrainer adds missing records and photos while keeping newer progress already on this device.')}</p>
        <input ref={fileInputRef} className="backup-file-input" type="file" accept=".geotrainer,application/vnd.geotrainer+json" aria-label={t('Choose .geotrainer backup file')} onChange={(event) => void importBackup(event.target.files?.[0])} />
        {importReceipt && <dl className="sync-receipt" aria-label={t('Import details')}>
          <div><dt>{t('In backup file')}</dt><dd>{importReceipt.fileRecords.toLocaleString()}</dd></div>
          <div><dt>{t('On this device')}</dt><dd>{importReceipt.deviceRecords.toLocaleString()}</dd></div>
          <div><dt>{t('Merged')}</dt><dd>{importReceipt.mergedRecords.toLocaleString()}</dd></div>
          <div><dt>{t('Added to this device')}</dt><dd>{importReceipt.addedToDevice.toLocaleString()}</dd></div>
          <div><dt>{t('Review schedules updated')}</dt><dd>{importReceipt.reviewSchedulesUpdated.toLocaleString()}</dd></div>
          <div><dt>{t('Review events retained')}</dt><dd>{importReceipt.reviewEvents.toLocaleString()}</dd></div>
          <div><dt>{t('Photos in backup')}</dt><dd>{importReceipt.photosInFile.toLocaleString()}</dd></div>
          <div><dt>{t('Photos added')}</dt><dd>{importReceipt.photosAdded.toLocaleString()}</dd></div>
        </dl>}
        <button type="button" className="auth-primary" disabled={busy} onClick={() => fileInputRef.current?.click()}><Upload size={16} />{busy ? t('Merging backup…') : t('Choose .geotrainer file')}</button>
        <p className="backup-privacy-note">{t('Import merges safely. It does not erase progress already saved on this device.')}</p>
        <p className="auth-message" role="status" aria-live="polite">{message}</p>
      </div>}

      <footer><Cloud size={14} />{t('Local saves keep working without cloud access.')}</footer>
    </dialog>
    {showSyncToast && sync.receipt && <div className="settings-saved-toast" role="status" aria-live="polite"><Check size={19} />{t('Sync complete')}: {sync.receipt.downloadedRecords.toLocaleString()} {t('downloaded')} · {sync.receipt.mergedRecords.toLocaleString()} {t('merged')} · {t('upload confirmed')}</div>}
  </>);
}
