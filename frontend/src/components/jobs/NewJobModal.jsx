/**
 * NewJobModal Component
 * Modal for creating new jobs with file attachments
 * 
 * @module components/jobs/NewJobModal
 */

import { useState, useCallback, memo } from 'react';
import { Plus, X, MapPin, Building2, HardHat, CheckCircle2, FileText, Paperclip } from 'lucide-react';
import { UploadDropzone } from '../upload';
import { colors, shadows } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** @type {Array<{value: string, label: string}>} */
const PHASE_OPTIONS = [
  { value: 'rough-in', label: 'Rough In' },
  { value: 'top-out', label: 'Top Out' },
  { value: 'trim', label: 'Trim' },
  { value: 'complete', label: 'Complete' },
];

/** @type {Array<{value: string, label: string}>} */
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
];

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Form input field
 * @param {{label: React.ReactNode, icon: React.ComponentType, children: React.ReactNode}} props
 */
const FormField = memo(function FormField({ label, icon: Icon, children }) {
  return (
    <div>
      <label 
        className="block text-sm font-medium mb-2"
        style={{ color: colors.text.secondary }}
      >
        <Icon className="w-4 h-4 inline mr-1" />
        {label}
      </label>
      {children}
    </div>
  );
});

FormField.displayName = 'FormField';

/**
 * Text input with standard styling
 * @param {React.InputHTMLAttributes<HTMLInputElement>} props
 */
const TextInput = memo(function TextInput(props) {
  return (
    <input
      className="w-full px-4 py-2.5 rounded-lg transition-colors outline-none"
      style={{
        backgroundColor: colors.surface.primary,
        border: `1px solid ${colors.border.default}`,
        color: colors.text.primary,
      }}
      {...props}
    />
  );
});

TextInput.displayName = 'TextInput';

/**
 * Select dropdown with standard styling
 * @param {React.SelectHTMLAttributes<HTMLSelectElement>} props
 */
const Select = memo(function Select(props) {
  return (
    <select
      className="w-full px-4 py-2.5 rounded-lg transition-colors outline-none cursor-pointer"
      style={{
        backgroundColor: colors.surface.primary,
        border: `1px solid ${colors.border.default}`,
        color: colors.text.primary,
      }}
      {...props}
    />
  );
});

Select.displayName = 'Select';

/**
 * Textarea with standard styling
 * @param {React.TextareaHTMLAttributes<HTMLTextAreaElement>} props
 */
const TextArea = memo(function TextArea(props) {
  return (
    <textarea
      className="w-full px-4 py-2.5 rounded-lg transition-colors outline-none resize-none"
      style={{
        backgroundColor: colors.surface.primary,
        border: `1px solid ${colors.border.default}`,
        color: colors.text.primary,
      }}
      {...props}
    />
  );
});

TextArea.displayName = 'TextArea';

/**
 * Attached file list item
 * @param {{name: string, onRemove: () => void}} props
 */
const FileAttachment = memo(function FileAttachment({ name, onRemove }) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-lg"
      style={{ 
        backgroundColor: colors.surface.primary, 
        border: `1px solid ${colors.border.default}`,
      }}
    >
      <span 
        className="text-sm truncate"
        style={{ color: colors.text.primary }}
      >
        {name}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-2 shrink-0 p-1 rounded transition-colors"
        style={{ color: colors.text.muted }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = colors.danger.DEFAULT;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = colors.text.muted;
        }}
        aria-label={`Remove ${name}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});

FileAttachment.displayName = 'FileAttachment';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * NewJobModal - Modal for creating new jobs
 * @param {{
 *   show: boolean,
 *   onClose: () => void,
 *   jobData: Record<string, any>,
 *   setJobData: (data: Record<string, any>) => void,
 *   onSubmit: (e: React.FormEvent, files: File[]) => void,
 *   isPending: boolean,
 *   error: Error | null
 * }} props
 */
function NewJobModal({ show, onClose, jobData, setJobData, onSubmit, isPending, error }) {
  const [pendingFiles, setPendingFiles] = useState([]);

  const handleFiles = useCallback((fileList) => {
    setPendingFiles(prev => [...prev, ...Array.from(fileList)]);
  }, []);

  const removeFile = useCallback((index) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSubmit(e, pendingFiles);
    setPendingFiles([]);
  }, [onSubmit, pendingFiles]);

  const updateField = useCallback((field, value) => {
    setJobData(prev => ({ ...prev, [field]: value }));
  }, [setJobData]);

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: colors.surface.overlay }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-job-title"
    >
      <div
        className="w-full max-w-md rounded-xl overflow-hidden"
        style={{ 
          backgroundColor: colors.surface.card, 
          border: `1px solid ${colors.border.default}`,
          boxShadow: shadows.cardHover,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${colors.border.default}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: colors.accent.muted }}
            >
              <Plus className="w-5 h-5" style={{ color: colors.accent.DEFAULT }} />
            </div>
            <div>
              <h2 
                id="new-job-title"
                className="text-lg font-semibold"
                style={{ color: colors.text.primary }}
              >
                Create New Job
              </h2>
              <p 
                className="text-sm"
                style={{ color: colors.text.muted }}
              >
                Add a new project to track
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: colors.text.muted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.border.default;
              e.currentTarget.style.color = colors.text.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.text.muted;
            }}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <FormField label="Job Name / Address *" icon={MapPin}>
            <TextInput
              type="text"
              required
              placeholder="e.g., 123 Main St, Dallas, TX"
              value={jobData.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </FormField>

          <FormField label="Builder / Client" icon={Building2}>
            <TextInput
              type="text"
              placeholder="e.g., Lennar Homes"
              value={jobData.builder}
              onChange={(e) => updateField('builder', e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Phase" icon={HardHat}>
              <Select
                value={jobData.phase}
                onChange={(e) => updateField('phase', e.target.value)}
              >
                {PHASE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Status" icon={CheckCircle2}>
              <Select
                value={jobData.status}
                onChange={(e) => updateField('status', e.target.value)}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label="Notes" icon={FileText}>
            <TextArea
              rows={3}
              placeholder="Additional job details..."
              value={jobData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </FormField>

          {/* File Attachments */}
          <FormField label="Attachments" icon={Paperclip}>
            <UploadDropzone compact onFiles={handleFiles} />
            {pendingFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {pendingFiles.map((file, i) => (
                  <FileAttachment
                    key={`${file.name}-${i}`}
                    name={file.name}
                    onRemove={() => removeFile(i)}
                  />
                ))}
              </div>
            )}
          </FormField>

          {error && (
            <div 
              className="p-3 rounded-lg border"
              style={{ 
                backgroundColor: colors.danger.muted,
                borderColor: colors.danger.border,
              }}
              role="alert"
            >
              <p 
                className="text-sm"
                style={{ color: colors.danger.light }}
              >
                {error.message || 'Failed to create job'}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors"
              style={{ 
                backgroundColor: colors.border.default, 
                color: colors.text.secondary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.border.strong;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.border.default;
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!jobData.name?.trim() || isPending}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: colors.accent.DEFAULT,
                color: '#FFFFFF',
                boxShadow: shadows.glowBlue,
              }}
              onMouseEnter={(e) => {
                if (!isPending && jobData.name?.trim()) {
                  e.currentTarget.style.backgroundColor = colors.accent.hover;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.accent.DEFAULT;
              }}
            >
              {isPending ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

NewJobModal.displayName = 'NewJobModal';

export default NewJobModal;
