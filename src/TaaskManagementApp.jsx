import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- Local Storage Key ---
const LOCAL_STORAGE_KEY = 'task_manager_data';

// Status options for active Kanban board columns
const ACTIVE_STATUSES = ['Opened', 'In Progress', 'Completed'];

// Date Formatting Utility
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  // Ensure timestamp is a number, as it comes from localStorage now
  const date = new Date(Number(timestamp)); 
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Utility to generate a unique ID
const generateId = () => crypto.randomUUID();

// --- Modal Component ---
const Modal = ({ isOpen, onClose, children, title, size = 'max-w-lg' }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 p-4 transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`bg-white rounded-xl shadow-2xl w-full ${size} overflow-hidden transform transition-all duration-300 scale-100 opacity-100`}>
        <header className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
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


// Component for a single Task Card
const TaskCard = React.memo(({ task, onStatusChange, onDeleteTask }) => {
  // Hooks MUST be called first, before any conditional return
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  const currentStatusIndex = ACTIVE_STATUSES.indexOf(task.status);

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
    'Opened': 'bg-blue-100 border-blue-400 text-blue-800',
    'In Progress': 'bg-yellow-100 border-yellow-400 text-yellow-800',
    'Completed': 'bg-green-100 border-green-400 text-green-800',
  };

  return (
    <div 
      className={`p-4 rounded-xl shadow-lg transition-all duration-300 cursor-grab ${statusColors[task.status]}`}
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Title and Description */}
      <h3 className="text-lg font-bold mb-2 text-gray-900 border-b pb-1 border-gray-300">
        {task.title}
      </h3>
      <p className="text-sm text-gray-700 mb-3">{task.description}</p>
      
      {/* Dates and Points */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between font-medium">
          <span className="text-gray-900">Points ETA:</span>
          <span className="px-2 py-0.5 rounded-full bg-white shadow-sm font-semibold">{task.eta}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Due Date:</span>
          <span className="font-semibold">{formatDate(task.dueDate)}</span>
        </div>
        {task.completedDate && (
          <div className="flex justify-between text-gray-700">
            <span>Completed:</span>
            <span className="font-semibold text-green-700">{formatDate(task.completedDate)}</span>
          </div>
        )}
      </div>

      {/* Confirmation Message Box (Inline) */}
      {showConfirmDelete && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-lg mb-4">
          <p className="text-sm font-medium text-red-800 mb-2">
            Are you sure you want to delete "{task.title}"?
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="px-3 py-1 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirmed}
              className="px-3 py-1 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      )}

      {/* Control Buttons (Arrows and Delete) */}
      <div className="flex gap-2 justify-between mt-4 pt-3 border-t border-gray-200">
        {/* Previous Status Button */}
        <button
          onClick={handleMoveBackward}
          disabled={currentStatusIndex === 0}
          className="w-1/3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-extrabold py-2 px-3 rounded-lg transition duration-150 ease-in-out shadow-md disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          title="Move to Previous Status"
        >
          {/* Inline SVG for Left Arrow */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
        </button>

        {/* Delete Button */}
        <button
          onClick={() => setShowConfirmDelete(true)}
          className="w-1/3 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-3 rounded-lg transition duration-150 ease-in-out shadow-md"
        >
          Delete
        </button>
        
        {/* Next Status Button */}
        <button
          onClick={handleMoveForward}
          disabled={currentStatusIndex === ACTIVE_STATUSES.length - 1}
          className="w-1/3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-extrabold py-2 px-3 rounded-lg transition duration-150 ease-in-out shadow-md disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          title="Move to Next Status"
        >
          {/* Inline SVG for Right Arrow */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>
    </div>
  );
});

// Component for creating a new task (used inside the Modal now)
const NewTaskForm = React.memo(({ onAddTask, onTaskCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eta, setEta] = useState(1);
  const [dueDate, setDueDate] = useState(''); // Stores date string (YYYY-MM-DD)

  // Set default due date to tomorrow
  useEffect(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const defaultDate = today.toISOString().split('T')[0];
    setDueDate(defaultDate);
  }, []);


  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !dueDate) return;

    // Convert date string to timestamp for consistent storage
    const dueDateTimestamp = new Date(dueDate).getTime();

    const newTask = {
      id: generateId(), // Generate local ID
      title: title.trim(),
      description: description.trim(),
      status: 'Opened', // Default status
      eta: parseInt(eta, 10) || 1,
      dueDate: dueDateTimestamp,
      completedDate: null, // Initialize
      createdAt: Date.now()
    };

    onAddTask(newTask);
    
    // Clear form and close modal upon success
    setTitle('');
    setDescription('');
    setEta(1);
    if (onTaskCreated) onTaskCreated();

  }, [title, description, eta, dueDate, onAddTask, onTaskCreated]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-blue-500 focus:ring-blue-500"
          placeholder="e.g., Implement dark mode feature"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows="3"
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-blue-500 focus:ring-blue-500"
          placeholder="Detail the steps required for this task."
        />
      </div>
      <div className="flex space-x-4">
        <div className="flex-1">
          <label htmlFor="eta" className="block text-sm font-medium text-gray-700">Points ETA</label>
          <input
            type="number"
            id="eta"
            value={eta}
            onChange={(e) => setEta(e.target.value)}
            required
            min="1"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
          <input
            type="date"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <button
        type="submit"
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
      >
        Create Task
      </button>
    </form>
  );
});

// Component for viewing archived tasks
const ArchivedTasksModal = ({ isOpen, onClose, archivedTasks }) => {
  const [sortBy, setSortBy] = useState('dueDate');
  const [searchQuery, setSearchQuery] = useState('');
  const [completedAfter, setCompletedAfter] = useState(''); // Date string for filtering

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
        const filterTimestamp = new Date(completedAfter).getTime();
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

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Archived Tasks" 
      size="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Filtering and Sorting Controls */}
        <div className="p-3 bg-gray-100 rounded-lg space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
             {/* Search */}
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-lg border-gray-300 shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
             {/* Completed After Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-gray-700 text-sm whitespace-nowrap">Completed After:</label>
              <input
                type="date"
                value={completedAfter}
                onChange={(e) => setCompletedAfter(e.target.value)}
                className="rounded-lg border-gray-300 shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 text-sm w-full"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm font-medium">
            <div className="flex items-center space-x-3">
              <label className="text-gray-700">Sort By:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border-gray-300 shadow-sm py-1 px-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="dueDate">Due Date</option>
                <option value="eta">Point Cost (ETA)</option>
              </select>
            </div>
            <span className="text-gray-500 italic">Showing {sortedTasks.length} of {archivedTasks.length} Archived Tasks</span>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {sortedTasks.length === 0 ? (
            <p className="text-center text-gray-500 p-8 italic">No tasks match the current filter criteria.</p>
          ) : (
            sortedTasks.map(task => (
              <div key={task.id} className="p-3 bg-white border border-gray-200 rounded-lg shadow-md flex justify-between items-center transition hover:shadow-lg">
                <div className="flex-1 min-w-0 pr-4 text-left">
                  <h4 className="font-semibold text-gray-900">{task.title}</h4>
                  <p className="text-xs text-gray-600 truncate max-w-lg">{task.description}</p>
                </div>
                <div className="text-right text-sm space-y-1 w-40">
                  <p className="font-medium">Points: <span className="text-blue-600">{task.eta}</span></p>
                  <p className="text-xs text-gray-700">Due: {formatDate(task.dueDate)}</p>
                  <p className="text-xs text-green-700">Completed: {formatDate(task.completedDate)}</p>
                </div>
              </div>
            ))
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
  const [isLoading, setIsLoading] = useState(true);
  
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


  // Add Task handler
  const handleAddTask = useCallback((newTask) => {
    setTasks(prevTasks => [...prevTasks, newTask]);
  }, []);

  // Delete Task handler
  const handleDeleteTask = useCallback((taskId) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
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
    const dueByTimestamp = dueByDate ? new Date(dueByDate).getTime() : Infinity;
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-600">Loading Task Manager...</p>
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
      e.currentTarget.classList.add('ring-4', 'ring-indigo-300');
    };

    const handleDragLeave = (e) => {
      e.currentTarget.classList.remove('ring-4', 'ring-indigo-300');
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.currentTarget.classList.remove('ring-4', 'ring-indigo-300');
      const taskId = e.dataTransfer.getData("taskId");
      const toStatus = status;

      onStatusChange(taskId, toStatus);
    };


    return (
      <div 
        // Responsive width: w-full on mobile, flex-1 and constrained on desktop
        className="flex flex-col w-full md:flex-1 md:min-w-[300px] md:max-w-[500px] bg-gray-50 rounded-xl shadow-inner overflow-hidden transition-shadow duration-200 hover:shadow-xl"
        onDragOver={handleDragOver} 
        onDragLeave={handleDragLeave} 
        onDrop={handleDrop}         
      >
        {/* Column Header */}
        <div className={`p-4 ${headerColor} text-white font-bold text-lg flex justify-between items-center`}>
          <span>{status} ({tasks.length})</span>
          <span className="text-sm px-2 py-1 rounded-full bg-white text-gray-800 font-extrabold">{totalPoints} Pts</span>
        </div>
        
        {/* Special Actions for Completed Column */}
        {isCompleted && tasks.length > 0 && (
          <div className="p-4 bg-green-100 border-b border-green-200">
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
              />
            ))
          ) : (
            <p className="text-center text-gray-500 italic p-8">No tasks in this status matching the current filters.</p>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <style>{`
        /* Custom scrollbar for task columns and modal */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #999;
        }
      `}</style>

      {/* Archive Feedback Message (New) */}
      {archiveMessage && (
        <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-2xl z-50 transition duration-300 transform ${archiveMessage.includes('Successfully') ? 'bg-green-500' : 'bg-red-500'} text-white font-semibold`}>
          {archiveMessage}
        </div>
      )}

      {/* Header and Controls */}
      <header className="mb-8 p-4 bg-white rounded-xl shadow-lg border-b border-gray-200 flex flex-col space-y-4 md:space-y-0 md:flex-row justify-between items-center">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Project Task Board
        </h1>
        
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          {/* Main Board Filtering and Sorting */}
          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:space-x-4 p-2 bg-gray-100 rounded-lg w-full md:w-auto">
            {/* Search Filter */}
            <input
              type="text"
              placeholder="Search title/desc..."
              value={mainSearchQuery}
              onChange={(e) => setMainSearchQuery(e.target.value)}
              className="rounded-lg border-gray-300 shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 text-sm w-full md:w-40"
            />

            {/* Due By Date Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-gray-700 font-medium text-sm whitespace-nowrap">Due By:</label>
              <input
                type="date"
                value={dueByDate}
                onChange={(e) => setDueByDate(e.target.value)}
                className="rounded-lg border-gray-300 shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 text-sm w-full"
              />
            </div>
          
            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2 text-sm">
              <label className="text-gray-700 font-medium whitespace-nowrap">Sort:</label>
              <select 
                value={mainBoardSortBy} 
                onChange={(e) => setMainBoardSortBy(e.target.value)}
                className="rounded-lg border-gray-300 shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="dueDate">Due Date</option>
                <option value="eta">Point Cost</option>
              </select>
            </div>
          </div>
          
          <div className="flex space-x-4 w-full md:w-auto">
            {/* New Task Button */}
            <button
              onClick={() => setIsNewTaskModalOpen(true)}
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
        {/* Task Creation Form Modal */}
        <Modal 
          isOpen={isNewTaskModalOpen} 
          onClose={() => setIsNewTaskModalOpen(false)} 
          title="Create New Task"
        >
          <NewTaskForm 
            onAddTask={handleAddTask}
            onTaskCreated={() => setIsNewTaskModalOpen(false)} 
          />
        </Modal>

        {/* Archived Tasks Modal */}
        <ArchivedTasksModal 
          isOpen={isArchivedModalOpen}
          onClose={() => setIsArchivedModalOpen(false)}
          archivedTasks={archivedTasks} 
        />

        {/* Kanban Board */}
        <div className="pb-4">
          {/* Note: flex-col on mobile, md:flex-row on desktop to remove horizontal scroll */}
          <div className="flex flex-col md:flex-row gap-6 p-3 justify-between">
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