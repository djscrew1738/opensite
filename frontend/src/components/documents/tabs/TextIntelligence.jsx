import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../hooks/useToast';
import { BookOpenText } from 'lucide-react';
import { docvaultApi } from '../../../api/docvault';
import { UploadDropzone } from '../../upload';
import DocSidebar from '../DocSidebar';
import DocViewer from '../DocViewer';

/**
 * TextIntelligence Component
 * Tab for AI-powered document analysis (summarize, extract, chat)
 */
export default function TextIntelligence() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

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

  // Fetch chat history when document selected
  useEffect(() => {
    if (!selectedDocId) {
      setChatHistory([]);
      return;
    }
    docvaultApi.getChatHistory(selectedDocId)
      .then(messages => setChatHistory(messages || []))
      .catch(() => setChatHistory([]));
  }, [selectedDocId]);

  // Upload handler — accepts FileList from UploadDropzone
  const handleUpload = async (files) => {
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
  };

  // Delete handler
  const handleDelete = async (id) => {
    try {
      await docvaultApi.delete(id);
      if (selectedDocId === id) setSelectedDocId(null);
      queryClient.invalidateQueries({ queryKey: ['docvault-documents'] });
      success('Document deleted');
    } catch {
      showError('Failed to delete document');
    }
  };

  // Summarize handler
  const handleSummarize = async () => {
    if (!selectedDocId) return;
    setIsAiLoading(true);
    try {
      await docvaultApi.summarize(selectedDocId);
      queryClient.invalidateQueries({ queryKey: ['docvault-document', selectedDocId] });
      success('Summary generated');
    } catch {
      showError('Failed to generate summary');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Extract entities handler
  const handleExtract = async () => {
    if (!selectedDocId) return;
    setIsAiLoading(true);
    try {
      await docvaultApi.extract(selectedDocId);
      queryClient.invalidateQueries({ queryKey: ['docvault-document', selectedDocId] });
      success('Entities extracted');
    } catch {
      showError('Failed to extract entities');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Chat handler
  const handleChat = async (message) => {
    if (!selectedDocId || !message.trim()) return;
    // Optimistic: add user message immediately
    const userMsg = { 
      role: 'user', 
      content: message, 
      created_at: new Date().toISOString() 
    };
    setChatHistory(prev => [...prev, userMsg]);
    setIsAiLoading(true);
    try {
      const result = await docvaultApi.chat(selectedDocId, message);
      const assistantMsg = { 
        role: 'assistant', 
        content: result.answer, 
        created_at: new Date().toISOString() 
      };
      setChatHistory(prev => [...prev, assistantMsg]);
    } catch {
      const errorMsg = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.', 
        created_at: new Date().toISOString() 
      };
      setChatHistory(prev => [...prev, errorMsg]);
      showError('Chat request failed');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Clear chat handler
  const handleClearChat = async () => {
    if (!selectedDocId) return;
    try {
      await docvaultApi.clearChat(selectedDocId);
      setChatHistory([]);
    } catch {
      showError('Failed to clear chat history');
    }
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Left panel: Upload + Document list */}
      <div
        className="w-72 lg:w-80 shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ borderColor: '#1F2430', backgroundColor: '#0A0B0D' }}
      >
        <div className="p-3">
          <UploadDropzone compact onFiles={handleUpload} />
        </div>
        <DocSidebar
          documents={textDocs}
          selectedId={selectedDocId}
          onSelect={setSelectedDocId}
          onDelete={handleDelete}
          isLoading={docsLoading}
        />
      </div>

      {/* Right panel: Document viewer */}
      <div className="flex-1 min-w-0 flex flex-col" style={{ backgroundColor: '#0A0B0D' }}>
        {selectedDocId && selectedDoc ? (
          <DocViewer
            document={selectedDoc}
            onBack={() => setSelectedDocId(null)}
            onSummarize={handleSummarize}
            onExtract={handleExtract}
            onChat={handleChat}
            onClearChat={handleClearChat}
            chatHistory={chatHistory}
            isAiLoading={isAiLoading}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#111318', border: '1px solid #1F2430' }}
              >
                <BookOpenText className="w-7 h-7" style={{ color: '#64748B' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: '#94A3B8' }}>
                Select a document to analyze
              </p>
              <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                Upload text files and use AI to summarize, extract entities, and chat
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
