import React from 'react'
import { Outlet } from 'react-router'
import Sidebar from '../components/Sidebar'

function Layout() {
  return (
    <div className="relative min-h-screen bg-[#1B1F3B] text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="relative z-0 flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout