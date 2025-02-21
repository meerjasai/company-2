// --- frontend/src/pages/index.tsx ---
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

interface Task {
  _id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: string;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('Todo');
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [suggestionInput, setSuggestionInput] = useState('');
  const socket = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      const decoded: any = jwtDecode(storedToken);
      setUsername(decoded.username);
      setIsLoggedIn(true);
      fetchTasks(storedToken);
      setupWebSocket(storedToken);
    }
  }, []);

  const setupWebSocket = (token: string) => {
    socket.current = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080', {
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    socket.current.on('taskUpdate', () => {
      fetchTasks(token);
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  };

  const fetchTasks = async (token: string) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/api/tasks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!token) return;
    try {
      await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
          assignedTo: newTaskAssignedTo,
          status: newTaskStatus,
        }),
      });
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskAssignedTo('');
      setNewTaskStatus('Todo');
      fetchTasks(token);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async (task: Task) => {
    if (!token) return;
    try {
      await fetch(`<span class="math-inline">\{process\.env\.NEXT\_PUBLIC\_<5\>BACKEND\_URL\}/api/tasks/</span>{task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(task),
      });
      fetchTasks(token);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`<span class="math-inline">\{process\.env\.NEXT\_PUBLIC\_BACKEND\_URL\}/api/tasks/</span>{id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchTasks(token);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        const decoded: any = jwtDecode(data.token);
        setUsername(decoded.username);
        setIsLoggedIn(true);
        fetchTasks(data.token);
        setupWebSocket(data.token);
        router.push('/');
      } else {
        alert('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleRegister = async () => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: registerUsername, password: registerPassword }),
      });
      const data = await response.json();
      alert(data.message || 'Registration successful');
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUsername(null);
    setIsLoggedIn(false);
    setTasks([]);
    router.push('/');
  };

  const handleGetSuggestion = async () => {
    if (!token) return;
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ input: suggestionInput }),
      });
      const data = await response.json();
      setSuggestion(data.suggestion);
    } catch (error) {
      console.error('Error fetching suggestion:', error);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Username"
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className="border p-2 rounded ml-2"
          />
          <button onClick={handleLogin} className="bg-blue-500 text-white p-2 rounded ml-2">
            Login
          </button>
        </div>
        <div>
          <input
            type="text"
            placeholder="Username"
            value={registerUsername}
            onChange={(e) => setRegisterUsername(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={registerPassword}
            onChange={(e) => setRegisterPassword(e.target.value)}
            className="border p-2 rounded ml-2"
          />
          <button onClick={handleRegister} className="bg-green-500 text-white p-2 rounded ml-2">
            Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Task Management</h1>