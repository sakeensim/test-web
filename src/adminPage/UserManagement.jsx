import React, { useEffect, useState } from 'react';
import useAuthStore from '../store/auth-store';
import axios from 'axios';
import { createAlert } from '../utils/createAlert';
import API_URL from "../utils/api"
function UserManagement() {
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [editingSalaryId, setEditingSalaryId] = useState(null);
    const [newSalary, setNewSalary] = useState('');
    const [branches, setBranches] = useState([])
    const [positions, setPositions] = useState([])
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newUser, setNewUser] = useState({
        firstname: '',
        lastname: '',
        email: '',
        role: 'USER',
        baseSalary: '',
        branchId: '',
        positionId: '',
    })
    const enableSalaryEdit = (id, currentSalary) => {
        setEditingSalaryId(id);
        setNewSalary(currentSalary || '');
    };
    

    // Check if user is admin
    useEffect(() => {
        if (user.role !== 'OWNER') {
            // Redirect non-admin users
            window.location.href = '/profile';
        } else {
            fetchEmployees();
            fetchBranches();
            fetchPositions();
        }
    }, [user]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/user/list`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployees(res.data.result);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching employees:', error);
            createAlert('error', 'Failed to fetch employees');
            setLoading(false);
        }
    };
    const fetchBranches = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/branches`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            })

            setBranches(res.data.data || [])
        } catch (error) {
            console.log(error)
        }
    }
    const fetchPositions = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/positions`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            setPositions(res.data.data || res.data.result || [])
        } catch (error) {
            console.log(error)
        }
    }
    const updateSalary = async (id) => {
        try {
            await axios.patch(`${API_URL}/admin/update-salary`,  
                { id, baseSalary: newSalary },  // Send ID and new salary in the request body
                { headers: { Authorization: `Bearer ${token}` } } // Correctly place headers here
            );
            createAlert('success', 'Salary updated successfully');
            fetchEmployees(); // Refresh the employee list
            setEditingSalaryId(null);
        } catch (error) {
            console.error('Error updating salary:', error);
            createAlert('error', 'Failed to update salary');
        }
    };

    const handleRoleChange = async (id, newRole) => {
        try {
            await axios.post(`${API_URL}/user/update-role`,
                { id, role: newRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            createAlert('success', 'Role updated successfully');
            fetchEmployees(); // Refresh the list
        } catch (error) {
            console.error('Error updating role:', error);
            createAlert('error', 'Failed to update role');
        }
    };
    const updateUserBranch = async (id, branchId) => {
    try {
        await axios.patch(
        `${API_URL}/admin/user-branch/${id}`,
        { branchId },
        {
            headers: {
            Authorization: `Bearer ${token}`,
            },
        }
        )

        createAlert('success', 'Branch updated')
        fetchEmployees()
    } catch (error) {
        console.log(error)
        createAlert('error', 'Update branch failed')
    }
    }
    const updateUserPosition = async (id, positionId) => {
        try {
            await axios.patch(
                `${API_URL}/admin/user-position/${id}`,
                { positionId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            createAlert('success', 'Position updated')
            fetchEmployees()
        } catch (error) {
            console.log(error)
            createAlert('error', 'Update position failed')
        }
    }
    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_URL}/user/delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            createAlert('success', 'User deleted successfully');
            fetchEmployees(); // Refresh the list
            setConfirmDelete(null); // Close confirmation
        } catch (error) {
            console.error('Error deleting user:', error);
            createAlert('error', 'Failed to delete user');
        }
    };
    const handleCreateUser = async (e) => {
        e.preventDefault()

        try {
            await axios.post(
            `${API_URL}/admin/user`,
            newUser,
            {
                headers: {
                Authorization: `Bearer ${token}`,
                },
            }
            )

            createAlert('success', 'Create user success')

            setIsAddOpen(false)

            setNewUser({
            firstname: '',
            lastname: '',
            email: '',
            role: 'USER',
            baseSalary: '',
            branchId: '',
            })

            fetchEmployees()
        } catch (error) {
            console.log(error)
            createAlert('error', 'Create user failed')
        }
    }
    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('th-TH');
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }
    return (
  <div className="min-h-screen w-full p-4 sm:p-6">
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FFB347]">
            Admin Panel
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            Employee Management
          </h1>
          <p className="mt-2 text-white/45">
            จัดการพนักงาน เงินเดือน บทบาท สาขา และข้อมูลติดต่อ
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="rounded-2xl bg-[#FFB347] px-5 py-3 font-bold text-[#1B1F3B]"
        >
          Add Employee
        </button>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-[#11152E]/90 shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-[1250px] w-full">
            <thead>
              <tr className="border-b border-white/10 text-left">
                {[
                  'Profile',
                  'Name',
                  'Email',
                  'Phone',
                  'Emergency',
                  'Base Salary',
                  'Joined',
                  'Branch',
                  'Position',
                  'Role',
                  'Actions',
                ].map((head) => (
                  <th
                    key={head}
                    className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/40"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {employees.map((employee) => (
                <tr
                  key={employee.id}
                  className="border-b border-white/5 transition hover:bg-white/[0.03]"
                >
                  <td className="px-6 py-4">
                    <div className="h-11 w-11 overflow-hidden rounded-2xl bg-white/[0.06]">
                      {employee.profileImage ? (
                        <img src={employee.profileImage} alt="profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-bold text-[#00B8A9]">
                          {employee.firstname?.charAt(0)}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 font-semibold text-white">
                    {employee.firstname} {employee.lastname}
                  </td>

                  <td className="px-6 py-4 text-sm text-white/45">{employee.email}</td>
                  <td className="px-6 py-4 text-sm text-white/45">{employee.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm text-white/45">{employee.emergencyContact || '-'}</td>

                  <td className="px-6 py-4">
                    {editingSalaryId === employee.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="w-28 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
                          value={newSalary}
                          onChange={(e) => setNewSalary(e.target.value)}
                        />
                        <button onClick={() => updateSalary(employee.id)} className="rounded-xl bg-[#00B8A9] px-3 py-2 text-xs font-bold text-[#071B1A]">
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => enableSalaryEdit(employee.id, employee.baseSalary)}
                        className="rounded-full bg-[#FFB347]/10 px-3 py-1 text-sm font-semibold text-[#FFB347]"
                      >
                        {employee.baseSalary ? `${Number(employee.baseSalary).toLocaleString()} บาท` : 'Set Salary'}
                      </button>
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm text-white/45">
                    {formatDate(employee.createdAt)}
                  </td>

                  <td className="px-6 py-4">
                    <select
                      value={employee.branchId || ''}
                      onChange={(e) => updateUserBranch(employee.id, e.target.value)}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
                    >
                      <option className="bg-[#11152E]" value="">No Branch</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id} className="bg-[#11152E]">
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select
                        value={employee.positionId || ''}
                        onChange={(e) => updateUserPosition(employee.id, e.target.value)}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
                    >
                        <option className="bg-[#11152E]" value="">
                        No Position
                        </option>

                        {positions.map((position) => (
                        <option
                            key={position.id}
                            value={position.id}
                            className="bg-[#11152E]"
                        >
                            {position.name}
                        </option>
                        ))}
                    </select>
                    </td>
                  <td className="px-6 py-4">
                    {user.id !== employee.id ? (
                      <select
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
                        value={employee.role}
                        onChange={(e) => handleRoleChange(employee.id, e.target.value)}
                      >
                        <option className="bg-[#11152E]" value="USER">USER</option>
                        <option className="bg-[#11152E]" value="ADMIN">ADMIN</option>
                      </select>
                    ) : (
                      <span className="rounded-full bg-[#00B8A9]/10 px-3 py-1 text-xs font-semibold text-[#00B8A9]">
                        {employee.role} (You)
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {user.id !== employee.id ? (
                      confirmDelete === employee.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleDelete(employee.id)} className="rounded-xl bg-red-400/15 px-3 py-2 text-xs font-semibold text-red-300">
                            Confirm
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="rounded-xl bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white/60">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(employee.id)} className="rounded-xl bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-300">
                          Delete
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-white/30">Cannot Delete</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm p-4">
          <div className="mx-auto mt-16 w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#11152E] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Add Employee</h2>
              <button onClick={() => setIsAddOpen(false)} className="text-white/40">
                Close
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-6 grid gap-4 md:grid-cols-2">
              <input placeholder="Firstname" value={newUser.firstname} onChange={(e) => setNewUser({ ...newUser, firstname: e.target.value })} className="rounded-2xl bg-white/[0.04] px-4 py-3 text-white outline-none" />
              <input placeholder="Lastname" value={newUser.lastname} onChange={(e) => setNewUser({ ...newUser, lastname: e.target.value })} className="rounded-2xl bg-white/[0.04] px-4 py-3 text-white outline-none" />
              <input placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="rounded-2xl bg-white/[0.04] px-4 py-3 text-white outline-none md:col-span-2" />
              <input placeholder="Base Salary" value={newUser.baseSalary} onChange={(e) => setNewUser({ ...newUser, baseSalary: e.target.value })} className="rounded-2xl bg-white/[0.04] px-4 py-3 text-white outline-none" />

              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="rounded-2xl bg-white/[0.04] px-4 py-3 text-white outline-none">
                <option className="bg-[#11152E]" value="USER">USER</option>
                <option className="bg-[#11152E]" value="ADMIN">ADMIN</option>
              </select>

              <select value={newUser.branchId} onChange={(e) => setNewUser({ ...newUser, branchId: e.target.value })} className="rounded-2xl bg-white/[0.04] px-4 py-3 text-white outline-none">
                <option className="bg-[#11152E]" value="">Select Branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id} className="bg-[#11152E]">
                    {branch.name}
                  </option>
                ))}
              </select>
            <select
            value={newUser.positionId}
            onChange={(e) =>
                setNewUser({ ...newUser, positionId: e.target.value })
            }
            className="rounded-2xl bg-white/[0.04] px-4 py-3 text-white outline-none"
            >
            <option className="bg-[#11152E]" value="">
                Select Position
            </option>

            {positions.map((position) => (
                <option
                key={position.id}
                value={position.id}
                className="bg-[#11152E]"
                >
                {position.name}
                </option>
            ))}
            </select>
              <button type="submit" className="rounded-2xl bg-[#FFB347] py-4 font-bold text-[#1B1F3B] md:col-span-2">
                Create Employee
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  </div>
);
}

export default UserManagement