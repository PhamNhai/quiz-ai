'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStaffMe } from './useStaffMe'

/** Quản lý trường không xem được trang liên quan đề thi — chuyển về danh sách lớp. */
export function useSchoolManagerExamRedirect() {
  const me = useStaffMe()
  const router = useRouter()
  useEffect(() => {
    if (me?.role === 'school_manager') {
      router.replace('/teacher/classes')
    }
  }, [me, router])
}
