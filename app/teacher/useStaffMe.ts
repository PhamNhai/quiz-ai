'use client'
import { useEffect, useState } from 'react'

export type StaffMe = {
  userId: number
  role: 'admin' | 'school_manager' | 'teacher'
  username: string
}

/** undefined = đang tải; null = chưa đăng nhập / lỗi */
export function useStaffMe() {
  const [me, setMe] = useState<StaffMe | null | undefined>(undefined)
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => setMe(j && (j as StaffMe)))
  }, [])
  return me
}
