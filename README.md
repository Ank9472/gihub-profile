# AI Journal System

An intelligent journaling application that uses AI to analyze your entries and provide meaningful insights about your emotional patterns, themes, and personal growth.

## Features

- **Journal Entries**: Create, edit, and organize your personal journal entries
- **Mood Tracking**: Track your mood with each entry
- **AI Analysis**: Get AI-powered insights on your writing including:
  - Emotional analysis
  - Theme detection
  - Personalized suggestions
  - Key phrase extraction
- **Weekly Summaries**: Automated weekly insights and patterns
- **Writing Prompts**: AI-generated prompts based on your recent entries
- **Visualizations**: Charts showing mood trends and theme distributions
- **Full-text Search**: Search across all your entries

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** for data storage
- **Redis** for caching
- **OpenAI GPT-4** for AI analysis
- **JWT** for authentication

### Frontend
- **React 18** with hooks
- **React Query** for data fetching
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 7.0+
- Redis 7+
- OpenAI API key
- Docker & Docker Compose (optional)

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-journal-system.git
cd ai-journal-system
```

2. Configure server environment:
```bash
cp server/.env.example server/.env
# Edit server/.env with your configuration
```

3. Configure client environment:
```bash
cp client/.env.example client/.env
# Edit client/.env if needed
```

### Running with Docker (Recommended)

```bash
# Set your OpenAI API key
export OPENAI_API_KEY=your-api-key-here

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Running Locally

#### Start MongoDB and Redis

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

#### Start the Backend

```bash
cd server
npm install
npm run dev
```

#### Start the Frontend

```bash
cd client
npm install
npm start
```

## API Endpoints

### Journal Entries
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/entries | Create a new entry |
| GET | /api/entries | Get all entries (paginated) |
| GET | /api/entries/:id | Get a single entry |
| PUT | /api/entries/:id | Update an entry |
| DELETE | /api/entries/:id | Delete an entry |
| POST | /api/entries/:id/analyze | Analyze entry with AI |
| GET | /api/entries/search | Search entries |

### Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/insights/entry/:id | Get insights for an entry |
| GET | /api/insights/weekly | Get weekly summary |
| GET | /api/insights/prompts | Get writing prompts |
| GET | /api/insights/trends/emotional | Get emotional trends |
| GET | /api/insights/trends/themes | Get theme analysis |
| POST | /api/insights/batch-analyze | Batch analyze entries |

## Project Structure

```
ai-journal-system/
├── server/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   ├── config/          # Configuration
│   │   └── app.js           # Entry point
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.js           # Main app
│   │   └── index.js         # Entry point
│   └── package.json
├── docker-compose.yml
├── Dockerfile.server
├── Dockerfile.client
└── README.md
```

## Configuration

### Server Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/ai-journal |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| JWT_SECRET | Secret for JWT tokens | (required) |
| JWT_EXPIRES_IN | Token expiration | 7d |
| OPENAI_API_KEY | OpenAI API key | (required) |
| OPENAI_MODEL | OpenAI model to use | gpt-4 |

## Security

- JWT-based authentication
- Rate limiting on all endpoints
- Helmet.js for security headers
- Input validation and sanitization
- CORS configuration

## License

MIT License - see LICENSE file for details
