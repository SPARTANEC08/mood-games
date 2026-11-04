import React, { useEffect, useState } from 'react';
import { Trophy, RotateCcw, Flame, Sparkles, Play, Star } from 'lucide-react';
import { sound } from '../utils/audio';
import { yandex } from '../utils/yandexGames';
import { Translations } from '../utils/i18n';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  bestScore: number;
  maxCombo: number;
  linesCleared: number;
  isNewBest: boolean;
  canRevive?: boolean;
  t: Translations;
  onRevive?: () => void;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  bestScore,
  maxCombo,
  linesCleared,
  isNewBest,
  canRevive = true,
  t,
  onRevive,
  onRestart,
}) => {
  const [canShowReview, setCanShowReview] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  useEffect(() => {
    if (isOpen) {
      yandex.getSDK()?.feedback?.canReview().then((res) => {
        if (res.value) setCanShowReview(true);
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReviveClick = async () => {
    if (!onRevive || isWatchingAd) return;
    setIsWatchingAd(true);
    sound.playButton();

    try {
      await yandex.showRewardAd(() => {
        onRevive();
      });
    } finally {
      setIsWatchingAd(false);
    }
  };

  const handleReviewClick = async () => {
    sound.playButton();
    const reviewed = await yandex.promptReview();
    if (reviewed) setCanShowReview(false);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0f1738] border-2 border-[#2b3a6e] p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(34,211,238,0.15)] flex flex-col items-center text-center overflow-hidden">
        {/* Ambient Top Light */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-cyan-500/20 via-blue-500/5 to-transparent pointer-events-none" />

        {/* Title */}
        <h2 className="text-3xl font-black font-['Fredoka',_'Rubik',_sans-serif] tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-blue-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          {t.gameOver}
        </h2>

        {/* New Best Badge */}
        {isNewBest && (
          <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-bounce font-['Rubik'] border border-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.newRecord}</span>
          </div>
        )}

        {/* Score Card */}
        <div className="w-full mt-3 p-3.5 rounded-2xl bg-[#141f47] border border-[#233368] shadow-inner flex flex-col items-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            {t.score}
          </span>
          <span className="text-4xl sm:text-5xl font-black font-['Fredoka',_'Rubik',_sans-serif] text-white my-1 drop-shadow-[0_4px_12px_rgba(0,210,211,0.4)]">
            {score}
          </span>

          <div className="w-full h-px bg-[#26376c] my-2.5" />

          {/* Stats Grid */}
          <div className="w-full grid grid-cols-3 gap-2 text-center">
            {/* Best */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-amber-400">
                <Trophy className="w-3 h-3" />
                <span className="text-[9px] font-bold tracking-wider uppercase">
                  {t.best}
                </span>
              </div>
              <span className="text-sm sm:text-base font-extrabold font-['Rubik'] text-amber-300">
                {bestScore}
              </span>
            </div>

            {/* Max Combo */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-rose-400">
                <Flame className="w-3 h-3" />
                <span className="text-[9px] font-bold tracking-wider uppercase">
                  {t.combo}
                </span>
              </div>
              <span className="text-sm sm:text-base font-extrabold font-['Rubik'] text-rose-300">
                x{maxCombo}
              </span>
            </div>

            {/* Lines */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-cyan-400">
                <span className="text-[9px] font-bold tracking-wider uppercase">
                  {t.lines}
                </span>
              </div>
              <span className="text-sm sm:text-base font-extrabold font-['Rubik'] text-cyan-300">
                {linesCleared}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full mt-4 flex flex-col gap-2.5">
          {/* Rewarded Video: Second Chance / Revive (Compliant with Sections 4.5.1, 4.5.2) */}
          {canRevive && onRevive && (
            <button
              onClick={handleReviveClick}
              disabled={isWatchingAd}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 active:scale-95 text-white font-black font-['Rubik'] shadow-[0_8px_25px_rgba(245,158,11,0.45)] border-t border-amber-300 flex flex-col items-center justify-center transition-all group disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="w-3 h-3 fill-white" />
                </div>
                <span className="text-sm uppercase tracking-wider">{t.revive}</span>
                <span className="text-[9px] bg-black/40 px-1.5 py-0.5 rounded font-mono font-bold tracking-normal uppercase text-amber-200">
                  {t.adBadge}
                </span>
              </div>
              <span className="text-[10px] text-amber-100/80 font-normal mt-0.5">
                {t.reviveDesc}
              </span>
            </button>
          )}

          {/* Play Again Button */}
          <button
            onClick={() => {
              sound.playButton();
              onRestart();
            }}
            className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 active:scale-95 text-white font-black font-['Rubik'] text-sm tracking-wide uppercase shadow-[0_8px_25px_rgba(16,185,129,0.35)] border-t border-emerald-300 flex items-center justify-center gap-2 transition-all group"
          >
            <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            <span>{t.playAgain}</span>
          </button>

          {/* Rate Game on Yandex Games if eligible */}
          {canShowReview && (
            <button
              onClick={handleReviewClick}
              className="w-full py-2 px-4 rounded-xl bg-[#18234d] hover:bg-[#202e66] active:scale-95 text-amber-300 text-xs font-bold tracking-wider uppercase border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{t.rateGame}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
