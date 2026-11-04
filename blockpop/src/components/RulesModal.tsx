import React from 'react';
import { HelpCircle, X, Check, Grid, Flame, Lightbulb, MousePointerClick } from 'lucide-react';
import { sound } from '../utils/audio';
import { Translations } from '../utils/i18n';

interface RulesModalProps {
  isOpen: boolean;
  t: Translations;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, t, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0f1738] border-2 border-[#2b3a6e] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(34,211,238,0.15)] flex flex-col items-center text-left overflow-hidden">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-[#233368]">
          <div className="flex items-center gap-2 text-cyan-400">
            <HelpCircle className="w-6 h-6" />
            <h2 className="text-xl font-black font-['Rubik'] text-white tracking-wide">
              {t.rulesTitle}
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playButton();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#162352] hover:bg-[#203173] text-slate-300 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="w-full my-4 flex flex-col gap-3.5 text-sm text-slate-200">
          <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#141f47] border border-[#233368]">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <MousePointerClick className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white leading-snug">{t.rulesStep1}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#141f47] border border-[#233368]">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white leading-snug">{t.rulesStep2}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#141f47] border border-[#233368]">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white leading-snug">{t.rulesStep3}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#141f47] border border-[#233368]">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white leading-snug">{t.rulesStep4}</p>
            </div>
          </div>
        </div>

        {/* OK Button */}
        <button
          onClick={() => {
            sound.playButton();
            onClose();
          }}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white font-black font-['Rubik'] text-base tracking-wide uppercase shadow-[0_8px_25px_rgba(6,182,212,0.35)] flex items-center justify-center gap-2 transition-all"
        >
          <Check className="w-5 h-5" />
          <span>{t.gotIt}</span>
        </button>
      </div>
    </div>
  );
};
