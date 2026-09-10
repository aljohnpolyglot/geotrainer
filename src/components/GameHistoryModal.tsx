/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameRecord } from '../types';
import { getScoreRating } from '../services/gameLogic';
import {
  History,
  X,
  Trophy,
  Trash2,
  ChevronRight,
  Clock,
  Layers,
  Calendar,
} from 'lucide-react';

interface GameHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: GameRecord[];
  onSelectGame: (game: GameRecord) => void;
  onDeleteGame: (id: string) => void;
  onClearAll: () => void;
}

export const GameHistoryModal: React.FC<GameHistoryModalProps> = ({
  isOpen,
  onClose,
  games,
  onSelectGame,
  onDeleteGame,
  onClearAll,
}) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      id="game-history-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none"
    >
      <div
        id="game-history-dialog"
        className="w-full max-w-xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-stone-100 max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Game Collection History</h2>
              <p className="text-[11px] text-stone-400">
                {games.length} {games.length === 1 ? 'game' : 'games'} recorded
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {games.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center mx-auto text-stone-500">
                <Trophy className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-stone-300">No games played yet</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Switch to Play mode and complete your first match to start building your game collection and tracking performance.
              </p>
            </div>
          ) : (
            games.map((g) => {
              const dateStr = new Date(g.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              const pct = g.totalScore / (g.maxPossibleScore || 1);
              const rating = getScoreRating(pct);

              return (
                <div
                  key={g.id}
                  className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 hover:border-stone-700 transition-all flex items-center justify-between gap-3 group"
                >
                  <div
                    onClick={() => {
                      onSelectGame(g);
                      onClose();
                    }}
                    className="flex-1 min-w-0 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-stone-100 group-hover:text-amber-400 transition-colors">
                        {g.collectionName}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">
                        {g.rounds.length} R
                      </span>
                      <span className={`text-[10px] font-semibold ${rating.color}`}>
                        {rating.title}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-stone-500" />
                        <span>{dateStr}</span>
                      </div>
                      <span>•</span>
                      <span>{g.settings.canMove ? 'Move' : 'No Move'}</span>
                      {g.settings.timeLimitSeconds > 0 && (
                        <>
                          <span>•</span>
                          <span>{g.settings.timeLimitSeconds}s</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <div
                      onClick={() => {
                        onSelectGame(g);
                        onClose();
                      }}
                      className="text-right cursor-pointer"
                    >
                      <div className="text-base font-extrabold font-mono text-amber-400">
                        {g.totalScore.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        / {g.maxPossibleScore.toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteGame(g.id)}
                      title="Delete game"
                      className="p-1.5 text-stone-600 hover:text-rose-400 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        onSelectGame(g);
                        onClose();
                      }}
                      className="p-1.5 text-stone-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5 text-stone-500 group-hover:text-stone-300" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-xs">
          {games.length > 0 && (
            <div>
              {showConfirmClear ? (
                <div className="flex items-center space-x-2">
                  <span className="text-rose-400 text-[11px]">Clear all games?</span>
                  <button
                    onClick={() => {
                      onClearAll();
                      setShowConfirmClear(false);
                    }}
                    className="px-2 py-0.5 bg-rose-600 text-white rounded text-[11px] font-semibold cursor-pointer"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="px-2 py-0.5 bg-stone-800 text-stone-300 rounded text-[11px] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmClear(true)}
                  className="text-stone-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear History
                </button>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="ml-auto px-4 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
