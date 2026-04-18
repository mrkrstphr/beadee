import { useCallback } from 'react';

interface ResizableDividerProps {
  currentWidth: number;
  onResize: (width: number) => void;
  minWidth?: number;
  maxWidthPct?: number;
}

export default function ResizableDivider({
  currentWidth,
  onResize,
  minWidth = 200,
  maxWidthPct = 0.65,
}: ResizableDividerProps) {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = currentWidth;

      const onMove = (moveEvent: MouseEvent) => {
        const maxWidth = Math.floor(window.innerWidth * maxWidthPct);
        const delta = moveEvent.clientX - startX;
        const next = Math.min(maxWidth, Math.max(minWidth, startWidth + delta));
        onResize(next);
      };

      const onUp = () => {
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [currentWidth, onResize, minWidth, maxWidthPct],
  );

  return <div className="resize-divider" onMouseDown={handleMouseDown} />;
}
