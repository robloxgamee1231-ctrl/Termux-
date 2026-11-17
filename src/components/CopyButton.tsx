import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  variant?: 'primary' | 'subtle' | 'inline';
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label = 'Copy',
  copiedLabel = 'Copied',
  variant = 'subtle',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
      } catch {
        // Ignore fallback error
      }
      document.body.removeChild(textarea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (variant === 'primary') {
    return (
      <button
        type="button"
        onClick={handleCopy}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-mono font-semibold transition-all duration-150 cursor-pointer border ${
          copied
            ? 'bg-[#10E88A] text-[#06110B] border-[#10E88A]'
            : 'bg-[#10E88A] text-[#06110B] border-[#10E88A] hover:bg-[#34F5A1] active:translate-y-[1px]'
        } ${className}`}
        aria-label={label}
      >
        {copied ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Copy className="w-4 h-4 stroke-[2.2]" />}
        <span>{copied ? copiedLabel : label}</span>
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleCopy}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono border transition-colors cursor-pointer ${
          copied
            ? 'border-[#10E88A]/60 bg-[#10E88A]/15 text-[#10E88A]'
            : 'border-[#25302B] bg-[#141917] text-[#94A39B] hover:text-[#ECF2EE] hover:border-[#374740]'
        } ${className}`}
        aria-label={label}
      >
        {copied ? <Check className="w-3.5 h-3.5 text-[#10E88A]" /> : <Copy className="w-3.5 h-3.5" />}
        <span>{copied ? copiedLabel : label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium border transition-colors cursor-pointer ${
        copied
          ? 'border-[#10E88A]/60 bg-[#10E88A]/15 text-[#10E88A]'
          : 'border-[#26312C] bg-[#121715] text-[#B8C5BE] hover:text-[#ECF2EE] hover:border-[#3A4B43] hover:bg-[#181F1C]'
      } ${className}`}
      aria-label={label}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-[#10E88A]" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
};
