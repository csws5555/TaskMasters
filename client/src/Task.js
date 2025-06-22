import { useState, useEffect, useMemo, useCallback } from 'react';
import './Task.css';

function Task({ user, showMessage }) {
  const [taskName, setTaskName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [tasks, setTasks] = useState([]);
  const [priority, setPriority] = useState('');
  const [workload, setWorkload] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [filterOption, setFilterOption] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Shared tasks state
  const [shareMode, setShareMode] = useState(false);
  const [friendsToShare, setFriendsToShare] = useState([]);
  const [sharedTasks, setSharedTasks] = useState([]);
  const [activeTaskTab, setActiveTaskTab] = useState('personal');


  // Load tasks from server
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/tasks/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      showMessage('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, showMessage]); // Add all dependencies used in the function

  // Load shared tasks
  const loadSharedTasks = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/tasks/shared/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setSharedTasks(data);
      }
    } catch (error) {
      console.error('Error loading shared tasks:', error);
      showMessage('Failed to load shared tasks', 'error');
    }
  }, [user.id, showMessage]);

    // Load tasks when user logs in
  useEffect(() => {
    if (user?.id) {
      loadTasks();
      loadSharedTasks();
    }
  }, [user?.id, loadTasks, loadSharedTasks]);

  // Form validation
  const validateTaskForm = () => {
    const newErrors = {};
    
    if (!taskName.trim()) {
      newErrors.taskName = 'Task name is required';
    } else if (taskName.trim().length < 3) {
      newErrors.taskName = 'Task name must be at least 3 characters';
    }
    
    if (!dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const selectedDate = new Date(dueDate + (dueTime ? ` ${dueTime}` : ''));
      const now = new Date();
      if (selectedDate < now) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }
    
    if (!priority || priority === "") {
    newErrors.priority = 'Priority is required';
    }
    
    if (!workload.trim()) {
      newErrors.workload = 'Workload is required';
    } else if (!/^\d+\s*(hr|hour|h)\s*(\d+\s*(min|minute|m))?$|^\d+\s*(min|minute|m)$/i.test(workload.trim())) {
      newErrors.workload = 'Workload format should be like "2hr 30min" or "45min"';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    switch (field) {
      case 'taskName':
        setTaskName(value);
        if (errors.taskName) setErrors(prev => ({ ...prev, taskName: '' }));
        break;
      case 'dueDate':
        setDueDate(value);
        if (errors.dueDate) setErrors(prev => ({ ...prev, dueDate: '' }));
        break;
      case 'priority':
        setPriority(value);
        if (errors.priority) setErrors(prev => ({ ...prev, priority: '' }));
        break;
      case 'workload':
        setWorkload(value);
        if (errors.workload) setErrors(prev => ({ ...prev, workload: '' }));
        break;
    }
  };

  // Toggle task completion
// Fixed handleToggle function - replace the existing one in Task.js
const handleToggle = async (id, completed) => {
  console.log('handleToggle called with:', { id, completed, idType: typeof id });
  console.log('Current tasks:', tasks.map(t => ({ id: t.id, idType: typeof t.id, name: t.name, completed: t.completed })));
  console.log('Current sharedTasks:', sharedTasks.map(t => ({ id: t.id, idType: typeof t.id, name: t.name, completed: t.completed })));
  
  try {
    // Check which list contains this task (with type-safe comparison)
    const isInPersonalTasks = tasks.some(task => String(task.id) === String(id));
    const isInSharedTasks = sharedTasks.some(task => String(task.id) === String(id));
    
    console.log('Task location:', { isInPersonalTasks, isInSharedTasks });
    
    if (!isInPersonalTasks && !isInSharedTasks) {
      console.error('Task not found in either list!');
      showMessage('Task not found', 'error');
      return;
    }
    
    // Optimistic update - update the correct list(s)
    if (isInPersonalTasks) {
      console.log('Updating personal tasks');
      setTasks(prev => {
        const updated = prev.map(task => 
          String(task.id) === String(id) ? { ...task, completed: !completed } : task
        );
        console.log('Updated personal tasks:', updated.map(t => ({ id: t.id, name: t.name, completed: t.completed })));
        return updated;
      });
    }
    if (isInSharedTasks) {
      console.log('Updating shared tasks');
      setSharedTasks(prev => {
        const updated = prev.map(task => 
          String(task.id) === String(id) ? { ...task, completed: !completed } : task
        );
        console.log('Updated shared tasks:', updated.map(t => ({ id: t.id, name: t.name, completed: t.completed })));
        return updated;
      });
    }

    // FIXED: Send both id and completed status to server
    const response = await fetch(`http://localhost:5000/tasks/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: id,           // Include the task ID
        completed: !completed  // Send the new completion status
      }),
    });

    console.log('Server response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server error:', errorData);
      throw new Error(errorData.error || 'Failed to update task');
    }
    
    const responseData = await response.json();
    console.log('Server response data:', responseData);
    
    showMessage(completed ? 'Task marked as incomplete' : 'Task completed!');
  } catch (error) {
    console.error('Error in handleToggle:', error);
    
    // Revert optimistic update on both lists
    setTasks(prev => prev.map(task => 
      String(task.id) === String(id) ? { ...task, completed } : task
    ));
    setSharedTasks(prev => prev.map(task => 
      String(task.id) === String(id) ? { ...task, completed } : task
    ));
    
    showMessage('Failed to update task: ' + error.message, 'error');
  }
};

  // Create new task (with optional sharing)
const handleAddTask = async () => {
  if (!validateTaskForm()) return;

  setLoading(true);
  try {
    // 1. First prepare the task payload
    const taskPayload = {
      name: taskName.trim(),
      date: dueDate,
      time: dueTime || null,
      priority: priority,
      workload: workload.trim(),
    };

    console.log('Creating task with payload:', taskPayload);

    // 2. Create the task
    const taskResponse = await fetch(`http://localhost:5000/tasks/${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskPayload),
    });

    if (!taskResponse.ok) {
      const errorData = await taskResponse.json();
      throw new Error(errorData.error || 'Failed to create task');
    }

    const taskData = await taskResponse.json();
    console.log('Task created:', taskData);

    // 3. Only proceed with sharing if needed
    if (shareMode && friendsToShare.some(f => f.selected)) {
      const sharePayload = {
        taskId: Number(taskData.id),
        ownerId: Number(user.id),
        sharedWithIds: friendsToShare
          .filter(f => f.selected)
          .map(f => Number(f.id)),
      };

      console.log('Sharing payload:', sharePayload);

      const shareResponse = await fetch('http://localhost:5000/tasks/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sharePayload),
      });

      if (!shareResponse.ok) {
        const errorData = await shareResponse.json();
        console.error('Sharing failed:', errorData);
        throw new Error(errorData.error || 'Task created but sharing failed');
      }

      console.log('Sharing successful');
    }

    // Reset form
    setTaskName('');
    setDueDate('');
    setDueTime('');
    setPriority('');
    setWorkload('');
    setShareMode(false);
    setFriendsToShare([]);

    // Reload data
    await Promise.all([loadTasks(), loadSharedTasks()]);
    
  } catch (err) {
    console.error('Error:', err.message, err.stack);
    showMessage(err.message, 'error');
  } finally {
    setLoading(false);
  }
};

  // Delete task
 const handleDelete = async (taskId, taskName, isShared = false) => {
  if (!window.confirm(`Are you sure you want to delete "${taskName}"?` + 
    (isShared ? " This will delete it for all users." : ""))) {
    return;
  }

  try {
    const endpoint = isShared ? `shared/${taskId}` : taskId;
    const response = await fetch(`http://localhost:5000/tasks/${endpoint}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete task');
    }

    showMessage('Task deleted successfully');
    loadTasks();
    loadSharedTasks();
  } catch (error) {
    console.error('Error deleting task:', {
      message: error.message,
      stack: error.stack
    });
    showMessage('Failed to delete task: ' + error.message, 'error');
  }
};

  // Toggle share mode
  const toggleShareMode = () => {
    setShareMode(!shareMode);
    if (!shareMode) {
      // Load friends when opening share mode
      fetch(`http://localhost:5000/friends/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setFriendsToShare(data.map(f => ({ ...f, selected: false })));
        })
        .catch(err => {
          console.error('Error loading friends:', err);
          showMessage('Failed to load friends', 'error');
        });
    }
  };

  // Toggle friend selection for sharing
  const toggleFriendSelection = (friendId) => {
    setFriendsToShare(prev => 
      prev.map(f => 
        f.id === friendId ? { ...f, selected: !f.selected } : f
      )
    );
  };

  // Set current date/time
  const setCurrentDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);
    setDueDate(date);
    setDueTime(time);
    if (errors.dueDate) setErrors(prev => ({ ...prev, dueDate: '' }));
  };

  // Filter and sort tasks
  const filterAndSortTasks = (taskList) => {
    let filtered = [...taskList];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(task =>
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.workload.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply completion filter
    switch (filterOption) {
      case 'completed': filtered = filtered.filter(task => task.completed); break;
      case 'pending': filtered = filtered.filter(task => !task.completed); break;
      case 'overdue':
        filtered = filtered.filter(task => {
          if (task.completed) return false;
          const taskDate = new Date(`${task.date} ${task.time || '23:59'}`);
          return taskDate < new Date();
        });
        break;
      default: break;
    }

    // Apply sorting
    if (sortOption === 'date') {
      filtered.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
    } else if (sortOption === 'priority') {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else if (sortOption === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  };

  const filteredAndSortedTasks = useMemo(() => filterAndSortTasks(tasks), 
    [tasks, searchTerm, filterOption, sortOption]);

  const filteredAndSortedSharedTasks = useMemo(() => filterAndSortTasks(sharedTasks), 
    [sharedTasks, searchTerm, filterOption, sortOption]);

  // Calculate task statistics
  const taskStats = useMemo(() => {
    const totalTasks = tasks.length + sharedTasks.length;
    const completedTasks = tasks.filter(t => t.completed).length + 
                         sharedTasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const overdueTasks = tasks.filter(t => {
      if (t.completed) return false;
      const taskDate = new Date(`${t.date} ${t.time || '23:59'}`);
      return taskDate < new Date();
    }).length + sharedTasks.filter(t => {
      if (t.completed) return false;
      const taskDate = new Date(`${t.date} ${t.time || '23:59'}`);
      return taskDate < new Date();
    }).length;

    return { total: totalTasks, completed: completedTasks, pending: pendingTasks, overdue: overdueTasks };
  }, [tasks, sharedTasks]);

  return (
    <>
      {/* Task Statistics */}
      <div className="task-stats">
        <div className="stat-item">
          <span className="stat-number">{taskStats.total}</span>
          <span className="stat-label">Total Tasks</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{taskStats.completed}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{taskStats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-item">
          <span 
            className="stat-number" 
            style={{ color: taskStats.overdue > 0 ? '#dc3545' : '#28a745' }}
          >
            {taskStats.overdue}
          </span>
          <span className="stat-label">Overdue</span>
        </div>
      </div>

{/* Task Creation Form */}
<div className="task-form">
  {/* Task form fields - First Row */}
  <div className="task-form-grid">
    <div className={`form-group ${errors.taskName ? 'error' : ''}`}>
      <label>Task Name</label>
      <input
        type="text"
        placeholder="Enter task name"
        value={taskName}
        onChange={(e) => handleInputChange('taskName', e.target.value)}
        disabled={loading}
      />
      {errors.taskName && <span className="error-message">{errors.taskName}</span>}
    </div>

    <div className={`form-group ${errors.dueDate ? 'error' : ''}`}>
      <label>Due Date</label>
      <input
        type="date"
        value={dueDate}
        onChange={(e) => handleInputChange('dueDate', e.target.value)}
        disabled={loading}
      />
      {errors.dueDate && <span className="error-message">{errors.dueDate}</span>}
    </div>

    <div className="form-group">
      <label>Due Time</label>
      <input
        type="time"
        value={dueTime}
        onChange={(e) => setDueTime(e.target.value)}
        disabled={loading}
      />
    </div>

    <div className={`form-group ${errors.priority ? 'error' : ''}`}>
      <label>Priority</label>
      <select 
        value={priority} 
        onChange={(e) => handleInputChange('priority', e.target.value)}
        disabled={loading}
      >
        <option value="">Select Priority</option>
        <option value="High">High Priority</option>
        <option value="Medium">Medium Priority</option>
        <option value="Low">Low Priority</option>
      </select>
      {errors.priority && <span className="error-message">{errors.priority}</span>}
    </div>

    <div className={`form-group ${errors.workload ? 'error' : ''}`}>
      <label>Workload</label>
      <input
        type="text"
        placeholder="e.g., 2hr 30min"
        value={workload}
        onChange={(e) => handleInputChange('workload', e.target.value)}
        disabled={loading}
      />
      {errors.workload && <span className="error-message">{errors.workload}</span>}
    </div>
  </div>

  {/* Share with friends section */}
  {shareMode && (
    <div className="share-section">
      <h4>Share with:</h4>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '10px',
        marginTop: '10px'
      }}>
        {friendsToShare.map(friend => (
          <div 
            key={friend.id}
            onClick={() => toggleFriendSelection(friend.id)}
            style={{
              background: friend.selected ? '#4CAF50' : '#e0e0e0',
              color: friend.selected ? 'white' : '#333',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {friend.username}
            {friend.selected && <span style={{ marginLeft: '8px' }}>✓</span>}
          </div>
        ))}
      </div>
      {friendsToShare.filter(f => f.selected).length > 0 && (
        <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
          Task will be shared with {friendsToShare.filter(f => f.selected).length} friend(s)
        </p>
      )}
    </div>
  )}

  {/* Action buttons - Second Row */}
  <div className="task-form-actions">
    <button 
      onClick={toggleShareMode}
      className={`share-toggle-button ${shareMode ? 'active' : ''}`}
    >
      {shareMode ? 'Cancel Sharing' : 'Share Task with Friends'}
    </button>

    <div className="action-buttons">
      <button 
        onClick={setCurrentDateTime}
        className="set-now-button"
        type="button"
      >
        Set Now
      </button>

      <button 
        onClick={handleAddTask} 
        disabled={loading}
        type="button"
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Creating...' : 'Create Task'}
      </button>
    </div>
  </div>
</div>

    {/* Search and Filter Controls */}
<div className="sort-options">
  <div className="controls-container">
    <div className="control-group">
      <label>Search:</label>
      <input
        type="text"
        placeholder="Search tasks..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
    </div>

    <div className="control-group">
      <label>Filter:</label>
      <select 
        value={filterOption} 
        onChange={(e) => setFilterOption(e.target.value)}
      >
        <option value="all">All Tasks</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
        <option value="overdue">Overdue</option>
      </select>
    </div>

    <div className="control-group">
      <label>Sort by:</label>
      <select 
        value={sortOption} 
        onChange={(e) => setSortOption(e.target.value)}
      >
        <option value="">Default</option>
        <option value="date">Due Date</option>
        <option value="priority">Priority</option>
        <option value="name">Name</option>
      </select>
    </div>
  </div>
</div>

      {/* Task Tabs */}
      <div className="task-tabs">
        <button
          onClick={() => setActiveTaskTab('personal')}
          style={{
            padding: '10px 20px',
            background: activeTaskTab === 'personal' ? '#f0f0f0' : 'transparent',
            border: 'none',
            borderBottom: activeTaskTab === 'personal' ? '2px solid #2196F3' : 'none',
            cursor: 'pointer',
            fontWeight: activeTaskTab === 'personal' ? 'bold' : 'normal'
          }}
        >
          My Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTaskTab('shared')}
          style={{
            padding: '10px 20px',
            background: activeTaskTab === 'shared' ? '#f0f0f0' : 'transparent',
            border: 'none',
            borderBottom: activeTaskTab === 'shared' ? '2px solid #2196F3' : 'none',
            cursor: 'pointer',
            fontWeight: activeTaskTab === 'shared' ? 'bold' : 'normal'
          }}
        >
          Shared Tasks ({sharedTasks.length})
        </button>
      </div>

      {/* Personal Tasks Tab */}
      {activeTaskTab === 'personal' && (
        <div className="task-list">
          <h2>
            My Tasks
            {searchTerm && ` (${filteredAndSortedTasks.length} results for "${searchTerm}")`}
            {filterOption !== 'all' && ` - ${filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}`}
          </h2>
          
          {loading ? (
            <div className="loading-container">
              <span className="loading"></span>
              <span className="loading-text">Loading tasks...</span>
            </div>
          ) : filteredAndSortedTasks.length === 0 ? (
            <div className="empty-state">
              {searchTerm || filterOption !== 'all' 
                ? 'No tasks found matching your criteria.' 
                : 'No tasks yet. Create your first task above!'}
            </div>
          ) : (
            <ul>
              {filteredAndSortedTasks.map((task) => {
                const taskDate = new Date(`${task.date} ${task.time || '23:59'}`);
                const isOverdue = !task.completed && taskDate < new Date();
                
                return (
                  <li 
                    key={task.id} 
                    className={`task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
                  >
                    <input 
                      type="checkbox" 
                      checked={task.completed} 
                      onChange={() => handleToggle(task.id, task.completed)}
                    />
                    <div>
                      <strong>{task.name}</strong>
                      {isOverdue && !task.completed && (
                        <span className="overdue-label">
                          OVERDUE
                        </span>
                      )}
                      <br />
                      <small>
                        <span>Due: {task.date} {task.time}</span>
                        <span>Workload: {task.workload}</span>
                        <span className={`priority-tag ${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                      </small>
                    </div>
                    <button 
                      className="delete-button" 
                      onClick={() => handleDelete(task.id, task.name)}
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Shared Tasks Tab */}
      {activeTaskTab === 'shared' && (
        <div className="task-list">
          <h2>
            Shared With Me
            {searchTerm && ` (${filteredAndSortedSharedTasks.length} results for "${searchTerm}")`}
            {filterOption !== 'all' && ` - ${filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}`}
          </h2>
          
          {loading ? (
            <div className="loading-container">
              <span className="loading"></span>
              <span className="loading-text">Loading shared tasks...</span>
            </div>
          ) : filteredAndSortedSharedTasks.length === 0 ? (
            <div className="empty-state">
              {searchTerm || filterOption !== 'all' 
                ? 'No shared tasks found matching your criteria.' 
                : 'No tasks have been shared with you yet.'}
            </div>
          ) : (
            <ul>
              {filteredAndSortedSharedTasks.map((task) => {
                const taskDate = new Date(`${task.date} ${task.time || '23:59'}`);
                const isOverdue = !task.completed && taskDate < new Date();
                
                return (
                  <li 
                    key={task.id} 
                    className={`task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
                  >
                    <input 
                      type="checkbox" 
                      checked={task.completed} 
                      onChange={() => handleToggle(task.id, task.completed)}
                    />
                    <div>
                      <strong>{task.name}</strong>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        color: '#666',
                        marginLeft: '10px'
                      }}>
                        (Shared by {task.owner_username})
                      </span>
                      {isOverdue && !task.completed && (
                        <span className="overdue-label">
                          OVERDUE
                        </span>
                      )}
                      <br />
                      <small>
                        <span>Due: {task.date} {task.time}</span>
                        <span>Workload: {task.workload}</span>
                        <span className={`priority-tag ${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                      </small>
                    </div>
                    <button 
                      className="delete-button" 
                      onClick={() => handleDelete(task.id, task.name, true)}
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

export default Task;