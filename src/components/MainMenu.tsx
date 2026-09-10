import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { ArrowRight, BookOpen, Cloud, Database, Gamepad2, LogOut, MapPinned, RefreshCw, Target } from 'lucide-react';
import { trainerDb } from '../data/trainerDb';
import { cloudSync } from '../services/cloudSync';

interface MainMenuProps {
  refreshKey: number;
  onStudy: () => void;
  onPlay: () => void;
  onReview: () => void;
  onData: () => void;
}

export function MainMenu({ refreshKey, onStudy, onPlay, onReview, onData }: MainMenuProps) {
  const [status, setStatus] = useState({ locations: 0, attempts: 0, due: 0, minutes: 0 });
  const sync = useSyncExternalStore(cloudSync.subscribe, cloudSync.getSnapshot);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    void Promise.all([trainerDb.locations(), trainerDb.attempts(), trainerDb.reviews(), trainerDb.sessions()])
      .then(([locations, attempts, reviews, sessions]) => setStatus({
        locations: locations.length,
        attempts: attempts.length,
        due: reviews.filter((review) => review.dueAt <= Date.now()).length,
        minutes: Math.round(sessions.reduce((sum, session) => sum + session.activeTimeSeconds, 0) / 60),
      }))
      .catch(() => {});
  }, [refreshKey]);

  const authenticate = async (create: boolean) => {
    setAuthBusy(true);
    setAuthMessage('');
    try {
      const needsConfirmation = create
        ? await cloudSync.signUp(email, password)
        : (await cloudSync.signIn(email, password), false);
      setAuthMessage(needsConfirmation ? 'Check your email to confirm the account.' : 'Signed in. Your progress is syncing.');
      setPassword('');
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Could not sign in.');
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <section className="main-menu">
      <div className="menu-mast">
        <div className="wordmark"><MapPinned size={24} /><span>GEOTRAINER</span><small>personal street view practice</small></div>
        <div className="menu-orbit" aria-hidden="true"><i /><i /><i /></div>
        <div className="menu-intro">
          <h1>Build a world<br />you can recognize.</h1>
          <p>Study unfamiliar roads, test your recall, then return to the places that fooled you.</p>
        </div>
        <button className="menu-primary" onClick={onStudy}><span><BookOpen size={18} /><strong>Continue Study</strong><small>Open a fresh panorama</small></span><ArrowRight size={20} /></button>
      </div>

      <div className="departure-board">
        <div className="board-heading"><span>Field desk</span><span>Local · Private</span></div>
        <button onClick={onPlay}><span className="route-code">PLY</span><span><strong>Start a game</strong><small>3–15 scored rounds · Standard / No Move / NMPZ</small></span><Gamepad2 size={19} /></button>
        <button onClick={onReview}><span className="route-code">REV</span><span><strong>Review weak places</strong><small>{status.due ? `${status.due} scheduled now` : 'Build a queue from past mistakes'}</small></span><Target size={19} /></button>
        <button onClick={onData}><span className="route-code">DAT</span><span><strong>Back up progress</strong><small>Export or restore the complete trainer database</small></span><Database size={19} /></button>
        <div className="menu-status">
          <span><strong>{status.locations.toLocaleString()}</strong> places encountered</span>
          <span><strong>{status.attempts.toLocaleString()}</strong> attempts retained</span>
          <span><strong>{status.minutes.toLocaleString()}</strong> active minutes</span>
        </div>
        <section className="cloud-account" aria-labelledby="cloud-account-title">
          <div className="cloud-account-heading">
            <Cloud size={17} />
            <strong id="cloud-account-title">Cloud backup</strong>
            <span className={`sync-state ${sync.phase}`}>{sync.phase === 'synced' ? 'Synced' : sync.phase.replace('-', ' ')}</span>
          </div>
          {sync.email ? (
            <div className="cloud-session">
              <span><small>Signed in as</small><strong>{sync.email}</strong></span>
              <button type="button" onClick={() => void cloudSync.syncNow().catch((error) => setAuthMessage(error.message))} disabled={sync.phase === 'syncing'}><RefreshCw size={15} />Sync now</button>
              <button type="button" onClick={() => void cloudSync.signOut().catch((error) => setAuthMessage(error.message))}><LogOut size={15} />Sign out</button>
            </div>
          ) : sync.configured ? (
            <form onSubmit={(event) => { event.preventDefault(); void authenticate(false); }}>
              <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
              <label>Password<input type="password" autoComplete="current-password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
              <button type="submit" disabled={authBusy}>{authBusy ? 'Working…' : 'Sign in'}</button>
              <button type="button" disabled={authBusy} onClick={() => void authenticate(true)}>Create account</button>
            </form>
          ) : (
            <p>Cloud backup is being set up. Your local progress remains available.</p>
          )}
          <p className="cloud-message" aria-live="polite">{authMessage || sync.message}</p>
        </section>
        <p className="local-note">Sign in to keep progress available across your devices.</p>
      </div>
    </section>
  );
}
