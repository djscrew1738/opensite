# Settings System Refactoring Plan

## Current State Analysis

### Backend Issues

| File | Lines | Problems |
|------|-------|----------|
| `backend/src/routes/settings.js` | 304 | Monolithic, mixed concerns, duplicate test logic |
| `backend/src/services/database/settings.js` | 82 | Clean but lacks types |

### Frontend Issues

| File | Lines | Problems |
|------|-------|----------|
| `frontend/src/pages/Settings.jsx` | 649 | God component, prop drilling, mixed concerns |
| `frontend/src/components/settings/SettingsHome.jsx` | 772 | Multiple sub-components, complex memoization |
| `frontend/src/components/settings/SettingsContext.jsx` | 517 | 200+ state variables, god object |
| `frontend/src/components/settings/hooks/useSettingsActions.js` | 644 | All actions in one hook |

## Proposed Architecture

### Backend Structure

```
backend/src/routes/settings/
├── index.js              # Route aggregator
├── schema.js             # Validation schemas (Zod)
├── controllers/
│   ├── index.js          # CRUD operations
│   ├── test-connection.js # Connection testing framework
│   └── masking.js        # API key masking
└── routes/
    ├── ai.js             # AI provider settings
    ├── business.js       # Business profile
    ├── notifications.js  # Notifications
    ├── apikeys.js        # API keys
    └── system.js         # System/performance
```

### Frontend Structure

```
frontend/src/settings/
├── domains/              # Domain-based modules
│   ├── ai/
│   │   ├── context.jsx
│   │   ├── hooks.js
│   │   ├── schema.js
│   │   └── components/
│   ├── business/
│   ├── notifications/
│   ├── discovery/
│   └── estimating/
├── shared/               # Shared settings components
│   ├── primitives/
│   ├── FormField.jsx
│   ├── Section.jsx
│   └── KeyInput.jsx
├── layout/
│   ├── SettingsLayout.jsx
│   ├── Sidebar.jsx
│   └── TabContent.jsx
└── index.js
```

## Key Improvements

### 1. Domain-Driven Design
Each settings domain (AI, Business, Notifications) is self-contained with:
- Own context/hooks
- Own validation schema
- Own components

### 2. Schema Validation
```javascript
// Zod schema for type safety
const AISettingsSchema = z.object({
  provider: z.enum(['ollama', 'groq', 'anthropic', 'openai']),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(100).max(8000),
});
```

### 3. Typed Database Layer
```javascript
// Type-safe settings with automatic coercion
class TypedSettings {
  async getNumber(key, fallback) { }
  async getBoolean(key, fallback) { }
  async getJSON(key, fallback) { }
}
```

### 4. Connection Testing Framework
```javascript
// Generic test framework instead of duplicate code
const testers = {
  ollama: async (url) => { /* ... */ },
  groq: async (key) => { /* ... */ },
  // ...
};
```

## Migration Strategy

### Phase 1: Backend (Low Risk)
1. Extract validation schemas
2. Create connection testing framework
3. Split routes by domain
4. Add typed settings database layer

### Phase 2: Frontend Shared (Medium Risk)
1. Create new settings primitives
2. Build shared layout components
3. Create domain contexts

### Phase 3: Frontend Domains (Medium Risk)
1. Migrate AI settings first (most complex)
2. Migrate Business settings
3. Migrate Notifications
4. Migrate remaining domains

### Phase 4: Cleanup (Low Risk)
1. Remove old SettingsContext
2. Remove old hooks
3. Update imports

## Benefits

| Metric | Before | After |
|--------|--------|-------|
| Max file size | 772 lines | ~200 lines |
| Context size | 517 lines | ~100 lines per domain |
| Coupling | High | Low |
| Testability | Poor | Good |
| Type Safety | None | Full |
| Bundle size | Large | Tree-shakeable |

## Implementation Checklist

### Backend
- [ ] Create `settings/schema.js` with Zod
- [ ] Create `settings/test-framework.js`
- [ ] Create `settings/masking.js`
- [ ] Split routes into domain files
- [ ] Add typed settings database methods

### Frontend
- [ ] Create domain folder structure
- [ ] Create shared primitives
- [ ] Create `ai/` domain module
- [ ] Create `business/` domain module
- [ ] Create `notifications/` domain module
- [ ] Create layout components
- [ ] Migrate Settings.jsx to use new structure
- [ ] Delete old files

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking changes | Feature flags, gradual migration |
| Lost functionality | Comprehensive test coverage |
| Performance regression | Code splitting, lazy loading |
| Developer confusion | Clear documentation, examples |
