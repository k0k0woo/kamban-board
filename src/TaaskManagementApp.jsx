import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- Local Storage Key ---
const LOCAL_STORAGE_KEY = 'task_manager_data';
const THEME_KEY = 'task_manager_theme';

// Status options for active Kanban board columns
const ACTIVE_STATUSES = ['Opened', 'In Progress', 'Completed'];

// Date Formatting Utility
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  // Ensure we format only the date part to avoid timezone issues for due dates
  const date = new Date(Number(timestamp)); 
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Utility to convert date string (YYYY-MM-DD) to start-of-day timestamp
const dateStringToTimestamp = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  // Set time to 00:00:00 for accurate day comparison
  date.setHours(0, 0, 0, 0); 
  return date.getTime();
};

// Utility to generate a unique ID
const generateId = () => crypto.randomUUID();

// --- Modal Component ---
const Modal = ({ isOpen, onClose, children, title, size = 'max-w-lg', isDarkMode }) => {
  if (!isOpen) return null;

  const overlayClass = isDarkMode 
    ? "bg-gray-900 bg-opacity-75" 
    : "bg-gray-100 bg-opacity-75 backdrop-blur-sm";

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${overlayClass}`}
      onClick={(e) => {
        // Only close if the click is directly on the overlay, not the content box
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full ${size} overflow-hidden transform transition-all duration-300 scale-100 opacity-100 dark:border dark:border-gray-700`}
        // Prevent clicks inside the modal content from bubbling up to the overlay
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 transition"
            aria-label="Close modal"
          >
            {/* Inline SVG for Close Icon (X) */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </header>
        <div className="p-5 overflow-y-auto max-h-[80vh] custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- TaskCard Component (Active Kanban) ---
const TaskCard = React.memo(({ task, onStatusChange, onDeleteTask, onToggleSubtask, onEditTask }) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  const currentStatusIndex = ACTIVE_STATUSES.indexOf(task.status);
  const subtasksCompleted = task.subtasks?.filter(s => s.completed).length || 0;
  const subtaskTotal = task.subtasks?.length || 0;
  const subtaskProgress = subtaskTotal > 0 ? `${subtasksCompleted}/${subtaskTotal}` : 'N/A';
  const totalSubtaskEta = task.subtasks?.reduce((sum, sub) => sum + (sub.eta || 0), 0) || 0;

  // Handler for confirmed deletion
  const handleDeleteConfirmed = useCallback(() => {
    setShowConfirmDelete(false);
    onDeleteTask(task.id);
  }, [task.id, onDeleteTask]);
  
  // Handler to move task status forward
  const handleMoveForward = useCallback(() => {
    if (currentStatusIndex < ACTIVE_STATUSES.length - 1) {
      const nextStatus = ACTIVE_STATUSES[currentStatusIndex + 1];
      onStatusChange(task.id, nextStatus);
    }
  }, [currentStatusIndex, task.id, onStatusChange]);

  // Handler to move task status backward
  const handleMoveBackward = useCallback(() => {
    if (currentStatusIndex > 0) {
      const prevStatus = ACTIVE_STATUSES[currentStatusIndex - 1];
      onStatusChange(task.id, prevStatus);
    }
  }, [currentStatusIndex, task.id, onStatusChange]);

  // Handler for drag start: sets the data being dragged (the taskId)
  const handleDragStart = useCallback((e) => {
    e.dataTransfer.setData("taskId", task.id);
    e.currentTarget.style.opacity = '0.4'; 
  }, [task.id]);

  // Handler for drag end: resets the visual effect
  const handleDragEnd = useCallback((e) => {
    e.currentTarget.style.opacity = '1';
  }, []);

  const statusColors = {
    'Opened': 'bg-blue-100 dark:bg-blue-900 border-blue-400 dark:border-blue-700 text-blue-800 dark:text-blue-200',
    'In Progress': 'bg-yellow-100 dark:bg-yellow-900 border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200',
    'Completed': 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-700 text-green-800 dark:text-green-200',
  };

  return (
    <div 
      className={`p-4 rounded-xl shadow-lg transition-all duration-300 cursor-grab ${statusColors[task.status]}`}
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex justify-between items-start mb-2">

        
        {/* Delete Button */}
        <button
          onClick={() => setShowConfirmDelete(true)}
          className="w-5 ml-0 bg-red-500 hover:bg-red-600 text-white font-semibold px-1 rounded-lg transition duration-150 ease-in-out shadow-md"
        >
            X
        </button>

         {/* Title and Edit Button */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 border-b pb-1 border-gray-300 dark:border-gray-600 flex-1">
          {task.title}
        </h3>
        
        {/* Edit Button */}
        <button
          onClick={() => onEditTask(task)}
          className="ml-2 p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
          title="Edit Task Details"
        >
          {/* Pencil icon SVG */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-7-9l5 5m-5-5l-5 5m5-5l-5 5m5-5l5 5M17 5l-5 5"></path></svg>
        </button>
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{task.description}</p>
      
      {/* Dates and Points */}
      <div className="space-y-2 mb-4 text-sm border-b pb-3 border-gray-300 dark:border-gray-600">
        <div className="flex justify-between font-medium">
          <span className="text-gray-900 dark:text-gray-100">Points ETA:</span>
          <span className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-900 shadow-sm font-semibold">{task.eta}</span>
        </div>
        <div className="flex justify-between text-gray-700 dark:text-gray-300">
          <span>Due Date:</span>
          <span className="font-semibold">{formatDate(task.dueDate)}</span>
        </div>
        {task.completedDate && (
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Completed:</span>
            <span className="font-semibold text-green-700 dark:text-green-300">{formatDate(task.completedDate)}</span>
          </div>
        )}
        {subtaskTotal > 0 && (
           <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Subtask Progress:</span>
            <span className={`font-semibold ${subtasksCompleted === subtaskTotal ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
              {subtaskProgress} ({totalSubtaskEta} Pts)
            </span>
          </div>
        )}
      </div>

      {/* Subtasks Checklist */}
      {subtaskTotal > 0 && (
        <div className="space-y-2 mb-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Subtasks:</h4>
          {task.subtasks.map(subtask => (
            <div key={subtask.id} className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => onToggleSubtask(task.id, subtask.id)}
                className="form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded mr-2 bg-white dark:bg-gray-700"
              />
              <span className={`flex-1 text-gray-700 dark:text-gray-300 ${subtask.completed ? 'line-through opacity-60' : ''}`}>
                {subtask.title} ({subtask.eta} Pts, Due: {formatDate(subtask.dueDate)})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Message Box (Inline) */}
      {showConfirmDelete && (
        <div className="p-3 bg-red-50 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg mb-4">
          <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            Are you sure you want to delete "{task.title}"?
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirmed}
              className="px-3 py-1 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      )}

      {/* Control Buttons (Arrows and Delete) */}
      <div className="flex gap-2 justify-between mt-4 pt-3 border-t border-gray-300 dark:border-gray-700">
        {/* Previous Status Button */}
        <button
          onClick={handleMoveBackward}
          disabled={currentStatusIndex === 0}
          className="w-1/5 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-extrabold py-2 px-3 rounded-lg transition duration-150 ease-in-out shadow-md disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          title="Move to Previous Status"
        >
          {/* Inline SVG for Left Arrow */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        
        {/* Next Status Button */}
        <button
          onClick={handleMoveForward}
          disabled={currentStatusIndex === ACTIVE_STATUSES.length - 1}
          className="w-1/5 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-extrabold py-2 px-3 rounded-lg transition duration-150 ease-in-out shadow-md disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          title="Move to Next Status"
        >
          {/* Inline SVG for Right Arrow */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>
    </div>
  );
});

// --- TaskForm Component (Handles Create and Edit) ---
const TaskForm = React.memo(({ initialTask, onTaskSave, onTaskCreated }) => {
  const isEditing = !!initialTask;
  
  // State for Main Task
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [eta, setEta] = useState(initialTask?.eta || 1);
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ? new Date(initialTask.dueDate).toISOString().split('T')[0] : ''); // Date string (YYYY-MM-DD)

  // State for Subtasks
  const [subtasks, setSubtasks] = useState(initialTask?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskEta, setNewSubtaskEta] = useState(0);
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState('');

  // Validation State
  const [etaError, setEtaError] = useState(null);

  // Set default due date to tomorrow if not editing
  useEffect(() => {
    if (!isEditing && !dueDate) {
      const today = new Date();
      today.setDate(today.getDate() + 1);
      const defaultDate = today.toISOString().split('T')[0];
      setDueDate(defaultDate);
    }
  }, [isEditing, dueDate]);

  // Calculate total subtask ETA and validate
  const totalSubtaskEta = useMemo(() => {
    return subtasks.reduce((sum, sub) => sum + (sub.eta || 0), 0);
  }, [subtasks]);

  // Validate total subtask ETA against main task ETA
  useEffect(() => {
    if (totalSubtaskEta > eta) {
      setEtaError(`Total subtask points (${totalSubtaskEta}) cannot exceed the main task's ETA (${eta}).`);
    } else {
      setEtaError(null);
    }
  }, [totalSubtaskEta, eta]);


  // Handler to add a new subtask to the temporary list
  const handleAddSubtask = useCallback((e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const subDueTimestamp = newSubtaskDueDate ? dateStringToTimestamp(newSubtaskDueDate) : null;

    const newSub = {
      id: generateId(),
      title: newSubtaskTitle.trim(),
      completed: false,
      eta: parseInt(newSubtaskEta, 10) || 0,
      dueDate: subDueTimestamp,
    };

    setSubtasks(prev => [...prev, newSub]);
    setNewSubtaskTitle('');
    setNewSubtaskEta(0);
    setNewSubtaskDueDate('');

  }, [newSubtaskTitle, newSubtaskEta, newSubtaskDueDate]);

  // Handler to remove a subtask
  const handleRemoveSubtask = useCallback((id) => {
    setSubtasks(prev => prev.filter(sub => sub.id !== id));
  }, []);

  // Main submission handler
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !dueDate || etaError) return;

    const finalDueDateTimestamp = dateStringToTimestamp(dueDate);

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      eta: parseInt(eta, 10) || 1,
      dueDate: finalDueDateTimestamp,
      subtasks: subtasks,
      // If editing, preserve original status/dates, otherwise set new ones
      status: initialTask?.status || 'Opened',
      completedDate: initialTask?.completedDate || null,
      createdAt: initialTask?.createdAt || Date.now(),
    };
    
    // Pass back the data with its ID if editing, or without if creating
    if (isEditing) {
      onTaskSave({ ...taskData, id: initialTask.id });
    } else {
      onTaskSave({ ...taskData, id: generateId() });
    }

    if (onTaskCreated) onTaskCreated();

  }, [title, description, eta, dueDate, subtasks, initialTask, isEditing, etaError, onTaskSave, onTaskCreated]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{isEditing ? 'Edit Task Details' : 'Task Details'}</h3>
      <div className="space-y-4 border-b pb-4 border-gray-200 dark:border-gray-700">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm p-3 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            placeholder="e.g., Implement dark mode feature"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows="3"
            className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm p-3 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            placeholder="Detail the steps required for this task."
          />
        </div>
        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="eta" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Points ETA (Main Task)</label>
            <input
              type="number"
              id="eta"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
              required
              min="1"
              className={`mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm p-3 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${etaError ? 'border-red-500' : 'focus:border-blue-500'}`}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm p-3 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
        {etaError && (
          <p className="text-red-500 text-sm font-medium p-2 bg-red-100 dark:bg-red-900 rounded-lg border border-red-300 dark:border-red-700">{etaError}</p>
        )}
      </div>

      {/* --- Subtask Section --- */}
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex justify-between items-center">
        <span>Subtasks ({totalSubtaskEta} / {eta} Pts)</span>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Remaining: {Math.max(0, eta - totalSubtaskEta)} Pts
        </span>
      </h3>
      
      {/* Existing Subtasks */}
      {subtasks.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar p-2 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
          {subtasks.map(sub => (
            <div key={sub.id} className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-gray-900 shadow-sm text-sm">
              <span className={`flex-1 font-medium text-gray-800 dark:text-gray-200 ${sub.completed ? 'line-through opacity-70' : ''}`}>
                {sub.title}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 mr-4 whitespace-nowrap">
                {sub.eta} Pts &middot; Due: {formatDate(sub.dueDate)}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveSubtask(sub.id)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-400 ml-2"
                title="Remove Subtask"
              >
                {/* Close Icon SVG */}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Subtask Form */}
      <div className="space-y-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-inner">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Add New Subtask</label>
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:space-x-3 items-end">
          <input
            type="text"
            placeholder="Subtask Title"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 shadow-sm p-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            type="number"
            placeholder="Points"
            min="0"
            max={eta - totalSubtaskEta} // Max is remaining points
            value={newSubtaskEta}
            onChange={(e) => setNewSubtaskEta(e.target.value)}
            className="w-24 rounded-lg border-gray-300 dark:border-gray-600 shadow-sm p-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            type="date"
            value={newSubtaskDueDate}
            onChange={(e) => setNewSubtaskDueDate(e.target.value)}
            className="w-32 rounded-lg border-gray-300 dark:border-gray-600 shadow-sm p-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={handleAddSubtask}
            disabled={!newSubtaskTitle.trim() || totalSubtaskEta + (parseInt(newSubtaskEta, 10) || 0) > eta}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg text-sm transition disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>


      {/* Submit Button */}
      <button
        type="submit"
        disabled={etaError}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out disabled:opacity-50"
      >
        {isEditing ? 'Save Changes' : 'Create Task'}
      </button>
    </form>
  );
});


// Component for viewing archived tasks
const ArchivedTasksModal = ({ isOpen, onClose, archivedTasks, onDeleteTask, isDarkMode }) => { 
  const [sortBy, setSortBy] = useState('dueDate');
  const [searchQuery, setSearchQuery] = useState('');
  const [completedAfter, setCompletedAfter] = useState(''); // Date string for filtering
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  // Filter tasks based on search and completed date
  const filteredTasks = useMemo(() => {
    return archivedTasks.filter(task => {
      // 1. Search filter
      const searchMatch = searchQuery.trim() === '' || 
                          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!searchMatch) return false;

      // 2. Completed Date filter (Completed After)
      if (completedAfter) {
        const filterTimestamp = dateStringToTimestamp(completedAfter);
        // Completed Date must be greater than or equal to the filter date
        if (task.completedDate < filterTimestamp) return false;
      }

      return true;
    });
  }, [archivedTasks, searchQuery, completedAfter]);

  // Sort the tasks based on the selected criteria
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (sortBy === 'dueDate') {
        // Sort by Due Date (ascending: earlier due date first)
        return (a.dueDate || Infinity) - (b.dueDate || Infinity);
      } else if (sortBy === 'eta') {
        // Sort by Point Cost (descending: higher cost first)
        return (b.eta || 0) - (a.eta || 0);
      }
      return 0;
    });
  }, [filteredTasks, sortBy]);
  
  // Confirmation state for archived deletion
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); 

  const handleDeleteConfirmed = useCallback((id) => {
    onDeleteTask(id);
    setConfirmDeleteId(null);
    if (expandedTaskId === id) setExpandedTaskId(null);
  }, [onDeleteTask, expandedTaskId]);

  const handleToggleExpand = useCallback((id) => {
    setExpandedTaskId(prevId => (prevId === id ? null : id));
  }, []);


  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Archived Tasks" 
      size="max-w-4xl"
      isDarkMode={isDarkMode}
    >
      <div className="space-y-4">
        {/* Filtering and Sorting Controls */}
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
             {/* Search */}
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
             {/* Completed After Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">Completed After:</label>
              <input
                type="date"
                value={completedAfter}
                onChange={(e) => setCompletedAfter(e.target.value)}
                className="rounded-lg border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 text-sm w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm font-medium">
            <div className="flex items-center space-x-3">
              <label className="text-gray-700 dark:text-gray-300">Sort By:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border-gray-300 dark:border-gray-600 shadow-sm py-1 px-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="dueDate">Due Date</option>
                <option value="eta">Point Cost (ETA)</option>
              </select>
            </div>
            <span className="text-gray-500 dark:text-gray-400 italic">Showing {sortedTasks.length} of {archivedTasks.length} Archived Tasks</span>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {sortedTasks.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 p-8 italic">No tasks match the current filter criteria.</p>
          ) : (
            sortedTasks.map(task => {
              const subtasksCompleted = task.subtasks?.filter(s => s.completed).length || 0;
              const subtaskTotal = task.subtasks?.length || 0;
              const isExpanded = expandedTaskId === task.id;

              return (
                <div key={task.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md transition hover:shadow-lg overflow-hidden">
                  
                  {/* Task Summary Header (Clickable) */}
                  <div 
                    className="p-3 flex justify-between items-start cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleToggleExpand(task.id)}
                  >
                    <div className="flex-1 min-w-0 pr-4 text-left">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                        {task.title}
                        {/* Chevron Icon */}
                        <svg className={`w-4 h-4 ml-2 transform transition-transform ${isExpanded ? 'rotate-180' : 'rotate-0'} text-gray-500 dark:text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-lg">{task.description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right text-sm space-y-1 w-40 text-gray-700 dark:text-gray-300">
                        <p className="font-medium">Points: <span className="text-blue-600 dark:text-blue-400">{task.eta}</span></p>
                        <p className="text-xs">Completed: {formatDate(task.completedDate)}</p>
                        {subtaskTotal > 0 && <p className="text-xs">Subtasks: {subtasksCompleted}/{subtaskTotal}</p>}
                      </div>
                      
                      {/* Delete Button and Confirmation */}
                      <div className="ml-3">
                        {confirmDeleteId === task.id ? (
                          <div className="flex space-x-2 p-1 bg-red-100 dark:bg-red-800 rounded-lg border border-red-300 dark:border-red-600 text-sm font-medium">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                              className="text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 px-2 transition"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteConfirmed(task.id); }}
                              className="bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(task.id); }}
                            className="text-red-500 hover:text-red-700 dark:text-red-500 dark:hover:text-red-300 transition p-1 rounded-full border border-gray-300 dark:border-gray-600"
                            title="Permanently delete this archived task"
                          >
                            {/* Trash icon SVG */}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Subtask Details (Hidden/Visible) */}
                  {isExpanded && task.subtasks && task.subtasks.length > 0 && (
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <h5 className="font-bold text-sm mb-2 text-gray-800 dark:text-gray-200">Subtask Breakdown:</h5>
                      <div className="space-y-2">
                        {task.subtasks.map(sub => (
                          <div key={sub.id} className="flex justify-between text-xs p-2 rounded-md bg-white dark:bg-gray-900 shadow-sm">
                            <span className={`flex-1 text-gray-800 dark:text-gray-200 ${sub.completed ? 'line-through opacity-70' : ''}`}>
                              {sub.title}
                            </span>
                            <div className="flex space-x-4 text-gray-600 dark:text-gray-400">
                              <span>{sub.eta} Pts</span>
                              <span>Due: {formatDate(sub.dueDate)}</span>
                              <span className={sub.completed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                {sub.completed ? 'Completed' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};


// Main Application Component
export default function App() {
  const [tasks, setTasks] = useState([]);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null); // State to hold the task being edited
  const [isLoading, setIsLoading] = useState(true);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_KEY);
      // Default to true (dark) if not explicitly light
      return storedTheme === 'dark' || storedTheme === null;
    } catch {
      return true; // Default to dark mode on error or no preference
    }
  });

  // Main Board Filters & Sorting
  const [mainBoardSortBy, setMainBoardSortBy] = useState('dueDate');
  const [mainSearchQuery, setMainSearchQuery] = useState('');
  const [dueByDate, setDueByDate] = useState(''); // Date string for filtering

  const [archiveMessage, setArchiveMessage] = useState(null); // State for archive feedback


  // 1. Initial Load from LocalStorage
  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error("Error loading tasks from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Run only once on mount

  // 2. Save tasks to LocalStorage whenever state changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
      } catch (error) {
        console.error("Error saving tasks to localStorage:", error);
      }
    }
  }, [tasks, isLoading]);
  
  // 3. Save theme preference
  useEffect(() => {
    localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Toggle theme handler
  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // Handler to open the edit modal
  const handleEditTask = useCallback((task) => {
    setTaskToEdit(task);
    setIsNewTaskModalOpen(true);
  }, []);

  // Handler for saving/creating a task (used by TaskForm)
  const handleTaskSave = useCallback((taskData) => {
    if (taskToEdit) {
      // Editing existing task
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskData.id ? taskData : task
      ));
      setTaskToEdit(null); // Clear edit state
    } else {
      // Creating new task
      setTasks(prevTasks => [...prevTasks, taskData]);
    }
    setIsNewTaskModalOpen(false);
  }, [taskToEdit]);

  // Handler to close the task form modal and clear edit state
  const handleCloseTaskModal = useCallback(() => {
    setIsNewTaskModalOpen(false);
    setTaskToEdit(null); // Always clear edit state when closing
  }, []);

  // Delete Task handler (used by both Kanban and Archived Modal)
  const handleDeleteTask = useCallback((taskId) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  }, []);

  // Handler to toggle subtask completion status
  const handleToggleSubtask = useCallback((taskId, subtaskId) => {
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        const newSubtasks = task.subtasks.map(sub => 
          sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
        );
        return { ...task, subtasks: newSubtasks };
      }
      return task;
    }));
  }, []);

  // Function to handle status change update in state and persistence
  const handleTaskStatusChange = useCallback((taskId, newStatus) => {
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        let updatedTask = { ...task, status: newStatus };

        // Set completedDate if moving to 'Completed'
        if (newStatus === 'Completed') {
          updatedTask.completedDate = Date.now();
        } 
        // Clear completedDate if moving out of 'Completed'
        else if (newStatus !== 'Completed') {
          updatedTask.completedDate = null;
        }
        return updatedTask;
      }
      return task;
    }));
  }, []);


  // Bulk Archive Function
  const handleArchiveCompletedTasks = useCallback(() => {
    
    // Calculate the start of the current week (7 days ago)
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    let archivedCount = 0;

    setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(task => {
            
            const isCompleted = task.status === 'Completed';
            const completedWithinWeek = task.completedDate && Number(task.completedDate) >= oneWeekAgo;
            
            if (isCompleted && completedWithinWeek) {
                archivedCount++;
                return { 
                    ...task, 
                    status: 'Archived', 
                    archivedAt: Date.now() 
                };
            }
            return task;
        });

        // Display feedback
        if (archivedCount > 0) {
            setArchiveMessage(`Successfully archived ${archivedCount} completed tasks from the last week!`);
        } else {
            setArchiveMessage("No tasks completed in the last week to archive.");
        }
        setTimeout(() => setArchiveMessage(null), 5000);

        return updatedTasks;
    });

  }, []);


  // Group and sort tasks for display on the main board
  const { groupedTasks, archivedTasks, pointSummary } = useMemo(() => {
    const groups = { 'Opened': [], 'In Progress': [], 'Completed': [] };
    const archived = [];
    
    // Timestamp for Due By filtering
    // Convert date string to start-of-day timestamp
    const dueByTimestamp = dueByDate ? dateStringToTimestamp(dueByDate) : Infinity;
    const searchLower = mainSearchQuery.toLowerCase();

    tasks.forEach(task => {
      if (task.status === 'Archived') {
        archived.push(task);
        return;
      }
      
      // 1. Filtering Logic (for non-archived tasks)
      const matchesSearch = searchLower === '' || 
                            task.title.toLowerCase().includes(searchLower) || 
                            task.description.toLowerCase().includes(searchLower);
      
      const matchesDueBy = dueByDate === '' || (task.dueDate && task.dueDate <= dueByTimestamp);

      if (!matchesSearch || !matchesDueBy) {
          return;
      }

      // 2. Grouping Logic
      if (ACTIVE_STATUSES.includes(task.status)) {
        groups[task.status].push(task);
      } else {
        groups['Opened'].push(task); 
      }
    });

    // 3. Sorting Logic
    const sorter = (a, b) => {
      if (mainBoardSortBy === 'dueDate') {
        // Sort by Due Date (ascending: earlier due date first)
        return (a.dueDate || Infinity) - (b.dueDate || Infinity);
      } else if (mainBoardSortBy === 'eta') {
        // Sort by Point Cost (descending: higher cost first)
        return (b.eta || 0) - (a.eta || 0);
      }
      return 0;
    };

    groups['Opened'].sort(sorter);
    groups['In Progress'].sort(sorter);

    // Calculate total points ETA for each status
    const summary = ACTIVE_STATUSES.reduce((acc, status) => {
      acc[status] = groups[status].reduce((sum, task) => sum + (task.eta || 0), 0);
      return acc;
    }, {});

    return { groupedTasks: groups, archivedTasks: archived, pointSummary: summary };
  }, [tasks, mainBoardSortBy, mainSearchQuery, dueByDate]);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-600 dark:text-gray-300">Loading Task Manager...</p>
      </div>
    );
  }

  // Kanban Column Component
  const KanbanColumn = ({ status, tasks, totalPoints, onStatusChange, onArchiveTasks }) => {
    const statusClasses = {
      'Opened': 'bg-blue-500',
      'In Progress': 'bg-yellow-500',
      'Completed': 'bg-green-500',
    };
    const headerColor = statusClasses[status] || 'bg-gray-500';
    const isCompleted = status === 'Completed';

    // Drag and Drop Handlers
    const handleDragOver = (e) => {
      e.preventDefault(); 
      e.currentTarget.classList.add('ring-4', 'ring-indigo-300', 'dark:ring-indigo-500');
    };

    const handleDragLeave = (e) => {
      e.currentTarget.classList.remove('ring-4', 'ring-indigo-300', 'dark:ring-indigo-500');
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.currentTarget.classList.remove('ring-4', 'ring-indigo-300', 'dark:ring-indigo-500');
      const taskId = e.dataTransfer.getData("taskId");
      const toStatus = status;

      onStatusChange(taskId, toStatus);
    };


    return (
      <div 
        // Responsive width: w-full on mobile, flex-1 and constrained on desktop
        className="flex flex-col w-full md:flex-1 md:min-w-[300px] md:max-w-[500px] bg-gray-50 dark:bg-gray-900 rounded-xl shadow-inner overflow-hidden transition-shadow duration-200 hover:shadow-xl dark:shadow-gray-700"
        onDragOver={handleDragOver} 
        onDragLeave={handleDragLeave} 
        onDrop={handleDrop}         
      >
        {/* Column Header */}
        <div className={`p-4 ${headerColor} text-white font-bold text-lg flex justify-between items-center`}>
          <span>{status} ({tasks.length})</span>
          <span className="text-sm px-2 py-1 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-extrabold">{totalPoints} Pts</span>
        </div>
        
        {/* Special Actions for Completed Column */}
        {isCompleted && tasks.length > 0 && (
          <div className="p-4 bg-green-100 dark:bg-green-900 border-b border-green-200 dark:border-green-700">
            <button
              onClick={onArchiveTasks}
              className="w-full bg-green-700 hover:bg-green-800 text-white text-sm font-semibold py-2 px-3 rounded-lg transition duration-150 ease-in-out shadow-md flex items-center justify-center"
            >
              {/* Inline SVG for Archive Icon */}
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 6h-2m2 0h-2"></path></svg>
              Archive This Week's ({tasks.filter(t => t.completedDate && Number(t.completedDate) >= Date.now() - (7 * 24 * 60 * 60 * 1000)).length})
            </button>
          </div>
        )}

        {/* Task List */}
        <div className="p-4 space-y-4 overflow-y-auto h-[70vh] custom-scrollbar">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onStatusChange={onStatusChange} 
                onDeleteTask={handleDeleteTask}
                onToggleSubtask={handleToggleSubtask}
                onEditTask={handleEditTask}
              />
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 italic p-8">No tasks in this status matching the current filters.</p>
          )}
        </div>
      </div>
    );
  };
  
  const modalTitle = taskToEdit ? 'Edit Task' : 'Create New Task';

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8 font-sans ${isDarkMode ? 'dark' : ''}`}>
      <style>{`
        /* Custom scrollbar for task columns and modal (Dark/Light) */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#374151' : '#f1f1f1'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#555' : '#ccc'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#777' : '#999'};
        }
      `}</style>

      {/* Archive Feedback Message (New) */}
      {archiveMessage && (
        <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-2xl z-50 transition duration-300 transform ${archiveMessage.includes('Successfully') ? 'bg-green-500' : 'bg-red-500'} text-white font-semibold`}>
          {archiveMessage}
        </div>
      )}

      {/* Header and Controls */}
      <header className="mb-8 p-4 bg-white dark:bg-gray-900 rounded-xl shadow-lg border-b border-gray-200 dark:border-gray-800 flex flex-col space-y-4 md:space-y-0 md:flex-row justify-between items-center">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          Project Task Board
        </h1>
        
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          {/* Main Board Filtering and Sorting */}
          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:space-x-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg w-full md:w-auto">
            {/* Search Filter */}
            <input
              type="text"
              placeholder="Search title/desc..."
              value={mainSearchQuery}
              onChange={(e) => setMainSearchQuery(e.target.value)}
              className="rounded-lg border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 text-sm w-full md:w-40 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />

            {/* Due By Date Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-gray-700 dark:text-gray-300 font-medium text-sm whitespace-nowrap">Due By:</label>
              <input
                type="date"
                value={dueByDate}
                onChange={(e) => setDueByDate(e.target.value)}
                className="rounded-lg border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 text-sm w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
          
            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2 text-sm">
              <label className="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">Sort:</label>
              <select 
                value={mainBoardSortBy} 
                onChange={(e) => setMainBoardSortBy(e.target.value)}
                className="rounded-lg border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="dueDate">Due Date</option>
                <option value="eta">Point Cost</option>
              </select>
            </div>
          </div>
          
          <div className="flex space-x-4 w-full md:w-auto">


            {/* New Task Button */}
            <button
              onClick={() => handleEditTask(null)} // Call with null to initiate creation mode
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out flex-1"
            >
              {/* Inline SVG for Plus Icon */}
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Create
            </button>
            
            {/* Show Archived Tasks Button */}
            <button
              onClick={() => setIsArchivedModalOpen(true)}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition duration-150 ease-in-out flex-1"
            >
              {/* Inline SVG for Box Icon */}
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7m16 0H4m16 0V5a2 2 0 00-2-2H6a2 2 0 00-2 2v2"></path></svg>
              Archive ({archivedTasks.length})
            </button>
          </div>
        </div>

      </header>

      <main className="container mx-auto">
        {/* Task Creation/Edit Form Modal */}
        <Modal 
          isOpen={isNewTaskModalOpen} 
          onClose={handleCloseTaskModal} 
          title={modalTitle}
          size="max-w-xl"
          isDarkMode={isDarkMode}
        >
          <TaskForm 
            initialTask={taskToEdit}
            onTaskSave={handleTaskSave}
            onTaskCreated={handleCloseTaskModal} 
          />
        </Modal>

        {/* Archived Tasks Modal */}
        <ArchivedTasksModal 
          isOpen={isArchivedModalOpen}
          onClose={() => setIsArchivedModalOpen(false)}
          archivedTasks={archivedTasks} 
          onDeleteTask={handleDeleteTask}
          isDarkMode={isDarkMode}
        />

        {/* Kanban Board */}
        <div className="pb-4">
          {/* Note: flex-col on mobile, md:flex-row on desktop to remove horizontal scroll */}
          <div className="flex flex-col md:flex-row gap-6 p-2 justify-between">
            {ACTIVE_STATUSES.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={groupedTasks[status] || []}
                totalPoints={pointSummary[status] || 0}
                onStatusChange={handleTaskStatusChange}
                onArchiveTasks={handleArchiveCompletedTasks}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}