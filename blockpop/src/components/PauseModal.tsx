import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, HelpCircle, Globe } from 'lucide-react';
import { sound } from '../utils/audio';
import { Translations, Lang } from '../utils/i18n';

interface PauseModalProps {
  isOpen: boolean;
  t: Translations;
  currentLang: Lang;
  isMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onToggleSound: () => void;
  onToggleLang: (lang: Lang) => void;
  onOpenRules: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  t,
  currentLang,
  isMuted,
  onResume,
  onRestart,
  onToggleSound,
  onToggleLang,
  onOpenRules,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-xs rounded-3xl bg-[#0f1738] border-2 border-[#2b3a6e] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(34,211,238,0.15)] flex flex-col items-center text-center overflow-hidden">
        {/* Title */}
        <h2 className="text-2xl font-black font-['Rubik'] text-white tracking-widest uppercase mb-5">
          {t.paused}
        </h2>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          {/* Resume */}
          <button
            onClick={() => {
              sound.playButton();
              onResume();
            }}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 active:scale-95 text-white font-black font-['Rubik'] text-base tracking-wide uppercase shadow-[0_8px_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 transition-all"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>{t.resume}</span>
          </button>

          {/* Restart */}
          <button
            onClick={() => {
              sound.playButton();
              onRestart();
            }}
            className="w-full py-3 px-5 rounded-2xl bg-[#172552] hover:bg-[#203473] active:scale-95 text-white font-bold font-['Rubik'] text-sm tracking-wide uppercase border border-[#263c80] flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.restart}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              sound.playButton();
              onToggleSound();
            }}
            className="w-full py-3 px-5 rounded-2xl bg-[#172552] hover:bg-[#203473] active:scale-95 text-slate-200 font-bold font-['Rubik'] text-sm tracking-wide uppercase border border-[#263c80] flex items-center justify-center gap-2 transition-all"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span>{isMuted ? t.soundOff : t.soundOn}</span>
          </button>

          {/* Language Selector (RU / EN) */}
          <div className="w-full flex items-center justify-between p-2 rounded-2xl bg-[#141f47] border border-[#233368] text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 ml-1">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="font-bold">{t.language}</span>
            </div>
            <div className="flex items-center gap-1 bg-[#0b122e] p-1 rounded-xl border border-[#1e2c5e]">
              <button
                onClick={() => {
                  sound.playButton();
                  onToggleLang('ru');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  currentLang === 'ru'
                    ? 'bg-cyan-500 text-slate-950 shadow font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                RU
              </button>
              <button
                onClick={() => {
                  sound.playButton();
                  onToggleLang('en');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  currentLang === 'en'
                    ? 'bg-cyan-500 text-slate-950 shadow font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Rules */}
          <button
            onClick={() => {
              sound.playButton();
              onOpenRules();
            }}
            className="w-full py-2 px-5 rounded-xl bg-transparent hover:bg-white/5 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{t.howToPlay}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
