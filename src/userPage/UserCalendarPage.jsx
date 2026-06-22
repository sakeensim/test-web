import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import moment from 'moment'
import 'moment/locale/th'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  StickyNote,
  Umbrella,
  Building2,
  Loader2,
} from 'lucide-react'

import API_URL from '../utils/api'
import useAuthStore from '../store/auth-store'
import { createAlert } from '../utils/createAlert'

moment.locale('th')

const DEFAULT_NOTE_FORM = {
  date: '',
  title: '',
  note: '',
}

const WEEK_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const CALENDAR_MODES = ['compact', 'medium', 'expanded']

function UserCalendarPage() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const calendarTouchStartY = useRef(null)
  const wheelLockRef = useRef(false)

  const [profile, setProfile] = useState(null)
  const [events, setEvents] = useState([])
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const [calendarMode, setCalendarMode] = useState('medium')
  const [dayModalOpen, setDayModalOpen] = useState(false)

  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [noteForm, setNoteForm] = useState(DEFAULT_NOTE_FORM)
  const [noteLoading, setNoteLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    fetchProfile()
  }, [token])

  useEffect(() => {
    if (!token) return
    fetchCalendar()
  }, [token, calendarDate, profile?.branch?.name])

  const fetchProfile = async () => {
    try {
      setProfileLoading(true)

      const res = await axios.get(`${API_URL}/user/myProfile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setProfile(res.data.result || null)
    } catch (error) {
      console.log(error)
    } finally {
      setProfileLoading(false)
    }
  }

  const fetchCalendar = async () => {
    try {
      setLoading(true)

      const month = moment(calendarDate).month() + 1
      const year = moment(calendarDate).year()

      const res = await axios.get(
        `${API_URL}/calendar/user?month=${month}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const rawEvents = res.data.data || res.data.result || []

      const mappedEvents = rawEvents.map((item) => {
        const date = item.date || item.startDate || item.start

        const branchName =
          item.branchName ||
          item.branch?.name ||
          item.raw?.branchName ||
          profile?.branch?.name ||
          user?.branch?.name ||
          'สาขาของฉัน'

        let title = ''

        if (item.type === 'holiday') {
          title = item.title || `วันหยุด: ${branchName}`
        } else if (item.type === 'note') {
          title = item.title || 'Note'
        } else {
          title = `${item.employeeName || item.name || 'พนักงาน'} ลางาน`
        }

        return {
          id: `${item.type}-${item.id}`,
          eventId: item.id,
          title,
          date: moment(date).format('YYYY-MM-DD'),
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

  const calendarDays = useMemo(() => {
    const startOfMonth = moment(calendarDate).startOf('month')
    const endOfMonth = moment(calendarDate).endOf('month')
    const startDay = startOfMonth.day()
    const totalDays = endOfMonth.date()

    const days = []

    const prevMonth = moment(calendarDate).subtract(1, 'month')
    const prevMonthDays = prevMonth.daysInMonth()

    for (let i = startDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i
      const date = prevMonth.date(day).format('YYYY-MM-DD')

      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: date === moment().format('YYYY-MM-DD'),
        isSelected: date === moment(selectedDate).format('YYYY-MM-DD'),
        events: events.filter((event) => event.date === date),
      })
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = moment(calendarDate).date(day).format('YYYY-MM-DD')

      days.push({
        date,
        day,
        isCurrentMonth: true,
        isToday: date === moment().format('YYYY-MM-DD'),
        isSelected: date === moment(selectedDate).format('YYYY-MM-DD'),
        events: events.filter((event) => event.date === date),
      })
    }

    const nextMonth = moment(calendarDate).add(1, 'month')
    let nextDay = 1

    while (days.length % 7 !== 0) {
      const date = nextMonth.date(nextDay).format('YYYY-MM-DD')

      days.push({
        date,
        day: nextDay,
        isCurrentMonth: false,
        isToday: date === moment().format('YYYY-MM-DD'),
        isSelected: date === moment(selectedDate).format('YYYY-MM-DD'),
        events: events.filter((event) => event.date === date),
      })

      nextDay++
    }

    return days
  }, [calendarDate, events, selectedDate])

  const visibleCalendarDays = useMemo(() => {
    if (calendarMode !== 'compact') return calendarDays

    const selectedKey = moment(selectedDate).format('YYYY-MM-DD')
    const selectedIndex = calendarDays.findIndex(
      (item) => item.date === selectedKey
    )

    if (selectedIndex === -1) return calendarDays.slice(0, 7)

    const weekStartIndex = Math.floor(selectedIndex / 7) * 7
    return calendarDays.slice(weekStartIndex, weekStartIndex + 7)
  }, [calendarDays, calendarMode, selectedDate])

  const selectedDateKey = moment(selectedDate).format('YYYY-MM-DD')

  const selectedDayEvents = useMemo(() => {
    return events.filter((event) => event.date === selectedDateKey)
  }, [events, selectedDateKey])

  const branchName =
    profile?.branch?.name || user?.branch?.name || 'ยังไม่พบข้อมูลสาขา'

  const branchAddress =
    profile?.branch?.address || user?.branch?.address || 'ปฏิทินประจำสาขา'

  const expandCalendar = () => {
    setCalendarMode((prev) => {
      const currentIndex = CALENDAR_MODES.indexOf(prev)
      return CALENDAR_MODES[
        Math.min(currentIndex + 1, CALENDAR_MODES.length - 1)
      ]
    })
  }

  const collapseCalendar = () => {
    setCalendarMode((prev) => {
      const currentIndex = CALENDAR_MODES.indexOf(prev)
      return CALENDAR_MODES[Math.max(currentIndex - 1, 0)]
    })
  }

  const changeCalendarWithLock = (direction) => {
    if (wheelLockRef.current) return

    wheelLockRef.current = true

    if (direction === 'expand') {
      expandCalendar()
    } else {
      collapseCalendar()
    }

    setTimeout(() => {
      wheelLockRef.current = false
    }, 280)
  }

  const handleCalendarWheel = (e) => {
    if (Math.abs(e.deltaY) < 24) return

    if (e.deltaY > 0) {
      changeCalendarWithLock('expand')
    } else {
      changeCalendarWithLock('collapse')
    }
  }

  const handleCalendarTouchStart = (e) => {
    calendarTouchStartY.current = e.touches[0].clientY
  }

  const handleCalendarTouchEnd = (e) => {
    if (calendarTouchStartY.current === null) return

    const endY = e.changedTouches[0].clientY
    const diff = endY - calendarTouchStartY.current

    if (Math.abs(diff) < 42) {
      calendarTouchStartY.current = null
      return
    }

    if (diff < 0) {
      changeCalendarWithLock('expand')
    } else {
      changeCalendarWithLock('collapse')
    }

    calendarTouchStartY.current = null
  }

  const handleDetailBoundaryWheel = (e, scrollEl) => {
    if (!scrollEl) return
    if (Math.abs(e.deltaY) < 18) return

    const isScrollingDown = e.deltaY > 0
    const isScrollingUp = e.deltaY < 0

    const atTop = scrollEl.scrollTop <= 1
    const atBottom =
      scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 2

    if (isScrollingDown && atBottom) {
      changeCalendarWithLock('expand')
      return
    }

    if (isScrollingUp && atTop) {
      changeCalendarWithLock('collapse')
    }
  }

  const handleDetailBoundarySwipe = (direction, scrollEl) => {
    if (!scrollEl) return

    const atTop = scrollEl.scrollTop <= 1
    const atBottom =
      scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 2

    if (direction === 'down' && atBottom) {
      changeCalendarWithLock('expand')
      return
    }

    if (direction === 'up' && atTop) {
      changeCalendarWithLock('collapse')
    }
  }

  const goPrevMonth = () => {
    setCalendarDate((prev) => moment(prev).subtract(1, 'month').toDate())
  }

  const goNextMonth = () => {
    setCalendarDate((prev) => moment(prev).add(1, 'month').toDate())
  }

  const goToday = () => {
    const today = new Date()
    setCalendarDate(today)
    setSelectedDate(today)
  }

  const selectDate = (date) => {
    const nextDate = new Date(`${date}T00:00:00.000+07:00`)
    setSelectedDate(nextDate)

    if (!moment(date).isSame(calendarDate, 'month')) {
      setCalendarDate(nextDate)
    }

    if (calendarMode === 'expanded') {
      setDayModalOpen(true)
    }
  }

  const openAddNoteModal = (date = selectedDate) => {
    setNoteForm({
      date: moment(date || new Date()).format('YYYY-MM-DD'),
      title: '',
      note: '',
    })

    setNoteModalOpen(true)
  }

  const closeNoteModal = () => {
    setNoteModalOpen(false)
    setNoteForm(DEFAULT_NOTE_FORM)
  }

  const submitNote = async (e) => {
    e.preventDefault()

    if (!noteForm.date || !noteForm.title) {
      createAlert('error', 'กรุณากรอกวันที่และหัวข้อ')
      return
    }

    try {
      setNoteLoading(true)

      const payload = {
        date: noteForm.date,
        title: noteForm.title,
        note: noteForm.note,
      }

      await axios.post(`${API_URL}/admin/calendar-note`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      createAlert('success', 'เพิ่ม note สำเร็จ')
      closeNoteModal()
      await fetchCalendar()
    } catch (error) {
      console.log(error)
      createAlert(
        'error',
        error.response?.data?.message || 'บันทึก note ไม่สำเร็จ'
      )
    } finally {
      setNoteLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#F5F8FD] text-[#0F172A]">
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-4 pb-[118px] pt-5">
        <header className="mb-3 flex shrink-0 items-center justify-between">
          <div>
            <p className="text-sm font-black text-blue-600">WorkPal</p>
            <h1 className="mt-0.5 text-[22px] font-black leading-tight tracking-tight">
              ตารางงาน
            </h1>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              ปฏิทินประจำสาขาของคุณ
            </p>
          </div>
        </header>

        <section className="mb-3 shrink-0 rounded-[1.5rem] bg-gradient-to-br from-[#0057E7] via-[#0052D9] to-[#003BB5] p-3.5 text-white shadow-[0_12px_28px_rgba(37,99,235,0.24)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Building2 size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-white/65">
                สาขาของฉัน
              </p>

              <h2 className="truncate text-base font-black">
                {profileLoading ? 'กำลังโหลดข้อมูลสาขา...' : branchName}
              </h2>

              <p className="truncate text-[11px] font-semibold text-white/65">
                {profileLoading ? 'กรุณารอสักครู่' : branchAddress}
              </p>
            </div>
          </div>
        </section>

        <section
          onWheel={handleCalendarWheel}
          onTouchStart={handleCalendarTouchStart}
          onTouchEnd={handleCalendarTouchEnd}
          className="shrink-0 select-none"
          style={{
            touchAction: 'none',
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={goPrevMonth}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm active:scale-95"
            >
              <ChevronLeft size={19} />
            </button>

            <div className="text-center">
              <h2 className="text-xl font-black leading-tight">
                {moment(calendarDate).format('MMMM YYYY')}
              </h2>

              <div className="mt-0.5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={goToday}
                  className="text-[11px] font-black text-blue-600"
                >
                  วันนี้
                </button>

                <span className="h-1 w-1 rounded-full bg-slate-300" />

                <span className="text-[11px] font-black text-slate-400">
                  {getModeLabel(calendarMode)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={goNextMonth}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm active:scale-95"
            >
              <ChevronRight size={19} />
            </button>
          </div>

          <div className="mb-2 flex justify-center">
            <div className="h-1.5 w-12 rounded-full bg-slate-300" />
          </div>

          {loading ? (
            <div
              className={`flex items-center justify-center transition-all duration-300 ${
                calendarMode === 'expanded'
                  ? 'h-[500px]'
                  : calendarMode === 'medium'
                    ? 'h-[340px]'
                    : 'h-[92px]'
              }`}
            >
              <Loader2 className="animate-spin text-blue-600" size={26} />
            </div>
          ) : (
            <div
              className={`grid grid-cols-7 text-center transition-all duration-300 ${
                calendarMode === 'compact'
                  ? 'gap-x-1 gap-y-1'
                  : 'gap-x-1 gap-y-1.5'
              }`}
            >
              {WEEK_DAYS.map((day) => (
                <div
                  key={day}
                  className={`pb-1.5 text-[11px] font-black ${
                    day === 'อา'
                      ? 'text-red-500'
                      : day === 'ส'
                        ? 'text-blue-500'
                        : 'text-slate-400'
                  }`}
                >
                  {day}
                </div>
              ))}

              {visibleCalendarDays.map((item) => (
                <CalendarCell
                  key={item.date}
                  item={item}
                  mode={calendarMode}
                  onClick={() => selectDate(item.date)}
                />
              ))}
            </div>
          )}
        </section>

        {calendarMode !== 'expanded' && (
          <div className="mt-4 min-h-0 flex-1 overflow-hidden">
            <DayDetailSection
              selectedDate={selectedDate}
              events={selectedDayEvents}
              onAddNote={() => openAddNoteModal(selectedDate)}
              onBoundaryWheel={handleDetailBoundaryWheel}
              onBoundarySwipe={handleDetailBoundarySwipe}
            />
          </div>
        )}
      </div>

      <FloatingAddNoteButton
        selectedDate={selectedDate}
        onClick={() => openAddNoteModal(selectedDate)}
      />

      {dayModalOpen && (
        <DayDetailModal
          selectedDate={selectedDate}
          events={selectedDayEvents}
          onClose={() => setDayModalOpen(false)}
          onAddNote={() => openAddNoteModal(selectedDate)}
        />
      )}

      {noteModalOpen && (
        <NoteModal
          noteForm={noteForm}
          setNoteForm={setNoteForm}
          noteLoading={noteLoading}
          onClose={closeNoteModal}
          onSubmit={submitNote}
        />
      )}
    </div>
  )
}

function CalendarCell({ item, mode, onClick }) {
  const isExpanded = mode === 'expanded'
  const isMedium = mode === 'medium'
  const isCompact = mode === 'compact'

  const maxEvents = isExpanded ? 4 : isMedium ? 2 : 1
  const visibleEvents = item.events.slice(0, maxEvents)
  const extraCount = item.events.length - visibleEvents.length

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-start overflow-hidden border border-transparent px-0.5 py-1 transition-all duration-300 active:scale-95 ${
        isExpanded
          ? 'h-[78px] rounded-[0.95rem]'
          : isMedium
            ? 'h-[57px] rounded-[0.85rem]'
            : 'h-[48px] rounded-[0.8rem]'
      } ${
        item.isSelected
          ? 'border-slate-400 bg-white text-slate-900 shadow-[0_6px_14px_rgba(15,23,42,0.10)]'
          : item.isToday
            ? 'bg-blue-50 text-blue-600'
            : item.isCurrentMonth
              ? 'bg-white/45 text-slate-900'
              : 'bg-transparent text-slate-300'
      }`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-lg font-black ${
          isCompact ? 'h-6 w-6 text-xs' : 'h-6 w-6 text-xs'
        } ${item.isSelected ? 'bg-slate-900 text-white' : ''}`}
      >
        {item.day}
      </span>

      {visibleEvents.length > 0 && (
        <div className="mt-0.5 flex w-full min-w-0 flex-col items-center gap-0.5">
          {visibleEvents.map((event) => (
            <EventMiniBadge
              key={event.id}
              event={event}
              compact={!isExpanded}
            />
          ))}

          {extraCount > 0 && (
            <span className="max-w-full rounded-md bg-slate-200 px-1 py-0.5 text-[8px] font-black leading-none text-slate-600">
              +{extraCount}
            </span>
          )}
        </div>
      )}
    </button>
  )
}

function EventMiniBadge({ event, compact }) {
  const config = getMiniEventConfig(event.type)

  return (
    <span
      className={`block w-full truncate rounded px-1 py-0.5 text-left font-black leading-tight ${
        compact ? 'text-[7px]' : 'text-[8px]'
      } ${config.className}`}
      title={event.title}
    >
      {compact ? config.label : event.title}
    </span>
  )
}

function DayDetailSection({
  selectedDate,
  events,
  onAddNote,
  onBoundaryWheel,
  onBoundarySwipe,
}) {
  const scrollRef = useRef(null)
  const detailTouchStartY = useRef(null)

  const handleWheel = (e) => {
    e.stopPropagation()
    onBoundaryWheel(e, scrollRef.current)
  }

  const handleTouchStart = (e) => {
    detailTouchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    if (detailTouchStartY.current === null) return

    const endY = e.changedTouches[0].clientY
    const diff = endY - detailTouchStartY.current

    if (Math.abs(diff) < 42) {
      detailTouchStartY.current = null
      return
    }

    if (diff < 0) {
      onBoundarySwipe('down', scrollRef.current)
    } else {
      onBoundarySwipe('up', scrollRef.current)
    }

    detailTouchStartY.current = null
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-blue-600">
            {moment(selectedDate).format('dddd')}
          </p>
          <h2 className="mt-0.5 text-2xl font-black text-slate-900">
            {moment(selectedDate).format('D MMM')}
          </h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-400">
            {events.length} รายการในวันนี้
          </p>
        </div>

        <button
          type="button"
          onClick={onAddNote}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-2xl bg-blue-50 px-3 text-xs font-black text-blue-600 active:scale-95"
        >
          <Plus size={14} strokeWidth={3} />
          Note
        </button>
      </div>

      <div
        ref={scrollRef}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="min-h-0 flex-1 overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]"
      >
        {events.length === 0 ? (
          <div className="flex h-full min-h-[130px] flex-col items-center justify-center text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
              <CalendarDays size={22} className="text-slate-400" />
            </div>
            <h3 className="font-black text-slate-700">ไม่มีรายการวันนี้</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              วันนี้ยังไม่มีวันหยุด วันลา หรือ Note
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 pb-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function DayDetailModal({ selectedDate, events, onClose, onAddNote }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[1.8rem] bg-white p-5 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-blue-600">
              {moment(selectedDate).format('dddd')}
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">
              {moment(selectedDate).format('DD MMMM YYYY')}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-400">
              {events.length} รายการในวันนี้
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <button
          type="button"
          onClick={onAddNote}
          className="mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-[0_10px_24px_rgba(37,99,235,0.26)] active:scale-[0.98]"
        >
          <Plus size={18} strokeWidth={3} />
          เพิ่ม Note วันนี้
        </button>

        {events.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F8FD]">
              <CalendarDays size={24} className="text-slate-400" />
            </div>
            <h3 className="font-black text-slate-700">ไม่มีรายการวันนี้</h3>
            <p className="mt-1 text-sm font-semibold text-slate-400">
              วันนี้ยังไม่มีวันหยุด วันลา หรือ Note
            </p>
          </div>
        ) : (
          <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FloatingAddNoteButton({ selectedDate, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-[104px] left-1/2 z-40 flex h-14 w-[260px] -translate-x-1/2 items-center justify-between rounded-full bg-white px-5 text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.18)] active:scale-[0.98] md:hidden"
    >
      <span className="text-base font-black">
        เพิ่มวันที่ {moment(selectedDate).format('D MMM')}
      </span>

      <Plus size={30} strokeWidth={2.2} className="text-slate-900" />
    </button>
  )
}

function NoteModal({
  noteForm,
  setNoteForm,
  noteLoading,
  onClose,
  onSubmit,
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[1.8rem] bg-white p-5 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-blue-600">Calendar Note</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">
              เพิ่ม Note
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-black text-slate-400">วันที่</p>
            <input
              type="date"
              value={noteForm.date}
              onChange={(e) =>
                setNoteForm({ ...noteForm, date: e.target.value })
              }
              className="h-12 w-full rounded-2xl border border-slate-200 bg-[#F5F8FD] px-4 text-sm font-bold text-slate-800 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-black text-slate-400">หัวข้อ</p>
            <input
              value={noteForm.title}
              onChange={(e) =>
                setNoteForm({ ...noteForm, title: e.target.value })
              }
              placeholder="เช่น ประชุมทีม / ทำความสะอาดร้าน"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-[#F5F8FD] px-4 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-black text-slate-400">
              รายละเอียด
            </p>
            <textarea
              value={noteForm.note}
              onChange={(e) =>
                setNoteForm({ ...noteForm, note: e.target.value })
              }
              rows={4}
              placeholder="รายละเอียดเพิ่มเติม"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-[#F5F8FD] px-4 py-3 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-500"
          >
            ยกเลิก
          </button>

          <button
            type="submit"
            disabled={noteLoading}
            className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(37,99,235,0.26)] disabled:opacity-60"
          >
            {noteLoading ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </form>
    </div>
  )
}

function EventCard({ event }) {
  const config = getEventConfig(event.type)

  return (
    <div className={`flex gap-3 rounded-[1.3rem] p-3 ${config.rowClass}`}>
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${config.iconClass}`}
      >
        {config.icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-900">
              {event.title}
            </p>
            <p className="mt-0.5 text-xs font-bold text-slate-500">
              {config.label} · {event.branchName || 'สาขา'}
            </p>
          </div>

          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-black ${config.badgeClass}`}
          >
            {config.shortLabel}
          </span>
        </div>

        {event.type === 'note' && event.raw?.note && (
          <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-600">
            {event.raw.note}
          </p>
        )}
      </div>
    </div>
  )
}

function getMiniEventConfig(type) {
  if (type === 'holiday') {
    return {
      label: 'หยุด',
      className: 'bg-emerald-100 text-emerald-800',
    }
  }

  if (type === 'note') {
    return {
      label: 'NOTE',
      className: 'bg-sky-100 text-sky-700',
    }
  }

  return {
    label: 'ลา',
    className: 'bg-orange-100 text-orange-700',
  }
}

function getEventConfig(type) {
  if (type === 'holiday') {
    return {
      label: 'วันหยุดสาขา',
      shortLabel: 'หยุด',
      icon: <CalendarDays size={20} />,
      rowClass: 'bg-emerald-50',
      iconClass: 'bg-white text-emerald-600',
      badgeClass: 'bg-white text-emerald-600',
    }
  }

  if (type === 'note') {
    return {
      label: 'Note',
      shortLabel: 'Note',
      icon: <StickyNote size={20} />,
      rowClass: 'bg-sky-50',
      iconClass: 'bg-white text-blue-600',
      badgeClass: 'bg-white text-blue-600',
    }
  }

  return {
    label: 'พนักงานลางาน',
    shortLabel: 'ลา',
    icon: <Umbrella size={20} />,
    rowClass: 'bg-orange-50',
    iconClass: 'bg-white text-orange-500',
    badgeClass: 'bg-white text-orange-500',
  }
}

function getModeLabel(mode) {
  if (mode === 'expanded') return 'เดือนเต็ม'
  if (mode === 'medium') return 'เดือนย่อ'
  return 'สัปดาห์'
}

export default UserCalendarPage