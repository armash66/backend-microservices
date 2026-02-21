import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const [session, setSession] = useState({ token: null, user: null });
  const [tasks, setTasks] = useState([]);

  // Forms
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '' });

  // Terminal Logs
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  const writeLog = (prefix, msg) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [${prefix}] ${msg}`]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Handle Axios Interceptors for Token
  useEffect(() => {
    const defaultHeaders = session.token ? { Authorization: `Bearer ${session.token}` } : {};
    axios.defaults.headers.common = defaultHeaders;

    if (session.token) {
      loadTasks();
    } else {
      setTasks([]);
    }
  }, [session]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      writeLog('AUTH', 'Initiating registration...');
      await axios.post('/auth/register', authForm);
      writeLog('AUTH', `Registration success for ${authForm.username}`);
      await handleLogin(e);
    } catch (err) {
      writeLog('ERROR', err.response?.data?.error || err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      writeLog('AUTH', 'Initiating login...');
      const res = await axios.post('/auth/login', {
        email: authForm.email,
        password: authForm.password
      });
      writeLog('AUTH', 'Login success! Token acquired.');
      setSession({
        token: res.data.token,
        user: { email: authForm.email }
      });
    } catch (err) {
      writeLog('ERROR', err.response?.data?.error || err.message);
    }
  };

  const loadTasks = async () => {
    try {
      writeLog('TASK', 'Fetching tasks (Cache-Aside layer active)...');
      const res = await axios.get('/tasks');
      setTasks(res.data);
      writeLog('TASK', `Retrieved ${res.data.length} tasks.`);
    } catch (err) {
      writeLog('ERROR', 'Failed to fetch tasks');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      writeLog('TASK', 'Creating new task...');
      await axios.post('/tasks', taskForm);
      writeLog('TASK', 'Task created successfully.');
      setTaskForm({ title: '', description: '' });
      loadTasks(); // Invalidate local and trigger backend get
    } catch (err) {
      writeLog('ERROR', 'Task creation failed');
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      writeLog('TASK', `Deleting task ${id}...`);
      await axios.delete(`/tasks/${id}`);
      writeLog('TASK', 'Task deleted.');
      loadTasks();
    } catch (err) {
      writeLog('ERROR', 'Task deletion failed');
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm("Are you positive? This proves distributed event architecture.");
    if (!confirm) return;

    try {
      writeLog('SYSTEM', 'Initiating Distributed Account Deletion...');
      await axios.delete('/auth/me');
      writeLog('SYSTEM', 'RabbitMQ user.deleted propagation complete.');
      setSession({ token: null, user: null });
    } catch (err) {
      writeLog('ERROR', 'Account deletion failed');
    }
  };

  return (
    <div className="layout">
      {/* Sidebar - Interactions */}
      <div className="sidebar">
        <h1 className="logo">SYSTEM_OPS // CLIENT</h1>

        {!session.token ? (
          <div className="card">
            <h2>Authentication</h2>
            <form>
              <input type="text" placeholder="Username (Reg)" value={authForm.username} onChange={e => setAuthForm({ ...authForm, username: e.target.value })} />
              <input type="email" placeholder="Email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} />
              <input type="password" placeholder="Password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} />

              <div className="btn-group">
                <button type="button" onClick={handleLogin}>Login</button>
                <button type="button" onClick={handleRegister}>Register</button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="card identity">
              <h2>Active Session</h2>
              <p>User: {session.user.email}</p>
              <button className="btn-danger" onClick={handleDeleteAccount}>Destroy Account</button>
              <button className="btn-secondary" onClick={() => setSession({ token: null, user: null })}>Logout</button>
            </div>

            <div className="card">
              <h2>Create Task</h2>
              <form onSubmit={handleCreateTask}>
                <input type="text" placeholder="Task Title" required value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
                <input type="text" placeholder="Description" required value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
                <button type="submit">Submit Matrix Task</button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="main">
        {session.token && (
          <div className="datagrid">
            <h2>Data Grid ({tasks.length})</h2>
            <div className="grid">
              {tasks.map(t => (
                <div key={t.id} className="task-card">
                  <div className="task-head">
                    <h3>{t.title}</h3>
                    <span onClick={() => handleDeleteTask(t.id)} className="task-del">×</span>
                  </div>
                  <p>{t.description}</p>
                  <small>ID: {t.id}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="terminal">
          <div className="terminal-header">SYS_LOGS</div>
          <div className="terminal-body">
            {logs.map((L, i) => <div key={i}>{L}</div>)}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
