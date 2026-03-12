import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../hooks/useToast';
import { BookOpenText } from 'lucide-react';
import { docvaultApi } from '../../../api/docvault';
import { UploadDropzone } from '../../upload';
import DocSidebar from '../DocSidebar';
import DocViewer from '../DocViewer';
import { DocumentProvider } from '../../../contexts/DocumentContext';

/**
 * TextIntelligence Component
 * Tab for AI-powered document analysis (summarize, extract, chat)
 * Uses DocumentProvider for state management in DocViewer
 */

/**
 * Inner component that uses the document context
 */
function DocumentViewerWithProvider({ selectedDoc, onBack }) {
  return (
    <DocumentProvider document={selectedDoc}>
      <DocViewer document={selectedDoc} onBack={onBack} />
    </DocumentProvider>
  );
}

export default function TextIntelligence() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [selectedDocId, setSelectedDocId] = useState(null);

  // Fetch text documents list
  const { data: textDocs = [], isLoading: docsLoading } = useQuery({
    queryKey: ['docvault-documents'],
    queryFn: () => docvaultApi.getAll(),
    refetchInterval: (query) => {
      // Poll while any document is processing
      const docs = query.state.data || [];
      return docs.some(d => d.status === 'processing') ? 3000 : false;
    },
  });

  // Fetch selected document details
  const { data: selectedDoc } = useQuery({
    queryKey: ['docvault-document', selectedDocId],
    queryFn: () => docvaultApi.getOne(selectedDocId),
    enabled: !!selectedDocId,
  });

  // Upload handler — accepts FileList from UploadDropzone
  const handleUpload = useCallback(async (files) => {
    try {
      const fileList = Array.from(files);
      for (const file of fileList) {
        await docvaultApi.upload(file);
      }
      queryClient.invalidateQueries({ queryKey: ['docvault-documents'] });
      success('Document uploaded');
    } catch {
      showError('Upload failed');
    }
  }, [queryClient, success, showError]);

  // Delete handler
  const handleDelete = useCallback(async (id) => {
    try {
      await docvaultApi.delete(id);
      if (selectedDocId === id) setSelectedDocId(null);
      queryClient.invalidateQueries({ queryKey: ['docvault-documents'] });
      success('Document deleted');
    } catch {
      showError('Failed to delete document');
    }
  }, [selectedDocId, queryClient, success, showError]);

  // Handle document selection
  const handleSelectDocument = useCallback((id) => {
    setSelectedDocId(id);
  }, []);

  // Handle going back
  const handleBack = useCallback(() => {
    setSelectedDocId(null);
  }, []);

  return (
    <div className="flex h-full min-h-0">
      {/* Left panel: Upload + Document list */}
      <div className="w-72 lg:w-80 shrink-0 flex flex-col border-r border-surface-700 overflow-y-auto bg-surface-950">
        <div className="p-3">
          <UploadDropzone compact onFiles={handleUpload} />
        </div>
        <DocSidebar
          documents={textDocs}
          selectedId={selectedDocId}
          onSelect={handleSelectDocument}
          onDelete={handleDelete}
          isLoading={docsLoading}
        />
      </div>

      {/* Right panel: Document viewer */}
      <div className="flex-1 min-w-0 flex flex-col bg-surface-950">
        {selectedDocId && selectedDoc ? (
          <DocumentViewerWithProvider 
            selectedDoc={selectedDoc} 
            onBack={handleBack} 
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-surface-900 border border-surface-700">
                <BookOpenText className="w-7 h-7 text-surface-500" />
              </div>
              <p className="text-sm font-medium text-surface-400">
                Select a document to analyze
              </p>
              <p className="text-xs mt-1 text-surface-500">
                Upload text files and use AI to summarize, extract entities, and chat
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
