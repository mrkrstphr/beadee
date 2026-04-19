import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useKeyboard } from './useKeyboard';

function fireKey(key: string, extra: Partial<KeyboardEventInit> = {}) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...extra }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useKeyboard', () => {
  it('calls the bound handler when the matching key is pressed', () => {
    const onJ = vi.fn();
    renderHook(() => useKeyboard({ j: onJ }));
    fireKey('j');
    expect(onJ).toHaveBeenCalledOnce();
  });

  it('does not call handlers for unbound keys', () => {
    const onJ = vi.fn();
    renderHook(() => useKeyboard({ j: onJ }));
    fireKey('k');
    expect(onJ).not.toHaveBeenCalled();
  });

  it('prevents default on matched keys', () => {
    const event = new KeyboardEvent('keydown', { key: 'j', bubbles: true });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    renderHook(() => useKeyboard({ j: vi.fn() }));
    document.dispatchEvent(event);
    expect(preventDefault).toHaveBeenCalled();
  });

  it('does not fire when active is false', () => {
    const onJ = vi.fn();
    renderHook(() => useKeyboard({ j: onJ }, false));
    fireKey('j');
    expect(onJ).not.toHaveBeenCalled();
  });

  it('ignores keys when a modifier key is held', () => {
    const onJ = vi.fn();
    renderHook(() => useKeyboard({ j: onJ }));
    fireKey('j', { metaKey: true });
    fireKey('j', { ctrlKey: true });
    fireKey('j', { altKey: true });
    expect(onJ).not.toHaveBeenCalled();
  });

  it('ignores keys when focus is inside an input', () => {
    const onJ = vi.fn();
    renderHook(() => useKeyboard({ j: onJ }));

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    fireKey('j');
    expect(onJ).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('allows Escape through even when focus is inside an input', () => {
    const onEscape = vi.fn();
    renderHook(() => useKeyboard({ Escape: onEscape }));

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    fireKey('Escape');
    expect(onEscape).toHaveBeenCalledOnce();

    document.body.removeChild(input);
  });

  it('removes the event listener on unmount', () => {
    const onJ = vi.fn();
    const { unmount } = renderHook(() => useKeyboard({ j: onJ }));
    unmount();
    fireKey('j');
    expect(onJ).not.toHaveBeenCalled();
  });
});
