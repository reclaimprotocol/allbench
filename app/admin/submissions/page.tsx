'use client';

import { useEffect, useState } from 'react';
import { Submission, Task, Rubric } from '../../../types';

interface Message {
  id: string;
  type: 'system' | 'user' | 'assistant';
  content: string;
  contentType: 'text' | 'image' | 'pdf';
  uri?: string;
  fileName?: string;
  fileData?: string;
  mimeType?: string;
  provider?: string;
}

interface SubmissionWithDetails extends Submission {
  id: string;
  createdAt: string;
  taskName?: string;
  messages: Message[];
}

export default function SubmissionsView() {
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);
  const [filters, setFilters] = useState({
    taskId: '',
    walletAddress: '',
  });

  useEffect(() => {
    fetchSubmissions();
    fetchTasks();
    fetchRubrics();
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

  const fetchRubrics = async () => {
    try {
      const response = await fetch('/api/rubrics');
      const data = await response.json();
      setRubrics(data);
    } catch (error) {
      console.error('Error fetching rubrics:', error);
    }
  };

  const getTaskName = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task?.name || `Task ${taskId}`;
  };

  const getRubricDetails = (rubricId: string) => {
    const rubric = rubrics.find(r => r.id === rubricId);
    return rubric || { id: rubricId, name: `Rubric ${rubricId}`, description: 'Description not available', taskId: '' };
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

  const calculateRubricAgreement = (evaluations: { llmName: string; score: number; description: string; candidateLlmName?: string }[]) => {
    if (evaluations.length < 2) return { status: 'N/A' as const, variance: 0 };
    
    const scores = evaluations.map(e => e.score);
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const variance = ((max - min) / 10) * 100; // Convert to percentage

    let status: 'green' | 'yellow' | 'red';
    if (variance <= 10) {
      status = 'green';
    } else if (variance <= 30) {
      status = 'yellow';
    } else {
      status = 'red';
    }

    return { status, variance };
  };

  const getAgreementStatusColor = (status: 'green' | 'yellow' | 'red' | 'N/A') => {
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

  const filteredSubmissions = submissions.filter(submission => {
    if (filters.taskId && submission.taskId !== filters.taskId) return false;
    if (filters.walletAddress && !submission.walletAddress.toLowerCase().includes(filters.walletAddress.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-light text-black dark:text-white font-mono">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 bg-white dark:bg-black min-h-screen">
      <div className="border border-black dark:border-white p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light text-black dark:text-white font-mono">Submissions</h2>
          <div className="text-sm text-black dark:text-white font-mono font-light opacity-70">
            Total: {filteredSubmissions.length} submissions
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-black border border-black dark:border-white p-4 mb-6">
          <h3 className="text-lg font-light text-black dark:text-white font-mono mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-light text-black dark:text-white font-mono">Filter by Task</label>
              <select
                value={filters.taskId}
                onChange={(e) => setFilters(prev => ({ ...prev, taskId: e.target.value }))}
                className="mt-1 block w-full border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white px-3 py-2 font-mono font-light focus:outline-none focus:border-black dark:focus:border-white"
              >
                <option value="">All Tasks</option>
                {tasks.map(task => (
                  <option key={task.id} value={task.id}>{task.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-light text-black dark:text-white font-mono">Filter by Wallet Address</label>
              <input
                type="text"
                value={filters.walletAddress}
                onChange={(e) => setFilters(prev => ({ ...prev, walletAddress: e.target.value }))}
                className="mt-1 block w-full border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white px-3 py-2 font-mono font-light focus:outline-none focus:border-black dark:focus:border-white"
                placeholder="Enter wallet address..."
              />
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white dark:bg-black border border-black dark:border-white overflow-hidden">
          <ul className="divide-y divide-black dark:divide-white">
            {filteredSubmissions.map((submission) => (
              <li key={submission.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-light text-black dark:text-white font-mono">
                        {getTaskName(submission.taskId)}
                      </h3>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-light text-black dark:text-white font-mono">
                          Score: {calculateOverallScore(submission)}
                        </span>
                        {submission.rubrics.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-black dark:text-white font-mono font-light opacity-70">
                              AI Agreement:
                            </span>
                            <div className="flex space-x-1">
                              {submission.rubrics.map((rubric, index) => {
                                const agreement = calculateRubricAgreement(rubric.evaluations);
                                return (
                                  <div
                                    key={index}
                                    className={`px-1.5 py-0.5 text-xs font-mono border ${getAgreementStatusColor(agreement.status)}`}
                                    title={`${getRubricDetails(rubric.rubricId).name}: ${agreement.variance.toFixed(1)}% variance`}
                                  >
                                    {agreement.status === 'N/A' ? 'N/A' : agreement.status.toUpperCase()}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <span className="text-sm text-black dark:text-white font-mono font-light opacity-70">
                          {submission.createdAt && new Date(submission.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-1">
                      <p className="text-sm text-black dark:text-white font-mono font-light">
                        Wallet: <span className="font-mono">{submission.walletAddress}</span>
                      </p>
                      <p className="text-sm text-black dark:text-white font-mono font-light">
                        LLM Responses: {submission.llmResponses.length} | 
                        Rubrics Evaluated: {submission.rubrics.length}
                      </p>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                      {submission.llmResponses.map((llmResponse, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 text-xs font-mono font-light border border-black dark:border-white text-black dark:text-white">
                          {llmResponse.llmName}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 border border-black dark:border-white text-sm font-mono font-light hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors"
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
              <div className="text-black dark:text-white font-mono font-light opacity-70">No submissions found</div>
            </div>
          )}
        </div>
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-black dark:border-white w-11/12 max-w-4xl bg-white dark:bg-black">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-light text-black dark:text-white font-mono">
                  Submission Details - {getTaskName(selectedSubmission.taskId)}
                </h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-black dark:text-white hover:opacity-70"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-light text-black dark:text-white font-mono mb-2">Wallet Address</h4>
                  <p className="text-sm font-mono bg-white dark:bg-black border border-black dark:border-white p-2 text-black dark:text-white">{selectedSubmission.walletAddress}</p>
                </div>

                <div>
                  <h4 className="font-light text-black dark:text-white font-mono mb-2">Chat Conversation</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto border border-black dark:border-white p-4">
                    {selectedSubmission.messages && selectedSubmission.messages.length > 0 ? (
                      selectedSubmission.messages.map((message, index) => (
                        <div key={index} className={`p-3 border border-black dark:border-white ${
                          message.type === 'user' ? 'ml-8' : message.type === 'assistant' ? 'mr-8' : ''
                        }`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-mono font-light text-black dark:text-white opacity-70">
                              {message.type.toUpperCase()}
                            </span>
                            {message.provider && (
                              <span className="text-xs font-mono font-light text-black dark:text-white opacity-50">
                                {message.provider}
                              </span>
                            )}
                          </div>
                          
                          {message.contentType === 'text' ? (
                            <p className="text-sm font-mono font-light text-black dark:text-white whitespace-pre-wrap">
                              {message.content}
                            </p>
                          ) : message.contentType === 'image' ? (
                            <div>
                              <p className="text-sm font-mono font-light text-black dark:text-white mb-2">
                                📷 Image: {message.fileName || 'Uploaded image'}
                              </p>
                              {message.uri && (
                                <img 
                                  src={message.uri} 
                                  alt={message.fileName || 'Chat image'} 
                                  className="max-w-xs max-h-48 border border-black dark:border-white"
                                />
                              )}
                            </div>
                          ) : message.contentType === 'pdf' ? (
                            <p className="text-sm font-mono font-light text-black dark:text-white">
                              📄 PDF: {message.fileName || 'Uploaded document'}
                            </p>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-black dark:text-white font-mono font-light opacity-70">
                        No chat conversation available
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-light text-black dark:text-white font-mono mb-2">LLM Responses & Evaluations</h4>
                  <div className="space-y-4">
                    {selectedSubmission.llmResponses.map((response, index) => (
                      <div key={index} className="border border-black dark:border-white p-4">
                        <h5 className="font-light text-black dark:text-white font-mono mb-2">{response.llmName} - Candidate Response</h5>
                        <div className="text-sm text-black dark:text-white font-mono font-light whitespace-pre-wrap bg-white dark:bg-black border border-black dark:border-white p-3 mb-4">
                          {response.response}
                        </div>
                        
                        {/* Show rubric evaluations for this specific candidate response */}
                        <div className="mt-3">
                          <h6 className="text-sm font-light text-black dark:text-white font-mono mb-3">
                            Rubric Evaluations for {response.llmName}'s Response:
                          </h6>
                          
                          {selectedSubmission.rubrics.map((rubric, rubricIndex) => {
                            const rubricDetails = getRubricDetails(rubric.rubricId);
                            
                            // Find evaluations for this specific candidate response
                            const candidateEvaluations = rubric.evaluations.filter(evaluation => 
                              evaluation.candidateLlmName === response.llmName ||
                              (!evaluation.candidateLlmName && rubric.evaluations.length <= 2) // fallback for old data
                            );
                            
                            // Only show rubric if there are evaluations for this candidate
                            if (candidateEvaluations.length === 0) {
                              return null;
                            }
                            
                            const agreement = calculateRubricAgreement(candidateEvaluations);
                            const scores = candidateEvaluations.map(e => e.score);
                            const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A';
                            
                            return (
                              <div key={rubricIndex} className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 p-3 mb-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-1">
                                      <span className="font-mono font-light text-black dark:text-white text-base">
                                        {rubricDetails.name}
                                      </span>
                                      <span className="text-xs font-mono text-black dark:text-white bg-white dark:bg-black px-2 py-1 border border-black dark:border-white">
                                        Avg: {avgScore}/10
                                      </span>
                                      {agreement.status !== 'N/A' && (
                                        <div className={`px-2 py-1 text-xs font-mono border ${getAgreementStatusColor(agreement.status)}`}>
                                          {agreement.status.toUpperCase()} ({agreement.variance.toFixed(1)}%)
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-xs font-mono font-light text-black dark:text-white opacity-70 mb-2">
                                      {rubricDetails.description}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Show evaluator LLMs clearly */}
                                <div className="space-y-2">
                                  {candidateEvaluations.map((evaluation, evalIndex) => (
                                    <div key={evalIndex} className="bg-white dark:bg-black border border-black dark:border-white p-3">
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="font-mono font-light text-black dark:text-white text-sm">
                                          <span className="font-medium">{evaluation.llmName}</span>'s evaluation for <span className="font-medium">{response.llmName}</span>'s response
                                        </span>
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 text-black dark:text-white border border-gray-300 dark:border-gray-600">
                                            {evaluation.score}/10
                                          </span>
                                          {scores.length > 1 && (
                                            <span className={`text-xs px-2 py-1 font-mono border ${
                                              Math.abs(evaluation.score - parseFloat(avgScore)) <= 1 
                                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300' 
                                                : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300'
                                            }`}>
                                              {evaluation.score >= parseFloat(avgScore) ? '+' : ''}{(evaluation.score - parseFloat(avgScore)).toFixed(1)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-sm font-mono font-light text-black dark:text-white opacity-80 italic">
                                        "{evaluation.description}"
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedSubmission(null)}
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