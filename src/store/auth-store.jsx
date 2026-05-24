/*import axios from "axios"
import {create} from "zustand"
import { persist } from "zustand/middleware"
import API_URL from "../utils/api"
//1.create store
const authStore = (set) => ({
    user: [],
    token: null,
    loginWithZustand: async(value)=>{
        try {
            const res = await axios.post(`${API_URL}/login`, value)
            // console.log(res.data.payload)
            // console.log(res.data.token)

            // console.log("Login response:", res);

            const {payload,token} = res.data
            // console.log(payload.role)
            // console.log(token)

            set({ user: payload, token: token }); // Updating Zustand store

            return {success: true, role : payload.role}
        } catch (error) {
            // console.log(error.response.data.message) 
            return {success: false, message: error.response.data.message}
        }
    }
})

//2. exports Store
const useAuthStore = create(persist(authStore, {name: 'auth-store'}))

export default useAuthStore*/
import axios from "axios"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import API_URL from "../utils/api"

const authStore = (set) => ({
  user: null,
  token: null,

  loginWithZustand: async (value) => {
    try {
      const res = await axios.post(`${API_URL}/login`, value)

      const { payload, token } = res.data

      set({
        user: payload,
        token: token
      })

      return {
        success: true,
        role: payload.role
      }

    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message
      }
    }
  },

  loginWithGoogle: async (idToken) => {
    try {
      const res = await axios.post(`${API_URL}/google-login`, {
        idToken
      })

      const { payload, token } = res.data

      set({
        user: payload,
        token: token
      })

      return {
        success: true,
        role: payload.role
      }

    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message
      }
    }
  },

  logout: () => {
    localStorage.removeItem('auth-store')

    set({
      user: null,
      token: null
    })
  } 
})

const useAuthStore = create(
  persist(authStore, {
    name: "auth-store"
  })
)

export default useAuthStore