import React, { useEffect, useMemo, useState } from 'react'
import { User, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import axios from 'axios'
import useAuthStore from '../store/auth-store'
import API_URL from '../utils/api'
import { createPortal } from 'react-dom'
function Dashboard() {
  const [employees, setEmployees] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [dashboardMonth] = useState(new Date())
  const [filter, setFilter] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    if (token) {
      fetchDashboardData()
      fetchBranches()
    }
  }, [token])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const year = dashboardMonth.getFullYear()
      const month = dashboardMonth.getMonth() + 1

      const response = await axios.get(
        `${API_URL}/admin/dashboard?year=${year}&month=${month}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setEmployees(response.data || [])
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/branches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setBranches(response.data.data || response.data.result || [])
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(Number(amount || 0))
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('th-TH')
  }

  const formatTime = (date) => {
    if (!date) return '-'

    return new Date(date).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-'

    const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime()

    if (diffMs <= 0) return '-'

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}h ${minutes}m`
  }

  const getMonthName = (date) => {
    return date.toLocaleString('th-TH', {
      month: 'long',
      year: 'numeric',
    })
  }

  const getEmployeeStats = (employee) => {
    const attendanceLogs = employee.attendanceLogs || []
    const timeLogs = employee.timetracking || []
    const dayOffs = employee.dayOff || employee.dayOffsTaken || []
    const advanceLogs = employee.advanceSalary || []

    const workingDays = attendanceLogs.length
      ? attendanceLogs.filter((log) => log.status === 'PRESENT').length
      : timeLogs.length

    const lateDays = attendanceLogs.length
      ? attendanceLogs.filter((log) => Number(log.lateMinutes || 0) > 0).length
      : timeLogs.filter((log) => Number(log.lateMinutes || 0) > 0).length

    const earlyDays = attendanceLogs.length
      ? attendanceLogs.filter((log) => Number(log.earlyLeaveMinutes || 0) > 0).length
      : timeLogs.filter((log) => Number(log.earlyLeaveMinutes || 0) > 0).length

    const approvedDayOffs = dayOffs.filter(
      (item) => item.status === 'APPROVED'
    ).length

    return {
      attendanceLogs,
      timeLogs,
      dayOffs,
      advanceLogs,
      workingDays,
      lateDays,
      earlyDays,
      approvedDayOffs,
      absentDays: Number(employee.absentDays || 0),
    }
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const keyword = filter.toLowerCase()

      const matchesSearch =
        employee.firstname?.toLowerCase().includes(keyword) ||
        employee.lastname?.toLowerCase().includes(keyword) ||
        employee.email?.toLowerCase().includes(keyword)

      const employeeBranchId =
        employee.branchId || employee.branch?.id || employee.branch?.branchId

      const matchesBranch =
        selectedBranch === 'all' ||
        String(employeeBranchId) === String(selectedBranch)

      return matchesSearch && matchesBranch
    })
  }, [employees, filter, selectedBranch])

  return (
    <div className="min-h-dvh w-full p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FFB347]">
              Admin Dashboard
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white">
              Employee Dashboard
            </h1>

            <p className="mt-2 text-white/45">
              สรุปเดือนปัจจุบัน หากต้องการดูเดือนอื่นให้กดเข้าไปในพนักงาน
            </p>
          </div>

          <div className="rounded-2xl bg-[#11152E]/90 px-5 py-4 font-semibold text-white">
            {getMonthName(dashboardMonth)}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#11152E]/90 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/10 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                  size={18}
                />

                <input
                  type="text"
                  placeholder="Search employees..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-white outline-none placeholder:text-white/30"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white outline-none"
                >
                  <option className="bg-[#11152E]" value="all">
                    All Branches
                  </option>

                  {branches.map((branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                      className="bg-[#11152E]"
                    >
                      {branch.name}
                    </option>
                  ))}
                </select>

                <div className="flex h-12 items-center gap-2 rounded-2xl border border-[#00B8A9]/20 bg-[#00B8A9]/10 px-4 text-sm font-semibold text-[#00B8A9]">
                  <User size={16} />
                  <span>{filteredEmployees.length} Employees</span>
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-auto">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#00B8A9]" />
              </div>
            ) : (
              <table className="min-w-[1250px] w-full">
                <thead className="sticky top-0 z-10 bg-[#11152E]">
                  <tr className="border-b border-white/10 text-left">
                    {[
                      'Employee',
                      'Position',
                      'Work',
                      'Absent',
                      'Late',
                      'Early',
                      'Day Off',
                      'Advance',
                      'Final Salary',
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
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => {
                      const stats = getEmployeeStats(employee)

                      return (
                        <tr
                          key={employee.id}
                          onClick={() => setSelectedEmployee(employee)}
                          className="cursor-pointer border-b border-white/5 transition hover:bg-white/[0.04]"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              {employee.profileImage ? (
                                <img
                                  className="h-11 w-11 rounded-2xl object-cover"
                                  src={employee.profileImage}
                                  alt=""
                                />
                              ) : (
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-white/40">
                                  <User size={20} />
                                </div>
                              )}

                              <div>
                                <div className="font-semibold text-white">
                                  {employee.firstname} {employee.lastname}
                                </div>
                                <div className="text-sm text-white/40">
                                  {employee.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-white/70">
                            {employee.position?.name || '-'}
                          </td>

                          <td className="px-6 py-4 font-bold text-[#00B8A9]">
                            {stats.workingDays} วัน
                          </td>

                          <td className="px-6 py-4 font-bold text-red-300">
                            {stats.absentDays} วัน
                          </td>

                          <td className="px-6 py-4 text-red-300">
                            {stats.lateDays} วัน
                          </td>

                          <td className="px-6 py-4 text-orange-300">
                            {stats.earlyDays} วัน
                          </td>

                          <td className="px-6 py-4 text-white/70">
                            {stats.approvedDayOffs} วัน
                          </td>

                          <td className="px-6 py-4 font-semibold text-[#FFB347]">
                            {formatCurrency(employee.advanceTaken || 0)}
                          </td>

                          <td className="px-6 py-4 font-bold text-white">
                            {formatCurrency(employee.finalSalary || 0)}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-white/40">
                        No employees found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {selectedEmployee &&
        createPortal(
          <EmployeeModal
            employee={selectedEmployee}
            token={token}
            onClose={() => setSelectedEmployee(null)}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            formatTime={formatTime}
            calculateDuration={calculateDuration}
            getMonthName={getMonthName}
            getEmployeeStats={getEmployeeStats}
          />,
          document.body
        )}
    </div>
  )
}

function EmployeeModal({
  employee,
  token,
  onClose,
  formatCurrency,
  formatDate,
  formatTime,
  calculateDuration,
  getMonthName,
  getEmployeeStats,
}) {
  const [modalMonth, setModalMonth] = useState(new Date())
  const [activeTab, setActiveTab] = useState('check')
  const [detail, setDetail] = useState(employee)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    fetchEmployeeMonthDetail()
  }, [modalMonth])

  const fetchEmployeeMonthDetail = async () => {
    try {
      setLoadingDetail(true)

      const year = modalMonth.getFullYear()
      const month = modalMonth.getMonth() + 1

      const response = await axios.get(
        `${API_URL}/admin/dashboard?year=${year}&month=${month}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const found = (response.data || []).find(
        (item) => String(item.id) === String(employee.id)
      )

      if (found) {
        setDetail(found)
      }
    } catch (error) {
      console.error('Error fetching employee month detail:', error)
    } finally {
      setLoadingDetail(false)
    }
  }

  const changeModalMonth = (increment) => {
    const newDate = new Date(modalMonth)
    newDate.setMonth(newDate.getMonth() + increment)
    setModalMonth(newDate)
  }

  const stats = getEmployeeStats(detail)

  const attendanceLogs = stats.attendanceLogs || []
  const dayOffs = stats.dayOffs || []
  const advanceLogs = stats.advanceLogs || []

  const baseSalary = Number(detail.baseSalary || 0)
  const advanceTaken = Number(detail.advanceTaken || 0)
  const finalSalary = Number(detail.finalSalary || baseSalary - advanceTaken)

  const tabs = [
    { key: 'check', label: 'Attendance' },
    { key: 'dayoff', label: 'Day Off' },
    { key: 'salary', label: 'Salary' },
  ]

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#11152E] p-5 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {detail.profileImage ? (
              <img
                src={detail.profileImage}
                alt=""
                className="h-14 w-14 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-white/40">
                <User size={24} />
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FFB347]">
                Employee Detail
              </p>

              <h2 className="mt-1 text-2xl font-bold text-white">
                {detail.firstname} {detail.lastname}
              </h2>

              <p className="text-sm text-white/45">
                {detail.position?.name || 'No position'} ·{' '}
                {detail.branch?.name || 'No branch'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-white/[0.06] p-3 text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-5 flex items-center justify-center gap-4 rounded-2xl bg-white/[0.03] p-3">
          <button
            onClick={() => changeModalMonth(-1)}
            className="rounded-xl bg-white/[0.06] p-3 text-white/60 hover:text-white"
          >
            <ChevronLeft size={18} />
          </button>

          <p className="min-w-[180px] text-center font-bold text-white">
            {getMonthName(modalMonth)}
          </p>

          <button
            onClick={() => changeModalMonth(1)}
            className="rounded-xl bg-white/[0.06] p-3 text-white/60 hover:text-white"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm leading-7 text-white/80">
            <span className="text-white/40">Base Salary:</span>{' '}
            <b>{formatCurrency(baseSalary)}</b>{' '}
            <span className="text-white/30">|</span>{' '}
            <span className="text-white/40">Advance:</span>{' '}
            <b className="text-[#FFB347]">{formatCurrency(advanceTaken)}</b>{' '}
            <span className="text-white/30">|</span>{' '}
            <span className="text-white/40">Final:</span>{' '}
            <b className="text-[#00B8A9]">{formatCurrency(finalSalary)}</b>
          </p>

          <p className="mt-1 text-sm leading-7 text-white/70">
            <span className="font-semibold text-[#00B8A9]">
              ทำงาน {stats.workingDays} วัน
            </span>
            {' · '}
            <span className="font-semibold text-red-300">
              ขาด {stats.absentDays} วัน
            </span>
            {' · '}
            <span className="font-semibold text-white/70">
              ลา {stats.approvedDayOffs} วัน
            </span>
            {' · '}
            <span className="font-semibold text-red-300">
              สาย {stats.lateDays} วัน
            </span>
            {' · '}
            <span className="font-semibold text-orange-300">
              ออกก่อน {stats.earlyDays} วัน
            </span>
          </p>
        </div>

        <div className="mt-5 flex overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`min-w-[130px] flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${
                activeTab === tab.key
                  ? 'bg-[#FFB347] text-[#1B1F3B]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-5 max-h-[360px] overflow-auto rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          {loadingDetail ? (
            <p className="py-8 text-center text-white/40">Loading...</p>
          ) : activeTab === 'check' ? (
            <AttendanceLogs
              logs={attendanceLogs}
              formatDate={formatDate}
              formatTime={formatTime}
              calculateDuration={calculateDuration}
            />
          ) : activeTab === 'dayoff' ? (
            <DayOffLogs logs={dayOffs} formatDate={formatDate} />
          ) : (
            <SalaryLogs
              logs={advanceLogs}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function AttendanceLogs({ logs, formatDate, formatTime, calculateDuration }) {
  if (!logs.length) return <EmptyLog text="No attendance logs" />

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-[#00B8A9]/10 text-[#00B8A9]'
      case 'ABSENT':
        return 'bg-red-400/10 text-red-300'
      case 'DAY_OFF':
        return 'bg-sky-400/10 text-sky-300'
      case 'HOLIDAY':
        return 'bg-[#FFB347]/10 text-[#FFB347]'
      default:
        return 'bg-white/[0.06] text-white/60'
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1080px] w-full">
        <thead>
          <tr className="border-b border-white/10 text-left">
            {[
              'Date',
              'Status',
              'Check In',
              'Late',
              'Check Out',
              'Early Out',
              'Duration',
              'Note',
            ].map((head) => (
              <th
                key={head}
                className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/35"
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {logs.map((log, index) => (
            <tr
              key={`${log.date}-${index}`}
              className="border-b border-white/5 transition hover:bg-white/[0.03]"
            >
              <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-white">
                {formatDate(log.date || log.checkIn)}
              </td>

              <td className="whitespace-nowrap px-4 py-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(
                    log.status
                  )}`}
                >
                  {log.status}
                </span>
              </td>

              <td className="whitespace-nowrap px-4 py-3">
                {log.status === 'PRESENT' ? (
                  <span className="rounded-full bg-[#00B8A9]/10 px-3 py-1 text-sm font-bold text-[#00B8A9]">
                    {formatTime(log.checkIn)}
                  </span>
                ) : (
                  <span className="text-white/30">-</span>
                )}
              </td>

              <td className="whitespace-nowrap px-4 py-3">
                {log.status === 'PRESENT' ? (
                  Number(log.lateMinutes || 0) > 0 ? (
                    <span className="rounded-full bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300">
                      สาย {log.lateMinutes} นาที
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#00B8A9]/10 px-3 py-1 text-xs font-bold text-[#00B8A9]">
                      ตรงเวลา
                    </span>
                  )
                ) : (
                  <span className="text-white/30">-</span>
                )}
              </td>

              <td className="whitespace-nowrap px-4 py-3">
                {log.status === 'PRESENT' ? (
                  <span className="rounded-full bg-[#FFB347]/10 px-3 py-1 text-sm font-bold text-[#FFB347]">
                    {formatTime(log.checkOut)}
                  </span>
                ) : (
                  <span className="text-white/30">-</span>
                )}
              </td>

              <td className="whitespace-nowrap px-4 py-3">
                {log.status === 'PRESENT' ? (
                  Number(log.earlyLeaveMinutes || 0) > 0 ? (
                    <span className="rounded-full bg-orange-400/10 px-3 py-1 text-xs font-bold text-orange-300">
                      ออกก่อน {log.earlyLeaveMinutes} นาที
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#00B8A9]/10 px-3 py-1 text-xs font-bold text-[#00B8A9]">
                      ตรงเวลา
                    </span>
                  )
                ) : (
                  <span className="text-white/30">-</span>
                )}
              </td>

              <td className="whitespace-nowrap px-4 py-3 font-bold text-white">
                {log.status === 'PRESENT'
                  ? calculateDuration(log.checkIn, log.checkOut)
                  : '-'}
              </td>

              <td className="px-4 py-3">
                <p className="max-w-[180px] truncate text-sm text-white/55">
                  {log.checkInNote ||
                    log.checkOutNote ||
                    log.reason ||
                    (log.status === 'HOLIDAY' ? 'Store holiday' : '-')}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DayOffLogs({ logs, formatDate }) {
  if (!logs.length) return <EmptyLog text="No day off logs" />

  const getStatusStyle = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-[#00B8A9]/10 text-[#00B8A9]'
      case 'REJECTED':
        return 'bg-red-400/10 text-red-300'
      case 'CANCELED':
        return 'bg-orange-400/10 text-orange-300'
      default:
        return 'bg-white/[0.06] text-white/60'
    }
  }

  return [...logs]
    .sort(
      (a, b) =>
        new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    )
    .map((dayOff, index) => (
      <div
        key={dayOff.id || index}
        className="border-b border-white/5 py-3 text-sm text-white/70"
      >
        <p className="font-bold text-white">
          {formatDate(dayOff.date || dayOff)}
        </p>

        <p className="mt-1">{dayOff.reason || 'No reason'}</p>

        <div className="mt-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(
              dayOff.status
            )}`}
          >
            {dayOff.status || 'PENDING'}
          </span>
        </div>
      </div>
    ))
}

function SalaryLogs({ logs, formatDate, formatCurrency }) {
  if (!logs.length) return <EmptyLog text="No salary logs" />

  const getStatusStyle = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-[#00B8A9]/10 text-[#00B8A9]'
      case 'REJECTED':
        return 'bg-red-400/10 text-red-300'
      case 'CANCELED':
        return 'bg-orange-400/10 text-orange-300'
      default:
        return 'bg-white/[0.06] text-white/60'
    }
  }

  return [...logs]
    .sort(
      (a, b) =>
        new Date(b.requestDate || b.createdAt) -
        new Date(a.requestDate || a.createdAt)
    )
    .map((advance) => (
      <div
        key={advance.id}
        className="border-b border-white/5 py-3 text-sm text-white/70"
      >
        <p className="font-bold text-[#FFB347]">
          {formatCurrency(advance.amount)}
        </p>

        <p className="mt-1">{formatDate(advance.requestDate)}</p>

        <div className="mt-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(
              advance.status
            )}`}
          >
            {advance.status}
          </span>
        </div>
      </div>
    ))
}

function EmptyLog({ text }) {
  return (
    <p className="py-8 text-center text-sm text-white/35">
      {text}
    </p>
  )
}

export default Dashboard