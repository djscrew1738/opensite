import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { visionApi } from '../api/vision';
import { api } from '../api/client';

/**
 * Hook for managing AI-detected fixtures on blueprints
 * Handles detection, CRUD operations, and state management
 * 
 * @param {string} projectId - The vision project ID
 * @returns {Object} Fixture detection state and handlers
 */
export function useFixtureDetection(projectId) {
  const queryClient = useQueryClient();
  
  // Local state
  const [selectedFixtureId, setSelectedFixtureId] = useState(null);
  const [detectionJobId, setDetectionJobId] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Query key for this project's fixtures
  const fixturesQueryKey = ['fixtures', projectId];

  // ═══════════════════════════════════════════════════════════════
  // Fetch Fixtures
  // ═══════════════════════════════════════════════════════════════

  const { 
    data: fixtures = [], 
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: fixturesQueryKey,
    queryFn: async () => {
      if (!projectId) return [];
      
      // Try to get fixtures from the project details
      try {
        const project = await visionApi.getProject(projectId);
        
        // Check if there's a fixtures layer
        const fixturesLayer = project.layers?.find(l => l.type === 'fixtures');
        if (fixturesLayer?.data) {
          return fixturesLayer.data.map((f, idx) => ({
            id: f.id || `fixture-${idx}`,
            type: f.type || 'unknown',
            x: f.x || 0.5,
            y: f.y || 0.5,
            confidence: f.confidence || 50,
            status: f.status || 'pending',
            dimensions: f.dimensions,
            detectedAt: f.detectedAt || new Date().toISOString(),
            aiModel: f.aiModel,
            notes: f.notes,
          }));
        }
        
        // Fallback: check analyses for fixture data
        if (project.analyses?.length > 0) {
          const latestAnalysis = project.analyses[project.analyses.length - 1];
          if (latestAnalysis.result?.fixtures) {
            return Object.entries(latestAnalysis.result.fixtures).map(([type, count], typeIdx) => {
              // Generate positions in a grid pattern for demo
              const fixturesOfType = [];
              for (let i = 0; i < Math.min(count, 20); i++) {
                fixturesOfType.push({
                  id: `fixture-${type}-${i}`,
                  type: type.toLowerCase().replace(/\s+/g, '_'),
                  x: 0.1 + (i % 5) * 0.15 + Math.random() * 0.05,
                  y: 0.1 + Math.floor(i / 5) * 0.15 + typeIdx * 0.1 + Math.random() * 0.05,
                  confidence: Math.round(60 + Math.random() * 35),
                  status: 'pending',
                  detectedAt: latestAnalysis.createdAt,
                  aiModel: latestAnalysis.model,
                });
              }
              return fixturesOfType;
            }).flat();
          }
        }
        
        return [];
      } catch (err) {
        console.error('Failed to load fixtures:', err);
        return [];
      }
    },
    enabled: !!projectId,
    staleTime: 30000, // 30 seconds
  });

  // ═══════════════════════════════════════════════════════════════
  // Mutations
  // ═══════════════════════════════════════════════════════════════

  // Update fixture
  const updateMutation = useMutation({
    mutationFn: async ({ fixtureId, updates }) => {
      // In a real implementation, this would call the API
      // For now, we update locally
      return { id: fixtureId, ...updates };
    },
    onMutate: async ({ fixtureId, updates }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: fixturesQueryKey });
      const previousFixtures = queryClient.getQueryData(fixturesQueryKey);
      
      queryClient.setQueryData(fixturesQueryKey, old => 
        old?.map(f => f.id === fixtureId ? { ...f, ...updates } : f) || []
      );
      
      return { previousFixtures };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousFixtures) {
        queryClient.setQueryData(fixturesQueryKey, context.previousFixtures);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: fixturesQueryKey });
    },
  });

  // Delete fixture
  const deleteMutation = useMutation({
    mutationFn: async (fixtureId) => {
      // API call would go here
      return fixtureId;
    },
    onMutate: async (fixtureId) => {
      await queryClient.cancelQueries({ queryKey: fixturesQueryKey });
      const previousFixtures = queryClient.getQueryData(fixturesQueryKey);
      
      queryClient.setQueryData(fixturesQueryKey, old => 
        old?.filter(f => f.id !== fixtureId) || []
      );
      
      return { previousFixtures };
    },
    onError: (err, variables, context) => {
      if (context?.previousFixtures) {
        queryClient.setQueryData(fixturesQueryKey, context.previousFixtures);
      }
    },
  });

  // Run AI detection
  const detectMutation = useMutation({
    mutationFn: async ({ model, options = {} }) => {
      setIsDetecting(true);
      
      // Use the vision API to analyze the project
      const result = await visionApi.analyze(projectId, model, 'fixtures');
      
      if (result.jobId) {
        setDetectionJobId(result.jobId);
        return { jobId: result.jobId };
      }
      
      // If synchronous response
      return result;
    },
    onSuccess: (data) => {
      if (data.jobId) {
        // Start polling for job completion
        pollDetectionJob(data.jobId);
      } else {
        // Immediate result
        setIsDetecting(false);
        queryClient.invalidateQueries({ queryKey: fixturesQueryKey });
      }
    },
    onError: () => {
      setIsDetecting(false);
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // Job Polling
  // ═══════════════════════════════════════════════════════════════

  const pollDetectionJob = useCallback(async (jobId) => {
    const poll = setInterval(async () => {
      try {
        const status = await api.jobs.getStatus(jobId);
        
        if (status.status === 'completed') {
          clearInterval(poll);
          setIsDetecting(false);
          setDetectionJobId(null);
          queryClient.invalidateQueries({ queryKey: fixturesQueryKey });
          refetch();
        } else if (status.status === 'failed') {
          clearInterval(poll);
          setIsDetecting(false);
          setDetectionJobId(null);
        }
      } catch (err) {
        console.error('Job polling error:', err);
      }
    }, 2000);

    // Cleanup after 5 minutes
    setTimeout(() => {
      clearInterval(poll);
      setIsDetecting(false);
    }, 300000);
  }, [projectId, queryClient, refetch]);

  // ═══════════════════════════════════════════════════════════════
  // Handlers
  // ═══════════════════════════════════════════════════════════════

  const handleUpdateFixture = useCallback((fixtureId, updates) => {
    updateMutation.mutate({ fixtureId, updates });
  }, [updateMutation]);

  const handleDeleteFixture = useCallback((fixtureId) => {
    deleteMutation.mutate(fixtureId);
  }, [deleteMutation]);

  const handleSelectFixture = useCallback((fixtureId) => {
    setSelectedFixtureId(prev => prev === fixtureId ? null : fixtureId);
  }, []);

  const handleRunDetection = useCallback((model, options) => {
    detectMutation.mutate({ model, options });
  }, [detectMutation]);

  const handleBulkAction = useCallback((action, fixtureIds) => {
    switch (action) {
      case 'verify':
        fixtureIds.forEach(id => handleUpdateFixture(id, { status: 'verified' }));
        break;
      case 'reject':
        fixtureIds.forEach(id => handleUpdateFixture(id, { status: 'rejected' }));
        break;
      case 'delete':
        fixtureIds.forEach(id => handleDeleteFixture(id));
        break;
      default:
        break;
    }
  }, [handleUpdateFixture, handleDeleteFixture]);

  // ═══════════════════════════════════════════════════════════════
  // Derived State
  // ═══════════════════════════════════════════════════════════════

  const stats = useMemo(() => {
    const total = fixtures.length;
    const verified = fixtures.filter(f => f.status === 'verified').length;
    const pending = fixtures.filter(f => f.status === 'pending').length;
    const rejected = fixtures.filter(f => f.status === 'rejected').length;
    const byType = fixtures.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1;
      return acc;
    }, {});
    
    return { total, verified, pending, rejected, byType };
  }, [fixtures]);

  const selectedFixture = useMemo(() => 
    fixtures.find(f => f.id === selectedFixtureId) || null,
    [fixtures, selectedFixtureId]
  );

  // ═══════════════════════════════════════════════════════════════
  // Return
  // ═══════════════════════════════════════════════════════════════

  return {
    // State
    fixtures,
    selectedFixtureId,
    selectedFixture,
    isLoading,
    isDetecting,
    error,
    stats,
    
    // Actions
    handleUpdateFixture,
    handleDeleteFixture,
    handleSelectFixture,
    handleRunDetection,
    handleBulkAction,
    refetch,
    
    // Setters
    setSelectedFixtureId,
  };
}

export default useFixtureDetection;
