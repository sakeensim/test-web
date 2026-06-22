import React from 'react'
import { Outlet } from 'react-router'
import Sidebar from '../components/Sidebar'
import BottomNavbar from '../components/BottomNavbar'

function Layout() {
  return (
    <div className="relative min-h-dvh bg-[#F5F8FD] text-[#0F172A]">
      <div className="flex min-h-dvh">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <main className="relative z-0 flex-1 min-w-0 overflow-x-hidden pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      <BottomNavbar />
    </div>
  )
}

export default Layout