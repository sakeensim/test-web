import moment from 'moment/min/moment-with-locales'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

import useAuthStore from '../store/auth-store'
import timeStore from '../store/time-store'
import { createAlert } from '../utils/createAlert'
import API_URL from '../utils/api'

function CheckOut() {
  const token = useAuthStore((state) => state.token)
  const { actionCheckOut, time } = timeStore()

  const [now, setNow] = useState(new Date())
  const [note, setNote] = useState('')
  const [checkoutType, setCheckoutType] = useState('')
  const [canUseOT, setCanUseOT] = useState(false)
  const [activeOvertime, setActiveOvertime] = useState(null)

  const currentShift = time?.shift || null
  const isOvertimeMode = checkoutType === 'OT'
  const showOTOption = canUseOT && activeOvertime

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (token) {
      fetchOTStatus()
    }
  }, [token])

  const fetchOTStatus = async () => {
    try {
      const [historyRes, activeOTRes] = await Promise.allSettled([
        axios.get(`${API_URL}/user/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get(`${API_URL}/user/overtime/active`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ])

      if (historyRes.status === 'fulfilled') {
        setCanUseOT(Boolean(historyRes.value.data?.profile?.position?.allowOT))
      }

      if (activeOTRes.status === 'fulfilled') {
        setActiveOvertime(activeOTRes.value.data?.data || null)
      }
    } catch (error) {
      console.error('Fetch OT status failed:', error)
    }
  }

  const endOvertime = async (latitude, longitude) => {
    const res = await axios.patch(
      `${API_URL}/user/overtime/end`,
      {
        latitude,
        longitude,
        noteOut: note,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    return res.data
  }

  const hdlSubmit = async (e) => {
    e.preventDefault()

    if (!checkoutType) {
      createAlert('error', 'กรุณาเลือกประเภทการออกงานก่อน Check-out')
      return
    }

    if (checkoutType === 'OT' && !showOTOption) {
      createAlert('error', 'ไม่พบ OT ที่กำลังทำอยู่')
      return
    }

    if (!navigator.geolocation) {
      createAlert('error', 'อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          if (isOvertimeMode) {
            const res = await endOvertime(latitude, longitude)

            console.log('End OT response:', res)
            createAlert('success', 'จบ OT สำเร็จ')
            setCheckoutType('')
            fetchOTStatus()
            return
          }

          const res = await actionCheckOut(token, latitude, longitude, note)

          console.log('Check-out response:', res)
          createAlert('success', 'ลงชื่อออก สำเร็จ')
          setCheckoutType('')
        } catch (error) {
          console.error('Check-out failed:', error)

          const status = error.response?.status
          const message = error.response?.data?.message

          if (status === 400 || status === 403) {
            createAlert('info', message || 'ไม่สามารถ Check-out ได้')
            return
          }

          if (status === 401) {
            createAlert('error', 'กรุณาเข้าสู่ระบบใหม่')
            return
          }

          createAlert(
            'error',
            message || (isOvertimeMode ? 'จบ OT ล้มเหลว' : 'Check-out ล้มเหลว')
          )
        }
      },
      (error) => {
        console.error('Location error:', error)
        createAlert('error', 'กรุณาอนุญาตให้เข้าถึงตำแหน่ง')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  return (
    <div className="min-h-[calc(100vh-2rem)] w-full">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center px-4 py-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="hidden lg:block">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FFB347]">
              Attendance
            </p>

            <h1 className="mt-4 max-w-xl text-5xl font-bold leading-tight text-white">
              {isOvertimeMode
                ? 'Finish your overtime properly.'
                : 'Finish your workday properly.'}
            </h1>

            <p className="mt-4 max-w-lg text-lg text-white/50">
              {isOvertimeMode
                ? 'จบ OT เพื่อบันทึกเวลาล่วงเวลาให้ครบถ้วน'
                : 'ลงชื่อออกเมื่อสิ้นสุดเวลาทำงาน เพื่อบันทึกเวลาทำงานให้ครบถ้วน'}
            </p>

            <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <p className="text-sm text-white/40">Today</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {moment(now).locale('th').format('dddd ll')}
              </p>
              <p className="mt-2 text-xl text-[#FFB347]">
                {moment(now).locale('th').format('LTS')}
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#11152E]/90 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#FFB347]">
                WorkPal
              </p>

              <h2 className="mt-2 text-3xl font-bold text-white">
                เวลาเข้า-ออกงาน
              </h2>

              <p className="mt-2 text-sm text-white/40">
                เลือกประเภทการออกงานก่อนกด Check-Out
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-white/[0.04] p-2">
              <Link
                to="/user/check-in"
                className="flex h-12 items-center justify-center rounded-xl text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white"
              >
                เวลาเข้า
              </Link>

              <div className="flex h-12 items-center justify-center rounded-xl bg-[#FFB347] text-sm font-semibold text-[#1B1F3B] shadow-lg">
                เวลาออก
              </div>
            </div>

            <form onSubmit={hdlSubmit} className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-white/40">วันที่</p>
                <input
                  disabled
                  type="text"
                  value={moment(now).locale('th').format('dddd ll')}
                  className="mt-1 w-full bg-transparent text-lg font-semibold text-white outline-none"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-white/40">เวลา</p>
                <input
                  disabled
                  type="text"
                  value={moment(now).locale('th').format('LTS')}
                  className="mt-1 w-full bg-transparent text-lg font-semibold text-white outline-none"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-white/40">ประเภทการออกงาน</p>

                <select
                  value={checkoutType}
                  onChange={(e) => setCheckoutType(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#11152E] px-4 text-sm font-semibold text-white outline-none"
                >
                  <option value="" className="bg-[#11152E]">
                    เลือกกะออกงาน
                  </option>

                  <option value="WORK" className="bg-[#11152E]">
                    {currentShift
                      ? `${currentShift.checkInTime} - ${currentShift.checkOutTime}`
                      : 'Check-out งานประจำ'}
                  </option>

                  {showOTOption && (
                    <option value="OT" className="bg-[#11152E]">
                      OT
                    </option>
                  )}
                </select>

                {activeOvertime && (
                  <p className="mt-2 text-xs text-cyan-300">
                    มี OT ที่กำลังทำอยู่ สามารถเลือก OT เพื่อจบงานล่วงเวลาได้
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-white/40">หมายเหตุ</p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    isOvertimeMode
                      ? 'เช่น จบงานจัดเลี้ยง / ปิดร้านเรียบร้อย / เคลียร์ออเดอร์เสร็จ'
                      : 'เช่น ออกก่อนเวลา / มีธุระ / เหตุผลเพิ่มเติม'
                  }
                  rows={3}
                  className="mt-2 w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                />
              </div>

              <button
                type="submit"
                className={`mt-2 flex h-14 w-full items-center justify-center rounded-2xl text-base font-bold transition hover:scale-[1.01] active:scale-[0.98] ${
                  isOvertimeMode
                    ? 'bg-cyan-300 text-[#11152E] shadow-[0_0_30px_rgba(103,232,249,0.22)]'
                    : 'bg-[#FFB347] text-[#1B1F3B] shadow-[0_0_30px_rgba(255,179,71,0.22)]'
                }`}
              >
                {isOvertimeMode ? 'End OT' : 'Check-Out'}
              </button>
            </form>

            <div
              className={`mt-5 rounded-2xl border p-4 ${
                isOvertimeMode
                  ? 'border-cyan-400/20 bg-cyan-400/10'
                  : 'border-[#FFB347]/20 bg-[#FFB347]/10'
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  isOvertimeMode ? 'text-cyan-300' : 'text-[#FFB347]'
                }`}
              >
                {isOvertimeMode ? 'End OT Reminder' : 'Check-Out Reminder'}
              </p>

              <p className="mt-1 text-xs leading-relaxed text-white/45">
                {isOvertimeMode
                  ? 'ระบบจะบันทึกเวลาสิ้นสุด OT ของคุณ'
                  : 'ระบบจะบันทึกเวลาสิ้นสุดการทำงานปกติของคุณ'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckOut