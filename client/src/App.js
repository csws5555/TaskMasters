import React, { useState, useEffect } from 'react';
import Login from './Login';
import './App.css';


function App() {
  const [taskName, setTaskName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [tasks, setTasks] = useState([]);
  const [priority, setPriority] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [user, setUser] = useState(null);


useEffect(() => {
  if (user) {
    fetch(`http://localhost:5000/tasks/${user.id}`)
      .then(res => res.json())
      .then(data => setTasks(data));
  }
}, [user]);

if (!user) {
  return <Login onLogin={setUser} />;
}
 

  const handleToggle = (id, completed) => {
    fetch(`http://localhost:5000/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !completed }),
    }).then(() => {
      setTasks(prev => 
        prev.map(task =>
          task.id === id ? { ...task, completed: !completed } : task
        )
      );
    });
  };
  

  const sortedTasks = [...tasks];

  if (sortOption === 'date') {
    sortedTasks.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
  } else if (sortOption === 'priority') {
    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
    sortedTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  const handleAddTask = () => {
    // Validate required fields
    if (!taskName.trim() || !dueDate || !priority) {
      alert('Task name, due date, and priority are required');
      return;
    }
  
    fetch(`http://localhost:5000/tasks/${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: taskName,
        date: dueDate,
        time: dueTime,
        priority: priority,
      })
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to create task');
      return res.json();
    })
    .then(data => {
      setTasks(prev => [...prev, {
        id: data.id,
        name: taskName,
        date: dueDate,
        time: dueTime,
        priority: priority,
        completed: false
      }]);
      // Reset form
      setTaskName('');
      setDueDate('');
      setDueTime('');
      setPriority('');
    })
    .catch(err => {
      console.error('Task creation error:', err);
      alert(err.message);
    });
  };




  return (
    <div className="App">
      <h1>
        <img src="/logo.png" alt="logo" className="logo" />
        TaskMasters
      </h1>

      <div className="task-form">
        <input
          type="text"
          placeholder="Enter task name"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <input
          type="time"
          value={dueTime}
          onChange={(e) => setDueTime(e.target.value)}
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">Select Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <button onClick={handleAddTask}>Create Task</button>
      </div>

      <div className="sort-options">
        <label>Sort by: </label>
        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
          <option value="">None</option>
          <option value="date">Due Date</option>
          <option value="priority">Priority</option>
        </select>
      </div>

      <div className="task-list">
        <h2>Task List</h2>
        <ul>
          {sortedTasks.map((task) => (
            <li key={task.id}>
              <input type="checkbox" checked={task.completed} onChange={() => handleToggle(task.id, task.completed)} />
              <div>
                <strong>{task.name}</strong><br />
                <small>Due: {task.date} {task.time} | 
                  <span className={`priority-tag ${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                </small>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
