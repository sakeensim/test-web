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
  maxDayOffPerMonth: 6,
  allowOT: false,
  otCapMinutes: '',
}

const createEmptyShift = (overrides = {}) => ({
  id: null,
  name: '',
  checkInTime: '08:00',
  checkOutTime: '17:00',
  isDefault: false,
  isActive: true,
  ...overrides,
})

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
  const [positionShifts, setPositionShifts] = useState([
    createEmptyShift({ isDefault: true }),
  ])
  const [deletedShiftIds, setDeletedShiftIds] = useState([])
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

      setPositions(res.data.data || res.data.result || [])
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
    setPositionShifts([createEmptyShift({ isDefault: true })])
    setDeletedShiftIds([])
    setEditingPositionId(null)
  }

  const openAddPositionModal = () => {
    resetPositionForm()
    setIsPositionModalOpen(true)
  }

  const normalizeShiftName = (shift, index) => {
    const baseName = positionForm.name.trim() || 'position'

    if (shift.name?.trim()) return shift.name.trim()

    return index === 0 ? `${baseName}_shift` : `${baseName}_shift_${index + 1}`
  }

  const validatePosition = () => {
    if (!positionForm.name.trim()) {
      createAlert('error', 'กรุณากรอกชื่อตำแหน่ง')
      return false
    }

    if (positionForm.allowOT) {
      const cap = Number(positionForm.otCapMinutes || 0)

      if (cap <= 0) {
        createAlert('error', 'กรุณากำหนด OT Cap มากกว่า 0 นาที')
        return false
      }
    }

    if (positionShifts.length === 0) {
      createAlert('error', 'กรุณาเพิ่มกะอย่างน้อย 1 กะ')
      return false
    }

    const activeShifts = positionShifts.filter((shift) => shift.isActive)

    if (activeShifts.length === 0) {
      createAlert('error', 'ต้องมีกะที่ active อย่างน้อย 1 กะ')
      return false
    }

    const defaultShift = positionShifts.find((shift) => shift.isDefault)

    if (!defaultShift) {
      createAlert('error', 'กรุณาเลือก default shift')
      return false
    }

    if (!defaultShift.isActive) {
      createAlert('error', 'Default shift ต้องเป็น active')
      return false
    }

    const names = positionShifts.map((shift, index) =>
      normalizeShiftName(shift, index).toLowerCase()
    )

    const hasDuplicate = names.some((name, index) => names.indexOf(name) !== index)

    if (hasDuplicate) {
      createAlert('error', 'ชื่อกะซ้ำกัน กรุณาเปลี่ยนชื่อกะ')
      return false
    }

    return true
  }

  const buildShiftPayload = (shift, positionId, index) => ({
    name: normalizeShiftName(shift, index),
    checkInTime: shift.checkInTime,
    checkOutTime: shift.checkOutTime,
    positionId: Number(positionId),
    isDefault: Boolean(shift.isDefault),
    isActive: Boolean(shift.isActive),
  })

  const syncShifts = async (positionId, defaultShiftId = null) => {
    for (const shiftId of deletedShiftIds) {
      try {
        await axios.delete(`${API_URL}/admin/shift/${shiftId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch (error) {
        await axios.patch(
          `${API_URL}/admin/shift/${shiftId}`,
          { isActive: false },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
    }

    for (let index = 0; index < positionShifts.length; index++) {
      const shift = positionShifts[index]
      const payload = buildShiftPayload(shift, positionId, index)

      if (shift.id) {
        await axios.patch(`${API_URL}/admin/shift/${shift.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else if (defaultShiftId && shift.isDefault) {
        await axios.patch(`${API_URL}/admin/shift/${defaultShiftId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        await axios.post(`${API_URL}/admin/shift`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    }
  }

  const submitPosition = async (e) => {
    e.preventDefault()

    if (!validatePosition()) return

    try {
      setPositionLoading(true)

      const defaultShift =
        positionShifts.find((shift) => shift.isDefault) || positionShifts[0]

      const payload = {
        name: positionForm.name,
        description: positionForm.description,
        checkInTime: defaultShift.checkInTime,
        checkOutTime: defaultShift.checkOutTime,
        maxDayOffPerMonth: Number(positionForm.maxDayOffPerMonth),
        allowOT: Boolean(positionForm.allowOT),
        otCapMinutes: positionForm.allowOT
          ? Number(positionForm.otCapMinutes || 0)
          : null,
      }

      if (editingPositionId) {
        await axios.patch(`${API_URL}/admin/position/${editingPositionId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })

        await syncShifts(editingPositionId)

        createAlert('success', 'Update position success')
      } else {
        const res = await axios.post(`${API_URL}/admin/position`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const createdPosition = res.data.data || res.data.result || res.data.position
        const defaultShiftFromServer = res.data.defaultShift

        await syncShifts(createdPosition.id, defaultShiftFromServer?.id)

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
      maxDayOffPerMonth: position.maxDayOffPerMonth ?? 6,
      allowOT: Boolean(position.allowOT),
      otCapMinutes:
        position.otCapMinutes === null || position.otCapMinutes === undefined
          ? ''
          : String(position.otCapMinutes),
    })

    const mappedShifts =
      position.shifts?.length > 0
        ? position.shifts.map((shift) =>
            createEmptyShift({
              id: shift.id,
              name: shift.name || '',
              checkInTime: shift.checkInTime || '08:00',
              checkOutTime: shift.checkOutTime || '17:00',
              isDefault: Boolean(shift.isDefault),
              isActive: Boolean(shift.isActive),
            })
          )
        : [
            createEmptyShift({
              name: `${position.name}_shift`,
              checkInTime: position.checkInTime || '08:00',
              checkOutTime: position.checkOutTime || '17:00',
              isDefault: true,
            }),
          ]

    const hasDefault = mappedShifts.some((shift) => shift.isDefault)

    setPositionShifts(
      hasDefault
        ? mappedShifts
        : mappedShifts.map((shift, index) => ({
            ...shift,
            isDefault: index === 0,
          }))
    )

    setDeletedShiftIds([])
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

  const addShift = () => {
    setPositionShifts((prev) => [
      ...prev,
      createEmptyShift({
        checkInTime: prev[0]?.checkInTime || '08:00',
        checkOutTime: prev[0]?.checkOutTime || '17:00',
      }),
    ])
  }

  const updateShift = (index, key, value) => {
    setPositionShifts((prev) =>
      prev.map((shift, i) =>
        i === index
          ? {
              ...shift,
              [key]: value,
            }
          : shift
      )
    )
  }

  const setDefaultShift = (index) => {
    setPositionShifts((prev) =>
      prev.map((shift, i) => ({
        ...shift,
        isDefault: i === index,
        isActive: i === index ? true : shift.isActive,
      }))
    )
  }

  const toggleShiftActive = (index) => {
    const targetShift = positionShifts[index]

    if (targetShift.isDefault && targetShift.isActive) {
      createAlert('error', 'ไม่สามารถ inactive default shift ได้')
      return
    }

    updateShift(index, 'isActive', !targetShift.isActive)
  }

  const removeShift = (index) => {
    const targetShift = positionShifts[index]

    if (targetShift.isDefault) {
      createAlert('error', 'กรุณาเลือก default shift อื่นก่อนลบ')
      return
    }

    if (positionShifts.length <= 1) {
      createAlert('error', 'ต้องมีกะอย่างน้อย 1 กะ')
      return
    }

    if (targetShift.id) {
      setDeletedShiftIds((prev) => [...prev, targetShift.id])
    }

    setPositionShifts((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-dvh w-full px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#FFB347]">
            Admin Panel
          </p>

          <h1 className="mt-1 text-2xl font-bold text-white">
            Organization Settings
          </h1>

          <p className="mt-1 text-sm text-white/35">
            จัดการสาขา ตำแหน่ง และกะทำงาน
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-[#11152E]/90 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Branches</h2>
                <span className="rounded-full bg-[#FFB347]/10 px-2 py-0.5 text-[11px] font-bold text-[#FFB347]">
                  {branches.length}
                </span>
              </div>

              <button
                onClick={openAddBranchModal}
                className="rounded-xl bg-[#FFB347] px-3 py-2 text-xs font-bold text-[#1B1F3B]"
              >
                + Add
              </button>
            </div>

            <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {branches.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-white/30">
                  ยังไม่มีสาขา
                </div>
              ) : (
                branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-white">
                          {branch.name}
                        </h3>

                        <p className="mt-0.5 text-xs text-white/35">
                          {branch.code}
                        </p>
                      </div>

                      <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-bold text-cyan-300">
                        {branch.radius}m
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-1 text-xs text-white/40">
                      {branch.address || 'No address'}
                    </p>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => hdlEdit(branch)}
                        className="flex-1 rounded-xl bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white/65"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => setDeleteBranchId(branch.id)}
                        className="flex-1 rounded-xl bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#11152E]/90 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Positions</h2>
                <span className="rounded-full bg-[#00B8A9]/10 px-2 py-0.5 text-[11px] font-bold text-[#00B8A9]">
                  {positions.length}
                </span>
              </div>

              <button
                onClick={openAddPositionModal}
                className="rounded-xl bg-[#FFB347] px-3 py-2 text-xs font-bold text-[#1B1F3B]"
              >
                + Add
              </button>
            </div>

            <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {positions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-white/30">
                  ยังไม่มีตำแหน่ง
                </div>
              ) : (
                positions.map((position) => {
                  const activeShifts =
                    position.shifts?.filter((shift) => shift.isActive) || []

                  const defaultShift =
                    position.shifts?.find((shift) => shift.isDefault) ||
                    activeShifts[0] ||
                    null

                  return (
                    <div
                      key={position.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-white">
                            {position.name}
                          </h3>

                          <p className="mt-0.5 line-clamp-1 text-xs text-white/35">
                            {position.description || 'No description'}
                          </p>
                        </div>

                        <span className="rounded-full bg-blue-400/10 px-2 py-1 text-[10px] font-bold text-blue-300">
                          {position.maxDayOffPerMonth} OFF
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-xl bg-[#FFB347]/10 px-2.5 py-1 text-[11px] font-bold text-[#FFB347]">
                          {defaultShift?.checkInTime || '--:--'} -{' '}
                          {defaultShift?.checkOutTime || '--:--'}
                        </span>

                        <span className="rounded-xl bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-white/50">
                          {(position.shifts || []).length} shifts
                        </span>

                        {position.allowOT && (
                          <span className="rounded-xl bg-cyan-400/10 px-2.5 py-1 text-[11px] font-bold text-cyan-300">
                            OT {position.otCapMinutes || 0}m
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(position.shifts || []).slice(0, 3).map((shift) => (
                          <span
                            key={shift.id}
                            className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                              shift.isDefault
                                ? 'bg-[#FFB347]/15 text-[#FFB347]'
                                : shift.isActive
                                  ? 'bg-white/[0.05] text-white/55'
                                  : 'bg-white/[0.03] text-white/25'
                            }`}
                          >
                            {shift.checkInTime}-{shift.checkOutTime}
                          </span>
                        ))}

                        {(position.shifts?.length || 0) > 3 && (
                          <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[10px] font-semibold text-white/40">
                            +{position.shifts.length - 3}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => editPosition(position)}
                          className="flex-1 rounded-xl bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white/65"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => setDeletePositionId(position.id)}
                          className="flex-1 rounded-xl bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {deleteBranchId && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#11152E] p-5">
              <h2 className="text-lg font-bold text-white">Delete Branch</h2>

              <p className="mt-2 text-sm text-white/45">
                ลบสาขานี้ใช่หรือไม่
              </p>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setDeleteBranchId(null)}
                  className="flex-1 rounded-xl bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white/70"
                >
                  Cancel
                </button>

                <button
                  onClick={async () => {
                    await hdlDelete(deleteBranchId)
                    setDeleteBranchId(null)
                  }}
                  className="flex-1 rounded-xl bg-red-400/15 px-4 py-3 text-sm font-bold text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {deletePositionId && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#11152E] p-5">
              <h2 className="text-lg font-bold text-white">Delete Position</h2>

              <p className="mt-2 text-sm text-white/45">
                ลบตำแหน่งนี้ใช่หรือไม่
              </p>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setDeletePositionId(null)}
                  className="flex-1 rounded-xl bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white/70"
                >
                  Cancel
                </button>

                <button
                  onClick={() => deletePosition(deletePositionId)}
                  className="flex-1 rounded-xl bg-red-400/15 px-4 py-3 text-sm font-bold text-red-300"
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
                className="w-full max-w-4xl rounded-3xl border border-white/10 bg-[#11152E] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-[#FFB347]">
                      Position Setup
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-white">
                      {editingPositionId ? 'Edit Position' : 'Add Position'}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPositionModalOpen(false)
                      resetPositionForm()
                    }}
                    className="rounded-xl bg-white/[0.05] px-3 py-2 text-sm text-white/60"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[320px_1fr]">
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/35">
                        Position Info
                      </p>

                      <input
                        value={positionForm.name}
                        onChange={(e) =>
                          setPositionForm({
                            ...positionForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="Position name"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none placeholder:text-white/30"
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
                        className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none placeholder:text-white/30"
                      />

                      <div className="mt-3">
                        <p className="mb-1.5 text-xs text-white/40">
                          Max Day Off / Month
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
                          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-cyan-300">
                            Overtime Setting
                          </p>

                          <p className="mt-1 text-xs text-white/45">
                            กำหนดว่าตำแหน่งนี้สามารถทำ OT ได้หรือไม่
                          </p>
                        </div>

                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={positionForm.allowOT}
                            onChange={(e) =>
                              setPositionForm({
                                ...positionForm,
                                allowOT: e.target.checked,
                                otCapMinutes: e.target.checked
                                  ? positionForm.otCapMinutes
                                  : '',
                              })
                            }
                            className="h-5 w-5 accent-cyan-300"
                          />
                        </label>
                      </div>

                      {positionForm.allowOT && (
                        <div className="mt-3">
                          <p className="mb-1.5 text-xs text-white/40">
                            OT Cap Minutes
                          </p>

                          <input
                            type="number"
                            min="1"
                            value={positionForm.otCapMinutes}
                            onChange={(e) =>
                              setPositionForm({
                                ...positionForm,
                                otCapMinutes: e.target.value,
                              })
                            }
                            placeholder="เช่น 120, 240, 300"
                            className="w-full rounded-xl border border-cyan-400/20 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none placeholder:text-white/25"
                          />

                          <p className="mt-2 text-xs leading-relaxed text-white/40">
                            ระบบจะนับ OT ไม่เกินจำนวนนี้ เช่น 240 = สูงสุด 4 ชั่วโมง
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-[#00B8A9]/15 bg-[#00B8A9]/10 p-4">
                      <p className="text-sm font-bold text-[#00B8A9]">
                        Shift Rules
                      </p>

                      <p className="mt-1.5 text-xs leading-relaxed text-white/45">
                        กะที่ active จะถูกใช้ตอนพนักงาน Check-in และคำนวณสาย/ออกก่อน
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">
                          Shifts
                        </p>

                        <h3 className="mt-0.5 text-lg font-bold text-white">
                          {positionShifts.length} Shift
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={addShift}
                        className="rounded-xl bg-[#FFB347] px-3 py-2 text-xs font-bold text-[#1B1F3B]"
                      >
                        + Add
                      </button>
                    </div>

                    <div className="max-h-[500px] space-y-3 overflow-y-auto pr-1">
                      {positionShifts.map((shift, index) => (
                        <div
                          key={shift.id || index}
                          className={`rounded-2xl border p-3 ${
                            shift.isDefault
                              ? 'border-[#FFB347]/35 bg-[#FFB347]/5'
                              : shift.isActive
                                ? 'border-white/10 bg-[#11152E]/50'
                                : 'border-white/5 bg-white/[0.02] opacity-60'
                          }`}
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-white">
                                Shift #{index + 1}
                              </p>

                              <p className="text-xs text-white/35">
                                {shift.isDefault
                                  ? 'Default'
                                  : shift.isActive
                                    ? 'Active'
                                    : 'Inactive'}
                              </p>
                            </div>

                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => setDefaultShift(index)}
                                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${
                                  shift.isDefault
                                    ? 'bg-[#FFB347] text-[#1B1F3B]'
                                    : 'bg-white/[0.06] text-white/55'
                                }`}
                              >
                                Default
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleShiftActive(index)}
                                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${
                                  shift.isActive
                                    ? 'bg-[#00B8A9]/10 text-[#00B8A9]'
                                    : 'bg-white/[0.06] text-white/40'
                                }`}
                              >
                                {shift.isActive ? 'Active' : 'Inactive'}
                              </button>

                              <button
                                type="button"
                                onClick={() => removeShift(index)}
                                className="rounded-lg bg-red-400/10 px-2.5 py-1.5 text-[11px] font-bold text-red-300"
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <input
                              value={shift.name}
                              onChange={(e) =>
                                updateShift(index, 'name', e.target.value)
                              }
                              placeholder={
                                index === 0
                                  ? `${positionForm.name || 'position'}_shift`
                                  : `${positionForm.name || 'position'}_shift_${
                                      index + 1
                                    }`
                              }
                              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 sm:col-span-2"
                            />

                            <input
                              type="time"
                              value={shift.checkInTime}
                              onChange={(e) =>
                                updateShift(index, 'checkInTime', e.target.value)
                              }
                              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
                            />

                            <input
                              type="time"
                              value={shift.checkOutTime}
                              onChange={(e) =>
                                updateShift(index, 'checkOutTime', e.target.value)
                              }
                              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPositionModalOpen(false)
                      resetPositionForm()
                    }}
                    className="flex-1 rounded-xl bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white/70"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={positionLoading}
                    className="flex-1 rounded-xl bg-[#FFB347] px-4 py-3 text-sm font-bold text-[#1B1F3B] disabled:opacity-60"
                  >
                    {positionLoading
                      ? 'Saving...'
                      : editingPositionId
                        ? 'Update'
                        : 'Add Position'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isBranchModalOpen && (
          <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
            <div className="flex min-h-dvh items-start justify-center py-6">
              <form
                onSubmit={hdlSubmit}
                className="w-full max-w-4xl rounded-3xl border border-white/10 bg-[#11152E] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-[#FFB347]">
                      Branch Setup
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-white">
                      {editingId ? 'Edit Branch' : 'Add Branch'}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsBranchModalOpen(false)
                      setEditingId(null)
                      setForm(DEFAULT_FORM)
                    }}
                    className="rounded-xl bg-white/[0.05] px-3 py-2 text-sm text-white/60"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[300px_1fr]">
                  <div className="space-y-3">
                    <input
                      name="name"
                      value={form.name}
                      onChange={hdlChange}
                      placeholder="Branch name"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none placeholder:text-white/30"
                    />

                    <input
                      name="code"
                      value={form.code}
                      onChange={hdlChange}
                      placeholder="Branch code"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none placeholder:text-white/30"
                    />

                    <textarea
                      name="address"
                      value={form.address}
                      onChange={hdlChange}
                      placeholder="Address"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none placeholder:text-white/30"
                    />

                    <input
                      name="radius"
                      type="number"
                      min="10"
                      value={form.radius}
                      onChange={hdlChange}
                      placeholder="Radius"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none placeholder:text-white/30"
                    />

                    <div className="rounded-2xl border border-[#00B8A9]/15 bg-[#00B8A9]/10 p-3">
                      <p className="text-xs font-bold text-[#00B8A9]">
                        GPS Location
                      </p>

                      <p className="mt-1 text-xs text-white/45">
                        Lat {Number(form.lat || 0).toFixed(5)} · Lng{' '}
                        {Number(form.lng || 0).toFixed(5)}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-white/10">
                    <MapContainer
                      center={[position.lat, position.lng]}
                      zoom={15}
                      scrollWheelZoom
                      className="h-[460px] w-full"
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
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBranchModalOpen(false)
                      setEditingId(null)
                      setForm(DEFAULT_FORM)
                    }}
                    className="flex-1 rounded-xl bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white/70"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-xl bg-[#FFB347] px-4 py-3 text-sm font-bold text-[#1B1F3B] disabled:opacity-60"
                  >
                    {loading
                      ? 'Saving...'
                      : editingId
                        ? 'Update Branch'
                        : 'Add Branch'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrganizationSettings