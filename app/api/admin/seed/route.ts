import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongoose';
import Task from '../../../../models/Task';
import Rubric from '../../../../models/Rubric';

const initialTasks = [
  {
    name: 'Code Review Task',
    description: 'Review and evaluate code snippets for best practices, security, and performance.',
    logo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    requiredCredentials: [
      {
        id: '1',
        name: 'GitHub Account',
        logo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
        reclaimProviderId: 'github-provider-id'
      }
    ],
    active: true
  },
  {
    name: 'Medical Diagnosis',
    description: 'Analyze medical cases and provide diagnostic insights.',
    logo: 'https://cdn-icons-png.flaticon.com/512/3004/3004458.png',
    requiredCredentials: [
      {
        id: '2',
        name: 'LinkedIn Profile',
        logo: 'https://content.linkedin.com/content/dam/me/business/en-us/amp/brand-site/v2/bg/LI-Bug.svg.original.svg',
        reclaimProviderId: 'linkedin-provider-id'
      }
    ],
    active: true
  },
  {
    name: 'Legal Analysis',
    description: 'Review legal documents and provide analysis.',
    logo: 'https://cdn-icons-png.flaticon.com/512/1034/1034131.png',
    requiredCredentials: [
      {
        id: '3',
        name: 'LinkedIn Profile',
        logo: 'https://content.linkedin.com/content/dam/me/business/en-us/amp/brand-site/v2/bg/LI-Bug.svg.original.svg',
        reclaimProviderId: 'linkedin-provider-id'
      },
      {
        id: '4',
        name: 'Bar Association Membership',
        logo: 'https://cdn-icons-png.flaticon.com/512/1034/1034131.png',
        reclaimProviderId: 'bar-association-provider-id'
      }
    ],
    active: false
  }
];

export async function POST() {
  try {
    await connectDB();
    
    // Check if tasks already exist
    const existingTasksCount = await Task.countDocuments();
    if (existingTasksCount > 0) {
      return NextResponse.json(
        { error: 'Database already contains tasks. Clear existing data first.' },
        { status: 400 }
      );
    }
    
    // Create tasks
    const createdTasks = await Task.insertMany(initialTasks);
    
    // Create some initial rubrics for the first task
    const codeReviewTask = createdTasks.find(task => task.name === 'Code Review Task');
    let rubricsCreated = 0;
    
    if (codeReviewTask) {
      const initialRubrics = [
        {
          name: 'Accuracy',
          description: 'How accurate is the response to the given task?',
          taskId: codeReviewTask._id.toString()
        },
        {
          name: 'Clarity',
          description: 'How clear and understandable is the response?',
          taskId: codeReviewTask._id.toString()
        },
        {
          name: 'Completeness',
          description: 'How complete is the response in addressing all aspects?',
          taskId: codeReviewTask._id.toString()
        }
      ];
      
      const createdRubrics = await Rubric.insertMany(initialRubrics);
      rubricsCreated = createdRubrics.length;
    }
    
    return NextResponse.json({
      success: true,
      tasksCreated: createdTasks.length,
      rubricsCreated
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}