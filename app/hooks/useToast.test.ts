import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast, useToastProvider } from './useToast';

describe('useToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with no toasts', () => {
    const { result } = renderHook(() => useToastProvider());
    expect(result.current.toasts).toHaveLength(0);
  });

  it('adds a toast when add() is called', () => {
    const { result } = renderHook(() => useToastProvider());
    act(() => {
      result.current.add({ id: 1, message: 'Saved', type: 'success' });
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Saved');
  });

  it('auto-dismisses a toast after 2500ms', () => {
    const { result } = renderHook(() => useToastProvider());
    act(() => {
      result.current.add({ id: 1, message: 'Saved', type: 'success' });
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('does not dismiss before 2500ms', () => {
    const { result } = renderHook(() => useToastProvider());
    act(() => {
      result.current.add({ id: 1, message: 'Saved', type: 'success' });
    });
    act(() => {
      vi.advanceTimersByTime(2499);
    });
    expect(result.current.toasts).toHaveLength(1);
  });

  it('dismiss() removes the toast immediately', () => {
    const { result } = renderHook(() => useToastProvider());
    act(() => {
      result.current.add({ id: 1, message: 'Saved', type: 'success' });
    });
    act(() => {
      result.current.dismiss(1);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('dismiss() cancels the auto-dismiss timer', () => {
    const { result } = renderHook(() => useToastProvider());
    act(() => {
      result.current.add({ id: 1, message: 'Saved', type: 'success' });
    });
    act(() => {
      result.current.dismiss(1);
    });
    // Advancing past the original timeout should not throw or cause issues
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('can hold multiple toasts independently', () => {
    const { result } = renderHook(() => useToastProvider());
    act(() => {
      result.current.add({ id: 1, message: 'One', type: 'success' });
      result.current.add({ id: 2, message: 'Two', type: 'error' });
    });
    expect(result.current.toasts).toHaveLength(2);

    act(() => {
      result.current.dismiss(1);
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Two');
  });
});

describe('toast() imperative helper', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a toast via the module-level helper when a provider is mounted', () => {
    const { result } = renderHook(() => useToastProvider());
    act(() => {
      toast('Hello from imperative helper');
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Hello from imperative helper');
  });

  it('defaults to success type', () => {
    const { result } = renderHook(() => useToastProvider());
    act(() => {
      toast('Done');
    });
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('respects an explicit type', () => {
    const { result } = renderHook(() => useToastProvider());
    act(() => {
      toast('Oops', 'error');
    });
    expect(result.current.toasts[0].type).toBe('error');
  });
});
