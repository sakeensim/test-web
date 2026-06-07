import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { ChevronLeft, ChevronRight, User } from 'lucide-react'
import API_URL from '../utils/api'
import useAuthStore from '../store/auth-store'

function UserHistoryPage() {
  const token = useAuthStore((state) => state.token)

  const [month, setMonth] = useState(new Date())
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('check')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) fetchHistory()
  }, [token, month])

  const fetchHistory = async () => {
    try {
      setLoading(true)

      const res = await axios.get(
        `${API_URL}/user/history?month=${month.getMonth() + 1}&year=${month.getFullYear()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setData(res.data)
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const changeMonth = (value) => {
    const newDate = new Date(month)
    newDate.setMonth(newDate.getMonth() + value)
    setMonth(newDate)
  }

  const formatMonth = (date) =>
    date.toLocaleString('th-TH', {
      month: 'long',
      year: 'numeric',
    })

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString('th-TH') : '-'

  const formatTime = (date) =>
    date
      ? new Date(date).toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-'

  const formatMoney = (amount) =>
    new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(Number(amount || 0))

  const formatMinutes = (minutes) => {
    const total = Number(minutes || 0)

    if (total <= 0) return '0 นาที'

    const hours = Math.floor(total / 60)
    const mins = total % 60

    if (hours <= 0) return `${mins} นาที`
    if (mins <= 0) return `${hours} ชม.`

    return `${hours} ชม. ${mins} นาที`
  }

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-'

    const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime()

    if (diffMs <= 0) return '-'

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}h ${minutes}m`
  }

  const statusClass = (status) => {
    if (status === 'APPROVED') return 'text-[#00B8A9] bg-[#00B8A9]/10'
    if (status === 'REJECTED') return 'text-red-300 bg-red-400/10'
    if (status === 'CANCELED') return 'text-orange-300 bg-orange-400/10'
    return 'text-white/60 bg-white/[0.06]'
  }

  const attendanceStatusClass = (status, type) => {
    if (type === 'OT') {
      if (status === 'COMPLETED') return 'text-cyan-300 bg-cyan-400/10'
      if (status === 'ACTIVE') return 'text-[#FFB347] bg-[#FFB347]/10'
      if (status === 'CANCELLED') return 'text-red-300 bg-red-400/10'
      if (status === 'EXPIRED') return 'text-orange-300 bg-orange-400/10'
      return 'text-white/60 bg-white/[0.06]'
    }

    if (status === 'PRESENT') return 'text-[#00B8A9] bg-[#00B8A9]/10'
    if (status === 'ABSENT') return 'text-red-300 bg-red-400/10'
    if (status === 'DAY_OFF') return 'text-sky-300 bg-sky-400/10'
    if (status === 'HOLIDAY') return 'text-[#FFB347] bg-[#FFB347]/10'
    return 'text-white/60 bg-white/[0.06]'
  }

  const typeClass = (type) => {
    if (type === 'OT') return 'text-cyan-300 bg-cyan-400/10'
    return 'text-[#00B8A9] bg-[#00B8A9]/10'
  }

  const isCountableOT = (ot) => {
    return (
      ot?.checkIn &&
      ot?.checkOut &&
      ot.status !== 'CANCELLED' &&
      ot.status !== 'EXPIRED'
    )
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#00B8A9]" />
      </div>
    )
  }

  if (!data) return null

  const attendanceLogs = data.logs.attendanceLogs || []
  const overtimeLogs = data.logs.overtimeLogs || data.logs.overtimeTrackings || []

  const totalOTMinutes =
    data.summary.totalOtMinutes ||
    overtimeLogs
      .filter(isCountableOT)
      .reduce((sum, ot) => sum + Number(ot.otMinutes || 0), 0)

  const workLogs = attendanceLogs.map((log) => ({
    ...log,
    type: 'WORK',
    rowStatus: log.status,
    sortDate: log.checkIn || log.date,
    }))

    const otLogs = overtimeLogs.map((ot) => ({
    ...ot,
    type: 'OT',
    rowStatus: ot.status,
    date: ot.date || ot.checkIn,
    sortDate: ot.checkIn || ot.date,
    }))

    const combinedLogs = [...workLogs, ...otLogs].sort(
    (a, b) => new Date(b.sortDate || b.date) - new Date(a.sortDate || a.date)
    )
  return (
    <div className="min-h-dvh w-full p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FFB347]">
              My History
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white">
              Work History
            </h1>

            <p className="mt-2 text-white/45">
              ดูประวัติการทำงาน วันลา และเงินเบิกล่วงหน้ารายเดือน
            </p>
          </div>

          <div className="flex items-center rounded-2xl bg-[#11152E]/90 p-2">
            <button
              onClick={() => changeMonth(-1)}
              className="h-11 w-11 rounded-xl text-white/60 hover:bg-white/[0.06]"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="w-48 text-center font-bold text-white">
              {formatMonth(month)}
            </div>

            <button
              onClick={() => changeMonth(1)}
              className="h-11 w-11 rounded-xl text-white/60 hover:bg-white/[0.06]"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#11152E]/90 p-5 shadow-2xl">
          <div className="flex items-center gap-4">
            {data.profile.profileImage ? (
              <img
                src={data.profile.profileImage}
                className="h-16 w-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06] text-white/40">
                <User />
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold text-white">
                {data.profile.firstname} {data.profile.lastname}
              </h2>
              <p className="text-white/45">
                {data.profile.position?.name || 'No position'} ·{' '}
                {data.profile.branch?.name || 'No branch'}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-8">
            <Mini title="ทำงาน" value={`${data.summary.workingDays} วัน`} color="text-[#00B8A9]" />
            <Mini title="ขาด" value={`${data.summary.absentDays || 0} วัน`} color="text-red-300" />
            <Mini title="สาย" value={`${data.summary.lateDays} วัน`} color="text-red-300" />
            <Mini title="ออกก่อน" value={`${data.summary.earlyDays} วัน`} color="text-orange-300" />
            <Mini title="OT" value={formatMinutes(totalOTMinutes)} color="text-cyan-300" />
            <Mini title="ลา" value={`${data.summary.dayOffs} วัน`} color="text-white" />
            <Mini title="เบิกล่วงหน้า" value={formatMoney(data.summary.advanceTaken)} color="text-[#FFB347]" />
            <Mini title="เงินเดือนสุทธิ" value={formatMoney(data.summary.finalSalary)} color="text-[#00B8A9]" />
          </div>
        </div>

        <div className="mt-5 rounded-[2rem] border border-white/10 bg-[#11152E]/90 p-4 shadow-2xl">
          <div className="flex overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1">
            {[
              ['check', 'Attendance / OT'],
              ['dayoff', 'Day Off'],
              ['salary', 'Salary'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`min-w-[140px] flex-1 rounded-xl px-4 py-3 text-sm font-bold ${
                  activeTab === key
                    ? 'bg-[#FFB347] text-[#1B1F3B]'
                    : 'text-white/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 max-h-[420px] overflow-auto rounded-2xl bg-white/[0.03] p-3">
            {activeTab === 'check' && (
              <table className="min-w-[1320px] w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    {[
                      'Date',
                      'Type',
                      'Status',
                      'Shift',
                      'Check In',
                      'Late',
                      'Check Out',
                      'Early',
                      'OT',
                      'Duration',
                      'Note',
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-xs uppercase text-white/35"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {combinedLogs.length > 0 ? (
                    combinedLogs.map((log, index) => {
                      const isOT = log.type === 'OT'
                      const status = isOT ? log.status : log.status

                      return (
                        <tr
                          key={`${log.type}-${log.id || log.date}-${index}`}
                          className={`border-b border-white/5 ${
                            isOT ? 'bg-cyan-400/[0.025]' : ''
                          }`}
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-white">
                            {formatDate(log.date || log.checkIn)}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${typeClass(
                                log.type
                              )}`}
                            >
                              {isOT ? 'OT' : 'WORK'}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${attendanceStatusClass(
                                status,
                                log.type
                              )}`}
                            >
                              {isOT ? `OT ${status}` : status}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-cyan-300">
                            {!isOT && log.status === 'PRESENT'
                              ? log.shiftName || '-'
                              : '-'}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-[#00B8A9]">
                            {(isOT || log.status === 'PRESENT') && log.checkIn
                              ? formatTime(log.checkIn)
                              : '-'}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-red-300">
                            {!isOT && log.status === 'PRESENT'
                              ? `${log.lateMinutes || 0}m`
                              : '-'}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-[#FFB347]">
                            {(isOT || log.status === 'PRESENT') && log.checkOut
                              ? formatTime(log.checkOut)
                              : '-'}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-orange-300">
                            {!isOT && log.status === 'PRESENT'
                              ? `${log.earlyLeaveMinutes || 0}m`
                              : '-'}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-cyan-300">
                            {isOT ? formatMinutes(log.otMinutes || 0) : '-'}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-white">
                            {(isOT || log.status === 'PRESENT') && log.checkOut
                              ? calculateDuration(log.checkIn, log.checkOut)
                              : '-'}
                          </td>

                          <td className="px-4 py-3 text-white/50">
                            <p className="max-w-[180px] truncate">
                              {isOT
                                ? log.noteIn || log.noteOut || '-'
                                : log.checkInNote ||
                                  log.checkOutNote ||
                                  log.reason ||
                                  (log.status === 'HOLIDAY'
                                    ? 'Store holiday'
                                    : '-')}
                            </p>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="11" className="py-10 text-center text-white/35">
                        No attendance logs
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'dayoff' && (
              <div className="space-y-3">
                {data.logs.dayOff.length > 0 ? (
                  data.logs.dayOff.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-white/[0.04] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold text-white">{formatDate(item.date)}</p>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-white/50">{item.reason || 'No reason'}</p>
                    </div>
                  ))
                ) : (
                  <p className="py-10 text-center text-white/35">No day off logs</p>
                )}
              </div>
            )}

            {activeTab === 'salary' && (
              <div className="space-y-3">
                {data.logs.advanceSalary.length > 0 ? (
                  data.logs.advanceSalary.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-white/[0.04] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xl font-bold text-[#FFB347]">
                          {formatMoney(item.amount)}
                        </p>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-white/50">
                        {formatDate(item.requestDate)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="py-10 text-center text-white/35">No salary logs</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Mini({ title, value, color }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-4">
      <p className="text-xs text-white/40">{title}</p>
      <p className={`mt-2 text-lg font-bold ${color}`}>{value}</p>
    </div>
  )
}

export default UserHistoryPage