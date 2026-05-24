import React from 'react'
import { resizeFile } from '../utils/resizeImage'
import { uploadImgProfile } from '../api/uploadFile'
import useAuthStore from '../store/auth-store'

function FormUploadImage({ setImage }) {
  const token = useAuthStore((state) => state.token)

  const hdlOnChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const resizedImage = await resizeFile(file)
      const res = await uploadImgProfile(token, resizedImage)

      console.log('UPLOAD RESULT:', res.data)

      const imageUrl = res.data.result.secure_url

      setImage(imageUrl)
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <label className="cursor-pointer rounded-xl bg-[#FFB347] px-3 py-2 text-xs font-semibold text-[#1B1F3B]">
      Change Photo
      <input
        type="file"
        accept="image/*"
        onChange={hdlOnChange}
        className="hidden"
      />
    </label>
  )
}

export default FormUploadImage