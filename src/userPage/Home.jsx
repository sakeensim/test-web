import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import moment from 'moment/min/moment-with-locales'
import {
  Bell,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Wallet,
  LogIn,
  LogOut,
  Umbrella,
  Megaphone,
  BriefcaseBusiness,
  AlertTriangle,
  Timer,
} from 'lucide-react'

import useAuthStore from '../store/auth-store'
import timeStore from '../store/time-store'
import API_URL from '../utils/api'
import { createAlert } from '../utils/createAlert'

function Home() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const { time, actionCheckIn, actionCheckOut } = timeStore()

  const [now, setNow] = useState(new Date())
  const [profile, setProfile] = useState({})
  const [summary, setSummary] = useState({})
  const [requests, setRequests] = useState([])
  const [shifts, setShifts] = useState([])
  const [selectedShiftId, setSelectedShiftId] = useState('')
  const [canUseOT, setCanUseOT] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeNormal, setActiveNormal] = useState(null)
  const [activeOT, setActiveOT] = useState(null)

  const monthLabel = moment(now).locale('th').format('MMMM')
  const remainingDayOffs = Number(profile?.remainingDayOffs || 0)

  const isNormalExpired = activeNormal
    ? checkNormalExpired(activeNormal, now)
    : false

  const isOTExpired = activeOT ? checkOTExpired(activeOT, profile, now) : false

  const hasWorkingNormal =
    activeNormal?.status === 'ACTIVE' &&
    activeNormal?.checkIn &&
    !activeNormal?.checkOut &&
    !isNormalExpired

  const hasWorkingOT =
    activeOT?.status === 'ACTIVE' &&
    activeOT?.checkIn &&
    !activeOT?.checkOut &&
    !isOTExpired

  const isCheckedIn = hasWorkingNormal || hasWorkingOT
  const activeRecord = hasWorkingNormal ? activeNormal : hasWorkingOT ? activeOT : null
  const activeType = hasWorkingNormal ? 'NORMAL' : hasWorkingOT ? 'OT' : null

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (token) fetchHomeData()
  }, [token])

  const fetchHomeData = async () => {
    await Promise.all([
      getProfile(),
      fetchApprovedRequests(),
      fetchMyShifts(),
      fetchUserHistory(),
    ])
  }

  const getProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/myProfile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setProfile(res.data.result || {})
    } catch (error) {
      console.log(error)
    }
  }

  const fetchApprovedRequests = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/approved-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setRequests(res.data.data || [])
    } catch (error) {
      console.log(error)
    }
  }

  const fetchMyShifts = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/my-shifts`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const shiftData = res.data.result || res.data.data || []
      setShifts(shiftData)
      setCanUseOT(Boolean(res.data.allowOT))

      if (shiftData.length === 1) {
        setSelectedShiftId(String(shiftData[0].id))
      }
    } catch (error) {
      console.log(error)
    }
  }

  const fetchUserHistory = async () => {
    try {
      const month = moment(now).month() + 1
      const year = moment(now).year()

      const res = await axios.get(
        `${API_URL}/user/history?month=${month}&year=${year}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setSummary(res.data.summary || {})

      if (res.data.profile) {
        setProfile((prev) => ({
          ...prev,
          ...res.data.profile,
        }))
      }

      const normal = (res.data.logs?.timetracking || []).find(
        (item) =>
          item.checkIn &&
          !item.checkOut &&
          item.status !== 'COMPLETED' &&
          item.status !== 'EXPIRED' &&
          item.status !== 'CANCELLED'
      )

      const ot =
        res.data.logs?.activeOvertime ||
        (res.data.logs?.overtimeLogs || []).find(
          (item) => item.status === 'ACTIVE' && item.checkIn && !item.checkOut
        )

      setActiveNormal(normal || null)
      setActiveOT(ot || null)
    } catch (error) {
      console.log(error)
    }
  }

  const totalSalaryAdvance = useMemo(() => {
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return requests
      .filter((request) => {
        const isAdvance =
          request.type === 'salary' ||
          request.type === 'advanceSalary' ||
          request.type === 'salaryAdvance' ||
          request.type === 'advance'

        const requestDate = new Date(request.requestDate || request.date)

        return (
          isAdvance &&
          requestDate.getMonth() === currentMonth &&
          requestDate.getFullYear() === currentYear
        )
      })
      .reduce((sum, request) => sum + Number(request.amount || 0), 0)
  }, [requests, now])

  const baseSalary = Number(profile?.baseSalary || 0)
  const remainingSalary =
    summary.finalSalary !== undefined
      ? Math.max(Number(summary.finalSalary || 0), 0)
      : Math.max(baseSalary - totalSalaryAdvance, 0)

  const totalOtHours = Number(summary.totalOtMinutes || 0) / 60

  const selectedShift = shifts.find(
    (shift) => String(shift.id) === String(selectedShiftId)
  )

  const currentShift =
    activeNormal?.shift || time?.shift || selectedShift || null

  const syncExpiredIfNeeded = async (latitude, longitude) => {
    if (activeNormal && isNormalExpired) {
      try {
        await actionCheckOut(token, latitude, longitude, 'auto-expired')
      } catch (error) {
        if (error.response?.data?.status !== 'EXPIRED') {
          throw error
        }
      }
    }

    if (activeOT && isOTExpired) {
      try {
        await axios.patch(
          `${API_URL}/user/overtime/end`,
          { latitude, longitude, noteOut: 'auto-expired' },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } catch (error) {
        if (error.response?.data?.status !== 'EXPIRED') {
          console.log('OT expire sync failed:', error)
        }
      }
    }
  }

  const handleAttendance = () => {
    if (submitting) return

    if (!navigator.geolocation) {
      createAlert('error', 'อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง')
      return
    }

    if (!isCheckedIn && !selectedShiftId) {
      createAlert('error', 'กรุณาเลือกกะทำงานก่อน Check-in')
      return
    }

    setSubmitting(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          await syncExpiredIfNeeded(latitude, longitude)

          if (isCheckedIn) {
            if (activeType === 'OT') {
              await axios.patch(
                `${API_URL}/user/overtime/end`,
                { latitude, longitude, noteOut: '' },
                { headers: { Authorization: `Bearer ${token}` } }
              )
              createAlert('success', 'จบ OT สำเร็จ')
            } else {
              await actionCheckOut(token, latitude, longitude, '')
              createAlert('success', 'Check-out สำเร็จ')
            }
          } else if (selectedShiftId === 'OT') {
            await axios.post(
              `${API_URL}/user/overtime/start`,
              { latitude, longitude, noteIn: '' },
              { headers: { Authorization: `Bearer ${token}` } }
            )
            createAlert('success', 'เริ่ม OT สำเร็จ')
          } else {
            await actionCheckIn(token, latitude, longitude, '', selectedShiftId)
            createAlert('success', 'Check-in สำเร็จ')
          }

          await fetchHomeData()
        } catch (error) {
          createAlert(
            'error',
            error.response?.data?.message || 'บันทึกเวลาไม่สำเร็จ'
          )
          await fetchHomeData()
        } finally {
          setSubmitting(false)
        }
      },
      () => {
        createAlert('error', 'กรุณาอนุญาตให้เข้าถึงตำแหน่ง')
        setSubmitting(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  return (
    <div className="min-h-dvh bg-[#F5F8FD] text-[#0F172A]">
      <div className="relative overflow-hidden rounded-b-[1.75rem] bg-gradient-to-br from-[#0057E7] via-[#0052D9] to-[#003BB5] px-4 pb-[96px] pt-6 text-white">
        <div className="absolute -right-24 top-14 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-24 bottom-[-110px] h-56 w-56 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-[54px] w-[54px] shrink-0 overflow-hidden rounded-full bg-white/20 ring-4 ring-white/25">
              {profile?.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt="profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/20">
                  <User size={24} />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-[20px] font-black leading-tight">
                สวัสดี {profile?.firstname || user?.firstname || 'User'} 👋
              </h1>

              <p className="mt-0.5 truncate text-xs font-semibold text-white/90">
                {profile?.position?.name || user?.role || 'Employee'}
              </p>

              <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-semibold text-white/80">
                <MapPin size={11} />
                {profile?.branch?.name || 'ยังไม่ได้กำหนดสาขา'}
              </p>

              <p className="mt-0.5 truncate text-[10px] font-medium text-white/60">
                {profile?.branch?.address || 'ยังไม่มีที่อยู่สาขา'}
              </p>
            </div>
          </div>

          <button className="relative shrink-0">
            <Bell size={25} />
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black">
              5
            </span>
          </button>
        </div>
      </div>

      <main className="relative z-10 -mt-[72px] space-y-3 px-3 pb-5">
        <section className="rounded-[1.6rem] bg-white p-3.5 shadow-[0_12px_30px_rgba(15,23,42,0.10)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-black">
                {isCheckedIn ? 'กำลังทำงานอยู่' : 'เช็กอินเข้างาน'}
              </h2>
              <p className="mt-0.5 text-xs font-bold text-slate-600">
                {isCheckedIn
                  ? activeType === 'OT'
                    ? 'กำลังทำ OT'
                    : currentShift
                      ? `${currentShift.name || 'กะทำงาน'} ${currentShift.checkInTime || ''} - ${currentShift.checkOutTime || ''}`
                      : 'กำลังอยู่ในรอบการทำงาน'
                  : 'เลือกกะทำงานวันนี้'}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                isCheckedIn
                  ? 'bg-green-100 text-green-600'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              {isCheckedIn ? 'Checked In' : 'Ready'}
            </span>
          </div>

          {!isCheckedIn && (
            <div className="mt-3 rounded-2xl bg-slate-50 p-2.5">
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {shifts.map((shift) => (
                  <button
                    key={shift.id}
                    type="button"
                    onClick={() => setSelectedShiftId(String(shift.id))}
                    className={`min-w-[138px] shrink-0 rounded-xl border p-2.5 text-left transition ${
                      String(selectedShiftId) === String(shift.id)
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <p className="truncate text-sm font-black">
                      {shift.name || 'กะทำงาน'}
                    </p>
                    <p className="mt-1 whitespace-nowrap text-[11px] font-bold text-slate-500">
                      {shift.checkInTime} - {shift.checkOutTime}
                    </p>
                  </button>
                ))}

                {canUseOT && (
                  <button
                    type="button"
                    onClick={() => setSelectedShiftId('OT')}
                    className={`min-w-[138px] shrink-0 rounded-xl border p-2.5 text-left transition ${
                      selectedShiftId === 'OT'
                        ? 'border-orange-400 bg-orange-50 shadow-sm'
                        : 'border-orange-100 bg-white'
                    }`}
                  >
                    <p className="text-sm font-black text-orange-600">OT</p>
                    <p className="mt-1 whitespace-nowrap text-[11px] font-bold text-slate-500">
                      ทำงานล่วงเวลา
                    </p>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="my-3 h-px bg-slate-200" />

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full border-4 border-blue-500 text-blue-500">
                <Clock size={28} />
              </div>

              <div>
                <p className="text-[28px] font-black leading-none">
                  {moment(now).format('HH:mm')}
                </p>
                <p className="mt-1.5 text-xs font-bold text-slate-500">
                  {moment(now).locale('th').format('D MMMM YYYY')}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-600">
                เวลาทำงานวันนี้
              </p>
              <p className="mt-1.5 text-[22px] font-black leading-none">
                {isCheckedIn
                  ? `${moment(now).diff(moment(activeRecord?.checkIn), 'hours')} ชม.`
                  : 'พร้อมเริ่ม'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAttendance}
            disabled={submitting}
            className={`mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-base font-black text-white shadow-lg disabled:opacity-60 ${
              isCheckedIn
                ? 'bg-gradient-to-r from-orange-500 to-red-500'
                : 'bg-gradient-to-r from-[#006BFF] to-[#0040C8]'
            }`}
          >
            {isCheckedIn ? <LogOut size={24} /> : <LogIn size={24} />}
            {submitting
              ? 'กำลังบันทึก...'
              : isCheckedIn
                ? activeType === 'OT'
                  ? 'จบ OT'
                  : 'เช็กเอาท์ออกงาน'
                : 'เช็กอินเข้างาน'}
          </button>
        </section>

        <Card title="ภาพรวมของฉัน" subtitle={`ในเดือน ${monthLabel}`}>
          <div className="grid grid-cols-3 gap-2">
            <OverviewBox
              icon={<Umbrella size={18} />}
              label="วันลาคงเหลือ"
              value={`${remainingDayOffs} วัน`}
              color="green"
            />
            <OverviewBox
              icon={<Wallet size={18} />}
              label="เงินคงเหลือ"
              value={`${remainingSalary.toLocaleString()}฿`}
              color="blue"
            />
            <OverviewBox
              icon={<BriefcaseBusiness size={18} />}
              label="ทำงาน"
              value={`${Number(summary.workingDays || 0)} วัน`}
              color="blue"
            />
            <OverviewBox
              icon={<Clock size={18} />}
              label="สาย"
              value={`${Number(summary.lateDays || 0)} วัน`}
              color="orange"
            />
            <OverviewBox
              icon={<AlertTriangle size={18} />}
              label="ขาด"
              value={`${Number(summary.absentDays || 0)} วัน`}
              color="red"
            />
            <OverviewBox
              icon={<Timer size={18} />}
              label="OT"
              value={`${totalOtHours.toFixed(1)} ชม.`}
              color="purple"
            />
          </div>
        </Card>

        <Card title="คำขอล่าสุด" action="ดูทั้งหมด">
          {requests.slice(0, 2).length > 0 ? (
            requests.slice(0, 2).map((item, index) => (
              <React.Fragment key={`${item.type}-${item.id}`}>
                <RequestRow
                  icon={
                    item.type === 'dayoff' ? (
                      <Umbrella size={22} />
                    ) : (
                      <Wallet size={22} />
                    )
                  }
                  title={item.type === 'dayoff' ? 'คำขอลา' : 'เบิกเงินล่วงหน้า'}
                  date={moment(item.date || item.requestDate)
                    .locale('th')
                    .format('D MMM YYYY')}
                  status={item.status}
                  statusColor="green"
                  color={item.type === 'dayoff' ? 'blue' : 'pink'}
                />

                {index < requests.slice(0, 2).length - 1 && (
                  <div className="my-2 h-px bg-slate-200" />
                )}
              </React.Fragment>
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-400">
              ยังไม่มีคำขอที่อนุมัติ
            </p>
          )}
        </Card>
      </main>
    </div>
  )
}

function checkNormalExpired(record, now) {
  if (!record?.shift?.checkInTime || !record?.checkIn) return false
  const checkIn = moment(record.checkIn)
  const expiredAt = checkIn.clone().add(23.5, 'hours')
  return moment(now).isAfter(expiredAt)
}

function checkOTExpired(record, profile, now) {
  if (!record?.checkIn) return false
  const cap = Number(profile?.position?.otCapMinutes || 0)
  if (!cap) return false
  const expiredAt = moment(record.checkIn).add(cap, 'minutes')
  return moment(now).isAfter(expiredAt)
}

function Card({ title, subtitle, action, children }) {
  return (
    <section className="rounded-[1.3rem] bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs font-bold text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <button className="text-xs font-black text-blue-600">
            {action} ›
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

function OverviewBox({ icon, label, value, color }) {
  const styles = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-500',
    red: 'bg-red-50 text-red-500',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className={`rounded-2xl p-2.5 ${styles[color]}`}>
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
        {icon}
      </div>
      <p className="text-[11px] font-bold opacity-80">{label}</p>
      <p className="mt-0.5 text-sm font-black">{value}</p>
    </div>
  )
}

function RequestRow({ icon, title, date, status, statusColor, color }) {
  const iconColor =
    color === 'pink'
      ? 'text-pink-500 bg-pink-100'
      : 'text-blue-600 bg-blue-100'

  const badgeColor =
    statusColor === 'orange'
      ? 'bg-orange-100 text-orange-500'
      : 'bg-green-100 text-green-600'

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconColor}`}
      >
        {icon}
      </div>

      <div className="flex-1">
        <p className="text-sm font-black">{title}</p>
        <p className="text-xs font-bold text-slate-500">{date}</p>
      </div>

      <span
        className={`rounded-full px-2.5 py-1 text-xs font-black ${badgeColor}`}
      >
        {status}
      </span>

      <ChevronRight size={17} className="text-slate-500" />
    </div>
  )
}

export default Home