import { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react'

import useAuthStore from '../store/auth-store'
import API_URL from '../utils/api'

const WorkTimeRecordPage = () => {
  const [records, setRecords] = useState([])
  const [employees, setEmployees] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedNote, setSelectedNote] = useState(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  const { token } = useAuthStore()

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/getemployee`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setEmployees(res.data.result || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load employees')
    }
  }

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setBranches(res.data.result || res.data.data || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load branches')
    }
  }

  const fetchTimeRecords = async () => {
    setLoading(true)
    setError(null)

    try {
      const month = format(selectedMonth, 'M')
      const year = format(selectedMonth, 'yyyy')

      let url = `${API_URL}/admin/Work-time-record?month=${month}&year=${year}&page=${page}&limit=20&_=${Date.now()}`

      if (selectedBranch !== 'all') {
        url += `&branchId=${selectedBranch}`
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setPagination(res.data.pagination || null)

      let recordsData = res.data.data || []

      recordsData = recordsData
        .filter((record) => {
          if (!record) return false

          const hasValidCheckIn =
            record.checkIn && !isNaN(new Date(record.checkIn).getTime())

          const hasValidCheckOut =
            record.checkOut && !isNaN(new Date(record.checkOut).getTime())

          return hasValidCheckIn && hasValidCheckOut
        })
        .map((record) => {
          const employeeId =
            record.employeeId || record.employeesId || record.employee_id

          return {
            ...record,
            normalizedEmployeeId: employeeId,
          }
        })
        .filter(Boolean)

      setRecords(
        recordsData.sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))
      )
    } catch (err) {
      console.error(err)
      setError('Failed to load time records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchEmployees()
      fetchBranches()
    }
  }, [token])

  useEffect(() => {
    if (token) fetchTimeRecords()
  }, [selectedMonth, selectedBranch, page, token])

  const prevMonth = () => {
    const newDate = new Date(selectedMonth)
    newDate.setMonth(newDate.getMonth() - 1)
    setSelectedMonth(newDate)
    setPage(1)
  }

  const nextMonth = () => {
    const newDate = new Date(selectedMonth)
    newDate.setMonth(newDate.getMonth() + 1)
    setSelectedMonth(newDate)
    setPage(1)
  }

  const formatTime = (dateTimeStr) => {
    if (
      !dateTimeStr ||
      typeof dateTimeStr !== 'string' ||
      isNaN(Date.parse(dateTimeStr))
    ) {
      return 'N/A'
    }

    return format(new Date(dateTimeStr), 'hh:mm a')
  }

  const calculateDuration = (checkIn, checkOut) => {
    if (
      !checkIn ||
      !checkOut ||
      isNaN(new Date(checkIn).getTime()) ||
      isNaN(new Date(checkOut).getTime())
    ) {
      return 'N/A'
    }

    const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime()
    if (diffMs <= 0) return 'N/A'

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}h ${minutes}m`
  }

  const getEmployeeName = (employeeId) => {
    if (!employeeId) return 'Unknown'

    const employee = employees.find((e) => String(e.id) === String(employeeId))

    return employee
      ? `${employee.firstname || ''} ${employee.lastname || ''}`.trim()
      : 'Unknown'
  }

  const badgeBase =
    'inline-flex min-h-[30px] min-w-[92px] items-center justify-center rounded-full px-3 py-1 text-xs font-bold leading-none whitespace-nowrap'

  const timeBadgeBase =
    'inline-flex min-h-[30px] min-w-[96px] items-center justify-center rounded-full px-3 py-1 text-sm font-bold leading-none whitespace-nowrap'

  const getLateBadge = (minutes) => {
    const late = Number(minutes || 0)

    if (late <= 0) {
      return (
        <span className={`${badgeBase} bg-[#00B8A9]/10 text-[#00B8A9]`}>
          ตรงเวลา
        </span>
      )
    }

    return (
      <span className={`${badgeBase} min-w-[115px] bg-red-400/10 text-red-300`}>
        สาย {late} นาที
      </span>
    )
  }

  const getEarlyBadge = (minutes) => {
    const early = Number(minutes || 0)

    if (early <= 0) {
      return (
        <span className={`${badgeBase} bg-[#00B8A9]/10 text-[#00B8A9]`}>
          ตรงเวลา
        </span>
      )
    }

    return (
      <span
        className={`${badgeBase} min-w-[125px] bg-orange-400/10 text-orange-300`}
      >
        ออกก่อน {early} นาที
      </span>
    )
  }

  const shortNote = (note) => {
    if (!note) return '-'
    return note.length > 24 ? `${note.slice(0, 24)}...` : note
  }

  return (
    <div className="min-h-dvh w-full p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FFB347]">
            Admin Panel
          </p>

          <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold text-white">
            <Clock className="text-[#00B8A9]" size={30} />
            Work Time Records
          </h1>

          <p className="mt-2 text-white/45">
            ตรวจสอบประวัติการเข้างาน ออกงาน สาย ออกก่อนเวลา และหมายเหตุ
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#11152E]/90 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/10 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex w-full items-center rounded-2xl bg-white/[0.04] p-2 lg:w-auto">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-white/60 hover:bg-white/[0.06] hover:text-white"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex flex-1 items-center justify-center gap-2 px-4 text-white lg:w-52">
                  <Calendar className="text-[#FFB347]" size={18} />
                  <span className="whitespace-nowrap font-semibold">
                    {format(selectedMonth, 'MMMM yyyy')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={nextMonth}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-white/60 hover:bg-white/[0.06] hover:text-white"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <Store className="shrink-0 text-[#00B8A9]" size={18} />

                <select
                  value={selectedBranch}
                  onChange={(e) => {
                    setSelectedBranch(e.target.value)
                    setPage(1)
                  }}
                  className="w-full bg-transparent text-sm font-medium text-white outline-none lg:w-56"
                >
                  <option className="bg-[#11152E]" value="all">
                    All Branches
                  </option>

                  {branches.map((branch) => (
                    <option
                      className="bg-[#11152E]"
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.name || branch.branchName || `Branch ${branch.id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#00B8A9]" />
            </div>
          ) : error ? (
            <div className="p-10 text-center text-red-300">{error}</div>
          ) : records.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-xl font-semibold text-white">
                No time records found
              </p>
              <p className="mt-2 text-white/40">
                ไม่พบข้อมูลตามเดือนหรือสาขาที่เลือก
              </p>
            </div>
          ) : (
            <div className="max-h-[70vh] w-full overflow-auto">
              <table className="min-w-[1400px] w-full">
                <thead className="sticky top-0 z-10 bg-[#11152E]">
                  <tr className="border-b border-white/10 text-left">
                    {[
                      'Employee',
                      'Date',
                      'Check In',
                      'Late',
                      'Check Out',
                      'Early Out',
                      'Duration',
                      'Check-in Note',
                      'Check-out Note',
                    ].map((head) => (
                      <th
                        key={head}
                        className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/40"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {records.map((record, index) => {
                    const employeeId = record.normalizedEmployeeId
                    const employeeName = getEmployeeName(employeeId)

                    const uniqueKey = `${employeeId || 'unknown'}-${record.date}-${record.checkIn}-${record.checkOut}-${index}`

                    return (
                      <tr
                        key={uniqueKey}
                        className="border-b border-white/5 transition hover:bg-white/[0.03]"
                      >
                        <td className="whitespace-nowrap px-6 py-4 font-semibold text-white">
                          {employeeName}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-white/60">
                          {record.date
                            ? format(new Date(record.date), 'MMM dd, yyyy')
                            : 'N/A'}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`${timeBadgeBase} bg-[#00B8A9]/10 text-[#00B8A9]`}
                          >
                            {formatTime(record.checkIn)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          {getLateBadge(record.lateMinutes)}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`${timeBadgeBase} bg-[#FFB347]/10 text-[#FFB347]`}
                          >
                            {formatTime(record.checkOut)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          {getEarlyBadge(record.earlyLeaveMinutes)}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 font-bold text-white">
                          {calculateDuration(record.checkIn, record.checkOut)}
                        </td>

                        <td className="px-6 py-4">
                          {record.checkInNote ? (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedNote({
                                  title: 'Check-in Note',
                                  content: record.checkInNote,
                                })
                              }
                              className="block max-w-[190px] truncate rounded-xl bg-white/[0.04] px-3 py-2 text-left text-sm text-white/60 hover:bg-white/[0.08] hover:text-white"
                            >
                              {shortNote(record.checkInNote)}
                            </button>
                          ) : (
                            <span className="text-white/30">-</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {record.checkOutNote ? (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedNote({
                                  title: 'Check-out Note',
                                  content: record.checkOutNote,
                                })
                              }
                              className="block max-w-[190px] truncate rounded-xl bg-white/[0.04] px-3 py-2 text-left text-sm text-white/60 hover:bg-white/[0.08] hover:text-white"
                            >
                              {shortNote(record.checkOutNote)}
                            </button>
                          ) : (
                            <span className="text-white/30">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {pagination && (
            <div className="flex items-center justify-between border-t border-white/10 p-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="rounded-xl bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <p className="text-sm text-white/50">
                Page {pagination.page} / {pagination.totalPages || 1}
              </p>

              <button
                type="button"
                disabled={page >= (pagination.totalPages || 1)}
                onClick={() => setPage((prev) => prev + 1)}
                className="rounded-xl bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedNote && (
        <div
          onClick={() => setSelectedNote(null)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#11152E] p-6 shadow-2xl"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#FFB347]">
              {selectedNote.title}
            </p>

            <p className="mt-4 max-h-[50vh] overflow-y-auto whitespace-pre-wrap leading-relaxed text-white/80">
              {selectedNote.content}
            </p>

            <button
              type="button"
              onClick={() => setSelectedNote(null)}
              className="mt-6 h-12 w-full rounded-2xl bg-[#FFB347] font-bold text-[#1B1F3B]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkTimeRecordPage