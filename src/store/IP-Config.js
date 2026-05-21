//import { create } from 'zustand';
//import { persist } from 'zustand/middleware';
//
//const useIPConfigStore = create(
//  persist(
//    (set) => ({
//      allowedIPs: ['184.82.221.58'], // Default office IP
//      
//      // Add a new IP to the list
//     addAllowedIP: (ip) => set((state) => ({
//        allowedIPs: [...state.allowedIPs, ip]
//      })),
//      
//      // Remove an IP from the list
//      removeAllowedIP: (ip) => set((state) => ({
//        allowedIPs: state.allowedIPs.filter(allowedIP => allowedIP !== ip)
//      })),
//      
//      // Update the entire allowed IPs list
//      setAllowedIPs: (ipArray) => set({
//        allowedIPs: ipArray
//      }),
//    }),
//    {
//      name: 'ip-config-storage',
//   }
//  )
//);

//export default useIPConfigStore;
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useIPConfigStore = create(
  persist(
    (set) => ({

      allowedIPs: [],

      addAllowedIP: (ip) => set((state) => {

        // กัน IP ซ้ำ
        if (state.allowedIPs.includes(ip)) {
          return state
        }

        return {
          allowedIPs: [...state.allowedIPs, ip]
        }

      }),

      removeAllowedIP: (ip) => set((state) => ({
        allowedIPs: state.allowedIPs.filter(
          allowedIP => allowedIP !== ip
        )
      })),

      setAllowedIPs: (ipArray) => set({
        allowedIPs: ipArray
      }),

      // AUTO UPDATE CURRENT IP
      updateCurrentIP: async () => {

        try {

          const ipRes = await fetch(
            "https://api.ipify.org?format=json"
          )

          const data = await ipRes.json()

          set((state) => {

            if (state.allowedIPs.includes(data.ip)) {
              return state
            }

            return {
              allowedIPs: [data.ip]
            }

          })

        } catch (error) {
          console.log(error)
        }

      }

    }),
    {
      name: 'ip-config-storage',
    }
  )
);

export default useIPConfigStore;