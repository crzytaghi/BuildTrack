import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProjectDetail } from '../useProjectDetail';

const project = { id: 'p1', name: 'Maple St', status: 'active' };

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn((url: string) => {
    if (url.endsWith('/projects/p1')) return json({ data: project });
    // Budget and quote endpoints are forbidden for field users.
    if (url.includes('budget-line-items') || url.includes('quotes')) return json({ error: 'Forbidden' }, 403);
    return json({ data: [{ id: 'x' }] });
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const requested = () => fetchMock.mock.calls.map(([url]) => String(url));

describe('useProjectDetail', () => {
  it('skips budget and quote requests for field users and loads the rest', async () => {
    const { result } = renderHook(() => useProjectDetail('p1', 't', 'field'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.project).toEqual(project);
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.lineItems).toEqual([]);
    expect(result.current.quotes).toEqual([]);
    expect(requested().some((u) => u.includes('budget-line-items') || u.includes('quotes'))).toBe(false);
  });

  it('treats a forbidden list as empty instead of crashing', async () => {
    // A manager whose budget request fails (e.g. role changed mid-session).
    const { result } = renderHook(() => useProjectDetail('p1', 't', 'manager'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(requested().some((u) => u.includes('budget-line-items'))).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.lineItems).toEqual([]);
    expect(result.current.quotes).toEqual([]);
  });
});
