import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './index.css';

// ============================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================
function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.icon}</span>
          <span>{t.message}</span>
          <button className="toast-close" onClick={() => onDismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// AUTH PAGE (Login + Register)
// ============================================================
function AuthPage({ onLogin, toast }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (mode === 'register' && form.password.length < 6) errs.password = 'At least 6 characters';
    else if (mode === 'register' && !/\d/.test(form.password)) errs.password = 'Must contain a number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      if (mode === 'register') {
        // Step 1: Register
        await axios.post('/auth/register', {
          email: form.email,
          password: form.password,
        });
        toast('success', '✓', 'Account created successfully! Logging in...');

        // Step 2: Auto-login after registration
        const loginRes = await axios.post('/auth/login', {
          email: form.email,
          password: form.password,
        });
        onLogin(loginRes.data.data, form.email);
      } else {
        // Login
        const res = await axios.post('/auth/login', {
          email: form.email,
          password: form.password,
        });
        onLogin(res.data.data, form.email);
        toast('success', '✓', 'Welcome back!');
      }
    } catch (err) {
      const msg = err.response?.data?.error
        || err.response?.data?.details?.map(d => d.message).join(', ')
        || err.message
        || 'Something went wrong';
      toast('error', '✕', msg);
      if (err.response?.data?.details) {
        const fieldErrors = {};
        err.response.data.details.forEach(d => {
          fieldErrors[d.field] = d.message;
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">⚡</div>
            <span className="auth-logo-text">Side Kicks</span>
          </div>
          <p className="auth-subtitle">Microservices-powered task management</p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              id="login-tab"
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setErrors({}); }}
            >
              Sign In
            </button>
            <button
              id="register-tab"
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setErrors({}); }}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">Email Address</label>
              <input
                id="auth-email"
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                autoComplete="email"
              />
              {errors.email && <div className="form-error">⚠ {errors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                className="form-input"
                type="password"
                placeholder={mode === 'register' ? 'Min 6 chars, include a number' : '••••••••'}
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
              {errors.password && <div className="form-error">⚠ {errors.password}</div>}
            </div>

            <button
              id="auth-submit"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? <span className="spinner"></span> : null}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            {mode === 'login'
              ? <>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setMode('register'); }}>Sign up</a></>
              : <>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); }}>Sign in</a></>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD
// ============================================================
function Dashboard({ session, onLogout, toast, logs, writeLog }) {
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeView, setActiveView] = useState('tasks');
  const [taskForm, setTaskForm] = useState({ title: '', description: '' });
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef(null);
  const logsEndRef = useRef(null);

  // Scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Load tasks
  const loadTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      writeLog('TASK', 'Fetching tasks...');
      const res = await axios.get('/tasks');
      const list = res.data.data || [];
      setTasks(list);
      writeLog('TASK', `Retrieved ${list.length} tasks`);
    } catch (err) {
      writeLog('ERROR', 'Failed to fetch tasks');
      toast('error', '✕', 'Failed to load tasks');
    } finally {
      setLoadingTasks(false);
    }
  }, [writeLog, toast]);

  // Load files
  const loadFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      writeLog('FILE', 'Fetching files...');
      const res = await axios.get('/files');
      const list = res.data.data || [];
      setFiles(list);
      writeLog('FILE', `Retrieved ${list.length} files`);
    } catch (err) {
      writeLog('ERROR', 'Failed to fetch files');
    } finally {
      setLoadingFiles(false);
    }
  }, [writeLog]);

  // Initial data load
  useEffect(() => {
    loadTasks();
    loadFiles();
  }, [loadTasks, loadFiles]);

  // Create task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    setCreatingTask(true);
    try {
      writeLog('TASK', `Creating "${taskForm.title}"...`);
      await axios.post('/tasks', taskForm);
      writeLog('TASK', 'Task created successfully');
      toast('success', '✓', 'Task created!');
      setTaskForm({ title: '', description: '' });
      loadTasks();
    } catch (err) {
      writeLog('ERROR', 'Task creation failed');
      toast('error', '✕', 'Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  // Update task status
  const handleUpdateStatus = async (id, status) => {
    try {
      writeLog('TASK', `Updating task #${id} → ${status}`);
      await axios.put(`/tasks/${id}`, { status });
      writeLog('TASK', 'Status updated');
      loadTasks();
    } catch (err) {
      writeLog('ERROR', 'Status update failed');
      toast('error', '✕', 'Failed to update status');
    }
  };

  // Delete task
  const handleDeleteTask = async (id) => {
    try {
      writeLog('TASK', `Deleting task #${id}...`);
      await axios.delete(`/tasks/${id}`);
      writeLog('TASK', 'Task deleted');
      toast('success', '✓', 'Task deleted');
      loadTasks();
    } catch (err) {
      writeLog('ERROR', 'Task deletion failed');
      toast('error', '✕', 'Failed to delete task');
    }
  };

  // Upload file
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      writeLog('FILE', `Uploading "${file.name}"...`);
      await axios.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      writeLog('FILE', 'Upload complete');
      toast('success', '✓', `"${file.name}" uploaded!`);
      loadFiles();
    } catch (err) {
      writeLog('ERROR', 'File upload failed');
      toast('error', '✕', 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Download file
  const handleDownloadFile = async (id, filename) => {
    try {
      writeLog('FILE', `Downloading "${filename}"...`);
      const res = await axios.get(`/files/download/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      writeLog('FILE', 'Download complete');
    } catch (err) {
      writeLog('ERROR', 'File download failed');
      toast('error', '✕', 'Download failed');
    }
  };

  // Delete file
  const handleDeleteFile = async (id) => {
    try {
      writeLog('FILE', `Deleting file #${id}...`);
      await axios.delete(`/files/${id}`);
      writeLog('FILE', 'File deleted');
      toast('success', '✓', 'File deleted');
      loadFiles();
    } catch (err) {
      writeLog('ERROR', 'File deletion failed');
      toast('error', '✕', 'Delete failed');
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      writeLog('SYSTEM', 'Initiating account deletion...');
      await axios.delete('/auth/me');
      writeLog('SYSTEM', 'Account deleted — event propagated via RabbitMQ');
      toast('info', 'ℹ', 'Account deleted successfully');
      onLogout();
    } catch (err) {
      writeLog('ERROR', 'Account deletion failed');
      toast('error', '✕', 'Account deletion failed');
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  // Compute stats
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (filename) => {
    if (!filename) return '📄';
    const ext = filename.split('.').pop()?.toLowerCase();
    const icons = { pdf: '📕', doc: '📘', docx: '📘', xls: '📊', xlsx: '📊', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', zip: '📦', rar: '📦', mp4: '🎬', mp3: '🎵', txt: '📝', js: '⚙️', json: '⚙️' };
    return icons[ext] || '📄';
  };

  const emailInitial = session.user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="dashboard">
      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">⚡</div>
            <span className="sidebar-logo-text">Side Kicks</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          <button
            id="nav-tasks"
            className={`nav-item ${activeView === 'tasks' ? 'active' : ''}`}
            onClick={() => { setActiveView('tasks'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📋</span>
            Tasks
          </button>
          <button
            id="nav-files"
            className={`nav-item ${activeView === 'files' ? 'active' : ''}`}
            onClick={() => { setActiveView('files'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📁</span>
            Files
          </button>
          <button
            id="nav-logs"
            className={`nav-item ${activeView === 'logs' ? 'active' : ''}`}
            onClick={() => { setActiveView('logs'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">🖥️</span>
            System Logs
          </button>

          <div className="nav-section-label">Account</div>
          <button
            id="nav-delete-account"
            className="nav-item"
            onClick={() => setShowDeleteModal(true)}
            style={{ color: 'var(--danger)' }}
          >
            <span className="nav-icon">⚠️</span>
            Delete Account
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{emailInitial}</div>
            <div className="user-info">
              <div className="user-name">{session.user.email}</div>
              <div className="user-role">Authenticated</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-content">
        <header className="page-header">
          <div>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </button>
            <h1 className="page-title">
              {activeView === 'tasks' && 'Tasks'}
              {activeView === 'files' && 'Files'}
              {activeView === 'logs' && 'System Logs'}
            </h1>
            <p className="page-title-sub">
              {activeView === 'tasks' && 'Manage your tasks across microservices'}
              {activeView === 'files' && 'Upload, download, and manage files'}
              {activeView === 'logs' && 'Real-time system activity feed'}
            </p>
          </div>
          <div className="page-actions">
            <button id="logout-btn" className="btn btn-ghost btn-sm" onClick={onLogout}>
              Sign Out
            </button>
          </div>
        </header>

        <div className="page-body">
          {/* ========== TASKS VIEW ========== */}
          {activeView === 'tasks' && (
            <>
              {/* Stats */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon purple">📋</div>
                  <div className="stat-content">
                    <div className="stat-value">{totalTasks}</div>
                    <div className="stat-label">Total Tasks</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon yellow">⏳</div>
                  <div className="stat-content">
                    <div className="stat-value">{pendingTasks}</div>
                    <div className="stat-label">Pending</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">🔄</div>
                  <div className="stat-content">
                    <div className="stat-value">{inProgressTasks}</div>
                    <div className="stat-label">In Progress</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon red">✅</div>
                  <div className="stat-content">
                    <div className="stat-value">{doneTasks}</div>
                    <div className="stat-label">Completed</div>
                  </div>
                </div>
              </div>

              {/* Create Task Form */}
              <div className="section">
                <div className="section-header">
                  <h2 className="section-title">➕ New Task</h2>
                </div>
                <form className="task-form-inline" onSubmit={handleCreateTask}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="task-title">Title</label>
                    <input
                      id="task-title"
                      className="form-input"
                      type="text"
                      placeholder="What needs to be done?"
                      required
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="task-desc">Description</label>
                    <input
                      id="task-desc"
                      className="form-input"
                      type="text"
                      placeholder="Optional description"
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    />
                  </div>
                  <button
                    id="create-task-btn"
                    className="btn btn-primary"
                    type="submit"
                    disabled={creatingTask || !taskForm.title.trim()}
                    style={{ minWidth: '140px', alignSelf: 'flex-end' }}
                  >
                    {creatingTask ? <span className="spinner"></span> : 'Create Task'}
                  </button>
                </form>
              </div>

              {/* Tasks Grid */}
              <div className="section">
                <div className="section-header">
                  <h2 className="section-title">
                    📋 All Tasks
                    <span className="section-badge">{totalTasks}</span>
                  </h2>
                  <button className="btn btn-ghost btn-sm" onClick={loadTasks} disabled={loadingTasks}>
                    {loadingTasks ? <span className="spinner"></span> : '↻ Refresh'}
                  </button>
                </div>

                {tasks.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <h3 className="empty-state-title">No tasks yet</h3>
                    <p className="empty-state-desc">Create your first task above. Tasks are stored in the task microservice with Redis caching.</p>
                  </div>
                ) : (
                  <div className="tasks-grid">
                    {tasks.map((t) => (
                      <div key={t.id} className="task-card">
                        <div className="task-card-header">
                          <h3 className="task-card-title">{t.title}</h3>
                          <button
                            className="task-delete-btn"
                            onClick={() => handleDeleteTask(t.id)}
                            title="Delete task"
                          >
                            🗑
                          </button>
                        </div>
                        {t.description && (
                          <p className="task-card-desc">{t.description}</p>
                        )}
                        <div className="task-card-footer">
                          <select
                            className="status-select"
                            value={t.status || 'pending'}
                            onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                          >
                            <option value="pending">⏳ Pending</option>
                            <option value="in_progress">🔄 In Progress</option>
                            <option value="done">✅ Done</option>
                          </select>
                          <span className="task-id">#{t.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ========== FILES VIEW ========== */}
          {activeView === 'files' && (
            <>
              <div className="section">
                <div className="section-header">
                  <h2 className="section-title">📤 Upload</h2>
                </div>
                <div
                  className="file-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="file-dropzone-icon">
                    {uploading ? <span className="spinner" style={{ width: 32, height: 32 }}></span> : '📂'}
                  </div>
                  <div className="file-dropzone-text">
                    {uploading ? 'Uploading...' : 'Click to select a file'}
                  </div>
                  <div className="file-dropzone-hint">Files are stored via the File microservice</div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="section">
                <div className="section-header">
                  <h2 className="section-title">
                    📁 Your Files
                    <span className="section-badge">{files.length}</span>
                  </h2>
                  <button className="btn btn-ghost btn-sm" onClick={loadFiles} disabled={loadingFiles}>
                    {loadingFiles ? <span className="spinner"></span> : '↻ Refresh'}
                  </button>
                </div>

                {files.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📂</div>
                    <h3 className="empty-state-title">No files uploaded</h3>
                    <p className="empty-state-desc">Upload your first file using the dropzone above.</p>
                  </div>
                ) : (
                  <div className="files-list">
                    {files.map((f) => (
                      <div key={f.id} className="file-item">
                        <span className="file-item-icon">{getFileIcon(f.original_name || f.filename)}</span>
                        <div className="file-item-info">
                          <div className="file-item-name">{f.original_name || f.filename}</div>
                          <div className="file-item-size">{formatFileSize(f.size)}</div>
                        </div>
                        <div className="file-item-actions">
                          <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => handleDownloadFile(f.id, f.original_name || f.filename)}
                            title="Download"
                          >
                            ⬇
                          </button>
                          <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => handleDeleteFile(f.id)}
                            title="Delete"
                            style={{ color: 'var(--danger)' }}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ========== LOGS VIEW ========== */}
          {activeView === 'logs' && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">🖥️ Activity Log</h2>
              </div>
              <div className="terminal">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <span className="terminal-dot red"></span>
                    <span className="terminal-dot yellow"></span>
                    <span className="terminal-dot green"></span>
                  </div>
                  <span className="terminal-title">system_logs — session</span>
                </div>
                <div className="terminal-body">
                  {logs.length === 0 && (
                    <div className="log-line" style={{ color: 'var(--text-muted)' }}>
                      Waiting for activity...
                    </div>
                  )}
                  {logs.map((log, i) => (
                    <div key={i} className="log-line">
                      <span className="log-time">[{log.time}]</span>{' '}
                      <span className={`log-tag ${log.tag.toLowerCase()}`}>[{log.tag}]</span>{' '}
                      {log.message}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </div>
          )}

          {/* Terminal always shown at bottom for tasks/files views */}
          {activeView !== 'logs' && (
            <div className="section" style={{ marginTop: 'auto' }}>
              <div className="terminal">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <span className="terminal-dot red"></span>
                    <span className="terminal-dot yellow"></span>
                    <span className="terminal-dot green"></span>
                  </div>
                  <span className="terminal-title">system_logs</span>
                </div>
                <div className="terminal-body" style={{ maxHeight: '160px' }}>
                  {logs.slice(-15).map((log, i) => (
                    <div key={i} className="log-line">
                      <span className="log-time">[{log.time}]</span>{' '}
                      <span className={`log-tag ${log.tag.toLowerCase()}`}>[{log.tag}]</span>{' '}
                      {log.message}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">⚠️ Delete Account</h2>
            <p className="modal-desc">
              This action is irreversible. Your account, all tasks, and all files will be permanently deleted
              via distributed event propagation (RabbitMQ).
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button
                id="confirm-delete-account"
                className="btn btn-danger"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? <span className="spinner"></span> : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// APP ROOT
// ============================================================
function App() {
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem('sk_session');
      return saved ? JSON.parse(saved) : { token: null, refreshToken: null, user: null };
    } catch {
      return { token: null, refreshToken: null, user: null };
    }
  });

  const [toasts, setToasts] = useState([]);
  const [logs, setLogs] = useState([]);

  // Persist session
  useEffect(() => {
    if (session.token) {
      localStorage.setItem('sk_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('sk_session');
    }
  }, [session]);

  // Axios interceptor for token
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use((config) => {
      if (session.token) {
        config.headers.Authorization = `Bearer ${session.token}`;
      }
      return config;
    });

    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and we have a refresh token, try to refresh
        if (error.response?.status === 401 && session.refreshToken && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const res = await axios.post('/auth/refresh', {
              refreshToken: session.refreshToken,
            });
            const newToken = res.data.data.token;
            setSession(prev => ({ ...prev, token: newToken }));
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshErr) {
            // Refresh failed — log out
            setSession({ token: null, refreshToken: null, user: null });
            return Promise.reject(refreshErr);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [session.token, session.refreshToken]);

  // Toast helper
  const showToast = useCallback((type, icon, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, icon, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Log helper
  const writeLog = useCallback((tag, message) => {
    setLogs(prev => [
      ...prev,
      {
        time: new Date().toLocaleTimeString(),
        tag,
        message,
      },
    ]);
  }, []);

  // Login handler
  const handleLogin = (data, email) => {
    setSession({
      token: data.token,
      refreshToken: data.refreshToken || null,
      user: { email },
    });
    writeLog('AUTH', `Authenticated as ${email}`);
  };

  // Logout handler
  const handleLogout = () => {
    setSession({ token: null, refreshToken: null, user: null });
    setLogs([]);
    showToast('info', 'ℹ', 'Signed out');
  };

  return (
    <>
      {!session.token ? (
        <AuthPage onLogin={handleLogin} toast={showToast} />
      ) : (
        <Dashboard
          session={session}
          onLogout={handleLogout}
          toast={showToast}
          logs={logs}
          writeLog={writeLog}
        />
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

export default App;
