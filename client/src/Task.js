import { useState, useEffect, useMemo } from 'react';
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

  // Load tasks when user logs in
  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  // Load tasks from server
  const loadTasks = async () => {
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
  };

  // Enhanced form validation
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
    
    if (!priority) {
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

  // Handle input changes with real-time validation
  const handleInputChange = (field, value) => {
    switch (field) {
      case 'taskName':
        setTaskName(value);
        if (errors.taskName) {
          setErrors(prev => ({ ...prev, taskName: '' }));
        }
        break;
      case 'dueDate':
        setDueDate(value);
        if (errors.dueDate) {
          setErrors(prev => ({ ...prev, dueDate: '' }));
        }
        break;
      case 'priority':
        setPriority(value);
        if (errors.priority) {
          setErrors(prev => ({ ...prev, priority: '' }));
        }
        break;
      case 'workload':
        setWorkload(value);
        if (errors.workload) {
          setErrors(prev => ({ ...prev, workload: '' }));
        }
        break;
    }
  };

  // Enhanced task toggle with optimistic updates
  const handleToggle = async (id, completed) => {
    // Optimistic update
    setTasks(prev => 
      prev.map(task =>
        task.id === id ? { ...task, completed: !completed } : task
      )
    );

    try {
      const response = await fetch(`http://localhost:5000/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      showMessage(completed ? 'Task marked as incomplete' : 'Task completed!');
    } catch (error) {
      // Revert optimistic update on error
      setTasks(prev => 
        prev.map(task =>
          task.id === id ? { ...task, completed: completed } : task
        )
      );
      showMessage('Failed to update task', 'error');
      console.error('Task update error:', error);
    }
  };

  // Enhanced task creation
  const handleAddTask = async () => {
    if (!validateTaskForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/tasks/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: taskName.trim(),
          date: dueDate,
          time: dueTime,
          priority: priority,
          workload: workload.trim(),
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      const data = await response.json();
      
      // Add new task to state
      setTasks(prev => [...prev, {
        id: data.id,
        name: taskName.trim(),
        date: dueDate,
        time: dueTime,
        priority: priority,
        workload: workload.trim(),
        completed: false
      }]);

      // Reset form
      setTaskName('');
      setDueDate('');
      setDueTime('');
      setPriority('');
      setWorkload('');
      setErrors({});
      
      showMessage('Task created successfully!');
    } catch (err) {
      console.error('Task creation error:', err);
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced task deletion with confirmation
  const handleDelete = async (taskId, taskName) => {
    if (!window.confirm(`Are you sure you want to delete "${taskName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
        showMessage('Task deleted successfully');
      } else {
        throw new Error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      showMessage('Failed to delete task', 'error');
    }
  };

  // Memoized filtered and sorted tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(task =>
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.workload.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply completion filter
    switch (filterOption) {
      case 'completed':
        filtered = filtered.filter(task => task.completed);
        break;
      case 'pending':
        filtered = filtered.filter(task => !task.completed);
        break;
      case 'overdue':
        filtered = filtered.filter(task => {
          if (task.completed) return false;
          const taskDate = new Date(`${task.date} ${task.time || '23:59'}`);
          return taskDate < new Date();
        });
        break;
      default: // 'all'
        break;
    }

    // Apply sorting
    const sorted = [...filtered];
    if (sortOption === 'date') {
      sorted.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
    } else if (sortOption === 'priority') {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else if (sortOption === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    return sorted;
  }, [tasks, searchTerm, filterOption, sortOption]);

  // Calculate task statistics
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(task => {
      if (task.completed) return false;
      const taskDate = new Date(`${task.date} ${task.time || '23:59'}`);
      return taskDate < new Date();
    }).length;

    return { total, completed, pending, overdue };
  }, [tasks]);

  // Auto-set current date and time
  const setCurrentDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);
    setDueDate(date);
    setDueTime(time);
    if (errors.dueDate) {
      setErrors(prev => ({ ...prev, dueDate: '' }));
    }
  };

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
        <div className={`form-group ${errors.taskName ? 'error' : ''}`}>
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
          <input
            type="date"
            value={dueDate}
            onChange={(e) => handleInputChange('dueDate', e.target.value)}
            disabled={loading}
          />
          {errors.dueDate && <span className="error-message">{errors.dueDate}</span>}
        </div>

        <div className="form-group">
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={`form-group ${errors.priority ? 'error' : ''}`}>
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
          <input
            type="text"
            placeholder="Workload (e.g., 2hr 30min)"
            value={workload}
            onChange={(e) => handleInputChange('workload', e.target.value)}
            disabled={loading}
          />
          {errors.workload && <span className="error-message">{errors.workload}</span>}
        </div>

        <button 
          onClick={setCurrentDateTime}
          className="set-now-button"
        >
          Set Now
        </button>

        <button 
          onClick={handleAddTask} 
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="sort-options">
        <div className="controls-container">
          <div>
            <label>Search: </label>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div>
            <label>Filter: </label>
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

          <div>
            <label>Sort by: </label>
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

      {/* Task List */}
      <div className="task-list">
        <h2>
          Task List 
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
    </>
  );
};

export default Task;