import { useState } from 'react';
import './CommitInput.css';

interface CommitInputProps {
  value: number;
  onCommit: (value: number) => void;
  formatDisplay: (val: number) => string;
  parseInput: (str: string) => number | null;
  min?: number;
  max?: number;
  step?: number | string;
  ariaLabel?: string;
  title?: string;
  className?: string;
}

export function CommitInput({
  value,
  onCommit,
  formatDisplay,
  parseInput,
  min,
  max,
  ariaLabel,
  title = 'Type exact value and press Enter to apply',
  className = '',
}: CommitInputProps) {
  // When editingText is null, we display the registered formatDisplay(value)
  const [editingText, setEditingText] = useState<string | null>(null);

  const displayText = editingText !== null ? editingText : formatDisplay(value);

  const commitValue = () => {
    if (editingText === null) return;
    const parsed = parseInput(editingText);
    if (parsed !== null && !isNaN(parsed)) {
      let finalVal = parsed;
      if (min !== undefined) finalVal = Math.max(min, finalVal);
      if (max !== undefined) finalVal = Math.min(max, finalVal);
      onCommit(finalVal);
    }
    setEditingText(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitValue();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setEditingText(null);
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      className={`commit-input ${className}`}
      value={displayText}
      onChange={(e) => setEditingText(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={commitValue}
      aria-label={ariaLabel}
      title={title}
    />
  );
}
