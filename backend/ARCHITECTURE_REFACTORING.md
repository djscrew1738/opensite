# Backend Architecture Refactoring Guide

This document describes the architectural improvements made to the OpenSite backend.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Service Layer](#service-layer)
3. [Repository Pattern](#repository-pattern)
4. [Error Handling](#error-handling)
5. [TypeScript Migration](#typescript-migration)
6. [Migration Guide](#migration-guide)

---

## Architecture Overview

### Before (Traditional MVC)
```
Route → Controller → Database
         ↓
    (Business Logic + 
     Validation + Caching
     all mixed together)
```

### After (Layered Architecture)
```
Route → Controller → Service → Repository → Database
         ↓              ↓           ↓
    HTTP Handling   Business    Data Access
                    Logic
```

### Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Testability** | Hard to unit test | Easy mocking at each layer |
| **Reusability** | Logic tied to routes | Services can be reused |
| **Maintainability** | Spaghetti code | Clear separation of concerns |
| **Error Handling** | Inconsistent | Centralized with custom errors |
| **Type Safety** | JavaScript only | TypeScript for critical paths |

---

## Service Layer

### BaseService (`services/base/BaseService.js`)

Abstract base class providing:
- **Logging**: Automatic operation logging with timing
- **Error Handling**: Standardized error wrapping
- **Validation**: Schema-based validation
- **Events**: Event emission for decoupled architecture

```javascript
class LeadService extends BaseService {
  constructor() {
    super('LeadService');
  }

  async createLead(data) {
    return this.execute('createLead', async () => {
      // Your business logic here
      // Errors are automatically caught and logged
    }, { context: 'data' });
  }
}
```

### Example Service (`services/LeadService.js`)

The refactored LeadService demonstrates:
- Input validation
- Business rules (auto-scoring, duplicate checking)
- Caching integration
- Event emission
- Transaction-like operations

**Key Methods:**
- `createLead()` - Creates with validation and auto-scoring
- `getLeads()` - Cached list with filtering
- `scoreLead()` - AI-powered lead scoring
- `bulkUpdateStatus()` - Mass operations
- `assignLead()` - Ownership management

---

## Repository Pattern

### BaseRepository (`services/base/BaseRepository.js`)

Abstract base class providing standard CRUD:
- `findById(id)` - Single record
- `findAll(filters, options)` - Paginated list
- `create(data)` - Insert
- `update(id, data)` - Modify
- `delete(id)` - Remove
- `bulkUpdate(ids, data)` - Mass update
- `bulkDelete(ids)` - Mass delete
- `exists(conditions)` - Check existence
- `count(conditions)` - Get count
- `transaction(callback)` - ACID operations

```javascript
class LeadRepository extends BaseRepository {
  constructor() {
    super('leads', db);
  }

  async findByStatus(status) {
    return this.findAll({ status });
  }
}
```

### LeadRepository (`services/repositories/LeadRepository.js`)

Lead-specific queries:
- `findByStatus()` - Filter by status
- `findByTier()` - Filter by tier (hot/warm/cold)
- `search()` - Text search across fields
- `findByDateRange()` - Date filtering
- `getStatistics()` - Aggregated stats
- `updateScore()` - Scoring data updates
- `assignToUser()` - Ownership changes
- `getLeadsNeedingFollowUp()` - Stale leads

### Repository Benefits

1. **Single Responsibility**: One place for all data access
2. **Testability**: Easy to mock database calls
3. **Swappable**: Can switch DB engines without changing services
4. **DRY**: Common operations in base class

---

## Error Handling

### Custom Error Classes (`utils/errors.js`)

| Error Class | Status Code | Use Case |
|-------------|-------------|----------|
| `AppError` | 500 | Base error class |
| `ValidationError` | 400 | Invalid input |
| `NotFoundError` | 404 | Resource missing |
| `UnauthorizedError` | 401 | Not authenticated |
| `ForbiddenError` | 403 | No permission |
| `ConflictError` | 409 | Duplicate/conflict |
| `RateLimitError` | 429 | Too many requests |
| `DatabaseError` | 500 | DB operation failed |
| `ExternalServiceError` | 503 | Third-party failure |
| `TimeoutError` | 504 | Operation timeout |

### Usage

```javascript
// In Service
if (!lead) {
  throw new NotFoundError('Lead', id);
}

if (exists) {
  throw new ConflictError('Lead with this email already exists');
}

// In Route - just use asyncHandler
router.get('/:id', asyncHandler(async (req, res) => {
  const lead = await leadService.getLead(req.params.id);
  // Errors are automatically caught and formatted
}));
```

### Response Format

```json
{
  "success": false,
  "error": {
    "message": "Lead not found",
    "code": "NOT_FOUND",
    "details": { "id": "123" },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

## TypeScript Migration

### Files Converted

| File | Description |
|------|-------------|
| `utils/response.ts` | API response utilities with strict typing |

### Type Definitions

```typescript
// Interfaces for API responses
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message: string | null;
  meta: ApiMeta;
}

interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

// Extended Express Response
interface ExtendedResponse extends Response {
  success<T>(data: T, message?: string, meta?: object): Response;
  error(message: string, code?: string, details?: any, status?: number): Response;
}
```

### Benefits

- **IntelliSense**: Auto-completion in IDEs
- **Type Safety**: Catch errors at compile time
- **Documentation**: Types serve as documentation
- **Refactoring**: Safe renaming and restructuring

---

## Migration Guide

### Step 1: Create Repository

```javascript
// services/repositories/NewRepository.js
import { BaseRepository } from '../base/BaseRepository.js';
import { db } from '../database/index.js';

export class NewRepository extends BaseRepository {
  constructor() {
    super('table_name', db);
  }

  // Add custom queries here
  async findByX(x) {
    return this.findAll({ x });
  }
}

export const newRepository = new NewRepository();
```

### Step 2: Create Service

```javascript
// services/NewService.js
import { BaseService } from './base/BaseService.js';
import { newRepository } from './repositories/NewRepository.js';

export class NewService extends BaseService {
  constructor() {
    super('NewService');
    this.repository = newRepository;
  }

  async create(data) {
    return this.execute('create', async () => {
      // Validation
      this.validate(data, { /* schema */ });
      
      // Business logic
      const result = await this.repository.create(data);
      
      // Events
      this.emit('created', result);
      
      return result;
    });
  }
}

export const newService = new NewService();
```

### Step 3: Create Route

```javascript
// routes/new-entity.js
import { Router } from 'express';
import { newService } from '../services/NewService.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();

router.post('/', asyncHandler(async (req, res) => {
  const result = await newService.create(req.body);
  res.status(201).success(result);
}));

export default router;
```

### Step 4: Register Route

```javascript
// routes/index.js
import newRoutes from './new-entity.js';

export function registerRoutes(app) {
  // ... existing routes
  router.use('/new-entity', newRoutes);
}
```

---

## Directory Structure

```
backend/src/
├── services/
│   ├── base/
│   │   ├── BaseService.js      # Abstract service base
│   │   ├── BaseRepository.js   # Abstract repository base
│   │   └── index.js            # Base exports
│   │
│   ├── repositories/
│   │   ├── LeadRepository.js   # Lead data access
│   │   └── index.js            # Repository exports
│   │
│   ├── LeadService.js          # Lead business logic
│   └── ...existing services
│
├── routes/
│   ├── leads-refactored.js     # New service-based route
│   └── leads.js                # Original route (for comparison)
│
├── middleware/
│   └── error-handler-enhanced.js  # New error handler
│
└── utils/
    ├── errors.js               # Custom error classes
    └── response.ts             # TypeScript response utils
```

---

## Comparison

### Original Approach

```javascript
// routes/leads.js
router.post('/', tryCatch(async (req, res) => {
  const leadData = { ...req.body, userId: req.user.id };
  
  // Validation inline
  if (!leadData.name) {
    return res.error('Name required', 'VALIDATION_ERROR', null, 400);
  }
  
  // Duplicate check inline
  const exists = await db.getLeadByEmail(leadData.email);
  if (exists) {
    return res.error('Duplicate', 'CONFLICT', null, 409);
  }
  
  // Business logic inline
  const lead = await db.createLead(leadData);
  
  // Caching inline
  cache.delPattern('leads:');
  
  // Logging inline
  logger.info('Lead created', { id: lead.id });
  
  res.status(201).success({ lead });
}));
```

### Refactored Approach

```javascript
// routes/leads-refactored.js
router.post('/', asyncHandler(async (req, res) => {
  const lead = await leadService.createLead(req.body, req.user.id);
  res.status(201).success({ lead }, 'Lead created successfully');
}));
```

---

## Best Practices

### Do's ✅

- Keep routes thin - delegate to services
- Use custom error classes for specific cases
- Validate at service layer
- Cache at service layer
- Log at service layer
- Use TypeScript for new utilities
- Write tests against services (mock repositories)

### Don'ts ❌

- Don't put business logic in routes
- Don't access database directly from routes
- Don't use generic Error - use custom classes
- Don't repeat validation logic
- Don't handle caching in routes

---

## Testing Strategy

### Unit Test Service

```javascript
import { LeadService } from '../services/LeadService.js';

// Mock repository
jest.mock('../services/repositories/LeadRepository.js');

describe('LeadService', () => {
  it('should create lead with validation', async () => {
    const service = new LeadService();
    const lead = await service.createLead({
      name: 'Test',
      email: 'test@example.com'
    }, 'user-123');
    
    expect(lead.name).toBe('Test');
  });
});
```

### Unit Test Repository

```javascript
import { LeadRepository } from '../services/repositories/LeadRepository.js';

// Mock database
jest.mock('../services/database/index.js');

describe('LeadRepository', () => {
  it('should find by status', async () => {
    const repo = new LeadRepository();
    const result = await repo.findByStatus('new');
    
    expect(result.data).toBeDefined();
  });
});
```

---

## Future Improvements

1. **Dependency Injection**: Use DI container for services
2. **More TypeScript**: Convert remaining utils
3. **Event Bus**: Replace direct emits with message queue
4. **API Versioning**: v2 routes with new pattern
5. **OpenAPI**: Auto-generate docs from TypeScript types

---

## References

- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
