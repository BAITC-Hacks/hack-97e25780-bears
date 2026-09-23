import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  const boxSizes = {
    sm: 'w-9 h-9 rounded-xl',
    md: 'w-11 h-11 rounded-2xl',
    lg: 'w-14 h-14 rounded-2xl',
  };

  const cardSizes = {
    sm: 'w-5 h-7 text-[11px]',
    md: 'w-6 h-8 text-xs',
    lg: 'w-7 h-10 text-sm',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Square with rounded corners: dark, serious, graphite-titanium with sleek burnt-amber edge */}
      <div
        className={`${boxSizes[size]} relative flex items-center justify-center bg-gradient-to-br from-[#1E202A] via-[#14151E] to-[#0A0B10] border border-white/[0.12] ring-1 ring-orange-500/30 shadow-lg shadow-black/80 overflow-hidden flex-shrink-0`}
      >
        {/* Subtle ambient tech glow inside container */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 40% 30%, rgba(249, 115, 22, 0.22), transparent 70%)',
          }}
        />

        {/* Two dark playing cards: back card tilted with letter 'C', front card with letter 'S' */}
        <div className="relative w-8 h-8 flex items-center justify-center">
          {/* Back card with letter C (tilted at ~14deg, serious dark slate with amber rim) */}
          <div
            className={`absolute ${cardSizes[size]} bg-[#181A24] rounded-[5px] transform rotate-14 translate-x-1.5 translate-y-0.5 flex items-center justify-center border border-amber-500/40 shadow-sm`}
            style={{
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.6)',
            }}
          >
            <span className="font-black text-amber-400 font-mono leading-none tracking-tight">
              C
            </span>
          </div>

          {/* Front card with letter S (prominently standing in front, dark obsidian with sharp burnt-orange border) */}
          <div
            className={`relative ${cardSizes[size]} bg-[#0E1017] rounded-[5px] transform -rotate-3 -translate-x-1 flex items-center justify-center border border-orange-500/70 z-10`}
            style={{
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.75)',
            }}
          >
            <span className="font-black text-[#FF6A00] font-mono leading-none tracking-tight drop-shadow-[0_0_6px_rgba(255,106,0,0.5)]">
              S
            </span>
            {/* Precision corner card pip */}
            <div className="absolute top-[2px] left-[2.5px] w-[3px] h-[3px] bg-orange-400 rounded-full shadow-[0_0_4px_#FF6A00]" />
          </div>
        </div>
      </div>

      {/* Brand Name Typography: serious, tech-focused, dark elegance */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-white font-extrabold tracking-tight text-lg leading-tight group-hover:text-amber-200 transition-colors">
            StartCard<span className="text-[#FF7A00] font-black">.ai</span>
          </span>
        </div>
        {showSubtitle && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase font-mono">
              SC.ai
            </span>
            <span className="text-neutral-600 text-[10px]">•</span>
            <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest">
              AI Challenge Engine
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
