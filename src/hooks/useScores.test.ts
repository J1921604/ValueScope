import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useScores } from './useScores'
import type { ScoreColor } from '../types'

const mockScoreData = {
  asOf: '2025-11-30',
  companies: {
    TEPCO: {
      Annual: {
        date: '2025-09-30',
        companyCode: 'E04498',
        roe: { value: 7.62, score: 'yellow' as ScoreColor, change: 0 },
        equityRatio: { value: 24.24, score: 'yellow' as ScoreColor, change: 0 },
        dscr: { value: 0.91, score: 'red' as ScoreColor, change: 0 },
      },
    },
  },
}

describe('useScores', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    vi.restoreAllMocks()
    globalThis.fetch = originalFetch
  })

  it('returns scorecard data for the requested company', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockScoreData,
    } as Response)

    const { result } = renderHook(() => useScores('TEPCO'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeNull()
    expect(result.current.data?.roe.value).toBe(7.62)
    expect(result.current.data?.equityRatio.score).toBe('yellow')
  })

  it('sets an error message when the fetch request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response)

    const { result } = renderHook(() => useScores('TEPCO'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toBeNull()
    expect(result.current.error).toContain('HTTP error')
  })
})
