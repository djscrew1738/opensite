// Job Operations Module
// Adds job-related CRUD operations to DatabaseService

export function addJobOperations(DatabaseService) {
  // Get all analysis jobs
  DatabaseService.prototype.getAllAnalysisJobs = async function(userId) {
    if (userId) {
      return await this.all('SELECT * FROM analysis_jobs WHERE blueprint_id = ? ORDER BY created_at DESC', [userId]);
    }
    return await this.all('SELECT * FROM analysis_jobs ORDER BY created_at DESC');
  };
}

export default addJobOperations;

