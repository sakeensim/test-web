import React, { useEffect, useState } from 'react'
import FormUploadImage from '../form/FormUploadImage'
import { useForm } from 'react-hook-form'
import { EditIcon } from '../icon/icon'
import useAuthStore from '../store/auth-store'
import axios from 'axios'
import { createAlert } from '../utils/createAlert'
import { Trash2 } from 'lucide-react'
import API_URL from '../utils/api'

function Profile() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const [image, setImage] = useState('')
  const [profile, setProfile] = useState({})
  const [dayOffDates, setDayOffDates] = useState([])
  const [totalSalaryAdvance, setTotalSalaryAdvance] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeletingDayOff, setIsDeletingDayOff] = useState(false)

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      image: null,
    },
  })

  useEffect(() => {
    if (token) {
      getProfile()
      fetchApprovedRequests()
    }
  }, [token])

  useEffect(() => {
    if (profile) {
      setValue('firstname', profile.firstname || '')
      setValue('lastname', profile.lastname || '')
      setValue('phone', profile.phone || '')
      setValue('emergencyContact', profile.emergencyContact || '')
    }
  }, [profile, setValue])

  const hdlSubmit = async (value) => {
    try {
      await axios.patch(`${API_URL}/user/update-profile/${user.id}`, value, {
        headers: { Authorization: `Bearer ${token}` },
      })

      getProfile()
      setIsEditing(false)
      createAlert('success', 'Profile updated successfully')
    } catch (error) {
      console.log(error)
      createAlert('error', 'Update profile failed')
    }
  }

  const getProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/myProfile`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setProfile(res.data.result)
    } catch (error) {
      console.log(error)
    }
  }

  const fetchApprovedRequests = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/approved-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const approvedDayOffs = res.data.data.filter(
        (request) => request.type === 'dayoff'
      )

      setDayOffDates(
        approvedDayOffs.map((dayOff) => ({
          id: dayOff.id,
          date: dayOff.date,
        }))
      )

      setTotalSalaryAdvance(res.data.totalSalaryAdvance || 0)
    } catch (error) {
      console.log('Error fetching approved requests:', error)
    }
  }

  const deleteDayOff = async (dayOffId) => {
    try {
      setIsDeletingDayOff(true)

      await axios.delete(`${API_URL}/user/cancel-dayoff/${dayOffId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      await fetchApprovedRequests()
      await getProfile()

      createAlert('success', 'Day off canceled successfully')
    } catch (error) {
      console.log('Error canceling day off:', error)
      createAlert(
        'error',
        error.response?.data?.message || 'Failed to cancel day off'
      )
    } finally {
      setIsDeletingDayOff(false)
    }
  }

  const remainingDayOffs = Number(profile?.remainingDayOffs || 0)
  const maxDayOffPerMonth = Number(profile?.position?.maxDayOffPerMonth || 0)

  return (
    <form
      onSubmit={handleSubmit(hdlSubmit)}
      className="w-full max-w-7xl mx-auto p-4 sm:p-6"
    >
      <input type="hidden" {...register('image')} />

      <div className="bg-[#11152E]/90 border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden border-4 border-[#00B8A9]/30 shadow-[0_0_40px_rgba(0,184,169,0.18)] bg-white/10 relative">
                <img
                  src={image || profile?.profileImage}
                  alt="profile"
                  className="w-full h-full object-cover"
                />

                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <FormUploadImage setValue={setValue} setImage={setImage} />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="absolute bottom-1 right-1 w-11 h-11 rounded-full bg-[#FFB347] flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300"
              >
                <EditIcon className="w-5 text-[#1B1F3B]" />
              </button>
            </div>
          </div>

          <div className="flex-1">
            <div className="text-center lg:text-left">
              <p className="text-[#FFB347] text-sm tracking-widest uppercase">
                Employee Profile
              </p>

              {isEditing ? (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    {...register('firstname')}
                    placeholder="Firstname"
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/30"
                  />

                  <input
                    {...register('lastname')}
                    placeholder="Lastname"
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/30"
                  />
                </div>
              ) : (
                <h1 className="text-3xl sm:text-4xl font-bold text-white mt-1">
                  {profile?.firstname || user?.firstname}{' '}
                  {profile?.lastname || user?.lastname}
                </h1>
              )}

              <p className="text-white/40 mt-3">{user?.role}</p>

              {profile?.position?.name && (
                <p className="mt-1 font-medium text-[#00B8A9]">
                  {profile.position.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-4">
                <p className="text-xs text-white/40 mb-1">Phone Number</p>

                {isEditing ? (
                  <input
                    {...register('phone')}
                    className="w-full bg-transparent text-white outline-none"
                  />
                ) : (
                  <p className="text-white text-lg">{profile?.phone || '-'}</p>
                )}
              </div>

              <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-4">
                <p className="text-xs text-white/40 mb-1">Email</p>

                <p className="text-white text-lg break-all">
                  {profile?.email || user?.email}
                </p>
              </div>

              <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-4 md:col-span-2">
                <p className="text-xs text-white/40 mb-1">
                  Emergency Contact
                </p>

                {isEditing ? (
                  <input
                    {...register('emergencyContact')}
                    className="w-full bg-transparent text-white outline-none"
                  />
                ) : (
                  <p className="text-white text-lg">
                    {profile?.emergencyContact || '-'}
                  </p>
                )}
              </div>
            </div>

            {isEditing && (
              <button
                type="submit"
                className="mt-6 px-6 py-3 rounded-2xl bg-[#FFB347] text-[#1B1F3B] font-semibold shadow-lg hover:scale-[1.02] transition-all duration-300"
              >
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        <div className="bg-[#11152E]/90 border border-white/10 rounded-[2rem] p-5 shadow-xl">
          <h2 className="text-white text-lg font-semibold mb-4">
            Upcoming Day Offs
          </h2>

          <div className="space-y-3">
            {dayOffDates.length > 0 ? (
              dayOffDates.map((dayOff) => (
                <div
                  key={dayOff.id}
                  className="flex justify-between items-center bg-white/[0.04] border border-white/5 rounded-2xl p-3"
                >
                  <p className="text-white/80">
                    {new Date(dayOff.date).toLocaleDateString('th-TH')}
                  </p>

                  <button
                    type="button"
                    disabled={isDeletingDayOff}
                    onClick={() => deleteDayOff(dayOff.id)}
                    className="text-white/40 hover:text-red-400 transition-all disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-white/40">No approved day offs</p>
            )}
          </div>
        </div>

        <div className="bg-[#11152E]/90 border border-white/10 rounded-[2rem] p-5 shadow-xl">
          <h2 className="text-white text-lg font-semibold mb-4">
            Remaining Day Offs
          </h2>

          <div className="flex items-end gap-2">
            <p className="text-5xl font-bold text-[#00B8A9]">
              {remainingDayOffs}
            </p>

            <span className="text-white/40 mb-2">
              / {maxDayOffPerMonth} Days
            </span>
          </div>
        </div>

        <div className="bg-[#11152E]/90 border border-white/10 rounded-[2rem] p-5 shadow-xl">
          <h2 className="text-white text-lg font-semibold mb-4">
            Advance Salary
          </h2>

          <div className="flex items-end gap-2">
            <p className="text-4xl font-bold text-[#FFB347]">
              {Number(totalSalaryAdvance || 0).toLocaleString()}
            </p>

            <span className="text-white/40 mb-1">฿</span>
          </div>
        </div>
      </div>
    </form>
  )
}

export default Profile