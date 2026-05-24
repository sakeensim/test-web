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
  const [selected, setSelected] = useState()
  const [title, setTitle] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (token) fetchHolidays()
  }, [token])

  const fetchHolidays = async () => {
    try {
      setFetching(true)

      const res = await axios.get(`${API_URL}/admin/holidays`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setHolidays(res.data.data || [])
    } catch (error) {
      console.log(error)
      createAlert('error', 'โหลดวันหยุดไม่สำเร็จ')
    } finally {
      setFetching(false)
    }
  }

  const createHoliday = async (e) => {
    e.preventDefault()

    if (!selected) {
        createAlert('error', 'กรุณาเลือกวันที่')
        return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const selectedDate = new Date(selected)
    selectedDate.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
        createAlert('error', 'ไม่สามารถเลือกวันที่ผ่านมาแล้วได้')
        return
    }

    try {
        setLoading(true)

        await axios.post(
        `${API_URL}/admin/holiday`,
        {
            date: selected,
            title,
        },
        {
            headers: {
            Authorization: `Bearer ${token}`,
            },
        }
        )

        setSelected(undefined)
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      .filter((holiday) =>
        (holiday.title || 'No title')
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [holidays, search])

  const upcomingHolidays = holidays.filter(
    (holiday) => new Date(holiday.date) >= new Date()
  ).length

  const selectedDateText = selected
    ? selected.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'ยังไม่ได้เลือกวัน'

  return (
    <div className="min-h-screen w-full p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FFB347]">
              Admin
            </p>

            <h1 className="mt-2 text-4xl font-black text-white">
              Store Holidays
            </h1>

            <p className="mt-2 text-white/45">
              จัดการวันหยุดร้าน เพื่อไม่ให้นับเป็นวันขาดงาน
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard title="Total" value={holidays.length} />
            <StatCard title="Upcoming" value={upcomingHolidays} active />
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="rounded-[2rem] border border-white/10 bg-[#11152E]/90 p-5 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFB347]/15 text-[#FFB347]">
                <CalendarDays size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  Holiday Calendar
                </h2>
                <p className="text-sm text-white/40">
                  เลือกวันที่บนปฏิทินเพื่อเพิ่มวันหยุดร้าน
                </p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
              <div className="rounded-[1.5rem] border border-white/10 bg-[#1B1F3B]/80 p-3 text-white">
                <DayPicker
                  mode="single"
                  selected={selected}
                  onSelect={setSelected}
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

              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03]">
                <div className="border-b border-white/10 p-4">
                  <h2 className="text-lg font-bold text-white">
                    Holiday List
                  </h2>
                  <p className="text-xs text-white/40">
                    รายการวันหยุดร้านทั้งหมด
                  </p>

                  <div className="relative mt-3">
                    <Search
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search holiday..."
                      className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/30"
                    />
                  </div>
                </div>

                <div className="max-h-[360px] overflow-y-auto p-3">
                  {fetching ? (
                    <div className="flex h-32 items-center justify-center">
                      <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/10 border-t-[#00B8A9]" />
                    </div>
                  ) : filteredHolidays.length > 0 ? (
                    <div className="space-y-2">
                      {filteredHolidays.map((holiday) => {
                        const isPast = new Date(holiday.date) < new Date()

                        return (
                          <div
                            key={holiday.id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.04] p-3 transition hover:bg-white/[0.06]"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-2.5 w-2.5 rounded-full ${
                                    isPast ? 'bg-white/30' : 'bg-[#00B8A9]'
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
                            </div>

                            <button
                              type="button"
                              onClick={() => deleteHoliday(holiday.id)}
                              className="shrink-0 rounded-xl bg-red-400/10 p-2.5 text-red-300 transition hover:bg-red-400/20"
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
            </div>
          </div>

          <form
            onSubmit={createHoliday}
            className="h-fit rounded-[2rem] border border-white/10 bg-[#11152E]/90 p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FFB347]">
                  WorkPal
                </p>

                <h2 className="mt-2 text-2xl font-bold text-white">
                  Add Holiday
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  เพิ่มวันที่ร้านหยุด
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFB347]/15 text-[#FFB347]">
                <CalendarDays size={26} />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs text-white/40">Selected Date</p>

                <div className="flex h-12 items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 font-semibold text-white">
                  {selectedDateText}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs text-white/40">Holiday Name</p>

                <input
                  type="text"
                  placeholder="เช่น วันรายอ / ร้านปิดปรับปรุง"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none placeholder:text-white/30"
                />
              </div>

              <div className="rounded-2xl border border-[#00B8A9]/20 bg-[#00B8A9]/10 p-4">
                <div className="flex gap-3">
                  <Info size={18} className="mt-0.5 text-[#00B8A9]" />

                  <p className="text-xs leading-relaxed text-white/50">
                    วันที่อยู่ในรายการนี้จะไม่ถูกนับเป็นวันขาดงาน
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#FFB347] font-bold text-[#1B1F3B] shadow-[0_0_30px_rgba(255,179,71,0.22)] transition hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60"
              >
                <Plus size={18} />
                {loading ? 'Adding...' : 'Add Holiday'}
              </button>
            </div>
          </form>
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
          ? 'border-[#00B8A9]/20 bg-[#00B8A9]/10'
          : 'border-white/10 bg-[#11152E]/90'
      }`}
    >
      <p className="text-xs text-white/40">{title}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          active ? 'text-[#00B8A9]' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

export default HolidayPage