import React, { useEffect, useState } from 'react'
import axios from 'axios'
import L from 'leaflet'
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet'

import 'leaflet/dist/leaflet.css'
import 'leaflet-control-geocoder'
import 'leaflet-control-geocoder/dist/Control.Geocoder.css'

import API_URL from '../utils/api'
import useAuthStore from '../store/auth-store'
import { createAlert } from '../utils/createAlert'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_FORM = {
  name: '',
  code: '',
  address: '',
  lat: 0,
  lng: 0,
  radius: 100,
}

const DEFAULT_POSITION_FORM = {
  name: '',
  description: '',
  checkInTime: '08:00',
  checkOutTime: '17:00',
  maxDayOffPerMonth: 6,
}

function SearchControl({ onSelect }) {
  const map = useMap()

  useEffect(() => {
    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: false,
      placeholder: 'Search branch location...',
    })

    geocoder.on('markgeocode', (e) => {
      const { lat, lng } = e.geocode.center
      onSelect({ lat, lng })
      map.setView([lat, lng], 17)
    })

    geocoder.addTo(map)

    const input = geocoder.getContainer()?.querySelector('input')

    if (input) {
      input.style.backgroundColor = 'white'
      input.style.color = '#11152E'
      input.style.borderRadius = '16px'
      input.style.padding = '12px 16px'
      input.style.fontWeight = '600'
      input.style.width = '240px'
      input.style.border = 'none'
      input.style.outline = 'none'
    }

    return () => map.removeControl(geocoder)
  }, [map, onSelect])

  return null
}

function ChangeMapView({ position }) {
  const map = useMap()

  useEffect(() => {
    map.setView([position.lat, position.lng], map.getZoom())
  }, [map, position])

  return null
}

function LocationPicker({ position, radius, onSelect }) {
  useMapEvents({
    click(e) {
      onSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      })
    },
  })

  return (
    <>
      <Marker position={[position.lat, position.lng]} />
      <Circle center={[position.lat, position.lng]} radius={Number(radius)} />
    </>
  )
}

function OrganizationSettings() {
  const token = useAuthStore((state) => state.token)

  const [branches, setBranches] = useState([])
  const [form, setForm] = useState(DEFAULT_FORM)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)

  const [positions, setPositions] = useState([])
  const [positionForm, setPositionForm] = useState(DEFAULT_POSITION_FORM)
  const [editingPositionId, setEditingPositionId] = useState(null)
  const [positionLoading, setPositionLoading] = useState(false)

  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false)
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false)
  const [deletePositionId, setDeletePositionId] = useState(null)
  const [deleteBranchId, setDeleteBranchId] = useState(null)
  const position = {
    lat: Number(form.lat) || DEFAULT_FORM.lat,
    lng: Number(form.lng) || DEFAULT_FORM.lng,
  }

  const fetchPositions = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/positions`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setPositions(res.data.data || [])
    } catch (error) {
      console.log(error)
    }
  }

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setBranches(res.data.data || [])
    } catch (error) {
      console.log(error)
      createAlert('error', 'โหลดข้อมูลสาขาไม่สำเร็จ')
    }
  }

  useEffect(() => {
    if (token) {
      fetchBranches()
      fetchPositions()
    }
  }, [token])

  const hdlChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const hdlSelectLocation = ({ lat, lng }) => {
    setForm((prev) => ({
      ...prev,
      lat,
      lng,
    }))
  }

  const openAddBranchModal = () => {
    setEditingId(null)
    setForm(DEFAULT_FORM)
    setIsBranchModalOpen(true)

    if (!navigator.geolocation) {
      createAlert('error', 'เครื่องนี้ไม่รองรับ Location')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }))

        createAlert('success', 'ดึงตำแหน่งเครื่องสำเร็จ')
      },
      (error) => {
        console.log(error)
        createAlert('error', 'กรุณาอนุญาต Location ใน Browser')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const hdlSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      const payload = {
        name: form.name,
        code: form.code,
        address: form.address,
        lat: Number(form.lat),
        lng: Number(form.lng),
        radius: Number(form.radius),
      }

      if (editingId) {
        await axios.patch(`${API_URL}/admin/branch/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })

        createAlert('success', 'อัปเดตสาขาสำเร็จ')
      } else {
        await axios.post(`${API_URL}/admin/branch`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })

        createAlert('success', 'เพิ่มสาขาสำเร็จ')
      }

      setForm(DEFAULT_FORM)
      setEditingId(null)
      setIsBranchModalOpen(false)
      fetchBranches()
    } catch (error) {
      console.log(error)
      createAlert('error', error.response?.data?.message || 'บันทึกสาขาไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  const hdlEdit = (branch) => {
    setEditingId(branch.id)

    setForm({
      name: branch.name || '',
      code: branch.code || '',
      address: branch.address || '',
      lat: branch.lat,
      lng: branch.lng,
      radius: branch.radius || 100,
    })

    setIsBranchModalOpen(true)
  }

  const hdlDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/admin/branch/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      createAlert('success', 'ลบสาขาสำเร็จ')
      fetchBranches()
    } catch (error) {
      console.log(error)
      createAlert('error', 'ลบสาขาไม่สำเร็จ')
    }
  }

  const resetPositionForm = () => {
    setPositionForm(DEFAULT_POSITION_FORM)
    setEditingPositionId(null)
  }

  const openAddPositionModal = () => {
    resetPositionForm()
    setIsPositionModalOpen(true)
  }

  const submitPosition = async (e) => {
    e.preventDefault()

    try {
      setPositionLoading(true)

      const payload = {
        name: positionForm.name,
        description: positionForm.description,
        checkInTime: positionForm.checkInTime,
        checkOutTime: positionForm.checkOutTime,
        maxDayOffPerMonth: Number(positionForm.maxDayOffPerMonth),
      }

      if (editingPositionId) {
        await axios.patch(`${API_URL}/admin/position/${editingPositionId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })

        createAlert('success', 'Update position success')
      } else {
        await axios.post(`${API_URL}/admin/position`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })

        createAlert('success', 'Create position success')
      }

      resetPositionForm()
      setIsPositionModalOpen(false)
      fetchPositions()
    } catch (error) {
      console.log(error)
      createAlert(
        'error',
        error.response?.data?.message ||
          (editingPositionId ? 'Update position failed' : 'Create position failed')
      )
    } finally {
      setPositionLoading(false)
    }
  }

  const editPosition = (position) => {
    setEditingPositionId(position.id)

    setPositionForm({
      name: position.name || '',
      description: position.description || '',
      checkInTime: position.checkInTime || '08:00',
      checkOutTime: position.checkOutTime || '17:00',
      maxDayOffPerMonth: position.maxDayOffPerMonth ?? 6,
    })

    setIsPositionModalOpen(true)
  }

  const deletePosition = async (id) => {
    try {
      await axios.delete(`${API_URL}/admin/position/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      createAlert('success', 'Delete position success')

      if (editingPositionId === id) {
        resetPositionForm()
      }

      setDeletePositionId(null)
      fetchPositions()
    } catch (error) {
      console.log(error)
      createAlert('error', 'Delete position failed')
    }
  }

  return (
    <div className="min-h-dvh w-full">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FFB347]">
              Admin Panel
            </p>

            <h1 className="mt-2 text-4xl font-bold text-white">
              Organization Settings
            </h1>

            <p className="mt-2 text-white/40">
              จัดการสาขา ตำแหน่งงาน และเวลาการทำงานของพนักงาน
            </p>
          </div>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-[#11152E]/90 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">Branches</h2>

                <span className="rounded-xl bg-[#FFB347]/10 px-3 py-1 text-sm font-semibold text-[#FFB347]">
                  {branches.length}
                </span>
              </div>

              <button
                onClick={openAddBranchModal}
                className="rounded-xl bg-[#FFB347] px-4 py-2 text-sm font-bold text-[#1B1F3B] transition hover:scale-[1.02]"
              >
                + Add
              </button>
            </div>

            <div className="mt-5 max-h-[500px] space-y-4 overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:rgba(255,179,71,0.45)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#FFB347]/30">
              {branches.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center text-white/30">
                  ยังไม่มีสาขา
                </div>
              ) : (
                branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#FFB347]/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {branch.name}
                        </h3>

                        <p className="mt-1 text-sm text-white/40">
                          {branch.code}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#00B8A9]/10 px-3 py-1 text-xs font-semibold text-[#00B8A9]">
                        {branch.radius}m
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-white/50">
                      {branch.address || 'No address'}
                    </p>

                    <div className="mt-5 flex gap-3">
                      <button
                        onClick={() => hdlEdit(branch)}
                        className="flex-1 rounded-2xl bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08]"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => setDeleteBranchId(branch.id)}
                        className="flex-1 rounded-2xl bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-400/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#11152E]/90 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">Positions</h2>

                <span className="rounded-xl bg-[#00B8A9]/10 px-3 py-1 text-sm font-semibold text-[#00B8A9]">
                  {positions.length}
                </span>
              </div>

              <button
                onClick={openAddPositionModal}
                className="rounded-xl bg-[#FFB347] px-4 py-2 text-sm font-bold text-[#1B1F3B] transition hover:scale-[1.02]"
              >
                + Add
              </button>
            </div>

            <div className="mt-5 max-h-[500px] space-y-4 overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:rgba(255,179,71,0.45)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#FFB347]/30">
              {positions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center text-white/30">
                  ยังไม่มีตำแหน่ง
                </div>
              ) : (
                positions.map((position) => (
                  <div
                    key={position.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                  >
                    <h3 className="text-xl font-bold text-white">
                      {position.name}
                    </h3>

                    <p className="mt-1 text-sm text-white/40">
                      {position.description || 'No description'}
                    </p>

                    <div className="mt-5 flex flex-wrap items-stretch gap-2">
                      <div className="flex h-12 items-center rounded-xl bg-[#00B8A9]/10 px-4 text-sm font-semibold text-[#00B8A9]">
                        IN {position.checkInTime}
                      </div>

                      <div className="flex h-12 items-center rounded-xl bg-[#FFB347]/10 px-4 text-sm font-semibold text-[#FFB347]">
                        OUT {position.checkOutTime}
                      </div>

                      <div className="flex h-12 items-center rounded-xl bg-blue-400/10 px-4 text-sm font-semibold text-blue-300">
                        DAY OFF {position.maxDayOffPerMonth}
                      </div>

                      <button
                        onClick={() => editPosition(position)}
                        className="flex h-12 items-center rounded-xl bg-white/[0.06] px-4 text-sm font-semibold text-white/70 transition hover:bg-white/[0.1]"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => setDeletePositionId(position.id)}
                        className="flex h-12 items-center rounded-xl bg-red-400/10 px-4 text-sm font-semibold text-red-300 transition hover:bg-red-400/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        {deleteBranchId && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#11152E] p-6 shadow-2xl">
              <h2 className="text-2xl font-bold text-white">Delete Branch</h2>

              <p className="mt-3 text-white/50">
                Are you sure you want to delete this branch?
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setDeleteBranchId(null)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 font-semibold text-white/70 transition hover:bg-white/[0.08]"
                >
                  Cancel
                </button>

                <button
                  onClick={async () => {
                    await hdlDelete(deleteBranchId)
                    setDeleteBranchId(null)
                  }}
                  className="flex-1 rounded-2xl bg-red-400/15 px-4 py-4 font-bold text-red-300 transition hover:bg-red-400/25"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
        {isPositionModalOpen && (
          <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
            <div className="flex min-h-dvh items-start justify-center py-6">
              <form
                onSubmit={submitPosition}
                className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#11152E] p-6 shadow-2xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-[#FFB347]">
                      Position Setup
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-white">
                      {editingPositionId ? 'Edit Position' : 'Add Position'}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPositionModalOpen(false)
                      resetPositionForm()
                    }}
                    className="rounded-xl bg-white/5 px-4 py-2 text-white/70 transition hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  <input
                    value={positionForm.name}
                    onChange={(e) =>
                      setPositionForm({
                        ...positionForm,
                        name: e.target.value,
                      })
                    }
                    placeholder="Position name"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none placeholder:text-white/30"
                  />

                  <input
                    value={positionForm.description}
                    onChange={(e) =>
                      setPositionForm({
                        ...positionForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Description"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none placeholder:text-white/30"
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs text-white/40">
                        Check-in Time
                      </p>

                      <input
                        type="time"
                        value={positionForm.checkInTime}
                        onChange={(e) =>
                          setPositionForm({
                            ...positionForm,
                            checkInTime: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none"
                      />
                    </div>

                    <div>
                      <p className="mb-2 text-xs text-white/40">
                        Check-out Time
                      </p>

                      <input
                        type="time"
                        value={positionForm.checkOutTime}
                        onChange={(e) =>
                          setPositionForm({
                            ...positionForm,
                            checkOutTime: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs text-white/40">
                      Max Day Off Per Month
                    </p>

                    <input
                      type="number"
                      min="0"
                      value={positionForm.maxDayOffPerMonth}
                      onChange={(e) =>
                        setPositionForm({
                          ...positionForm,
                          maxDayOffPerMonth: e.target.value,
                        })
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPositionModalOpen(false)
                      resetPositionForm()
                    }}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 font-semibold text-white/70 transition hover:bg-white/[0.08]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={positionLoading}
                    className="flex-1 rounded-2xl bg-[#FFB347] px-4 py-4 font-bold text-[#1B1F3B] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {positionLoading
                      ? 'Saving...'
                      : editingPositionId
                        ? 'Update Position'
                        : 'Add Position'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deletePositionId && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#11152E] p-6 shadow-2xl">
              <h2 className="text-2xl font-bold text-white">Delete Position</h2>

              <p className="mt-3 text-white/50">
                Are you sure you want to delete this position?
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setDeletePositionId(null)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 font-semibold text-white/70 transition hover:bg-white/[0.08]"
                >
                  Cancel
                </button>

                <button
                  onClick={() => deletePosition(deletePositionId)}
                  className="flex-1 rounded-2xl bg-red-400/15 px-4 py-4 font-bold text-red-300 transition hover:bg-red-400/25"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {isBranchModalOpen && (
          <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
            <div className="flex min-h-dvh items-start justify-center py-6">
              <div className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#11152E] shadow-2xl lg:max-w-6xl">
                <div className="grid max-h-[calc(100dvh-3rem)] overflow-y-auto lg:grid-cols-[1fr_420px]">
                  <div className="relative h-[420px] lg:h-auto lg:min-h-[700px]">
                    <MapContainer
                      center={[position.lat, position.lng]}
                      zoom={16}
                      className="h-full w-full"
                    >
                      <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      <SearchControl onSelect={hdlSelectLocation} />
                      <ChangeMapView position={position} />

                      <LocationPicker
                        position={position}
                        radius={form.radius}
                        onSelect={hdlSelectLocation}
                      />
                    </MapContainer>
                  </div>

                  <form onSubmit={hdlSubmit} className="flex flex-col p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-[#FFB347]">
                          Branch Setup
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-white">
                          {editingId ? 'Edit Branch' : 'Add Branch'}
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsBranchModalOpen(false)}
                        className="rounded-xl bg-white/5 px-4 py-2 text-white/70 transition hover:bg-white/10"
                      >
                        Close
                      </button>
                    </div>

                    <div className="mt-6 space-y-4">
                      <input
                        name="name"
                        value={form.name}
                        onChange={hdlChange}
                        placeholder="Branch name"
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none placeholder:text-white/30"
                      />

                      <input
                        name="code"
                        value={form.code}
                        onChange={hdlChange}
                        placeholder="Branch code"
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none placeholder:text-white/30"
                      />

                      <textarea
                        name="address"
                        value={form.address}
                        onChange={hdlChange}
                        placeholder="Address"
                        rows={4}
                        className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none placeholder:text-white/30"
                      />

                      <div className="rounded-2xl border border-[#00B8A9]/20 bg-[#00B8A9]/10 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#00B8A9]">
                          Selected Location
                        </p>

                        <p className="mt-2 text-sm text-white/70">
                          Lat {Number(form.lat).toFixed(5)}
                        </p>

                        <p className="text-sm text-white/70">
                          Lng {Number(form.lng).toFixed(5)}
                        </p>
                      </div>

                      <input
                        name="radius"
                        type="number"
                        value={form.radius}
                        onChange={hdlChange}
                        placeholder="Radius"
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none placeholder:text-white/30"
                      />
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsBranchModalOpen(false)}
                        className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 font-semibold text-white/70 transition hover:bg-white/[0.08]"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 rounded-2xl bg-[#FFB347] px-4 py-4 font-bold text-[#1B1F3B] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? 'Saving...' : 'Confirm & Save'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrganizationSettings