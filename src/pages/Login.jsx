import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import useAuthStore from '../store/auth-store'
import { createAlert } from '../utils/createAlert'

import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../../firebase'

function Login() {
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle)
  const navigate = useNavigate()

  const roleDirect = (role) => {
    if (role === 'USER') {
      navigate('/user')
    } else if (role === 'ADMIN' || role == 'OWNER') {
      navigate('/admin')
    }else{
      navigate('/')
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)

      const idToken = await result.user.getIdToken()

      const res = await loginWithGoogle(idToken)

      if (res.success) {
        roleDirect(res.role)
        createAlert('success', 'Google Login Success')
      } else {
        createAlert('error', res.message)
      }

    } catch (error) {
      console.log(error)
      createAlert('error', 'Google Login Failed')
    }
  }

  return (
  <div className="min-h-dvh bg-[#1B1F3B] text-white">
    <div className="mx-auto flex min-h-dvh max-w-6xl items-center justify-center px-4 py-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="hidden lg:block">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FFB347]">
            WorkPal
          </p>

          <h1 className="mt-4 max-w-xl text-5xl font-bold leading-tight">
            Manage your workday with clarity.
          </h1>

          <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/50">
            ระบบลงเวลา ขอลา และจัดการข้อมูลพนักงานสำหรับทีมของคุณ
          </p>

          <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-2xl font-bold text-[#00B8A9]">GPS</p>
              <p className="mt-1 text-xs text-white/40">Check-in</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-2xl font-bold text-[#FFB347]">HR</p>
              <p className="mt-1 text-xs text-white/40">Approval</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-2xl font-bold text-white">Pay</p>
              <p className="mt-1 text-xs text-white/40">Salary</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#11152E]/90 p-6 shadow-2xl backdrop-blur-xl">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00B8A9]/15 text-2xl font-bold text-[#00B8A9]">
              WP
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#FFB347]">
              Welcome back
            </p>

            <h2 className="mt-2 text-3xl font-bold text-white">
              Login to WorkPal
            </h2>

            <p className="mt-2 text-sm text-white/40">
              เข้าสู่ระบบด้วยบัญชี Google ที่ได้รับอนุญาต
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="mt-8 flex h-14 w-full items-center justify-center rounded-2xl border border-white/10 bg-white text-base font-semibold text-[#1B1F3B] shadow-lg transition hover:scale-[1.01] active:scale-[0.98]"
          >
            Login with Google
          </button>

          <div className="mt-5 rounded-2xl border border-[#FFB347]/20 bg-[#FFB347]/10 p-4">
            <p className="text-sm font-medium text-[#FFB347]">
              Secure Access
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/45">
              เฉพาะอีเมลที่แอดมินเพิ่มไว้ในระบบเท่านั้นที่สามารถเข้าสู่ระบบได้
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)
}

export default Login