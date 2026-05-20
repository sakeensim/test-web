import axios from "axios"
import {create} from 'zustand'
import API_URL from "../utils/api"
const salaryStore = create((set)=>({
    salaryTaked :{},

    actionSalary: async (token,amount)=>{
        const res =await axios.post(`${API_URL}/user/advance-salary`,
            { 
                amount,  // Now amount is defined
                date: new Date()  // Add date since your backend expects it
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            set({salaryTaked: res.data.data})
           console.log("res.data.data",res.data)
           
    }

}))
export default salaryStore