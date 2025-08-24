'use client';

import { useEffect, useState } from 'react';

interface DashboardStats {
  totalTasks: number;
  activeTasks: number;
  totalCredentials: number;
  totalSubmissions: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    activeTasks: 0,
    totalCredentials: 0,
    totalSubmissions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [tasksRes, submissionsRes] = await Promise.all([
          fetch('/api/admin/tasks'),
          fetch('/api/admin/submissions'),
        ]);

        const tasks = await tasksRes.json();
        const submissions = await submissionsRes.json();

        // Count total credentials across all tasks
        const totalCredentials = tasks.reduce((count: number, task: any) => 
          count + (task.requiredCredentials?.length || 0), 0
        );

        setStats({
          totalTasks: tasks.length,
          activeTasks: tasks.filter((task: any) => task.active).length,
          totalCredentials,
          totalSubmissions: submissions.length,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Set default stats on error
        setStats({
          totalTasks: 0,
          activeTasks: 0,
          totalCredentials: 0,
          totalSubmissions: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleSeedDatabase = async () => {
    if (!confirm('This will seed the database with initial tasks. Continue?')) {
      return;
    }

    setSeeding(true);
    try {
      const response = await fetch('/api/admin/seed', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Database seeded successfully! Created ${result.tasksCreated} tasks and ${result.rubricsCreated} rubrics.`);
        // Refresh stats
        const fetchStats = async () => {
          try {
            const [tasksRes, submissionsRes] = await Promise.all([
              fetch('/api/admin/tasks'),
              fetch('/api/admin/submissions'),
            ]);

            const tasks = await tasksRes.json();
            const submissions = await submissionsRes.json();

            const totalCredentials = tasks.reduce((count: number, task: any) => 
              count + (task.requiredCredentials?.length || 0), 0
            );

            setStats({
              totalTasks: tasks.length,
              activeTasks: tasks.filter((task: any) => task.active).length,
              totalCredentials,
              totalSubmissions: submissions.length,
            });
          } catch (error) {
            console.error('Error fetching dashboard stats:', error);
          }
        };
        await fetchStats();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error seeding database:', error);
      alert('Failed to seed database');
    } finally {
      setSeeding(false);
    }
  };

  const statCards = [
    { name: 'Total Tasks', value: stats.totalTasks, color: 'bg-blue-500' },
    { name: 'Active Tasks', value: stats.activeTasks, color: 'bg-green-500' },
    { name: 'Total Credentials', value: stats.totalCredentials, color: 'bg-purple-500' },
    { name: 'Total Submissions', value: stats.totalSubmissions, color: 'bg-orange-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-light text-black dark:text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border border-black dark:border-white p-6">
        <h2 className="text-2xl font-light text-black dark:text-white mb-6">Dashboard Overview</h2>
        
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.name} className="bg-white dark:bg-black border border-black dark:border-white">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 ${stat.color} rounded-md flex items-center justify-center`}>
                      <span className="text-white font-bold">{stat.value}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-light text-black dark:text-white truncate">{stat.name}</dt>
                      <dd className="text-lg font-light text-black dark:text-white">{stat.value}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-light text-black dark:text-white">Quick Actions</h3>
            <button
              onClick={handleSeedDatabase}
              disabled={seeding}
              className={`px-4 py-2 text-sm font-light ${
                seeding
                  ? 'bg-gray-500 text-white cursor-not-allowed'
                  : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'
              }`}
            >
              {seeding ? 'Seeding...' : 'Seed Database'}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <a
              href="/admin/tasks"
              className="relative block w-full bg-white dark:bg-black border border-black dark:border-white p-6 text-center hover:bg-gray-100 dark:hover:bg-gray-900 focus:outline-none"
            >
              <span className="block text-sm font-light text-black dark:text-white">Manage Tasks</span>
              <span className="mt-2 block text-sm font-light text-black dark:text-white">Create and edit tasks</span>
            </a>
            <a
              href="/admin/rubrics"
              className="relative block w-full bg-white dark:bg-black border border-black dark:border-white p-6 text-center hover:bg-gray-100 dark:hover:bg-gray-900 focus:outline-none"
            >
              <span className="block text-sm font-light text-black dark:text-white">Manage Rubrics</span>
              <span className="mt-2 block text-sm font-light text-black dark:text-white">View rubrics and AI agreement</span>
            </a>
            <a
              href="/admin/submissions"
              className="relative block w-full bg-white dark:bg-black border border-black dark:border-white p-6 text-center hover:bg-gray-100 dark:hover:bg-gray-900 focus:outline-none"
            >
              <span className="block text-sm font-light text-black dark:text-white">View Submissions</span>
              <span className="mt-2 block text-sm font-light text-black dark:text-white">Review user submissions with AI evaluations</span>
            </a>
            <a
              href="/admin/notifications"
              className="relative block w-full bg-white dark:bg-black border border-black dark:border-white p-6 text-center hover:bg-gray-100 dark:hover:bg-gray-900 focus:outline-none"
            >
              <span className="block text-sm font-light text-black dark:text-white">Send Notifications</span>
              <span className="mt-2 block text-sm font-light text-black dark:text-white">Send push notifications to users</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}