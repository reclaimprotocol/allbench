'use client';

import { useEffect, useState } from 'react';
import { Task, Credential } from '../../../types';

export default function TasksManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    systemPrompt: '',
    helperSystemPrompt: '',
    requiredCredentials: [] as Credential[],
    active: true,
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/admin/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const taskData = {
      ...formData,
    };

    try {
      const url = editingTask ? `/api/admin/tasks/${editingTask.id}` : '/api/admin/tasks';
      const method = editingTask ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        await fetchTasks();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description,
      logo: task.logo,
      systemPrompt: task.systemPrompt,
      helperSystemPrompt: task.helperSystemPrompt,
      requiredCredentials: task.requiredCredentials,
      active: task.active,
    });
    setShowForm(true);
  };

  const handleDelete = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await fetch(`/api/admin/tasks/${taskId}`, {
          method: 'DELETE',
        });
        await fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      logo: '',
      systemPrompt: '',
      helperSystemPrompt: '',
      requiredCredentials: [],
      active: true,
    });
    setEditingTask(null);
    setShowForm(false);
  };

  const addCredential = () => {
    const newCredential: Credential = {
      id: Date.now().toString(),
      name: '',
      logo: '',
      reclaimProviderId: '',
    };
    setFormData(prev => ({
      ...prev,
      requiredCredentials: [...prev.requiredCredentials, newCredential]
    }));
  };

  const updateCredential = (index: number, field: keyof Credential, value: string) => {
    setFormData(prev => ({
      ...prev,
      requiredCredentials: prev.requiredCredentials.map((cred, i) => 
        i === index ? { ...cred, [field]: value } : cred
      )
    }));
  };

  const removeCredential = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requiredCredentials: prev.requiredCredentials.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-light text-black dark:text-white font-mono">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 bg-white dark:bg-black min-h-screen">
      <div className="border border-black dark:border-white p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light text-black dark:text-white font-mono">Task Management</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 border border-black dark:border-white font-mono font-light hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors"
          >
            {showForm ? 'Cancel' : 'Add New Task'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-black border border-black dark:border-white p-6 mb-6">
            <h3 className="text-lg font-light text-black dark:text-white font-mono mb-4">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-light text-black dark:text-white font-mono">Task Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white px-3 py-2 font-mono font-light focus:outline-none focus:border-black dark:focus:border-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-light text-black dark:text-white font-mono">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white px-3 py-2 font-mono font-light focus:outline-none focus:border-black dark:focus:border-white"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-light text-black dark:text-white font-mono">Logo URL</label>
                <input
                  type="url"
                  value={formData.logo}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.value }))}
                  className="mt-1 block w-full border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white px-3 py-2 font-mono font-light focus:outline-none focus:border-black dark:focus:border-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-light text-black dark:text-white font-mono">System Prompt</label>
                <textarea
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  className="mt-1 block w-full border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white px-3 py-2 font-mono font-light focus:outline-none focus:border-black dark:focus:border-white"
                  rows={4}
                  placeholder="Enter the system prompt that will be sent to all LLMs..."
                  required
                />
                <p className="mt-1 text-sm text-black dark:text-white font-mono font-light opacity-70">
                  This prompt will be sent as a system message to all LLMs (OpenAI, Claude) to define their role and behavior for this task.
                </p>
              </div>

              <div>
                <label className="block text-sm font-light text-black dark:text-white font-mono">Helper System Prompt</label>
                <textarea
                  value={formData.helperSystemPrompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, helperSystemPrompt: e.target.value }))}
                  className="mt-1 block w-full border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white px-3 py-2 font-mono font-light focus:outline-none focus:border-black dark:focus:border-white"
                  rows={3}
                  placeholder="Enter the helper system prompt for chat interactions..."
                  required
                />
                <p className="mt-1 text-sm text-black dark:text-white font-mono font-light opacity-70">
                  This prompt will be used for chat interactions in the TaskScreen to provide helpful guidance to users.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-light text-black dark:text-white font-mono">Required Credentials</label>
                  <button
                    type="button"
                    onClick={addCredential}
                    className="bg-black dark:bg-white text-white dark:text-black px-2 py-1 border border-black dark:border-white text-sm font-mono font-light hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors"
                  >
                    Add Credential
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.requiredCredentials.map((credential, index) => (
                    <div key={index} className="border border-black dark:border-white p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-light text-black dark:text-white font-mono">Credential {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeCredential(index)}
                          className="text-black dark:text-white hover:opacity-70 text-sm font-mono font-light"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-xs font-light text-black dark:text-white font-mono">Name</label>
                          <input
                            type="text"
                            value={credential.name}
                            onChange={(e) => updateCredential(index, 'name', e.target.value)}
                            className="mt-1 block w-full border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white px-2 py-1 text-sm font-mono font-light focus:outline-none focus:border-black dark:focus:border-white"
                            placeholder="e.g., GitHub Account"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-light text-black dark:text-white font-mono">Logo URL</label>
                          <input
                            type="url"
                            value={credential.logo}
                            onChange={(e) => updateCredential(index, 'logo', e.target.value)}
                            className="mt-1 block w-full border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white px-2 py-1 text-sm font-mono font-light focus:outline-none focus:border-black dark:focus:border-white"
                            placeholder="https://example.com/logo.png"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-light text-black dark:text-white font-mono">Reclaim Provider ID</label>
                          <input
                            type="text"
                            value={credential.reclaimProviderId}
                            onChange={(e) => updateCredential(index, 'reclaimProviderId', e.target.value)}
                            className="mt-1 block w-full border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white px-2 py-1 text-sm font-mono font-light focus:outline-none focus:border-black dark:focus:border-white"
                            placeholder="provider-id"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {formData.requiredCredentials.length === 0 && (
                    <div className="text-center py-8 text-black dark:text-white text-sm font-mono font-light opacity-70">
                      No credentials added. Click "Add Credential" to add required credentials for this task.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="mr-2 border border-black dark:border-white"
                  />
                  <span className="text-sm font-light text-black dark:text-white font-mono">Active</span>
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 border border-black dark:border-white font-mono font-light hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-white dark:bg-black text-black dark:text-white px-4 py-2 border border-black dark:border-white font-mono font-light hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white dark:bg-black border border-black dark:border-white overflow-hidden">
          <ul className="divide-y divide-black dark:divide-white">
            {tasks.map((task) => (
              <li key={task.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img src={task.logo} alt={task.name} className="w-10 h-10 mr-4" />
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-lg font-light text-black dark:text-white font-mono">{task.name}</h3>
                        <span className={`ml-2 px-2 py-1 text-xs font-mono font-light border ${
                          task.active ? 'border-black dark:border-white text-black dark:text-white' : 'border-black dark:border-white text-black dark:text-white opacity-50'
                        }`}>
                          {task.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-black dark:text-white font-mono font-light opacity-70">{task.description}</p>
                      <div className="mt-1">
                        <span className="text-xs text-black dark:text-white font-mono font-light opacity-50">Required credentials: </span>
                        {task.requiredCredentials.map((cred, index) => (
                          <span key={cred.id} className="text-xs text-black dark:text-white font-mono font-light">
                            {cred.name}{index < task.requiredCredentials.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(task)}
                      className="bg-white dark:bg-black text-black dark:text-white px-3 py-1 border border-black dark:border-white text-sm font-mono font-light hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="bg-black dark:bg-white text-white dark:text-black px-3 py-1 border border-black dark:border-white text-sm font-mono font-light hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}