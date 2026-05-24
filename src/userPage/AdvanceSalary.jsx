import moment from 'moment/min/moment-with-locales'
import React, { useState } from 'react'
import salaryStore from '../store/salary-store'
import useAuthStore from '../store/auth-store'
import { createAlert } from '../utils/createAlert'

function AdvanceSalary() {
  const token = useAuthStore((state) => state.token)
  const { actionSalary } = salaryStore()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const hdlSubmit = async (e) => {
    e.preventDefault()

    if (!amount || Number(amount) <= 0) {
      createAlert('error', 'กรุณากรอกจำนวนเงินให้ถูกต้อง')
      return
    }

    try {
      setLoading(true)

      await actionSalary(token, amount)

      createAlert('success', 'Your request has been submitted')
      setAmount('')
    } catch (error) {
      console.error('Error submitting advance salary request:', error)

      createAlert(
        'error',
        error.response?.data?.message || 'Failed to submit request'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-2rem)] w-full">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center px-4 py-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="hidden lg:block">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FFB347]">
              Salary Request
            </p>

            <h1 className="mt-4 max-w-xl text-5xl font-bold leading-tight text-white">
              Request your advance salary with confidence.
            </h1>

            <p className="mt-4 max-w-lg text-lg text-white/50">
              ส่งคำขอเบิกเงินล่วงหน้าให้ผู้ดูแลตรวจสอบและอนุมัติ
            </p>

            <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <p className="text-sm text-white/40">Request Date</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {moment(new Date()).locale('th').format('dddd ll')}
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#11152E]/90 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#FFB347]">
                WorkPal
              </p>

              <h2 className="mt-2 text-3xl font-bold text-white">
                เบิกเงินล่วงหน้า
              </h2>

              <p className="mt-2 text-sm text-white/40">
                กรอกจำนวนเงินที่ต้องการเบิก แล้วส่งคำขอให้แอดมินอนุมัติ
              </p>
            </div>

            <form onSubmit={hdlSubmit} className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-white/40">วันที่ขอเบิก</p>
                <input
                  disabled
                  type="text"
                  value={moment(new Date()).locale('th').format('dddd ll')}
                  className="mt-1 w-full bg-transparent text-lg font-semibold text-white outline-none"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-white/40">จำนวนเงิน</p>
                <input
                  placeholder="0.00"
                  type="number"
                  min="1"
                  value={amount}
                  disabled={loading}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full bg-transparent text-2xl font-bold text-white outline-none placeholder:text-white/20 disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-white/35">บาท</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-14 w-full items-center justify-center rounded-2xl bg-[#FFB347] text-base font-bold text-[#1B1F3B] shadow-[0_0_30px_rgba(255,179,71,0.22)] transition hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>

            <div className="mt-5 rounded-2xl border border-[#FFB347]/20 bg-[#FFB347]/10 p-4">
              <p className="text-sm font-medium text-[#FFB347]">
                Advance Salary Info
              </p>
              <p className="mt-1 text-xs leading-relaxed text-white/45">
                คำขอของคุณจะถูกส่งไปยังแอดมินเพื่อพิจารณาอนุมัติ
                หากยอดเงินเกินเงินเดือนคงเหลือ ระบบจะแจ้งเตือนอัตโนมัติ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvanceSalary