import React from 'react';

interface BrandLogoProps {
  type: 'nvidia' | 'sony' | 'discord' | 'telegram' | 'yandex' | 'tinkoff' | 'custom';
  company: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  type,
  company,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };

  switch (type) {
    case 'nvidia':
      return (
        <div
          className={`${sizeClasses[size]} rounded-lg bg-[#0E1B14] border border-[#10B981]/30 flex items-center justify-center p-1.5 shadow-sm ${className}`}
          title="NVIDIA"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-[#10B981]" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.9 4c-3.1 0-5.7 2.4-5.9 5.5v.1c0 2 .9 3.8 2.3 5-1-1.3-1.6-3-1.5-4.8.2-3.8 3.5-6.8 7.3-6.6 2.3.1 4.3 1.2 5.6 2.9C15.2 4.9 12.2 4 8.9 4zm.1 2.8c-2.3 0-4.1 1.7-4.4 4v.1c0 1.5.7 2.9 1.8 3.8-.8-1-1.3-2.3-1.2-3.7.2-2.7 2.5-4.9 5.3-4.8 1.6.1 3.1.9 4 2.2-1.2-.9-2.7-1.6-5.5-1.6zm.1 3.4c-1.3 0-2.4.9-2.6 2.2v.1c0 .8.4 1.6 1 2.2-.4-.6-.7-1.4-.7-2.2.1-1.4 1.4-2.6 2.8-2.5.8.1 1.6.5 2.1 1.2-.7-.6-1.6-1-2.6-1zM20 9.2c-.3 0-.6.1-.8.2-1.4-1.9-3.7-3.1-6.3-3.2-4.7-.2-8.6 3.4-8.9 8.1-.1 2.2.7 4.3 2 5.9.3.4.7.7 1.1 1-1.1-.9-1.9-2.2-2.1-3.7-.3-3.6 2.4-6.8 6-7.1 2.3-.2 4.4.7 5.8 2.2-.8-.4-1.7-.7-2.7-.7-3.4 0-6.1 2.7-6.1 6.1 0 1.2.4 2.4 1 3.4-1.2-1-2-2.5-2-4.2 0-3 2.5-5.5 5.5-5.5 1.7 0 3.3.8 4.3 2.1-1-.4-2-.6-3.1-.6-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5c2.3 0 4.2-1.7 4.5-3.9v-.4c0-2-1.3-3.7-3.2-4.2.3-.1.7-.1 1-.1 1.4 0 2.8.6 3.7 1.7.3.3.5.7.7 1.1 0-.1 0-.1 0 0 .1-2.9-1.9-5.4-4.8-6.1.4-.1.8-.2 1.2-.2 1.8 0 3.5.8 4.6 2.2.2.3.4.6.6.9-.2-2.5-1.8-4.6-4.1-5.3.3-.1.7-.1 1-.1 1.6 0 3.2.7 4.2 2 .1.1.2.3.3.4-.6-2.1-2.5-3.6-4.7-3.7z" />
          </svg>
        </div>
      );

    case 'sony':
      return (
        <div
          className={`${sizeClasses[size]} rounded-lg bg-[#1B170E] border border-[#F59E0B]/30 flex items-center justify-center p-1.5 shadow-sm ${className}`}
          title="SONY / PlayStation"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-[#F59E0B]" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.01 3.02L2.5 7.15v9.7l5.51-2.06V3.02zm1.61 2.6l4.28-1.6v12.24l-4.28 1.6V5.62zm5.89-2.2l5.99 4.48v5.52l-5.99-2.24V3.42z" />
          </svg>
        </div>
      );

    case 'discord':
      return (
        <div
          className={`${sizeClasses[size]} rounded-lg bg-[#161726] border border-[#818CF8]/30 flex items-center justify-center p-1.5 shadow-sm ${className}`}
          title="Discord"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-[#818CF8]" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
        </div>
      );

    case 'telegram':
      return (
        <div
          className={`${sizeClasses[size]} rounded-lg bg-[#0F1B26] border border-[#38BDF8]/30 flex items-center justify-center p-1.5 shadow-sm ${className}`}
          title="Telegram"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-[#38BDF8]" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .34z" />
          </svg>
        </div>
      );

    case 'yandex':
      return (
        <div
          className={`${sizeClasses[size]} rounded-lg bg-[#241111] border border-[#F87171]/30 flex items-center justify-center font-bold text-[#F87171] shadow-sm font-sans ${className}`}
          title="Яндекс"
        >
          Я
        </div>
      );

    case 'tinkoff':
      return (
        <div
          className={`${sizeClasses[size]} rounded-lg bg-[#23200D] border border-[#FACC15]/30 flex items-center justify-center font-bold text-[#FACC15] shadow-sm font-sans ${className}`}
          title="Т-Банк"
        >
          Т
        </div>
      );

    case 'custom':
    default:
      return (
        <div
          className={`${sizeClasses[size]} rounded-lg bg-orange-950/40 border border-orange-500/30 flex items-center justify-center font-bold text-amber-300 shadow-sm ${className}`}
          title={company}
        >
          {company.charAt(0).toUpperCase()}
        </div>
      );
  }
};
