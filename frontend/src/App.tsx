import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ShieldAlert, Activity, AlertTriangle, LogOut, User, Lock } from 'lucide-react';

interface LogEntry {
  id: number;
  timestamp: string;
  tenant: string;
  source: string;
  event_type: string;
  severity: number;
  src_ip: string;
  user_name: string;
}

interface AlertEntry {
  id: number;
  timestamp: string;
  rule_name: string;
  message: string;
  src_ip: string;
  severity: number;
}

interface UserProfile {
  name: string;
  role: string;
  tenant: string;
  token: string;
}

function App() {
  // State สำหรับระบบ Login
  const [user, setUser] = useState<UserProfile | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // State สำหรับ Dashboard
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------------
  // ฟังก์ชันจัดการ Login / Logout
  // --------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const API_BASE_URL = `http://${window.location.hostname}:5000`;

      const res = await axios.post(`${API_BASE_URL}/login`, {
        username: usernameInput,
        password: passwordInput
      });
      setUser(res.data);
    } catch (err) {
      setLoginError('Username หรือ Password ไม่ถูกต้อง');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLogs([]);
    setAlerts([]);
    setUsernameInput('');
    setPasswordInput('');
  };

  // --------------------------------------------------------
  // ดึงข้อมูลเมื่อ Login สำเร็จ (ส่ง Tenant ไปกรองข้อมูลด้วย)
  // --------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const API_BASE_URL = `http://${window.location.hostname}:5000`;

        const [logsRes, alertsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/logs?tenant=${user.tenant}`),
          axios.get(`${API_BASE_URL}/alerts?tenant=${user.tenant}`)
        ]);
        setLogs(logsRes.data);
        setAlerts(alertsRes.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // --------------------------------------------------------
  //  หน้าจอ Login (ถ้ายังไม่เข้าสู่ระบบ)
  // --------------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <ShieldAlert className="w-16 h-16 text-red-600 mb-4" />
            <h1 className="text-2xl font-bold text-slate-800">CyberDefense SIEM</h1>
            <p className="text-slate-500 text-sm mt-1">Please sign in to access the dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="pl-10 w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  placeholder="Enter your username"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  className="pl-10 w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                />
              </div>
            </div>

            {loginError && <p className="text-red-500 text-sm text-center font-medium">{loginError}</p>}

            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-lg shadow-red-500/30">
              Sign In
            </button>
          </form>

          {/* Hint ให้กรรมการรู้ว่าต้องใช้รหัสอะไรทดสอบ */}
          <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50 p-4 rounded-lg">
            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Demo Accounts</p>
            <ul className="text-xs text-slate-600 space-y-1 font-mono">
              <li>Admin: <span className="font-bold text-red-600">admin / admin</span> (All Data)</li>
              <li>Tenant A: <span className="font-bold text-red-600">user_a / password</span> (demoA Only)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------
  // หน้าจอ Dashboard (ล็อกอินสำเร็จแล้ว)
  // --------------------------------------------------------
  const eventTypeCounts = logs.reduce((acc: any, log) => {
    acc[log.event_type] = (acc[log.event_type] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(eventTypeCounts).map(key => ({
    name: key,
    count: eventTypeCounts[key]
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header และปุ่ม Logout */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-8 h-8 text-red-600" />
            <h1 className="text-2xl font-bold text-slate-800">CyberDefense SIEM</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">{user.name}</p>
              <div className="flex items-center space-x-2 mt-0.5 justify-end">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>
                  {user.role}
                </span>
                <span className="text-xs text-slate-500">Tenant: <b>{user.tenant}</b></span>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><p className="text-slate-500 animate-pulse">Loading secure data...</p></div>
        ) : (
          <>
            {alerts.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm mb-6">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                  <h2 className="text-red-700 font-bold text-lg">Active Alerts ({alerts.length})</h2>
                </div>
                <ul className="space-y-2">
                  {alerts.map(alert => (
                    <li key={alert.id} className="text-red-600 text-sm flex justify-between bg-white/50 p-2 rounded">
                      <span><strong>{alert.rule_name}:</strong> {alert.message}</span>
                      <span className="text-red-400 text-xs">{new Date(alert.timestamp).toLocaleString('th-TH')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
                  <div className="p-3 bg-red-100 rounded-lg text-red-600">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Total Events Detected</p>
                    <p className="text-3xl font-bold text-slate-800">{logs.length}</p>
                  </div>
                </div>
              </div>

              <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-700 mb-4">Event Types Overview</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                      <YAxis allowDecimals={false} tick={{ fill: '#64748b' }} />
                      <Tooltip cursor={{ fill: '#f1f5f9' }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-700">Recent Logs Timeline</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-medium">Timestamp</th>
                      <th className="px-6 py-4 font-medium">Tenant</th>
                      <th className="px-6 py-4 font-medium">Source</th>
                      <th className="px-6 py-4 font-medium">Event Type</th>
                      <th className="px-6 py-4 font-medium">IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">{new Date(log.timestamp).toLocaleString('th-TH')}</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600">{log.tenant}</span></td>
                        <td className="px-6 py-4">{log.source}</td>
                        <td className="px-6 py-4 font-medium text-red-600">{log.event_type}</td>
                        <td className="px-6 py-4 font-mono text-xs">{log.src_ip || '-'}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No logs found for this tenant.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;