import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useFormPersistence } from '../../hooks/useFormPersistence';

export default function LeadModal({ lead, onClose, onSave }) {
  const [formData, setFormData] = useState(() => ({
    name: lead?.name || '',
    company: lead?.company || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    location: lead?.location || '',
    projectType: lead?.projectType || '',
    value: lead?.value || '',
    notes: lead?.notes || ''
  }));

  // Auto-save form data to localStorage (only for new leads, not edits)
  const { clearSaved } = useFormPersistence('lead-form', formData, setFormData, {
    enabled: !lead, // Only enable auto-save for new leads, not when editing
    shouldSave: (data) => {
      // Only save if name or company has a value
      return data.name?.trim() || data.company?.trim();
    },
    onRestore: () => {
      console.log('Lead form data restored from auto-save');
    }
  });

  useEffect(() => {
    if (lead) {
      // Clear any auto-saved data when editing an existing lead
      clearSaved();
    }
  }, [lead, clearSaved]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      value: Number(formData.value) || 0
    });
    clearSaved(); // Clear auto-saved form data after successful save
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {lead ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input w-full"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="label">Company *</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
                className="input w-full"
                placeholder="ABC Apartments"
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input w-full"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input w-full"
                placeholder="(214) 555-0100"
              />
            </div>

            <div>
              <label className="label">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input w-full"
                placeholder="Dallas, TX"
              />
            </div>

            <div>
              <label className="label">Project Type</label>
              <input
                type="text"
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
                className="input w-full"
                placeholder="Commercial, Multi-family, etc."
              />
            </div>

            <div>
              <label className="label">Estimated Value</label>
              <input
                type="number"
                name="value"
                value={formData.value}
                onChange={handleChange}
                className="input w-full"
                placeholder="50000"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="label">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
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
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {lead ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
