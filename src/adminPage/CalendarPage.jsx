import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import moment from 'moment'
import 'moment/locale/th'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { CalendarDays, Building2, Users, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import API_URL from '../utils/api'
import useAuthStore from '../store/auth-store'
import { createAlert } from '../utils/createAlert'

moment.locale('th')
const localizer = momentLocalizer(moment)

function CalendarPage() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  const [events, setEvents] = useState([])
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedDayEvents, setSelectedDayEvents] = useState([])

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER'
  const isAdminPage = location.pathname.startsWith('/admin')

  useEffect(() => {
    if (!token) return

    fetchCalendar()

    if (isAdminPage && isAdmin) {
      fetchBranches()
    }
  }, [token, selectedBranch, user?.role, location.pathname])

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/branches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setBranches(res.data.data || res.data.result || [])
    } catch (error) {
      console.log(error)
    }
  }

  const fetchCalendar = async () => {
    try {
      setLoading(true)

      const url =
        isAdminPage && isAdmin
          ? `${API_URL}/calendar/admin?branchId=${selectedBranch}`
          : `${API_URL}/calendar/user`

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const rawEvents = res.data.data || res.data.result || []

      const mappedEvents = rawEvents.map((item) => {
        const date = item.date || item.startDate || item.start
        const start = new Date(date)
        const end = new Date(date)

        const branchName =
          item.branchName ||
          item.branch?.name ||
          item.raw?.branchName ||
          'สาขา'

        return {
          id: `${item.type}-${item.id}`,
          title:
            item.type === 'holiday'
              ? `วันหยุด: ${branchName}`
              : `${item.employeeName || item.name || 'Employee'} ลางาน`,
          start,
          end,
          allDay: true,
          type: item.type,
          branchName,
          raw: item,
        }
      })

      setEvents(mappedEvents)
    } catch (error) {
      console.log(error)
      createAlert('error', 'โหลดปฏิทินไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  const openDayDetail = (date, eventList = events) => {
    const clickedDate = moment(date).format('YYYY-MM-DD')

    const dayEvents = eventList.filter(
      (event) => moment(event.start).format('YYYY-MM-DD') === clickedDate
    )

    setSelectedDate(date)
    setSelectedDayEvents(dayEvents)
  }

  const handleSelectSlot = (slotInfo) => {
    openDayDetail(slotInfo.start)
  }

  const handleSelectEvent = (event) => {
    openDayDetail(event.start)
  }

  const handleShowMore = (moreEvents, date) => {
    setSelectedDate(date)
    setSelectedDayEvents(moreEvents)
  }

  const eventStyleGetter = (event) => {
    if (event.type === 'holiday') {
      return {
        style: {
          backgroundColor: '#EF4444',
          color: '#FFFFFF',
          borderRadius: '999px',
          border: 'none',
          padding: '3px 8px',
          fontSize: '12px',
          fontWeight: 800,
          boxShadow: '0 6px 14px rgba(239,68,68,0.25)',
        },
      }
    }

    return {
      style: {
        backgroundColor: '#FFB347',
        color: '#1B1F3B',
        borderRadius: '999px',
        border: 'none',
        padding: '3px 8px',
        fontSize: '12px',
        fontWeight: 800,
        boxShadow: '0 6px 14px rgba(255,179,71,0.25)',
      },
    }
  }

  const summary = useMemo(() => {
    return {
      holiday: events.filter((event) => event.type === 'holiday').length,
      dayoff: events.filter((event) => event.type === 'dayoff').length,
    }
  }, [events])

  return (
    <div className="min-h-screen w-full p-4 sm:p-6">
      <style>
        {`
          .rbc-calendar {
            color: #E2E8F0;
            font-family: inherit;
            background: #11152E;
          }

          .rbc-toolbar {
            margin-bottom: 18px;
            gap: 12px;
            color: #E2E8F0;
          }

          .rbc-toolbar button {
            border: 1px solid rgba(255,255,255,0.12);
            background: #1E2447;
            color: #CBD5E1;
            font-weight: 800;
            border-radius: 12px;
            padding: 8px 14px;
          }

          .rbc-toolbar button:hover,
          .rbc-toolbar button.rbc-active {
            background: #FFB347;
            color: #1B1F3B;
            border-color: #FFB347;
          }

          .rbc-toolbar-label {
            font-size: 22px;
            font-weight: 900;
            color: #FFFFFF;
          }

          .rbc-month-view,
          .rbc-time-view {
            border-radius: 22px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.10);
            background: #181D3A;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
          }

          .rbc-header {
            padding: 12px 4px;
            font-size: 13px;
            font-weight: 900;
            color: #CBD5E1;
            background: #1E2447;
            border-bottom: 1px solid rgba(255,255,255,0.08);
          }

          .rbc-month-row,
          .rbc-day-bg,
          .rbc-date-cell,
          .rbc-header,
          .rbc-time-view,
          .rbc-time-content,
          .rbc-timeslot-group {
            border-color: rgba(255,255,255,0.08) !important;
          }

          .rbc-date-cell {
            padding: 10px;
            font-weight: 900;
            color: #E2E8F0;
            font-size: 16px;
          }

          .rbc-off-range {
            color: #64748B;
          }

          .rbc-off-range-bg {
            background: #141936;
          }

          .rbc-today {
            background: rgba(0,184,169,0.16) !important;
          }

          .rbc-day-bg:hover {
            background: rgba(255,179,71,0.08);
            cursor: pointer;
            transition: 0.2s ease;
          }

          .rbc-event {
            margin-top: 4px;
            border-radius: 999px !important;
          }

          .rbc-show-more {
            color: #FFB347 !important;
            font-weight: 900;
            background: transparent !important;
            padding-left: 8px;
          }

          .rbc-show-more:hover {
            color: #FFFFFF !important;
            text-decoration: none;
          }
        `}
      </style>

      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FFB347]">
              {isAdminPage ? 'Branch Calendar' : 'My Calendar'}
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white">
              {isAdminPage
                ? 'Branch Day Off & Holiday Calendar'
                : 'My Day Off & Holiday Calendar'}
            </h1>

            <p className="mt-2 text-white/45">
              {isAdminPage
                ? 'ดูวันลาของพนักงานและวันหยุดของแต่ละสาขา'
                : 'ดูวันลาของคุณและวันหยุดของสาขาคุณ'}
            </p>
          </div>

          {isAdminPage && isAdmin && (
            <div className="rounded-2xl border border-white/10 bg-[#11152E]/90 px-4 py-3">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                <Building2 className="h-4 w-4" />
                Branch Calendar
              </p>

              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-white outline-none lg:w-64"
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
            </div>
          )}
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-[#11152E]/90 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-red-400/15 p-3 text-red-300">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm text-white/40">Holiday</p>
                <p className="text-2xl font-bold text-white">
                  {summary.holiday}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-[#11152E]/90 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#FFB347]/15 p-3 text-[#FFB347]">
                <Users className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm text-white/40">Day Off</p>
                <p className="text-2xl font-bold text-white">
                  {summary.dayoff}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#11152E] p-4 shadow-2xl">
          {loading ? (
            <div className="flex h-[650px] items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#00B8A9]" />
            </div>
          ) : (
            <div className="h-[650px]">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                views={['month', 'week', 'day']}
                defaultView="month"
                selectable
                popup={false}
                doShowMoreDrillDown={false}
                eventPropGetter={eventStyleGetter}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                onShowMore={handleShowMore}
                messages={{
                  next: 'ถัดไป',
                  previous: 'ก่อนหน้า',
                  today: 'วันนี้',
                  month: 'เดือน',
                  week: 'สัปดาห์',
                  day: 'วัน',
                  agenda: 'รายการ',
                  showMore: (total) => `ดูเพิ่ม ${total} รายการ`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {selectedDate && (
        <div
          onClick={() => {
            setSelectedDate(null)
            setSelectedDayEvents([])
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#11152E] p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#FFB347]">
                  Calendar Detail
                </p>

                <h2 className="mt-2 text-2xl font-bold text-white">
                  {moment(selectedDate).format('DD MMMM YYYY')}
                </h2>
              </div>

              <button
                onClick={() => {
                  setSelectedDate(null)
                  setSelectedDayEvents([])
                }}
                className="rounded-2xl bg-white/[0.06] p-3 text-white/50 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
                <p className="text-white/50">วันนี้ไม่มีวันลาและวันหยุด</p>
              </div>
            ) : (
              <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
                {selectedDayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-3 w-3 rounded-full ${
                          event.type === 'holiday'
                            ? 'bg-red-400'
                            : 'bg-[#FFB347]'
                        }`}
                      />

                      <div>
                        <p className="font-semibold text-white">
                          {event.title}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          {event.type === 'holiday'
                            ? `วันหยุดของ ${event.branchName || 'สาขา'}`
                            : 'พนักงานลางาน'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarPage