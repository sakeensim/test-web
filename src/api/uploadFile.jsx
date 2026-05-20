import axios from 'axios'; 
import API_URL from "../utils/api"
export const uploadImgProfile = async(token, form)=>{
    return await axios.patch(`${API_URL}/user/upload-img`,
     {image: form},
     {
        headers:{
            Authorization: `Bearer ${token}`
        }
    })
}