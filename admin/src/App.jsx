import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, usersRes, plansRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, { headers }),
        axios.get(`${API_URL}/admin/users`, { headers }),
        axios.get(`${API_URL}/admin/plans`, { headers })
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setPlans(plansRes.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username: email, password });
      setToken(res.data.access_token);
      localStorage.setItem('adminToken', res.data.access_token);
    } catch (err) {
      alert('Login failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('adminToken');
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <form onSubmit={handleLogin} className="p-8 bg-white rounded-xl shadow-lg w-96">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Login</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-3 mb-4 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-3 mb-6 border rounded"
            required
          />
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center border-b">
        <h1 className="text-xl font-bold text-gray-900">Meesho Sakhi Admin</h1>
        <button onClick={handleLogout} className="text-sm font-semibold text-red-600 hover:text-red-800">Logout</button>
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        {stats && (
          <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Users</h3>
              <p className="text-4xl font-bold text-blue-600 mt-2">{stats.users}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Goals</h3>
              <p className="text-4xl font-bold text-purple-600 mt-2">{stats.goals}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Plans</h3>
              <p className="text-4xl font-bold text-green-600 mt-2">{stats.plans}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-12">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-800">Users ({users.length})</h2>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">#{u.id}</td>
                  <td className="px-6 py-4 font-medium">{u.name || '-'}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-800">Recent Plans ({plans.length})</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {plans.map(p => (
              <div key={p.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <p className="text-sm text-gray-500">User: {p.goal?.user?.email || 'Guest'}</p>
                  </div>
                  <span className="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    ₹{p.total_budget.toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">Items ({p.items?.length || 0}):</p>
                  <ul className="list-disc list-inside space-y-1">
                    {p.items?.map(i => (
                      <li key={i.id}>{i.name} — <span className="text-gray-400">₹{i.price}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
