import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useFormPersistence } from '../../hooks/useFormPersistence';
import { useFormValidation } from '../../hooks/useFormValidation';

// Validation rules
const validators = {
  name: [
    { required: true, message: 'Name is required' },
    { minLength: 2, message: 'Name must be at least 2 characters' },
  ],
  company: [
    { required: true, message: 'Company is required' },
    { minLength: 2, message: 'Company must be at least 2 characters' },
  ],
  email: [
    { 
      pattern: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
      message: 'Please enter a valid email address' 
    },
  ],
  phone: [
    { 
      pattern: /^$|^\(\d{3}\)\s?\d{3}-?\d{4}$|^\d{3}-?\d{3}-?\d{4}$|^\d{10}$/,
      message: 'Format: (214) 555-0100 or 214-555-0100'
    },
  ],
};

// Format phone number as user types
const formatPhone = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

export default function LeadModal({ lead, onClose, onSave }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form validation hook
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setValue,
    validateAll,
    isValid,
    getFieldProps,
  } = useFormValidation(
    {
      name: lead?.name || '',
      company: lead?.company || '',
      email: lead?.email || '',
      phone: lead?.phone || '',
      location: lead?.location || '',
      projectType: lead?.projectType || '',
      value: lead?.value || '',
      notes: lead?.notes || ''
    },
    validators
  );

  // Auto-save form data to localStorage (only for new leads, not edits)
  const { clearSaved } = useFormPersistence('lead-form', values, (newValues) => {
    Object.entries(newValues).forEach(([key, value]) => {
      setValue(key, value);
    });
  }, {
    enabled: !lead,
    shouldSave: (data) => data.name?.trim() || data.company?.trim(),
    onRestore: () => {}
  });

  useEffect(() => {
    if (lead) {
      clearSaved();
    }
  }, [lead, clearSaved]);

  // Handle phone input with formatting
  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setValue('phone', formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const isFormValid = validateAll();
    if (!isFormValid) {
      setIsSubmitting(false);
      return;
    }
    
    try {
      await onSave({
        ...values,
        value: Number(values.value) || 0
      });
      clearSaved();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to show field error state
  const getFieldClassName = (fieldName) => {
    const baseClass = 'input w-full';
    if (touched[fieldName] && errors[fieldName]) {
      return `${baseClass} border-red-500 focus:border-red-500 focus:ring-red-500/20`;
    }
    return baseClass;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-concrete-200 dark:border-gray-700 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {lead ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Name Field */}
            <div>
              <label className="label">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...getFieldProps('name')}
                className={getFieldClassName('name')}
                placeholder="John Doe"
              />
              {touched.name && errors.name && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Company Field */}
            <div>
              <label className="label">
                Company <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...getFieldProps('company')}
                className={getFieldClassName('company')}
                placeholder="ABC Apartments"
              />
              {touched.company && errors.company && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.company}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                {...getFieldProps('email')}
                className={getFieldClassName('email')}
                placeholder="john@example.com"
              />
              {touched.email && errors.email && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                name="phone"
                value={values.phone}
                onChange={handlePhoneChange}
                onBlur={handleBlur}
                className={getFieldClassName('phone')}
                placeholder="(214) 555-0100"
              />
              {touched.phone && errors.phone && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Location Field */}
            <div>
              <label className="label">Location</label>
              <input
                type="text"
                {...getFieldProps('location')}
                className="input w-full"
                placeholder="Dallas, TX"
              />
            </div>

            {/* Project Type Field */}
            <div>
              <label className="label">Project Type</label>
              <input
                type="text"
                {...getFieldProps('projectType')}
                className="input w-full"
                placeholder="Commercial, Multi-family, etc."
              />
            </div>

            {/* Value Field */}
            <div>
              <label className="label">Estimated Value</label>
              <input
                type="number"
                {...getFieldProps('value')}
                className="input w-full"
                placeholder="50000"
                min="0"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="label">Notes</label>
            <textarea
              {...getFieldProps('notes')}
              rows={4}
              className="input w-full"
              placeholder="Additional information about the lead..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
