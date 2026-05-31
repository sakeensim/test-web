import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import API_URL from '../utils/api'
import useAuthStore from '../store/auth-store'
import { Trash2, Plus, CalendarDays, Search, Info } from 'lucide-react'
import { createAlert } from '../utils/createAlert'

function HolidayPage() {
  const token = useAuthStore((state) => state.token)

  const [holidays, setHolidays] = useState([])
  const [branches, setBranches] = useState([])
  const [selectedRange, setSelectedRange] = useState()
  const [selectedBranchIds, setSelectedBranchIds] = useState([])
  const [filterBranchId, setFilterBranchId] = useState('all')
  const [title, setTitle] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (token) {
      fetchBranches()
      fetchHolidays()
    }
  }, [token])

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setBranches(res.data.data || res.data.result || [])
    } catch (error) {
      console.log(error)
      createAlert('error', 'โหลดข้อมูลสาขาไม่สำเร็จ')
    }
  }

  const fetchHolidays = async (branchId = filterBranchId) => {
    try {
      setFetching(true)

      let url = `${API_URL}/admin/holidays`

      if (branchId && branchId !== 'all') {
        url += `?branchId=${branchId}`
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setHolidays(res.data.data || [])
    } catch (error) {
      console.log(error)
      createAlert('error', 'โหลดวันหยุดไม่สำเร็จ')
    } finally {
      setFetching(false)
    }
  }

  const getDatesInRange = (range) => {
    if (!range?.from) return []

    const from = new Date(range.from)
    const to = new Date(range.to || range.from)

    from.setHours(0, 0, 0, 0)
    to.setHours(0, 0, 0, 0)

    const dates = []
    const current = new Date(from)

    while (current <= to) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return dates
  }

  const toggleBranch = (branchId) => {
    setSelectedBranchIds((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    )
  }

  const selectAllBranches = () => {
    setSelectedBranchIds(branches.map((branch) => branch.id))
  }

  const clearBranches = () => {
    setSelectedBranchIds([])
  }

  const createHoliday = async (e) => {
    e.preventDefault()

    const dates = getDatesInRange(selectedRange)

    if (dates.length === 0) {
      createAlert('error', 'กรุณาเลือกวันที่')
      return
    }

    if (selectedBranchIds.length === 0) {
      createAlert('error', 'กรุณาเลือกสาขา')
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const hasPastDate = dates.some((date) => {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      return d < today
    })

    if (hasPastDate) {
      createAlert('error', 'ไม่สามารถเลือกวันที่ผ่านมาแล้วได้')
      return
    }

    try {
      setLoading(true)

      for (const branchId of selectedBranchIds) {
        for (const date of dates) {
          await axios.post(
            `${API_URL}/admin/holiday`,
            {
              date,
              title,
              branchId,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
        }
      }

      setSelectedRange(undefined)
      setSelectedBranchIds([])
      setTitle('')
      createAlert('success', 'เพิ่มวันหยุดสำเร็จ')
      fetchHolidays()
    } catch (error) {
      console.log(error)
      createAlert(
        'error',
        error.response?.data?.message || 'เพิ่มวันหยุดไม่สำเร็จ'
      )
    } finally {
      setLoading(false)
    }
  }

  const deleteHoliday = async (id) => {
    try {
      await axios.delete(`${API_URL}/admin/holiday/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      createAlert('success', 'ลบวันหยุดสำเร็จ')
      fetchHolidays()
    } catch (error) {
      console.log(error)
      createAlert('error', 'ลบวันหยุดไม่สำเร็จ')
    }
  }

  const holidayDates = useMemo(() => {
    return holidays.map((holiday) => new Date(holiday.date))
  }, [holidays])

  const filteredHolidays = useMemo(() => {
    return holidays
      .filter((holiday) => {
        const keyword = search.toLowerCase()

        const titleMatch = (holiday.title || 'No title')
          .toLowerCase()
          .includes(keyword)

        const branchMatch = (holiday.branch?.name || '')
          .toLowerCase()
          .includes(keyword)

        return titleMatch || branchMatch
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [holidays, search])

  const upcomingHolidays = holidays.filter((holiday) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const date = new Date(holiday.date)
    date.setHours(0, 0, 0, 0)

    return date >= today
  }).length

  const selectedDateText = useMemo(() => {
    if (!selectedRange?.from) return 'ยังไม่ได้เลือกวัน'

    const from = selectedRange.from.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

    if (!selectedRange.to) return from

    const to = selectedRange.to.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

    return `${from} - ${to}`
  }, [selectedRange])

  return (
    <div className="min-h-dvh w-full p-4 sm:p-6">
      <style>
  {`
    .workpal-calendar {
      --rdp-accent-color: #8B7355;
      --rdp-selected-color: #F5E7D4;
      width: 100%;
    }

    .workpal-calendar .rdp-months {
      justify-content: center;
    }

    .workpal-calendar .rdp-month {
      width: 100%;
    }

    .workpal-calendar .rdp-caption_label,
    .workpal-calendar .rdp-month_caption {
      color: #F8FAFC;
      font-weight: 900;
      font-size: 18px;
    }

    .workpal-calendar .rdp-nav button,
    .workpal-calendar .rdp-button_previous,
    .workpal-calendar .rdp-button_next {
      color: #F6B546 !important;
    }

    .workpal-calendar .rdp-chevron {
      fill: #F6B546 !important;
    }

    .workpal-calendar .rdp-weekday {
      color: rgba(248,250,252,0.45);
      font-weight: 800;
      font-size: 13px;
    }

    .workpal-calendar .rdp-day {
      background: transparent !important;
    }

    .workpal-calendar .rdp-day_button {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      color: rgba(248,250,252,0.82);
      font-weight: 800;
      border: 1px solid transparent;
      transition: 160ms ease;
      background: transparent !important;
    }

    .workpal-calendar .rdp-day_button:hover {
      background: rgba(139,115,85,0.18) !important;
      border-color: rgba(246,181,70,0.25);
      color: #F5E7D4 !important;
    }

    .workpal-calendar .rdp-disabled .rdp-day_button {
      color: rgba(248,250,252,0.16) !important;
      background: transparent !important;
      opacity: 1;
    }

    .workpal-calendar .rdp-today .rdp-day_button {
      border-color: rgba(246,181,70,0.55);
      color: #F6B546 !important;
    }

    .workpal-calendar .rdp-range_middle,
    .workpal-calendar .rdp-day_range_middle {
      background: rgba(122,104,82,0.24) !important;
    }

    .workpal-calendar .rdp-range_middle .rdp-day_button,
    .workpal-calendar .rdp-day_range_middle .rdp-day_button {
      background: rgba(122,104,82,0.24) !important;
      color: #D6C7B2 !important;
      border-radius: 8px !important;
      box-shadow: none !important;
    }

    .workpal-calendar .rdp-selected,
    .workpal-calendar .rdp-range_start,
    .workpal-calendar .rdp-range_end,
    .workpal-calendar .rdp-day_selected,
    .workpal-calendar .rdp-day_range_start,
    .workpal-calendar .rdp-day_range_end {
      background: transparent !important;
    }

    .workpal-calendar .rdp-selected .rdp-day_button,
    .workpal-calendar .rdp-range_start .rdp-day_button,
    .workpal-calendar .rdp-range_end .rdp-day_button,
    .workpal-calendar .rdp-day_selected .rdp-day_button,
    .workpal-calendar .rdp-day_range_start .rdp-day_button,
    .workpal-calendar .rdp-day_range_end .rdp-day_button {
      background: #7A6852 !important;
      color: #F5E7D4 !important;
      font-weight: 900 !important;
      border-color: rgba(246,181,70,0.45) !important;
      box-shadow: 0 0 0 4px rgba(122,104,82,0.2);
    }

    .workpal-calendar .holiday-day .rdp-day_button {
      color: #34D399 !important;
    }
  `}
</style>

      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#F6B546]">
              Admin
            </p>

            <h1 className="mt-2 text-4xl font-black text-white">
              Store Holidays
            </h1>

            <p className="mt-2 text-white/45">
              จัดการวันหยุดแยกตามสาขา เลือกได้หลายสาขาและหลายวัน
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard title="Total" value={holidays.length} />
            <StatCard title="Upcoming" value={upcomingHolidays} active />
          </div>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[380px_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[#111827]/95 shadow-2xl">
            <div className="border-b border-white/10 p-5">
              <h2 className="text-2xl font-black text-white">Holiday List</h2>

              <p className="mt-1 text-sm text-white/40">
                รายการวันหยุดทั้งหมด
              </p>

              <div className="mt-4 grid gap-3">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                  />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search holiday / branch..."
                    className="h-12 w-full rounded-2xl border border-white/10 bg-[#1E293B]/70 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/30"
                  />
                </div>

                <select
                  value={filterBranchId}
                  onChange={(e) => {
                    setFilterBranchId(e.target.value)
                    fetchHolidays(e.target.value)
                  }}
                  className="h-12 rounded-2xl border border-white/10 bg-[#1E293B]/70 px-4 text-sm font-semibold text-white outline-none"
                >
                  <option className="bg-[#111827]" value="all">
                    All Branches
                  </option>

                  {branches.map((branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                      className="bg-[#111827]"
                    >
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="max-h-[620px] overflow-y-auto p-4">
              {fetching ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/10 border-t-[#34D399]" />
                </div>
              ) : filteredHolidays.length > 0 ? (
                <div className="space-y-3">
                  {filteredHolidays.map((holiday) => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)

                    const holidayDate = new Date(holiday.date)
                    holidayDate.setHours(0, 0, 0, 0)

                    const isPast = holidayDate < today

                    return (
                      <div
                        key={holiday.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-[#1E293B]/70 p-4 transition hover:border-[#F6B546]/30"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                isPast ? 'bg-white/30' : 'bg-[#34D399]'
                              }`}
                            />

                            <p className="truncate text-sm font-bold text-white">
                              {new Date(holiday.date).toLocaleDateString(
                                'th-TH',
                                {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )}
                            </p>
                          </div>

                          <p className="mt-1 truncate text-xs text-white/45">
                            {holiday.title || 'No title'}
                          </p>

                          <p className="mt-2 truncate text-xs font-bold text-[#F6B546]">
                            {holiday.branch?.name || 'No branch'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteHoliday(holiday.id)}
                          className="shrink-0 rounded-xl bg-red-400/10 p-3 text-red-300 transition hover:bg-red-400/20"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="py-16 text-center text-sm text-white/35">
                  No holidays found
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#111827]/95 p-5 shadow-2xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F6B546]/15 text-[#F6B546]">
                <CalendarDays size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  Holiday Setup
                </h2>

                <p className="text-sm text-white/40">
                  เลือกช่วงวันและสาขาที่ต้องการเพิ่มวันหยุด
                </p>
              </div>
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-[380px_1fr]">
              <div className="rounded-[1.5rem] border border-white/10 bg-[#1E293B]/70 p-4 text-white">
                <DayPicker
                  mode="range"
                  selected={selectedRange}
                  onSelect={setSelectedRange}
                  disabled={{ before: new Date() }}
                  modifiers={{
                    holiday: holidayDates,
                  }}
                  modifiersClassNames={{
                    holiday: 'holiday-day',
                  }}
                  className="workpal-calendar"
                />
              </div>

              <form
                onSubmit={createHoliday}
                className="rounded-[1.5rem] border border-white/10 bg-[#1E293B]/50 p-5"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F6B546]">
                      WorkPal
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-white">
                      Add Holiday
                    </h2>

                    <p className="mt-1 text-sm text-white/40">
                      เพิ่มวันหยุดหลายสาขา
                    </p>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F6B546]/15 text-[#F6B546]">
                    <CalendarDays size={26} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs text-white/40">
                      Selected Date Range
                    </p>

                    <div className="flex min-h-12 items-center rounded-2xl border border-white/10 bg-[#111827]/70 px-4 py-3 font-semibold text-white">
                      {selectedDateText}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs text-white/40">Branches</p>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={selectAllBranches}
                          className="text-xs font-semibold text-[#34D399]"
                        >
                          Select all
                        </button>

                        <button
                          type="button"
                          onClick={clearBranches}
                          className="text-xs font-semibold text-red-300"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[170px] space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-[#111827]/70 p-3">
                      {branches.length > 0 ? (
                        branches.map((branch) => (
                          <label
                            key={branch.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                              selectedBranchIds.includes(branch.id)
                                ? 'border-[#34D399]/40 bg-[#34D399]/10'
                                : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.05]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedBranchIds.includes(branch.id)}
                              onChange={() => toggleBranch(branch.id)}
                              className="h-4 w-4 accent-[#F6B546]"
                            />

                            <span className="text-sm font-semibold text-white/80">
                              {branch.name}
                            </span>
                          </label>
                        ))
                      ) : (
                        <p className="py-4 text-center text-sm text-white/35">
                          No branches found
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs text-white/40">
                      Holiday Name
                    </p>

                    <input
                      type="text"
                      placeholder="เช่น วันรายอ / ร้านปิดปรับปรุง"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#111827]/70 px-4 text-white outline-none placeholder:text-white/30"
                    />
                  </div>


                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#F6B546] font-bold text-[#111827] shadow-[0_0_30px_rgba(246,181,70,0.25)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus size={18} />
                    {loading ? 'Adding...' : 'Add Holiday'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, active }) {
  return (
    <div
      className={`rounded-2xl border px-5 py-4 ${
        active
          ? 'border-[#34D399]/20 bg-[#34D399]/10'
          : 'border-white/10 bg-[#111827]/95'
      }`}
    >
      <p className="text-xs text-white/40">{title}</p>

      <p
        className={`mt-1 text-2xl font-bold ${
          active ? 'text-[#34D399]' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

export default HolidayPage