import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { ArrowRight, BookOpen, ChevronRight, Cloud, Database, Gamepad2, MapPinned, Target } from 'lucide-react';
import { trainerDb } from '../data/trainerDb';
import { cloudSync } from '../services/cloudSync';
import { CloudAccountDialog } from './CloudAccountDialog';

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
  const [accountOpen, setAccountOpen] = useState(false);

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
        <button type="button" className="account-entry" onClick={() => setAccountOpen(true)}>
          <span className="account-entry-icon"><Cloud size={19} /></span>
          <span><strong>{sync.email ? 'Cloud account' : 'Protect your progress'}</strong><small>{sync.email || 'Sign in or create an account'}</small></span>
          <span className={`sync-state ${sync.phase}`}>{sync.phase === 'synced' ? 'Synced' : sync.phase.replace('-', ' ')}</span>
          <ChevronRight size={18} />
        </button>
        <p className="local-note">Your field log stays available offline and syncs when you sign in.</p>
      </div>
      <CloudAccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} />
    </section>
  );
}
