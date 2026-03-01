/**
 * Base Classes for Service Layer Architecture
 * 
 * This module provides the foundation for a clean, maintainable architecture:
 * 
 * - BaseService: Abstract class for business logic services
 * - BaseRepository: Abstract class for data access repositories
 * 
 * Usage Pattern:
 *   Repository → Service → Controller → Route
 *   
 *   Repository: Data access only (SQL queries)
 *   Service: Business logic (validation, orchestration, caching)
 *   Controller: HTTP handling (req/res, status codes)
 *   Route: URL mapping and middleware
 */

export { BaseService } from './BaseService.js';
export { BaseRepository } from './BaseRepository.js';
