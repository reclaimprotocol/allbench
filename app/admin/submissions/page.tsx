'use client';

import { useEffect, useState } from 'react';
import { Submission, Task } from '../../../types';

interface SubmissionWithDetails extends Submission {
  id: string;
  createdAt: string;
  taskName?: string;
}

export default function SubmissionsView() {
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);
  const [filters, setFilters] = useState({
    taskId: '',
    walletAddress: '',
  });

  useEffect(() => {
    fetchSubmissions();
    fetchTasks();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/admin/submissions');
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
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

  const calculateOverallScore = (submission: SubmissionWithDetails) => {
    let totalScore = 0;
    let totalEvaluations = 0;

    submission.rubrics.forEach(rubric => {
      rubric.evaluations.forEach(evaluation => {
        totalScore += evaluation.score;
        totalEvaluations++;
      });
    });

    return totalEvaluations > 0 ? (totalScore / totalEvaluations).toFixed(1) : 'N/A';
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (filters.taskId && submission.taskId !== filters.taskId) return false;
    if (filters.walletAddress && !submission.walletAddress.toLowerCase().includes(filters.walletAddress.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Submissions</h2>
          <div className="text-sm text-gray-500">
            Total: {filteredSubmissions.length} submissions
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-lg font-medium mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Filter by Task</label>
              <select
                value={filters.taskId}
                onChange={(e) => setFilters(prev => ({ ...prev, taskId: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Tasks</option>
                {tasks.map(task => (
                  <option key={task.id} value={task.id}>{task.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Filter by Wallet Address</label>
              <input
                type="text"
                value={filters.walletAddress}
                onChange={(e) => setFilters(prev => ({ ...prev, walletAddress: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter wallet address..."
              />
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredSubmissions.map((submission) => (
              <li key={submission.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        {getTaskName(submission.taskId)}
                      </h3>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-blue-600">
                          Score: {calculateOverallScore(submission)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {submission.createdAt && new Date(submission.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-1">
                      <p className="text-sm text-gray-600">
                        Wallet: <span className="font-mono">{submission.walletAddress}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        LLM Responses: {submission.llmResponses.length} | 
                        Rubrics Evaluated: {submission.rubrics.length}
                      </p>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                      {submission.llmResponses.map((llmResponse, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {llmResponse.llmName}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          {filteredSubmissions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">No submissions found</div>
            </div>
          )}
        </div>
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Submission Details - {getTaskName(selectedSubmission.taskId)}
                </h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Wallet Address</h4>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded">{selectedSubmission.walletAddress}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">LLM Responses</h4>
                  <div className="space-y-3">
                    {selectedSubmission.llmResponses.map((response, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-800 mb-2">{response.llmName}</h5>
                        <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                          {response.response}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Evaluations</h4>
                  <div className="space-y-3">
                    {selectedSubmission.rubrics.map((rubric, rubricIndex) => (
                      <div key={rubricIndex} className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-800 mb-2">Rubric {rubric.rubricId}</h5>
                        <div className="space-y-2">
                          {rubric.evaluations.map((evaluation, evalIndex) => (
                            <div key={evalIndex} className="flex justify-between items-start bg-gray-50 p-3 rounded">
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium">{evaluation.llmName}</span>
                                  <span className="text-sm font-bold text-blue-600">Score: {evaluation.score}/10</span>
                                </div>
                                <p className="text-sm text-gray-600">{evaluation.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
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