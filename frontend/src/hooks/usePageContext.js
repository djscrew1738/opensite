import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';

/**
 * usePageContext - Hook to detect current page context for AI assistant
 * Returns context-aware information based on the current route
 */
export function usePageContext() {
  const location = useLocation();
  const params = useParams();

  const context = useMemo(() => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);

    // Dashboard / Home
    if (path === '/') {
      return {
        page: 'dashboard',
        title: 'Dashboard',
        greeting: "Welcome to your command center. I can help analyze your active jobs, lead pipeline, or today's priorities.",
        quickActions: [
          { label: 'Analyze leads', prompt: 'Analyze my recent leads and identify hot opportunities' },
          { label: 'Job summary', prompt: 'Give me a summary of my active jobs' },
          { label: 'Today\'s priorities', prompt: 'What should I prioritize today?' },
          { label: 'Overdue items', prompt: 'Show me any overdue jobs or inspections' },
        ],
        data: {
          view: searchParams.get('view'),
        },
      };
    }

    // Jobs page
    if (path === '/jobs') {
      const tab = searchParams.get('tab');
      const tabNames = {
        'estimating': 'Estimating',
        'plumbing': '4D Plumbing',
        'inspections': 'Inspections',
        'permits': 'Permits',
      };

      return {
        page: 'jobs',
        title: tab ? `${tabNames[tab] || tab} Jobs` : 'Jobs',
        greeting: tab 
          ? `I see you're viewing ${tabNames[tab] || tab} jobs. Need help analyzing timelines, materials, or scheduling?`
          : "Looking at your jobs. I can help with scheduling conflicts, material estimates, or phase planning.",
        quickActions: [
          { label: 'Schedule analysis', prompt: 'Analyze my job schedule for conflicts' },
          { label: 'Material needs', prompt: 'What materials will I need this week?' },
          { label: 'Phase planning', prompt: 'Help me plan phase transitions' },
          { label: 'Inspection prep', prompt: 'What inspections are coming up?' },
        ],
        data: { tab },
      };
    }

    // Leads page
    if (path === '/leads') {
      return {
        page: 'leads',
        title: 'Lead Finder',
        greeting: "I see you're in the Lead Finder. Want me to score leads, analyze conversion patterns, or draft follow-up messages?",
        quickActions: [
          { label: 'Score hot leads', prompt: 'Identify and score my hottest leads' },
          { label: 'Follow-up drafts', prompt: 'Draft follow-up messages for recent leads' },
          { label: 'Conversion analysis', prompt: 'Analyze my lead conversion patterns' },
          { label: 'Builder insights', prompt: 'Show insights about builder activity' },
        ],
        data: {},
      };
    }

    // Documents / Vision page
    if (path === '/documents') {
      const tab = searchParams.get('tab');
      
      if (tab === 'vision') {
        return {
          page: 'vision',
          title: 'Vision Analysis',
          greeting: "I see you're analyzing blueprints. I can help extract data, check code compliance, or estimate materials from your uploads.",
          quickActions: [
            { label: 'Extract data', prompt: 'Help me extract data from this blueprint' },
            { label: 'Code check', prompt: 'Check code compliance for this design' },
            { label: 'Material estimate', prompt: 'Estimate materials from this blueprint' },
            { label: 'Cost analysis', prompt: 'Analyze costs for this project' },
          ],
          data: { tab },
        };
      }

      return {
        page: 'documents',
        title: 'Documents',
        greeting: "Looking at your documents. I can help organize, search, or analyze your files.",
        quickActions: [
          { label: 'Search documents', prompt: 'Help me find specific documents' },
          { label: 'Organize files', prompt: 'Suggest ways to organize my documents' },
          { label: 'Extract data', prompt: 'Extract data from uploaded documents' },
        ],
        data: { tab },
      };
    }

    // Settings page
    if (path === '/settings') {
      return {
        page: 'settings',
        title: 'Settings',
        greeting: "You're in settings. I can help explain configuration options or troubleshoot issues.",
        quickActions: [
          { label: 'AI configuration', prompt: 'Explain the AI model options' },
          { label: 'Integration help', prompt: 'Help me set up integrations' },
          { label: 'Troubleshoot', prompt: 'I\'m having an issue with...' },
        ],
        data: {},
      };
    }

    // Default / unknown page
    return {
      page: 'unknown',
      title: 'OpenSite',
      greeting: "I'm your CTL Plumbing AI assistant. How can I help you today?",
      quickActions: [
        { label: 'General help', prompt: 'What can you help me with?' },
        { label: 'Lead analysis', prompt: 'Analyze my leads' },
        { label: 'Job help', prompt: 'Help with my jobs' },
        { label: 'Code question', prompt: 'I have a code compliance question' },
      ],
      data: {},
    };
  }, [location.pathname, location.search]);

  return context;
}

/**
 * Get detailed context for specific entity types
 * This can be extended to include actual data from your stores/API
 */
export function useEntityContext(entityType, entityId) {
  // This would typically fetch actual entity data
  // For now, return placeholder structure
  return useMemo(() => {
    if (!entityType || !entityId) return null;

    switch (entityType) {
      case 'lead':
        return {
          type: 'lead',
          greeting: `I see you're looking at a lead. Want me to score this lead, draft a follow-up text, or estimate the project?`,
          quickActions: [
            { label: 'Score lead', prompt: 'Score this lead based on the details' },
            { label: 'Draft follow-up', prompt: 'Draft a follow-up message for this lead' },
            { label: 'Estimate project', prompt: 'Help me estimate this project' },
            { label: 'Check builder', prompt: 'What do we know about this builder?' },
          ],
        };

      case 'job':
        return {
          type: 'job',
          greeting: `Looking at a job detail. I can help with phase planning, inspection prep, or material ordering.`,
          quickActions: [
            { label: 'Phase plan', prompt: 'Help me plan the next phase' },
            { label: 'Inspection prep', prompt: 'What do I need for the next inspection?' },
            { label: 'Materials', prompt: 'Order materials for this phase' },
            { label: 'Timeline', prompt: 'Analyze the job timeline' },
          ],
        };

      case 'estimate':
        return {
          type: 'estimate',
          greeting: `I see you're working on an estimate. Want me to do a deep analysis on this estimate?`,
          quickActions: [
            { label: 'Deep analysis', prompt: 'Do a deep analysis of this estimate' },
            { label: 'Check pricing', prompt: 'Are these prices competitive?' },
            { label: 'Material check', prompt: 'Verify material quantities' },
            { label: 'Compare jobs', prompt: 'Compare to similar past jobs' },
          ],
        };

      default:
        return null;
    }
  }, [entityType, entityId]);
}
