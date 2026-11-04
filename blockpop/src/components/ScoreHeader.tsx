import React, { useEffect, useState } from 'react';
import { Trophy, Volume2, VolumeX, Pause, HelpCircle, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';
import { Translations } from '../utils/i18n';

interface ScoreHeaderProps {
  score: number;
  bestScore: number;
  combo: number;
  lastCheer: string | null;
  t: Translations;
  onOpenPause: () => void;
  onOpenRules: () => void;
}

export const ScoreHeader: React.FC<ScoreHeaderProps> = ({
  score,
  bestScore,
  combo,
  lastCheer,
  t,
  onOpenPause,
  onOpenRules,
}) => {
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const [scoreBumping, setScoreBumping] = useState(false);

  useEffect(() => {
    if (score > 0) {
      setScoreBumping(true);
      const timer = setTimeout(() => setScoreBumping(false), 220);
      return () => clearTimeout(timer);
    }
  }, [score]);

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="w-full max-w-[440px] px-3 pt-2 pb-1 flex flex-col items-center select-none">
      {/* Top action row */}
      <div className="w-full flex items-center justify-between text-slate-300">
        {/* Left: Best Score Trophy */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141b36] border border-[#232f58] shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400/80 animate-pulse" />
          <span className="text-[10px] font-bold tracking-wider text-amber-300/80 uppercase">
            {t.best}
          </span>
          <span className="text-xs font-extrabold text-amber-300 font-['Rubik'] ml-0.5">
            {bestScore}
          </span>
        </div>

        {/* Right controls: Help, Sound & Pause */}
        <div className="flex items-center gap-2">
          {/* Rules / How to play */}
          <button
            onClick={() => {
              sound.playButton();
              onOpenRules();
            }}
            className="p-1.5 rounded-full bg-[#141b36] hover:bg-[#1e2850] active:scale-90 transition-all border border-[#232f58] text-slate-300 hover:text-cyan-400"
            title={t.howToPlay}
            aria-label={t.howToPlay}
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-1.5 rounded-full bg-[#141b36] hover:bg-[#1e2850] active:scale-90 transition-all border border-[#232f58] text-slate-300 hover:text-white"
            title={isMuted ? t.soundOn : t.soundOff}
            aria-label="Toggle sound"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>

          {/* Pause Button */}
          <button
            onClick={() => {
              sound.playButton();
              onOpenPause();
            }}
            className="p-1.5 rounded-full bg-[#141b36] hover:bg-[#1e2850] active:scale-90 transition-all border border-[#232f58] text-slate-300 hover:text-amber-400"
            title={t.pause}
            aria-label="Pause"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Score Display */}
      <div className="flex flex-col items-center mt-1">
        <span
          className={`font-['Fredoka',_'Rubik',_sans-serif] font-bold text-5xl sm:text-6xl tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,210,211,0.35)] transition-transform duration-150 ${
            scoreBumping ? 'scale-115 text-amber-300' : 'scale-100'
          }`}
        >
          {score}
        </span>
      </div>

      {/* Combo Indicator Banner */}
      <div className="h-7 mt-1 flex items-center justify-center">
        {combo > 1 ? (
          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-bounce font-['Rubik'] font-black text-xs sm:text-sm tracking-wider uppercase border border-amber-300/60">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>{t.combo} x{combo}!</span>
            {lastCheer && <span className="text-amber-200">({lastCheer})</span>}
          </div>
        ) : lastCheer ? (
          <div className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold tracking-wider font-['Rubik'] animate-pulse">
            {lastCheer}
          </div>
        ) : null}
      </div>
    </header>
  );
};
