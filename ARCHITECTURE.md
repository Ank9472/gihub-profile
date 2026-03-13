# AI Journal System - Architecture

## System Overview

The AI Journal System is a full-stack application designed for personal journaling with AI-powered insights. The architecture follows a modern microservices-ready monolith pattern that can be easily scaled.

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT (React)                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────────────┐  │
│  │JournalEntry│  │ EntryList │  │ Insights  │  │ AnalyzeButton   │  │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └───────┬─────────┘  │
│        └──────────────┴──────────────┴────────────────┘             │
│                              │                                       │
│                    React Query (Data Layer)                          │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │ HTTP/REST
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVER (Express.js)                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      Middleware Stack                         │   │
│  │  ┌────────┐  ┌─────────────┐  ┌────────────┐  ┌───────────┐ │   │
│  │  │ CORS   │→ │Rate Limiter │→ │ Auth (JWT) │→ │ Validator │ │   │
│  │  └────────┘  └─────────────┘  └────────────┘  └───────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                        Controllers                            │   │
│  │  ┌──────────────────┐       ┌───────────────────┐           │   │
│  │  │ journalController│       │ insightController │           │   │
│  │  └────────┬─────────┘       └─────────┬─────────┘           │   │
│  └───────────┼───────────────────────────┼───────────────────────┘   │
│              │                           │                           │
│  ┌───────────┴───────────────────────────┴───────────────────────┐   │
│  │                         Services                               │   │
│  │  ┌─────────────────┐           ┌────────────────┐            │   │
│  │  │   llmService    │           │  cacheService  │            │   │
│  │  │   (OpenAI)      │           │    (Redis)     │            │   │
│  │  └─────────────────┘           └────────────────┘            │   │
│  └───────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
         │                                      │
         ▼                                      ▼
┌─────────────────┐                   ┌─────────────────┐
│    MongoDB      │                   │     Redis       │
│  (Data Store)   │                   │    (Cache)      │
└─────────────────┘                   └─────────────────┘
         │
         ▼
┌─────────────────┐
│   OpenAI API    │
│   (GPT-4)       │
└─────────────────┘
```

## Component Details

### Frontend Architecture

#### React Components

1. **App.js** - Main application container
   - Manages global state
   - Handles routing between views
   - Configures axios interceptors

2. **JournalEntry.js** - Entry creation and editing
   - Form handling with local state
   - Mood selection
   - Tag management
   - Insights display

3. **EntryList.js** - Entry browsing
   - Search filtering
   - Date grouping
   - Pagination support

4. **Insights.js** - Analytics dashboard
   - Mood trend visualization
   - Theme distribution charts
   - Weekly summaries

5. **AnalyzeButton.js** - AI analysis trigger
   - Handles analysis requests
   - Shows loading states

#### State Management

- **React Query** for server state
  - Caching and synchronization
  - Background refetching
  - Optimistic updates

### Backend Architecture

#### Request Flow

```
Request → CORS → Rate Limiter → Auth → Validation → Controller → Service → Response
```

#### Controllers

- **journalController.js**
  - CRUD operations for entries
  - Search functionality
  - Mood statistics

- **insightController.js**
  - AI analysis orchestration
  - Weekly summaries
  - Writing prompts
  - Trend analysis

#### Services

- **llmService.js**
  - OpenAI API integration
  - Prompt engineering
  - Response parsing
  - Error handling

- **cacheService.js**
  - Redis connection management
  - Cache operations (get/set/delete)
  - Pattern-based invalidation
  - TTL management

#### Middleware

- **auth.js** - JWT authentication
- **rateLimiter.js** - Request rate limiting
- **validation.js** - Input validation

### Data Models

#### JournalEntry Schema

```javascript
{
  userId: ObjectId,
  title: String,
  content: String,
  mood: Enum['very_negative', 'negative', 'neutral', 'positive', 'very_positive'],
  tags: [String],
  insights: {
    summary: String,
    emotionalAnalysis: {
      primaryEmotion: String,
      emotionScore: Number,
      emotionalTrends: [String]
    },
    themes: [{
      theme: String,
      confidence: Number
    }],
    suggestions: [String],
    keyPhrases: [String],
    analyzedAt: Date,
    model: String
  },
  isAnalyzed: Boolean,
  wordCount: Number,
  readingTime: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## AI Integration

### Analysis Pipeline

1. **Entry Submission**
   - User clicks "Analyze" button
   - Request sent to `/api/entries/:id/analyze`

2. **Cache Check**
   - Check Redis for cached analysis
   - Cache key: `analysis:{entryId}:{updatedAt}`

3. **LLM Processing**
   - Build structured prompt
   - Send to OpenAI GPT-4
   - Request JSON response format

4. **Response Processing**
   - Parse JSON response
   - Validate structure
   - Save to database
   - Cache result

### Prompt Engineering

The system uses structured prompts with:
- Clear role definition
- Specific output format (JSON schema)
- Empathetic tone instructions
- Temperature: 0.7 for balanced creativity

## Caching Strategy

### Cache Layers

1. **Analysis Cache** (Redis)
   - Key: `analysis:{entryId}:{updatedAt}`
   - TTL: 1 hour
   - Invalidated on content update

2. **Weekly Summary Cache**
   - Key: `weekly:{userId}:{weekStart}`
   - TTL: 24 hours

3. **Writing Prompts Cache**
   - Key: `prompts:{userId}`
   - TTL: 6 hours

4. **React Query Cache** (Client)
   - Stale time: 5 minutes
   - Background refetch on window focus

## Security Measures

1. **Authentication**
   - JWT tokens with expiration
   - Secure token storage
   - Refresh token rotation

2. **Rate Limiting**
   - Global: 100 requests/15 min
   - API: 60 requests/min
   - Analysis: 10 requests/min

3. **Input Validation**
   - express-validator for all inputs
   - Content length limits
   - XSS prevention

4. **Security Headers**
   - Helmet.js for HTTP headers
   - CORS configuration
   - Content Security Policy

## Scalability Considerations

### Horizontal Scaling

- Stateless server design
- External session storage (Redis)
- Load balancer ready

### Database Scaling

- MongoDB indexes for common queries
- Compound indexes for user queries
- Text index for search

### Caching Optimization

- Redis cluster support
- Cache invalidation patterns
- Lazy loading strategies

## Monitoring Points

- Health check endpoint: `/health`
- Request logging with Morgan
- Error tracking
- Rate limit metrics
- Cache hit/miss ratios

## Future Enhancements

1. **Real-time Features**
   - WebSocket for live updates
   - Collaborative journaling

2. **Advanced Analytics**
   - Sentiment trends over time
   - Goal tracking integration
   - Export functionality

3. **Multi-modal Support**
   - Voice journaling
   - Image attachments
   - Drawing integration
