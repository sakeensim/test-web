import axios from 'axios'
import { create } from 'zustand'
import API_URL from '../utils/api'

const timeStore = create((set) => ({
  time: {},
  date: {},

  actionCheckIn: async (token, latitude, longitude, note) => {
    try {
      const res = await axios.post(
        `${API_URL}/user/check-in`,
        { latitude, longitude,note},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      set({ time: res.data.data })
      console.log('Check-In Response:', res.data)

      return res.data
    } catch (error) {
      console.error('Error in actionCheckIn:', error)
      throw error
    }
  },

  actionCheckOut: async (token, latitude, longitude,note) => {
  try {
    const res = await axios.patch(
      `${API_URL}/user/check-out`,
      { latitude, longitude,note },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    set({ time: res.data.data })
    console.log('Check-Out Response:', res.data)

    return res.data
  } catch (error) {
    console.error('Check-Out Error:', error)
    throw error
  }
},

  actionDayOff: async (token, date, reason, status) => {
    const res = await axios.post(
      `${API_URL}/user/day-off`,
      { date, reason, status },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    console.log('log from day off time store', res)
    set({ date: res.data.data })
    return res.data
  },
}))

export default timeStore