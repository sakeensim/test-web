import React from 'react'
import { Route, Routes } from 'react-router'

import Layout from '../layouts/Layout'
import Login from '../pages/Login'

import Profile from '../userPage/Profile'
import CheckIn from '../userPage/CheckIn'
import CheckOut from '../userPage/CheckOut'
import DayOff from '../userPage/DayOff'
import AdvanceSalary from '../userPage/AdvanceSalary'
import UserHistoryPage from '../userPage/UserHistoryPage'

import AdminApprovalPage from '../adminPage/AdminApprovalPage'
import Dashboard from '../adminPage/Dashboard'
import UserManagement from '../adminPage/UserManagement'
import WorkTimeRecord from '../adminPage/WorkTimeRecord'
import OrganizationSettings from '../adminPage/OrganizationSettings'
import HolidayPage from '../adminPage/HolidayPage'
import CalendarPage from '../adminPage/CalendarPage'
import ProtectRoutes from './ProtectRoutes'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/user"
        element={
          <ProtectRoutes
            el={<Layout />}
            allows={['OWNER', 'ADMIN', 'USER']}
          />
        }
      >
        <Route index element={<Profile />} />
        <Route path="check-in" element={<CheckIn />} />
        <Route path="check-out" element={<CheckOut />} />
        <Route path="day-off" element={<DayOff />} />
        <Route path="advancd-salary" element={<AdvanceSalary />} />
        <Route path="history" element={<UserHistoryPage />} />
        <Route path="calendar" element={<CalendarPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectRoutes
            el={<Layout />}
            allows={['OWNER', 'ADMIN']}
          />
        }
      >
        <Route index element={<AdminApprovalPage />} />
        <Route path="dashboard" element={<Dashboard />} />

        <Route
            path="user-management"
            element={<UserManagement />}
        />

        <Route path="work-time-record" element={<WorkTimeRecord />} />
        <Route path="organization" element={<OrganizationSettings />} />
        <Route path="holiday" element={<HolidayPage />} />
        <Route path="calendar" element={<CalendarPage />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes