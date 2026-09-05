import mongoose from 'mongoose';
import connectDB from '../lib/mongoose';
import Task from '../models/Task';
import Rubric from '../models/Rubric';

const initialTasks = [
  {
    name: 'Code Review Task',
    description: 'Review and evaluate code snippets for best practices, security, and performance.',
    logo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    systemPrompt: 'You are an expert software engineer and code reviewer. Analyze the provided code for best practices, security vulnerabilities, performance issues, and maintainability. Provide specific, actionable feedback with examples.',
    helperSystemPrompt: 'You are a helpful assistant for a code review task. Help users understand how to submit code for review, answer questions about coding best practices, and provide guidance on the review process. Be encouraging and educational.',
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
    systemPrompt: 'You are a medical professional assistant. Analyze the provided medical information and suggest possible diagnoses, recommended tests, and treatment considerations. Always emphasize the importance of professional medical consultation.',
    helperSystemPrompt: 'You are a helpful assistant for a medical diagnosis task. Help users understand how to present medical information clearly, answer questions about the diagnostic process, and remind them that this is for educational purposes only and not a substitute for professional medical advice.',
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
    systemPrompt: 'You are a legal analysis assistant. Review the provided legal documents or scenarios and provide analysis of key legal issues, potential risks, and recommendations. Always note that this is not legal advice and professional consultation is recommended.',
    helperSystemPrompt: 'You are a helpful assistant for a legal analysis task. Help users understand how to present legal documents or scenarios for analysis, answer questions about legal concepts, and remind them that this is for educational purposes only and not legal advice.',
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

async function seedData() {
  try {
    await connectDB();
    
    // Clear existing data
    await Task.deleteMany({});
    await Rubric.deleteMany({});
    
    console.log('Cleared existing data');
    
    // Create tasks
    const createdTasks = await Task.insertMany(initialTasks);
    console.log(`Created ${createdTasks.length} tasks`);
    
    // Create some initial rubrics for the first task
    const codeReviewTask = createdTasks.find(task => task.name === 'Code Review Task');
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
      console.log(`Created ${createdRubrics.length} rubrics for Code Review Task`);
    }
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedData();