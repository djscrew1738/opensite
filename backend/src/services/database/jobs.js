// Job Operations Module
// Adds job-related CRUD operations to DatabaseService

export function addJobOperations(DatabaseService) {
  // Get all analysis jobs
  DatabaseService.prototype.getAllAnalysisJobs = async function(userId) {
    if (userId) {
      return await this.all('SELECT * FROM analysis_jobs WHERE userId = ? ORDER BY createdAt DESC', [userId]);
    }
    return await this.all('SELECT * FROM analysis_jobs ORDER BY createdAt DESC');
  };
}

export default addJobOperations;

