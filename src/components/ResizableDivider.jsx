import { useCallback } from 'react';

export default function ResizableDivider({
  currentWidth,
  onResize,
  minWidth = 200,
  maxWidthPct = 0.65,
}) {
  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = currentWidth;

      const onMove = (moveEvent) => {
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
