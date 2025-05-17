import React, { useState } from 'react';
import './App.css';

function App() {
  const [taskName, setTaskName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [tasks, setTasks] = useState([]);
  const [priority, setPriority] = useState('');
  const [sortOption, setSortOption] = useState('');



  const handleCreateTask = () => {
    if (taskName.trim() === '' || dueDate === '' || dueTime === '' || priority === '') {
      alert('Please fill in all fields.');
      return;
    }
  
    const newTask = {
      id: Date.now(),
      name: taskName,
      date: dueDate,
      time: dueTime,
      priority: priority,
      completed: false,
    };
  
    setTasks([...tasks, newTask]);
    setTaskName('');
    setDueDate('');
    setDueTime('');
    setPriority('');
  };  

  const handleToggle = (id) => {
    const updatedTasks = tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
  };

  const sortedTasks = [...tasks];

  if (sortOption === 'date') {
    sortedTasks.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
  } else if (sortOption === 'priority') {
    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
    sortedTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }




  return (
    <div className="App">
      <h1>TaskMaster</h1>

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
        <button onClick={handleCreateTask}>Create Task</button>
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
              <input type="checkbox" checked={task.completed} onChange={() => handleToggle(task.id)} />
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
