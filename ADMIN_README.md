# AllBench Admin Dashboard

This admin dashboard provides a comprehensive interface for managing tasks, credentials, and viewing submissions for the AllBench platform.

## Features

### 🎯 Task Management
- **Create Tasks**: Add new tasks with custom descriptions, logos, and task-specific required credentials
- **Edit Tasks**: Modify existing task details and settings
- **Delete Tasks**: Remove tasks from the platform
- **Toggle Status**: Enable/disable tasks as needed
- **Credential Management**: Add, edit, and remove credentials specific to each task
- **Integrated Workflow**: Manage credentials directly within the task creation/editing process

### 📊 Submissions View
- **View All Submissions**: Comprehensive list of all user submissions
- **Filter by Task**: Filter submissions by specific tasks
- **Filter by Wallet**: Search submissions by wallet address
- **Detailed View**: Inspect LLM responses and evaluation scores
- **Score Analysis**: See overall scores and individual rubric evaluations

### 📈 Dashboard Overview
- **Statistics**: View total tasks, active tasks, task-specific credentials, and submissions
- **Quick Actions**: Fast access to task management and submission viewing
- **Status Indicators**: Visual indicators for system health

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Navigate to the backend directory:
   ```bash
   cd allbench-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Access the admin dashboard:
   ```
   http://localhost:3000/admin
   ```

## API Endpoints

### Admin Tasks API
- `GET /api/admin/tasks` - Fetch all tasks
- `POST /api/admin/tasks` - Create a new task with embedded credentials
- `PUT /api/admin/tasks/[id]` - Update a task and its credentials
- `DELETE /api/admin/tasks/[id]` - Delete a task

### Task Credentials API
- `GET /api/tasks/[id]/credentials` - Fetch credentials for a specific task

### Admin Submissions API
- `GET /api/admin/submissions` - Fetch all submissions

## Environment Variables

Required environment variables in `.env.local`:

```env
# Backend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
PORT=3000

# Database Configuration
DATABASE_URL=mongodb://localhost:27017/allbench

# API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# Reclaim Protocol Configuration
RECLAIM_APP_ID=your_reclaim_app_id_here
RECLAIM_APP_SECRET=your_reclaim_app_secret_here

# Security
JWT_SECRET=your_jwt_secret_here

# Blockchain Configuration
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/your_infura_project_id
WALLET_PRIVATE_KEY=your_wallet_private_key_here
```

## Data Structure

### Task Object
```typescript
interface Task {
  id: string;
  name: string;
  description: string;
  logo: string;
  requiredCredentials: Credential[];
  active: boolean;
}
```

### Credential Object
```typescript
interface Credential {
  id: string;
  name: string;
  logo: string;
  reclaimProviderId: string;
}
```

### Submission Object
```typescript
interface Submission {
  taskId: string;
  llmResponses: LLMResponse[];
  rubrics: {
    rubricId: string;
    evaluations: {
      llmName: string;
      score: number;
      description: string;
    }[];
  }[];
  walletAddress: string;
}
```

## Security Considerations

⚠️ **Important**: This admin dashboard should be protected with proper authentication in production. Consider implementing:

- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting
- Input validation and sanitization
- HTTPS enforcement
- Environment-specific access controls

## Deployment

For production deployment:

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. Configure reverse proxy (nginx/Apache) with SSL
4. Set up proper database connections
5. Configure monitoring and logging

## Support

For issues or questions about the admin dashboard, please check:
- API documentation in the `/api` endpoints
- TypeScript interfaces in `/types`
- Component source code in `/app/admin`

## Contributing

When contributing to the admin dashboard:
1. Follow the existing TypeScript patterns
2. Maintain consistent UI/UX with Tailwind CSS
3. Add proper error handling
4. Test API endpoints thoroughly
5. Update this documentation for new features