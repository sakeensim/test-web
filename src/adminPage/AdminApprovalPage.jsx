import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import API_URL from '../utils/api'
import useAuthStore from '../store/auth-store'
import { createAlert } from '../utils/createAlert'

function AdminApprovalPage() {
  const [requests, setRequests] = useState([])
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    if (token) {
      fetchRequests()
      fetchBranches()
    }
  }, [token])

  const fetchRequests = async () => {
    try {
      setLoading(true)

      const response = await axios.get(`${API_URL}/admin/pending-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setRequests(response.data.data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
      createAlert('error', 'โหลดคำขอไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/branches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setBranches(response.data.data || response.data.result || [])
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const filteredRequests = useMemo(() => {
    if (selectedBranch === 'all') return requests

    return requests.filter((request) => {
      const branchId =
        request.employee?.branchId ||
        request.employee?.branch?.id ||
        request.branchId

      return String(branchId) === String(selectedBranch)
    })
  }, [requests, selectedBranch])

  const handleApprove = async (id, type) => {
    try {
      setActionLoading(`${type}-${id}`)

      await axios.patch(
        `${API_URL}/admin/${type}-approve/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      createAlert('success', 'Approved successfully')
      fetchRequests()
    } catch (error) {
      console.error('Error approving request:', error)

      createAlert(
        'error',
        error.response?.data?.message || 'Approve failed'
      )
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id, type) => {
    try {
      setActionLoading(`${type}-${id}`)

      await axios.patch(
        `${API_URL}/admin/${type}-reject/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      createAlert('success', 'Rejected successfully')
      fetchRequests()
    } catch (error) {
      console.error('Error rejecting request:', error)

      createAlert(
        'error',
        error.response?.data?.message || 'Reject failed'
      )
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="min-h-dvh w-full p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FFB347]">
              Admin Panel
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white">
              Approval Requests
            </h1>

            <p className="mt-2 text-white/45">
              ตรวจสอบคำขอวันลาและเงินเบิกล่วงหน้าของพนักงาน
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#11152E]/90 px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
              Filter Branch
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
        </div>

        {loading ? (
          <div className="flex h-60 items-center justify-center rounded-[2rem] border border-white/10 bg-[#11152E]/90">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#00B8A9]" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-[#11152E]/90 p-8 text-center shadow-2xl">
            <p className="text-xl font-semibold text-white">
              No pending requests
            </p>

            <p className="mt-2 text-white/40">
              ตอนนี้ยังไม่มีคำขอที่รออนุมัติ
            </p>
          </div>
        ) : (
          <div className="max-h-[72vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredRequests.map((request) => {
                const isSalary = request.type === 'salary'
                const actionKey = `${isSalary ? 'salary' : 'dayoff'}-${request.id}`
                const isActionLoading = actionLoading === actionKey

                return (
                  <div
                    key={`${request.type}-${request.id}`}
                    className="rounded-[2rem] border border-white/10 bg-[#11152E]/90 p-5 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05]">
                        {request.employee?.profileImage ? (
                          <img
                            src={request.employee.profileImage}
                            alt="profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#00B8A9]/15 text-2xl font-bold text-[#00B8A9]">
                            {request.employee?.firstName?.charAt(0) ||
                              request.employee?.firstname?.charAt(0) ||
                              '?'}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold text-white">
                          {request.employee?.firstName ||
                            request.employee?.firstname ||
                            '-'}{' '}
                          {request.employee?.lastName ||
                            request.employee?.lastname ||
                            ''}
                        </h3>

                        <span
                          className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            isSalary
                              ? 'bg-[#FFB347]/15 text-[#FFB347]'
                              : 'bg-[#00B8A9]/15 text-[#00B8A9]'
                          }`}
                        >
                          {isSalary ? 'Advance Salary' : 'Day Off'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {isSalary ? (
                        <>
                          <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-4">
                            <p className="text-xs text-white/40">Amount</p>

                            <p className="mt-1 text-3xl font-bold text-[#FFB347]">
                              {Number(request.amount).toLocaleString()} ฿
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-4">
                            <p className="text-xs text-white/40">
                              Request Date
                            </p>

                            <p className="mt-1 text-white">
                              {new Date(
                                request.requestDate
                              ).toLocaleDateString('th-TH')}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-4">
                            <p className="text-xs text-white/40">Reason</p>

                            <p className="mt-1 text-white">
                              {request.reason || 'No reason provided'}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-4">
                            <p className="text-xs text-white/40">Date</p>

                            <p className="mt-1 text-white">
                              {request.startDate
                                ? new Date(
                                    request.startDate
                                  ).toLocaleDateString('th-TH')
                                : request.date
                                  ? new Date(
                                      request.date
                                    ).toLocaleDateString('th-TH')
                                  : 'No date specified'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <button
                        disabled={isActionLoading}
                        onClick={() =>
                          handleApprove(
                            request.id,
                            isSalary ? 'salary' : 'dayoff'
                          )
                        }
                        className="h-12 rounded-2xl bg-[#00B8A9] font-semibold text-[#071B1A] transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isActionLoading ? 'Saving...' : 'Approve'}
                      </button>

                      <button
                        disabled={isActionLoading}
                        onClick={() =>
                          handleReject(
                            request.id,
                            isSalary ? 'salary' : 'dayoff'
                          )
                        }
                        className="h-12 rounded-2xl border border-red-400/20 bg-red-400/10 font-semibold text-red-300 transition hover:bg-red-400/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminApprovalPage