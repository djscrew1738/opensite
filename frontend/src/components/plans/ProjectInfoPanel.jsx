import { useState, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronRight, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const FIELD_CONFIG = {
  sqft: {
    label: 'Sq Ft',
    placeholder: '2,000',
    min: 0,
    type: 'number',
    validate: (value) => value && Number(value) < 0 ? 'Must be positive' : '',
  },
  units: {
    label: 'Units',
    placeholder: '4',
    min: 0,
    type: 'number',
    validate: (value) => value && Number(value) < 0 ? 'Must be positive' : '',
  },
  bathrooms: {
    label: 'Bathrooms',
    placeholder: '8',
    min: 0,
    step: 0.5,
    type: 'number',
    validate: (value) => value && Number(value) < 0 ? 'Must be positive' : '',
  },
  stories: {
    label: 'Stories',
    placeholder: '2',
    min: 1,
    max: 100,
    required: true,
    type: 'number',
    validate: (value) => {
      if (!value) return 'Stories is required';
      const num = Number(value);
      if (num < 1) return 'Must be at least 1';
      if (num > 100) return 'Value seems too high';
      return '';
    },
  },
};

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Validation error display
 */
const ValidationError = memo(function ValidationError({ message }) {
  return (
    <p className="mt-1 text-xs text-danger-500 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">{message}</span>
    </p>
  );
});

/**
 * Individual form field with validation
 */
const FormField = memo(function FormField({
  name,
  config,
  value,
  onChange,
  onBlur,
  error,
  touched,
}) {
  const hasError = touched && error;
  const inputId = `project-field-${name}`;
  const errorId = hasError ? `${inputId}-error` : undefined;

  const baseClass = 'input w-full mt-1';
  const errorClass = hasError
    ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
    : '';

  return (
    <div>
      <label 
        htmlFor={inputId}
        className="text-xs font-medium text-surface-400 uppercase tracking-wider"
      >
        {config.label}
        {config.required && <span className="text-danger-500 ml-0.5">*</span>}
      </label>
      
      <input
        id={inputId}
        type={config.type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={config.placeholder}
        min={config.min}
        max={config.max}
        step={config.step}
        required={config.required}
        className={`${baseClass} ${errorClass}`}
        aria-invalid={hasError}
        aria-describedby={errorId}
        aria-required={config.required}
      />
      
      {hasError && (
        <ValidationError message={error} />
      )}
    </div>
  );
});

/**
 * Panel header with expand/collapse
 */
const PanelHeader = memo(function PanelHeader({ 
  expanded, 
  onToggle, 
  hasErrors,
  hasValidData 
}) {
  const Icon = hasErrors ? AlertCircle : Building2;
  const iconColor = hasErrors ? 'text-danger-500' : 'text-surface-400';

  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-750 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent-500/50"
      aria-expanded={expanded}
      aria-controls="project-info-content"
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${iconColor}`} aria-hidden="true" />
        <h3 className="text-sm font-semibold text-surface-100 uppercase tracking-wider">
          Project Information
        </h3>
        
        {hasErrors && (
          <span className="flex items-center gap-1 text-xs text-danger-500">
            <AlertCircle className="w-3 h-3" />
            Has errors
          </span>
        )}
        
        {!hasErrors && hasValidData && (
          <span className="flex items-center gap-1 text-xs text-emerald-500">
            <CheckCircle2 className="w-3 h-3" />
            Valid
          </span>
        )}
      </div>
      
      {expanded ? (
        <ChevronDown className="w-4 h-4 text-surface-400" aria-hidden="true" />
      ) : (
        <ChevronRight className="w-4 h-4 text-surface-400" aria-hidden="true" />
      )}
    </button>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * ProjectInfoPanel - Collapsible project information form
 * 
 * Fields:
 * - Square footage
 * - Units
 * - Bathrooms
 * - Stories (required)
 * 
 * Features:
 * - Real-time validation
 * - Error highlighting
 * - Collapsible panel
 * 
 * @param {Object} props
 * @param {boolean} props.expanded - Whether panel is expanded
 * @param {Function} props.onToggle - Toggle callback
 * @param {Object} props.projectInfo - Current form values
 * @param {Function} props.onChange - Form change callback
 */
function ProjectInfoPanel({ expanded, onToggle, projectInfo, onChange }) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validate single field
  const validateField = useCallback((name, value) => {
    const config = FIELD_CONFIG[name];
    return config?.validate ? config.validate(value) : '';
  }, []);

  // Handle field change
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Validate if already touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
    
    onChange({ ...projectInfo, [name]: value });
  }, [touched, projectInfo, onChange, validateField]);

  // Handle field blur (mark touched + validate)
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  // Check for any errors
  const hasErrors = Object.values(errors).some(e => e);
  const hasValidData = Object.keys(projectInfo).some(
    key => projectInfo[key] && !errors[key]
  );

  // Border color based on errors
  const borderClass = hasErrors && !expanded
    ? 'border-danger-500/50'
    : 'border-surface-700';

  return (
    <div className={`bg-surface-800 border ${borderClass} rounded-xl overflow-hidden`}>
      <PanelHeader
        expanded={expanded}
        onToggle={onToggle}
        hasErrors={hasErrors}
        hasValidData={hasValidData}
      />

      {expanded && (
        <div id="project-info-content" className="px-5 pb-5 pt-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(FIELD_CONFIG).map(([name, config]) => (
              <FormField
                key={name}
                name={name}
                config={config}
                value={projectInfo[name] || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors[name]}
                touched={touched[name]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PropTypes
// ═══════════════════════════════════════════════════════════════

ProjectInfoPanel.propTypes = {
  expanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  projectInfo: PropTypes.shape({
    sqft: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    units: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    bathrooms: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    stories: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

ValidationError.propTypes = {
  message: PropTypes.string.isRequired,
};

FormField.propTypes = {
  name: PropTypes.string.isRequired,
  config: PropTypes.shape({
    label: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    required: PropTypes.bool,
    type: PropTypes.string.isRequired,
    validate: PropTypes.func,
  }).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  error: PropTypes.string,
  touched: PropTypes.bool,
};

PanelHeader.propTypes = {
  expanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  hasErrors: PropTypes.bool.isRequired,
  hasValidData: PropTypes.bool.isRequired,
};

export default memo(ProjectInfoPanel);
