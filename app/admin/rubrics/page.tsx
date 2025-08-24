'use client';

import { useEffect, useState } from 'react';
import { Task, Rubric } from '../../../types';

interface RubricWithTaskName extends Rubric {
  taskName?: string;
}

interface ScoreVariance {
  status: 'green' | 'yellow' | 'red';
  scores: number[];
  variance: number;
}

interface RubricEvaluationSample {
  rubricId: string;
  rubricName: string;
  evaluations: {
    llmName: string;
    score: number;
    description: string;
  }[];
  scoreVariance: ScoreVariance;
}

export default function RubricsManagement() {
  const [rubrics, setRubrics] = useState<RubricWithTaskName[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRubric, setSelectedRubric] = useState<RubricWithTaskName | null>(null);
  const [isAddingRubric, setIsAddingRubric] = useState(false);
  const [testEvaluations, setTestEvaluations] = useState<RubricEvaluationSample[]>([]);
  const [testResponse, setTestResponse] = useState('');
  const [testingRubric, setTestingRubric] = useState<string | null>(null);
  
  const [newRubric, setNewRubric] = useState({
    name: '',
    description: '',
    taskId: ''
  });

  useEffect(() => {
    fetchRubrics();
    fetchTasks();
  }, []);

  const fetchRubrics = async () => {
    try {
      const response = await fetch('/api/rubrics');
      const data = await response.json();
      setRubrics(data);
    } catch (error) {
      console.error('Error fetching rubrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/admin/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const getTaskName = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task?.name || `Task ${taskId}`;
  };

  const handleAddRubric = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRubric.name || !newRubric.description || !newRubric.taskId) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/rubrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRubric),
      });

      if (response.ok) {
        const addedRubric = await response.json();
        setRubrics(prev => [...prev, addedRubric]);
        setNewRubric({ name: '', description: '', taskId: '' });
        setIsAddingRubric(false);
        alert('Rubric added successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding rubric:', error);
      alert('Failed to add rubric');
    }
  };

  const testRubricEvaluation = async (rubricId: string) => {
    if (!testResponse.trim()) {
      alert('Please enter a test response to evaluate');
      return;
    }

    setTestingRubric(rubricId);
    try {
      const response = await fetch('/api/evaluate-rubrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rubricIds: [rubricId],
          candidateResponse: testResponse
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestEvaluations(data.evaluations);
      } else {
        const error = await response.json();
        alert(`Error testing rubric: ${error.error}`);
      }
    } catch (error) {
      console.error('Error testing rubric:', error);
      alert('Failed to test rubric evaluation');
    } finally {
      setTestingRubric(null);
    }
  };

  const getVarianceStatusColor = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'red':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-light text-black dark:text-white font-mono">Loading rubrics...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 bg-white dark:bg-black min-h-screen">
      <div className="border border-black dark:border-white p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light text-black dark:text-white font-mono">Rubrics Management</h2>
          <button
            onClick={() => setIsAddingRubric(true)}
            className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 border border-black dark:border-white text-sm font-mono font-light hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors"
          >
            Add New Rubric
          </button>
        </div>

        {/* Add Rubric Modal */}
        {isAddingRubric && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-black dark:border-white w-11/12 max-w-2xl bg-white dark:bg-black max-h-[80vh] overflow-y-auto">
              <form onSubmit={handleAddRubric} className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-light text-black dark:text-white font-mono">Add New Rubric</h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingRubric(false)}
                    className="text-black dark:text-white hover:opacity-70"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-light text-black dark:text-white font-mono mb-1">
                    Rubric Name
                  </label>
                  <input
                    type="text"
                    value={newRubric.name}
                    onChange={(e) => setNewRubric(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white px-3 py-2 font-mono font-light focus:outline-none focus:border-black dark:focus:border-white"
                    placeholder="Enter rubric name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-light text-black dark:text-white font-mono mb-1">
                    Task
                  </label>
                  <select
                    value={newRubric.taskId}
                    onChange={(e) => setNewRubric(prev => ({ ...prev, taskId: e.target.value }))}
                    className="w-full border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white px-3 py-2 font-mono font-light focus:outline-none focus:border-black dark:focus:border-white"
                  >
                    <option value="">Select a task</option>
                    {tasks.map(task => (
                      <option key={task.id} value={task.id}>{task.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-light text-black dark:text-white font-mono mb-1">
                    Description
                  </label>
                  <textarea
                    value={newRubric.description}
                    onChange={(e) => setNewRubric(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white px-3 py-2 font-mono font-light focus:outline-none focus:border-black dark:focus:border-white"
                    placeholder="Enter rubric description..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingRubric(false)}
                    className="px-4 py-2 text-sm font-mono font-light text-black dark:text-white border border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 border border-black dark:border-white text-sm font-mono font-light hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors"
                  >
                    Add Rubric
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Test Evaluation Section */}
        <div className="mb-8 bg-white dark:bg-black border border-black dark:border-white p-4">
          <h3 className="text-lg font-light text-black dark:text-white font-mono mb-4">Test Rubric Evaluation</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-light text-black dark:text-white font-mono mb-1">
                Test Response (to evaluate against rubrics)
              </label>
              <textarea
                value={testResponse}
                onChange={(e) => setTestResponse(e.target.value)}
                rows={4}
                className="w-full border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white px-3 py-2 font-mono font-light focus:outline-none focus:border-black dark:focus:border-white"
                placeholder="Enter a sample response to test rubric evaluations..."
              />
            </div>
            
            {testEvaluations.length > 0 && (
              <div className="mt-6 max-h-96 overflow-y-auto">
                <h4 className="text-md font-light text-black dark:text-white font-mono mb-3">Test Results</h4>
                {testEvaluations.map((evaluation, index) => (
                  <div key={index} className="border border-black dark:border-white p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-light text-black dark:text-white font-mono">{evaluation.rubricName}</h5>
                      <div className={`px-2 py-1 text-xs font-mono border ${getVarianceStatusColor(evaluation.scoreVariance.status)}`}>
                        Variance: {evaluation.scoreVariance.variance.toFixed(1)}% ({evaluation.scoreVariance.status.toUpperCase()})
                      </div>
                    </div>
                    <div className="space-y-2">
                      {evaluation.evaluations.map((evaluation, evalIndex) => (
                        <div key={evalIndex} className="bg-white dark:bg-black border border-black dark:border-white p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-light text-black dark:text-white font-mono">{evaluation.llmName}</span>
                            <span className="text-sm font-light text-black dark:text-white font-mono">Score: {evaluation.score}/10</span>
                          </div>
                          <p className="text-sm text-black dark:text-white font-mono font-light">{evaluation.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rubrics List */}
        <div className="bg-white dark:bg-black border border-black dark:border-white overflow-hidden">
          <div className="px-6 py-4 border-b border-black dark:border-white">
            <h3 className="text-lg font-light text-black dark:text-white font-mono">
              All Rubrics ({rubrics.length})
            </h3>
          </div>
          <ul className="divide-y divide-black dark:divide-white">
            {rubrics.map((rubric) => (
              <li key={rubric.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-light text-black dark:text-white font-mono">
                        {rubric.name}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {testResponse && (
                          <button
                            onClick={() => testRubricEvaluation(rubric.id)}
                            disabled={testingRubric === rubric.id}
                            className={`px-3 py-1 text-xs font-mono border ${
                              testingRubric === rubric.id
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                            }`}
                          >
                            {testingRubric === rubric.id ? 'Testing...' : 'Test'}
                          </button>
                        )}
                        <span className="text-sm text-black dark:text-white font-mono font-light opacity-70">
                          Task: {getTaskName(rubric.taskId)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-sm text-black dark:text-white font-mono font-light">
                        {rubric.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <button
                      onClick={() => setSelectedRubric(rubric)}
                      className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 border border-black dark:border-white text-sm font-mono font-light hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          {rubrics.length === 0 && (
            <div className="text-center py-12">
              <div className="text-black dark:text-white font-mono font-light opacity-70">No rubrics found</div>
            </div>
          )}
        </div>
      </div>

      {/* Rubric Detail Modal */}
      {selectedRubric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-black dark:border-white w-11/12 max-w-2xl bg-white dark:bg-black max-h-[80vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-light text-black dark:text-white font-mono">
                  Rubric Details
                </h3>
                <button
                  onClick={() => setSelectedRubric(null)}
                  className="text-black dark:text-white hover:opacity-70"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-light text-black dark:text-white font-mono mb-2">Name</h4>
                  <p className="text-sm font-mono bg-white dark:bg-black border border-black dark:border-white p-2 text-black dark:text-white">
                    {selectedRubric.name}
                  </p>
                </div>

                <div>
                  <h4 className="font-light text-black dark:text-white font-mono mb-2">Task</h4>
                  <p className="text-sm font-mono bg-white dark:bg-black border border-black dark:border-white p-2 text-black dark:text-white">
                    {getTaskName(selectedRubric.taskId)}
                  </p>
                </div>

                <div>
                  <h4 className="font-light text-black dark:text-white font-mono mb-2">Description</h4>
                  <p className="text-sm font-mono bg-white dark:bg-black border border-black dark:border-white p-2 text-black dark:text-white whitespace-pre-wrap">
                    {selectedRubric.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-light text-black dark:text-white font-mono mb-2">ID</h4>
                  <p className="text-sm font-mono bg-white dark:bg-black border border-black dark:border-white p-2 text-black dark:text-white">
                    {selectedRubric.id}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedRubric(null)}
                  className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 border border-black dark:border-white font-mono font-light hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}