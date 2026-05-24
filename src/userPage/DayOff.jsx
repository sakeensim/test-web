import React, { useState } from 'react'
import useTimeStore from '../store/time-store'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import useAuthStore from '../store/auth-store'
import { createAlert } from '../utils/createAlert'

function DayOff() {
  const token = useAuthStore((state) => state.token)
  const { actionDayOff } = useTimeStore()

  const [selected, setSelected] = useState()
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const hdlSubmit = async (e) => {
    e.preventDefault()

    if (!token) {
      createAlert('error', 'Please log in')
      return
    }

    if (!selected) {
      createAlert('error', 'กรุณาเลือกวันที่ต้องการลา')
      return
    }

    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    const requestDate = new Date(selected)
    requestDate.setHours(0, 0, 0, 0)

    if (requestDate < currentDate) {
      createAlert('error', 'โปรดเลือกวันที่วันนี้หรือในอนาคต')
      return
    }

    try {
      setLoading(true)

      const res = await actionDayOff(token, selected, reason)

      createAlert('success', res?.data?.message || 'ส่งคำขอลาสำเร็จ')

      setSelected(undefined)
      setReason('')
    } catch (error) {
      console.error('Error submitting day off:', error)

      createAlert(
        'error',
        error.response?.data?.message || 'ส่งคำขอลาไม่สำเร็จ'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-5xl justify-center px-3 py-4 sm:px-4 sm:py-6">
        <div className="grid w-full justify-center gap-5 lg:grid-cols-[1fr_400px] lg:items-center">
          <div className="hidden lg:block">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FFB347]">
              Day Off Request
            </p>

            <h1 className="mt-4 max-w-xl text-5xl font-bold leading-tight text-white">
              Plan your day off smoothly.
            </h1>

            <p className="mt-4 max-w-lg text-lg text-white/50">
              เลือกวันที่ต้องการลา พร้อมระบุเหตุผลเพื่อส่งให้แอดมินอนุมัติ
            </p>

            <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <p className="text-sm text-white/40">Selected Date</p>

              <p className="mt-2 text-3xl font-bold text-white">
                {selected
                  ? selected.toLocaleDateString('th-TH')
                  : 'ยังไม่ได้เลือกวัน'}
              </p>

              <p className="mt-2 text-sm text-[#00B8A9]">Status: PENDING</p>
            </div>
          </div>

          <div className="w-full max-w-[360px] rounded-[1.5rem] border border-white/10 bg-[#11152E]/90 p-4 shadow-2xl backdrop-blur-xl sm:max-w-[420px] sm:p-5">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FFB347]">
                WorkPal
              </p>

              <h2 className="mt-1 text-2xl font-bold text-white">
                ขอวันหยุด
              </h2>

              <p className="mt-1 text-xs text-white/40">
                เลือกวันที่และกรอกเหตุผลสำหรับการขอลา
              </p>
            </div>

            <form onSubmit={hdlSubmit} className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p className="mb-2 text-xs text-white/40">วันที่ต้องการลา</p>

                <div className="overflow-hidden rounded-2xl bg-[#1B1F3B] p-2 text-white">
                  <DayPicker
                    mode="single"
                    selected={selected}
                    onSelect={setSelected}
                    disabled={{ before: new Date() }}
                    className="workpal-calendar"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs text-white/40">เหตุผล</p>

                <input
                  placeholder="เช่น ธุระส่วนตัว / ป่วย / เดินทาง"
                  type="text"
                  name="reason"
                  value={reason}
                  disabled={loading}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 w-full bg-transparent text-base font-semibold text-white outline-none placeholder:text-white/20 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#FFB347] text-sm font-bold text-[#1B1F3B] shadow-[0_0_30px_rgba(255,179,71,0.22)] transition hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>

            <div className="mt-4 rounded-2xl border border-[#00B8A9]/20 bg-[#00B8A9]/10 p-3">
              <p className="text-sm font-medium text-[#00B8A9]">
                Day Off Policy
              </p>

              <p className="mt-1 text-xs leading-relaxed text-white/45">
                ระบบจะตรวจสอบตำแหน่ง โควต้า และวันลาคงเหลืออัตโนมัติ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DayOff