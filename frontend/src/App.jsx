import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './index.css';

/* ================================================================
   SVG ICONS — lightweight inline icons, no emoji
   ================================================================ */
const Icons = {
  tasks: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 12l2 2 4-4" /></svg>,
  files: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /></svg>,
  logs: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  upload: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
  warning: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  logout: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  menu: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>,
};

/* ================================================================
   TOAST SYSTEM
   ================================================================ */
function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.message}</span>
          <button className="toast-close" onClick={() => onDismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

/* ================================================================
   AUTH PAGE
   ================================================================ */
function AuthPage({ onLogin, toast }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Required';
    else if (mode === 'register' && form.password.length < 6) e.password = 'Min 6 characters';
    else if (mode === 'register' && !/\d/.test(form.password)) e.password = 'Must include a number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      if (mode === 'register') {
        await axios.post('/auth/register', { email: form.email, password: form.password });
        toast('success', 'Account created');
        const res = await axios.post('/auth/login', { email: form.email, password: form.password });
        onLogin(res.data.data, form.email);
      } else {
        const res = await axios.post('/auth/login', { email: form.email, password: form.password });
        onLogin(res.data.data, form.email);
        toast('success', 'Logged in');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.details?.map(d => d.message).join(', ') || err.message;
      toast('error', msg);
      if (err.response?.data?.details) {
        const fe = {};
        err.response.data.details.forEach(d => { fe[d.field] = d.message; });
        setErrors(fe);
      }
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }));
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-brand">Side Kicks</div>
          <div className="auth-subtitle">Sign in to your workspace</div>
        </div>
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setErrors({}); }}>Sign In</button>
            <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setErrors({}); }}>Create Account</button>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} autoComplete="email" />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          <div className="auth-footer">
            {mode === 'login'
              ? <>No account? <a href="#" onClick={e => { e.preventDefault(); setMode('register'); }}>Create one</a></>
              : <>Have an account? <a href="#" onClick={e => { e.preventDefault(); setMode('login'); }}>Sign in</a></>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   DASHBOARD
   ================================================================ */
function Dashboard({ session, onLogout, toast, logs, writeLog }) {
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([]);
  const [view, setView] = useState('tasks');
  const [taskForm, setTaskForm] = useState({ title: '', description: '' });
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileRef = useRef(null);
  const logsEnd = useRef(null);

  useEffect(() => { logsEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const loadTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      writeLog('TASK', 'Fetching tasks');
      const r = await axios.get('/tasks');
      setTasks(r.data.data || []);
    } catch { toast('error', 'Failed to load tasks'); }
    finally { setLoadingTasks(false); }
  }, [writeLog, toast]);

  const loadFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      writeLog('FILE', 'Fetching files');
      const r = await axios.get('/files');
      setFiles(r.data.data || []);
    } catch { }
    finally { setLoadingFiles(false); }
  }, [writeLog]);

  useEffect(() => { loadTasks(); loadFiles(); }, [loadTasks, loadFiles]);

  const createTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    setCreating(true);
    try {
      await axios.post('/tasks', taskForm);
      toast('success', 'Task created');
      setTaskForm({ title: '', description: '' });
      loadTasks();
    } catch { toast('error', 'Failed to create task'); }
    finally { setCreating(false); }
  };

  const updateStatus = async (id, status) => {
    try { await axios.put(`/tasks/${id}`, { status }); loadTasks(); }
    catch { toast('error', 'Update failed'); }
  };

  const deleteTask = async (id) => {
    try { await axios.delete(`/tasks/${id}`); toast('success', 'Task deleted'); loadTasks(); }
    catch { toast('error', 'Delete failed'); }
  };

  const uploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('document', file);
      await axios.post('/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast('success', `Uploaded ${file.name}`);
      loadFiles();
    } catch { toast('error', 'Upload failed'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const downloadFile = async (id, name) => {
    try {
      const r = await axios.get(`/files/download/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch { toast('error', 'Download failed'); }
  };

  const deleteFile = async (id) => {
    try { await axios.delete(`/files/${id}`); toast('success', 'File deleted'); loadFiles(); }
    catch { toast('error', 'Delete failed'); }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await axios.delete('/auth/me');
      toast('info', 'Account deleted');
      onLogout();
    } catch { toast('error', 'Deletion failed'); }
    finally { setDeleting(false); setDeleteModal(false); }
  };

  const total = tasks.length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProg = tasks.filter(t => t.status === 'in_progress').length;
  const done = tasks.filter(t => t.status === 'done').length;
  const initial = session.user?.email?.[0]?.toUpperCase() || '?';

  const fmtSize = (b) => {
    if (!b) return '—';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  };

  const statusLabel = { pending: 'Pending', in_progress: 'In Progress', done: 'Done' };

  return (
    <div className="dashboard">
      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">Side Kicks</div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Overview</div>
          <button className={`nav-item ${view === 'tasks' ? 'active' : ''}`} onClick={() => { setView('tasks'); setSidebarOpen(false); }}>
            <span className="nav-icon">{Icons.tasks}</span> Tasks
          </button>
          <button className={`nav-item ${view === 'files' ? 'active' : ''}`} onClick={() => { setView('files'); setSidebarOpen(false); }}>
            <span className="nav-icon">{Icons.files}</span> Files
          </button>
          <button className={`nav-item ${view === 'logs' ? 'active' : ''}`} onClick={() => { setView('logs'); setSidebarOpen(false); }}>
            <span className="nav-icon">{Icons.logs}</span> Logs
          </button>
          <div className="nav-section">Settings</div>
          <button className="nav-item" onClick={() => setDeleteModal(true)} style={{ color: 'var(--red)' }}>
            <span className="nav-icon">{Icons.warning}</span> Delete Account
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initial}</div>
            <div className="user-email">{session.user.email}</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>{Icons.menu}</button>
            <span className="topbar-title">
              {view === 'tasks' && 'Tasks'}
              {view === 'files' && 'Files'}
              {view === 'logs' && 'Logs'}
            </span>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-ghost btn-sm" onClick={onLogout}>{Icons.logout} Sign out</button>
          </div>
        </header>

        <div className="page-body">
          {/* TASKS */}
          {view === 'tasks' && (
            <>
              <div className="stats-row">
                <div className="stat-cell"><div className="stat-value">{total}</div><div className="stat-label">Total</div></div>
                <div className="stat-cell"><div className="stat-value">{pending}</div><div className="stat-label">Pending</div></div>
                <div className="stat-cell"><div className="stat-value">{inProg}</div><div className="stat-label">In Progress</div></div>
                <div className="stat-cell"><div className="stat-value">{done}</div><div className="stat-label">Completed</div></div>
              </div>

              <form className="create-form" onSubmit={createTask}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" placeholder="Task name" required value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" placeholder="Optional" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
                </div>
                <button className="btn btn-secondary btn-sm" type="submit" disabled={creating || !taskForm.title.trim()} style={{ height: '34px' }}>
                  {creating ? <span className="spinner" /> : Icons.plus} Add
                </button>
              </form>

              <div className="section">
                <div className="section-header">
                  <h2 className="section-title">All Tasks<span className="section-count">{total}</span></h2>
                  <button className="btn btn-ghost btn-sm" onClick={loadTasks} disabled={loadingTasks}>
                    {loadingTasks ? <span className="spinner" /> : Icons.refresh} Refresh
                  </button>
                </div>
                {tasks.length === 0 ? (
                  <div className="empty"><div className="empty-title">No tasks</div>Create your first task above.</div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr><th>Title</th><th>Description</th><th>Status</th><th>ID</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
                      </thead>
                      <tbody>
                        {tasks.map(t => (
                          <tr key={t.id}>
                            <td className="task-title">{t.title}</td>
                            <td className="task-desc">{t.description || '—'}</td>
                            <td>
                              <select className="status-select" value={t.status || 'pending'} onChange={e => updateStatus(t.id, e.target.value)}>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="done">Done</option>
                              </select>
                            </td>
                            <td className="task-id">#{t.id}</td>
                            <td className="actions-cell">
                              <button className="btn btn-ghost btn-icon" onClick={() => deleteTask(t.id)} title="Delete">{Icons.trash}</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* FILES */}
          {view === 'files' && (
            <>
              <div className="dropzone" onClick={() => fileRef.current?.click()}>
                {uploading ? <span className="spinner" /> : Icons.upload}
                <div className="dropzone-label">{uploading ? 'Uploading...' : 'Click to upload a file'}</div>
                <div className="dropzone-hint">Stored via File microservice</div>
              </div>
              <input type="file" ref={fileRef} onChange={uploadFile} style={{ display: 'none' }} />

              <div className="section">
                <div className="section-header">
                  <h2 className="section-title">Files<span className="section-count">{files.length}</span></h2>
                  <button className="btn btn-ghost btn-sm" onClick={loadFiles} disabled={loadingFiles}>
                    {loadingFiles ? <span className="spinner" /> : Icons.refresh} Refresh
                  </button>
                </div>
                {files.length === 0 ? (
                  <div className="empty"><div className="empty-title">No files</div>Upload your first file above.</div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr><th>Name</th><th>Size</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                      <tbody>
                        {files.map(f => (
                          <tr key={f.id}>
                            <td className="task-title">{f.original_name || f.filename}</td>
                            <td style={{ color: 'var(--text-3)' }}>{fmtSize(f.size)}</td>
                            <td className="actions-cell">
                              <button className="btn btn-ghost btn-icon" onClick={() => downloadFile(f.id, f.original_name || f.filename)} title="Download">{Icons.download}</button>
                              <button className="btn btn-ghost btn-icon" onClick={() => deleteFile(f.id)} title="Delete" style={{ color: 'var(--red)' }}>{Icons.trash}</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* LOGS */}
          {view === 'logs' && (
            <div className="terminal">
              <div className="terminal-bar">
                <div className="terminal-dots"><span /><span /><span /></div>
                <span className="terminal-label">system — logs</span>
              </div>
              <div className="terminal-body" style={{ maxHeight: '600px' }}>
                {logs.length === 0 && <div style={{ color: 'var(--text-4)' }}>Waiting for activity...</div>}
                {logs.map((l, i) => (
                  <div key={i} className="log-line">
                    <span className="log-time">{l.time}</span>{' '}
                    <span className={`log-tag ${l.tag.toLowerCase()}`}>{l.tag}</span>{' '}
                    {l.message}
                  </div>
                ))}
                <div ref={logsEnd} />
              </div>
            </div>
          )}

          {/* Mini log bar on non-log views */}
          {view !== 'logs' && logs.length > 0 && (
            <div className="terminal" style={{ marginTop: '1.5rem' }}>
              <div className="terminal-bar">
                <div className="terminal-dots"><span /><span /><span /></div>
                <span className="terminal-label">activity</span>
              </div>
              <div className="terminal-body" style={{ maxHeight: '120px' }}>
                {logs.slice(-10).map((l, i) => (
                  <div key={i} className="log-line">
                    <span className="log-time">{l.time}</span>{' '}
                    <span className={`log-tag ${l.tag.toLowerCase()}`}>{l.tag}</span>{' '}
                    {l.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DELETE MODAL */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Delete Account</div>
            <div className="modal-desc">This will permanently delete your account, all tasks, and all files. This action cannot be undone.</div>
            <div className="modal-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setDeleteModal(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={deleteAccount} disabled={deleting}>
                {deleting ? <span className="spinner" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   APP ROOT
   ================================================================ */
function App() {
  const [session, setSession] = useState(() => {
    try { const s = localStorage.getItem('sk_session'); return s ? JSON.parse(s) : { token: null, refreshToken: null, user: null }; }
    catch { return { token: null, refreshToken: null, user: null }; }
  });
  const [toasts, setToasts] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (session.token) localStorage.setItem('sk_session', JSON.stringify(session));
    else localStorage.removeItem('sk_session');
  }, [session]);

  useEffect(() => {
    const req = axios.interceptors.request.use(c => {
      if (session.token) c.headers.Authorization = `Bearer ${session.token}`;
      return c;
    });
    const res = axios.interceptors.response.use(r => r, async err => {
      const orig = err.config;
      if (err.response?.status === 401 && session.refreshToken && !orig._retry) {
        orig._retry = true;
        try {
          const r = await axios.post('/auth/refresh', { refreshToken: session.refreshToken });
          const t = r.data.data.token;
          setSession(p => ({ ...p, token: t }));
          orig.headers.Authorization = `Bearer ${t}`;
          return axios(orig);
        } catch { setSession({ token: null, refreshToken: null, user: null }); }
      }
      return Promise.reject(err);
    });
    return () => { axios.interceptors.request.eject(req); axios.interceptors.response.eject(res); };
  }, [session.token, session.refreshToken]);

  const showToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);

  const writeLog = useCallback((tag, message) => {
    setLogs(p => [...p, { time: new Date().toLocaleTimeString('en-US', { hour12: false }), tag, message }]);
  }, []);

  const handleLogin = (data, email) => {
    setSession({ token: data.token, refreshToken: data.refreshToken || null, user: { email } });
    writeLog('AUTH', `Authenticated as ${email}`);
  };

  const handleLogout = () => {
    setSession({ token: null, refreshToken: null, user: null });
    setLogs([]);
    showToast('info', 'Signed out');
  };

  return (
    <>
      {!session.token
        ? <AuthPage onLogin={handleLogin} toast={showToast} />
        : <Dashboard session={session} onLogout={handleLogout} toast={showToast} logs={logs} writeLog={writeLog} />
      }
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

export default App;
