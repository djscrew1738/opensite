// In-memory data store for rapid development
// Ready for PostgreSQL migration when needed

import { v4 as uuidv4 } from 'uuid';

class DataStore {
  constructor() {
    this.leads = new Map();
    this.projects = new Map();
    this.estimates = new Map();
    this.conversations = new Map();
  }

  // Lead operations
  createLead(data) {
    const id = uuidv4();
    const lead = {
      id,
      name: data.name,
      company: data.company,
      email: data.email || '',
      phone: data.phone || '',
      location: data.location || '',
      projectType: data.projectType || '',
      value: data.value || 0,
      score: null,
      status: null,
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.leads.set(id, lead);
    return lead;
  }

  getLead(id) {
    return this.leads.get(id);
  }

  getAllLeads(filters = {}) {
    let leads = Array.from(this.leads.values());

    // Apply status filter
    if (filters.status) {
      leads = leads.filter(lead => lead.status === filters.status);
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      leads = leads.filter(lead =>
        lead.name.toLowerCase().includes(searchLower) ||
        lead.company.toLowerCase().includes(searchLower) ||
        lead.location.toLowerCase().includes(searchLower)
      );
    }

    // Sort by updated date (newest first)
    leads.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return leads;
  }

  updateLead(id, data) {
    const lead = this.leads.get(id);
    if (!lead) return null;

    const updated = {
      ...lead,
      ...data,
      id: lead.id, // Prevent ID change
      createdAt: lead.createdAt, // Prevent creation date change
      updatedAt: new Date().toISOString()
    };

    this.leads.set(id, updated);
    return updated;
  }

  deleteLead(id) {
    return this.leads.delete(id);
  }

  // Project operations
  createProject(data) {
    const id = uuidv4();
    const project = {
      id,
      name: data.name,
      leadId: data.leadId || null,
      phase: 'rough-in',
      progress: 0,
      value: data.value || 0,
      startDate: data.startDate || new Date().toISOString(),
      estimatedCompletion: data.estimatedCompletion || null,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.projects.set(id, project);
    return project;
  }

  getProject(id) {
    return this.projects.get(id);
  }

  getAllProjects() {
    return Array.from(this.projects.values())
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  updateProject(id, data) {
    const project = this.projects.get(id);
    if (!project) return null;

    const updated = {
      ...project,
      ...data,
      id: project.id,
      createdAt: project.createdAt,
      updatedAt: new Date().toISOString()
    };

    this.projects.set(id, updated);
    return updated;
  }

  // Estimate operations
  createEstimate(data) {
    const id = uuidv4();
    const estimate = {
      id,
      leadId: data.leadId || null,
      tier: data.tier,
      sqft: data.sqft,
      bathrooms: data.bathrooms,
      units: data.units,
      stories: data.stories,
      total: data.total,
      perUnit: data.perUnit,
      breakdown: data.breakdown,
      margin: data.margin,
      analysis: data.analysis || null,
      createdAt: new Date().toISOString()
    };
    this.estimates.set(id, estimate);
    return estimate;
  }

  getEstimate(id) {
    return this.estimates.get(id);
  }

  // Conversation operations
  createConversation(data) {
    const id = data.conversationId || uuidv4();
    const conversation = this.conversations.get(id) || {
      id,
      messages: [],
      createdAt: new Date().toISOString()
    };

    conversation.messages.push({
      role: data.role,
      content: data.content,
      timestamp: new Date().toISOString()
    });

    conversation.updatedAt = new Date().toISOString();
    this.conversations.set(id, conversation);
    return conversation;
  }

  getConversation(id) {
    return this.conversations.get(id);
  }

  // Dashboard statistics
  getDashboardStats() {
    const leads = Array.from(this.leads.values());
    const projects = Array.from(this.projects.values());

    const pipelineValue = leads
      .filter(lead => lead.status === 'hot')
      .reduce((sum, lead) => sum + (lead.value || 0), 0);

    const activeProjects = projects.filter(p => p.status === 'active');

    const hotLeads = leads
      .filter(lead => lead.status === 'hot')
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 3);

    return {
      pipelineValue,
      activeProjectsCount: activeProjects.length,
      activeProjects,
      hotLeadsCount: hotLeads.length,
      hotLeads,
      totalLeads: leads.length
    };
  }
}

// Singleton instance
export const dataStore = new DataStore();
