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
        <div className="text-lg text-gray-600">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            {showForm ? 'Cancel' : 'Add New Task'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-medium mb-4">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Task Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                <input
                  type="url"
                  value={formData.logo}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">System Prompt</label>
                <textarea
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={4}
                  placeholder="Enter the system prompt that will be sent to all LLMs..."
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  This prompt will be sent as a system message to all LLMs (OpenAI, Claude) to define their role and behavior for this task.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Helper System Prompt</label>
                <textarea
                  value={formData.helperSystemPrompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, helperSystemPrompt: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Enter the helper system prompt for chat interactions..."
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  This prompt will be used for chat interactions in the TaskScreen to provide helpful guidance to users.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Required Credentials</label>
                  <button
                    type="button"
                    onClick={addCredential}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    Add Credential
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.requiredCredentials.map((credential, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-medium text-gray-900">Credential {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeCredential(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Name</label>
                          <input
                            type="text"
                            value={credential.name}
                            onChange={(e) => updateCredential(index, 'name', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                            placeholder="e.g., GitHub Account"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Logo URL</label>
                          <input
                            type="url"
                            value={credential.logo}
                            onChange={(e) => updateCredential(index, 'logo', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                            placeholder="https://example.com/logo.png"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Reclaim Provider ID</label>
                          <input
                            type="text"
                            value={credential.reclaimProviderId}
                            onChange={(e) => updateCredential(index, 'reclaimProviderId', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                            placeholder="provider-id"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {formData.requiredCredentials.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
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
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <li key={task.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img src={task.logo} alt={task.name} className="w-10 h-10 rounded-full mr-4" />
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{task.name}</h3>
                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          task.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {task.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{task.description}</p>
                      <div className="mt-1">
                        <span className="text-xs text-gray-400">Required credentials: </span>
                        {task.requiredCredentials.map((cred, index) => (
                          <span key={cred.id} className="text-xs text-blue-600">
                            {cred.name}{index < task.requiredCredentials.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(task)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
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