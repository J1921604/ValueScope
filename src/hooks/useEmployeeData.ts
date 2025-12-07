import { useEffect, useState } from 'react'
import type { EmployeeDataResponse } from '../types'

interface UseEmployeeDataReturn {
  data: EmployeeDataResponse | null
  loading: boolean
  error: Error | null
}

/**
 * 従業員情報データを取得するカスタムフック
 */
export function useEmployeeData(): UseEmployeeDataReturn {
  const [data, setData] = useState<EmployeeDataResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/ValueScope/data/employees.json')
        
        if (!response.ok) {
          throw new Error(`従業員情報の読み込みに失敗しました: ${response.status}`)
        }
        
        const jsonData = await response.json() as EmployeeDataResponse
        setData(jsonData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('不明なエラーが発生しました'))
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}
