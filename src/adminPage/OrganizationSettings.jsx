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
import { Building2, MapPin, Trash2, Edit3, Plus } from 'lucide-react'

import 'leaflet/dist/leaflet.css'
import 'leaflet-control-geocoder'
import 'leaflet-control-geocoder/dist/Control.Geocoder.css'

import API_URL from '../utils/api'
import useAuthStore from '../store/auth-store'
import { createAlert } from '../utils/createAlert'

const DEFAULT_FORM = {
  name: '',
  code: '',
  address: '',
  lat: 6.57095,
  lng: 101.29689,
  radius: 100,
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
  const [positionForm, setPositionForm] = useState({
    name: '',
    description: '',
    checkInTime: '08:00',
    checkOutTime: '17:00',
    maxDayOffPerMonth: 6,
  })
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false)
  const position = {
    lat: Number(form.lat) || DEFAULT_FORM.lat,
    lng: Number(form.lng) || DEFAULT_FORM.lng,
  }
  const fetchPositions = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/positions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      fetchBranches();
      fetchPositions();
    }
  }, [token])

  const hdlChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const hdlSelectLocation = ({ lat, lng }) => {
    setForm({
      ...form,
      lat,
      lng,
    })
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

  const hdlCancel = () => {
    setForm(DEFAULT_FORM)
    setEditingId(null)
  }
  const createPosition = async (e) => {
    e.preventDefault()

    try {
      await axios.post(
        `${API_URL}/admin/position`,
        positionForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      createAlert('success', 'Create position success')

      setPositionForm({
        name: '',
        description: '',
        checkInTime: '08:00',
        checkOutTime: '17:00',
        maxDayOffPerMonth: 6,
      })

      fetchPositions()
    } catch (error) {
      console.log(error)
      createAlert('error', 'Create position failed')
    }
  }
  const deletePosition = async (id) => {
  try {
    await axios.delete(
      `${API_URL}/admin/position/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    createAlert('success', 'Delete position success')

    fetchPositions()
  } catch (error) {
    console.log(error)

    createAlert('error', 'Delete position failed')
  }
}

  return (
  <div className="min-h-screen w-full">
    <div className="mx-auto max-w-7xl">
      {/* HEADER */}
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
      {/* MAIN GRID */}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        {/* BRANCHES */}
        <div className="rounded-[2rem] border border-white/10 bg-[#11152E]/90 p-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">
                Branches
              </h2>

              <span className="rounded-xl bg-[#FFB347]/10 px-3 py-1 text-sm font-semibold text-[#FFB347]">
                {branches.length}
              </span>
            </div>

            <button
              onClick={() => {
                setEditingId(null)
                setForm(DEFAULT_FORM)
                setIsBranchModalOpen(true)
              }}
              className="rounded-xl bg-[#FFB347] px-4 py-2 text-sm font-bold text-[#1B1F3B] transition hover:scale-[1.02]"
            >
              + Add
            </button>
          </div>

          <div className="mt-5 max-h-[500px] space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
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
                      onClick={() => {
                        hdlEdit(branch)
                        setIsBranchModalOpen(true)
                      }}
                      className="flex-1 rounded-2xl bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08]"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => hdlDelete(branch.id)}
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

        {/* POSITIONS */}
        <div className="rounded-[2rem] border border-white/10 bg-[#11152E]/90 p-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              Positions
            </h2>

            <span className="rounded-xl bg-[#00B8A9]/10 px-3 py-1 text-sm font-semibold text-[#00B8A9]">
              {positions.length}
            </span>
          </div>

          {/* ADD POSITION */}
          <form
            onSubmit={createPosition}
            className="mt-5 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <input
              value={positionForm.name}
              onChange={(e) =>
                setPositionForm({
                  ...positionForm,
                  name: e.target.value,
                })
              }
              placeholder="Position name"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/30"
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
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/30"
            />

            <div className="grid grid-cols-2 gap-3">
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
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
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
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                />
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
                  placeholder="Max day off per month"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="h-14 w-full rounded-2xl bg-[#FFB347] text-lg font-bold text-[#1B1F3B] transition hover:scale-[1.01]"
            >
              Add Position
            </button>
          </form>

          {/* POSITION LIST */}
          <div className="mt-6 max-h-[500px] space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {positions.map((position) => (
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
                    onClick={() => deletePosition(position.id)}
                    className="flex h-12 items-center rounded-xl bg-red-400/10 px-4 text-sm font-semibold text-red-300 transition hover:bg-red-400/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BRANCH MODAL */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/70 p-4 backdrop-blur-sm">
          <div className="mx-auto overflow-hidden rounded-[2rem] border border-white/10 bg-[#11152E] shadow-2xl lg:max-w-6xl">
            <div className="grid lg:grid-cols-[1fr_420px]">
              {/* MAP */}
              <div className="relative h-[500px] lg:h-[700px]">
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

              {/* FORM */}
              <form
                onSubmit={hdlSubmit}
                className="flex flex-col p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-[#FFB347]">
                      Branch Setup
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-white">
                      {editingId
                        ? 'Edit Branch'
                        : 'Add Branch'}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBranchModalOpen(false)}
                    className="rounded-xl bg-white/5 px-4 py-2 text-white/70"
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
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none"
                  />

                  <input
                    name="code"
                    value={form.code}
                    onChange={hdlChange}
                    placeholder="Branch code"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none"
                  />

                  <textarea
                    name="address"
                    value={form.address}
                    onChange={hdlChange}
                    placeholder="Address"
                    rows={4}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none"
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
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none"
                  />
                </div>

                <div className="mt-auto flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsBranchModalOpen(false)}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 font-semibold text-white/70"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-2xl bg-[#FFB347] px-4 py-4 font-bold text-[#1B1F3B]"
                  >
                    {loading
                      ? 'Saving...'
                      : 'Confirm Location & Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
)
}

export default OrganizationSettings