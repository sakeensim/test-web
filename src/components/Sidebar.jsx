import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/auth-store'

import {
  LogOut,
  History as HistoryIcon,
  CalendarDays,
  FileCheck,
  Menu,
  X,
  Building2,
} from 'lucide-react'

import {
  ApprovedIcon,
  CheckinIcon,
  CheckoutIcon,
  DashboardIcon,
  DayoffIcon,
  ProfileIcon,
  SalaryIcon,
  UserManageIcon,
} from '../icon/icon'

function Sidebar() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const location = useLocation()
  const navigate = useNavigate()

  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768

      setIsMobile(mobile)
      setIsExpanded(!mobile)
    }

    checkIfMobile()

    window.addEventListener('resize', checkIfMobile)

    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  const hdlLogout = () => {
    logout()
    navigate('/')
  }

  const menuItems = [
    {
      to: '/user',
      icon: <ProfileIcon className="w-5 h-5" />,
      label: 'Profile',
    },
    {
      to: '/user/check-in',
      icon: <CheckinIcon className="w-5 h-5" />,
      label: 'Check-In',
    },
    {
      to: '/user/check-out',
      icon: <CheckoutIcon className="w-5 h-5" />,
      label: 'Check-Out',
    },
    {
      to: '/user/advancd-salary',
      icon: <SalaryIcon className="w-5 h-5" />,
      label: 'Advance Salary',
    },
    {
      to: '/user/day-off',
      icon: <DayoffIcon className="w-5 h-5" />,
      label: 'Day-Off',
    },
    {
      to: '/user/history',
      icon: <HistoryIcon className="w-5 h-5" />,
      label: 'History',
    },
  ]

  const adminItems = [
    {
      to: '/admin',
      icon: <ApprovedIcon className="w-5 h-5" />,
      label: 'Approved',
    },
    {
      to: '/admin/dashboard',
      icon: <DashboardIcon className="w-5 h-5" />,
      label: 'Dashboard',
    },

    ...(user?.role === 'OWNER'
      ? [
          {
            to: '/admin/user-management',
            icon: <UserManageIcon className="w-5 h-5" />,
            label: 'User Management',
          },
        ]
      : []),

    {
      to: '/admin/Work-time-record',
      icon: <FileCheck className="w-5 h-5" />,
      label: 'Worktime Record',
    },
    {
      to: '/admin/holiday',
      icon: <CalendarDays className="w-5 h-5" />,
      label: 'Holiday',
    },
    {
      to: '/admin/organization',
      icon: <Building2 className="w-5 h-5" />,
      label: 'Organization',
    },
  ]

  const allMenuItems = [
    ...menuItems,
    ...(user?.role === 'ADMIN' || user?.role === 'OWNER' ? adminItems : []),
  ]

  return (
    <>
      {isMobile && isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          fixed top-4 left-4 z-[9999]
          p-3 rounded-2xl
          bg-[#FFB347]
          text-[#1B1F3B]
          shadow-lg
          hover:scale-105
          transition-all duration-300
        "
      >
        {isExpanded ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside
        className={`
          fixed md:sticky top-0 left-0 z-[9999] h-screen shrink-0
          bg-[#11152E]/95
          backdrop-blur-xl
          border-r border-white/5
          transition-all duration-300
          flex flex-col

          ${
            isExpanded
              ? 'w-64 translate-x-0'
              : 'w-0 md:w-64 -translate-x-full md:translate-x-0'
          }

          overflow-hidden
        `}
      >
        <div className="flex items-center h-20 px-6">
          <h1 className="text-3xl font-bold tracking-wide">
            <span className="text-[#00B8A9]">Work</span>
            <span className="text-white">Pal</span>
          </h1>
        </div>

        <div className="flex-1 px-3 space-y-2">
          {allMenuItems.map((item) => {
            const active = location.pathname === item.to

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => isMobile && setIsExpanded(false)}
                className={`
                  group relative flex items-center gap-4
                  px-4 py-3 rounded-2xl
                  transition-all duration-300 overflow-hidden

                  ${
                    active
                      ? `
                        bg-gradient-to-r 
                        from-[#FFB347]/15 
                        to-transparent
                        text-[#FFB347]
                        border border-[#FFB347]/10
                        shadow-[0_0_30px_rgba(255,179,71,0.10)]
                      `
                      : `
                        text-white/65
                        hover:text-white
                        hover:bg-white/[0.03]
                      `
                  }
                `}
              >
                {active && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-[#FFB347]" />
                )}

                <div
                  className={`
                    transition-all duration-300

                    ${
                      active
                        ? 'text-[#FFB347] scale-110'
                        : 'text-white/60 group-hover:text-white'
                    }
                  `}
                >
                  {item.icon}
                </div>

                {isExpanded && (
                  <span
                    className={`
                      text-sm font-medium tracking-wide
                      transition-all duration-300

                      ${
                        active
                          ? 'text-[#FFB347]'
                          : 'text-white/70 group-hover:text-white'
                      }
                    `}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-white/5">
          {isExpanded && (
            <div className="text-xs text-white/30 tracking-wide">
              WorkPal v1.0
            </div>
          )}

          <button
            onClick={hdlLogout}
            className="
              flex w-full items-center gap-3
              rounded-2xl px-4 py-3
              text-white/60
              hover:bg-red-400/10
              hover:text-red-300
              transition-all
            "
          >
            <LogOut className="w-5 h-5" />

            {isExpanded && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar