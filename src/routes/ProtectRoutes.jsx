import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import axios from 'axios'

import useAuthStore from '../store/auth-store'
import API_URL from '../utils/api'

function ProtectRoutes({ el, allows }) {
  const [ok, setOk] = useState(null)
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (!token) {
          setOk(false)
          return
        }

        const res = await axios.get(`${API_URL}/getme`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const role = res.data.result.role
        setOk(allows.includes(role))
      } catch (error) {
        console.log(error)
        setOk(false)
      }
    }

    checkPermission()
  }, [token])

  if (ok === null) {
    return <h1>Loading...</h1>
  }

  if (!ok) {
    return <Navigate to="/" replace />
  }

  return el
}

export default ProtectRoutes