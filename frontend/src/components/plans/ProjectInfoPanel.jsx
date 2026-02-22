import { useState } from 'react';
import { ChevronDown, ChevronRight, Building2, AlertCircle } from 'lucide-react';

export default function ProjectInfoPanel({ expanded, onToggle, projectInfo, onChange }) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'sqft':
        if (value && Number(value) < 0) return 'Square footage must be positive';
        break;
      case 'units':
        if (value && Number(value) < 0) return 'Units must be positive';
        break;
      case 'bathrooms':
        if (value && Number(value) < 0) return 'Bathrooms must be positive';
        break;
      case 'stories':
        if (!value) return 'Stories is required';
        if (Number(value) < 1) return 'Stories must be at least 1';
        if (Number(value) > 100) return 'Stories seems too high';
        break;
      default:
        return '';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validate on change if already touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
    
    onChange({ ...projectInfo, [name]: value });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const getFieldClassName = (fieldName) => {
    const baseClass = 'input w-full mt-1';
    if (touched[fieldName] && errors[fieldName]) {
      return `${baseClass} border-red-500 focus:border-red-500 focus:ring-red-500/20`;
    }
    return baseClass;
  };

  const hasErrors = Object.values(errors).some(e => e);

  return (
    <div className={`bg-white dark:bg-surface-800 border rounded-xl overflow-hidden ${hasErrors && !expanded ? 'border-red-300 dark:border-red-700' : 'border-surface-200 dark:border-surface-700'}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-50 dark:hover:bg-surface-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Building2 className={`w-4.5 h-4.5 ${hasErrors ? 'text-red-500' : 'text-surface-500 dark:text-surface-400'}`} />
          <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 uppercase tracking-wider">
            Project Information
          </h3>
          {hasErrors && (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="w-3 h-3" />
              Has errors
            </span>
          )}
        </div>
        {expanded
          ? <ChevronDown className="w-4 h-4 text-surface-400" />
          : <ChevronRight className="w-4 h-4 text-surface-400" />
        }
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Sq Ft */}
            <div>
              <label className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Sq Ft
              </label>
              <input
                type="number"
                name="sqft"
                value={projectInfo.sqft}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getFieldClassName('sqft')}
                placeholder="2,000"
                min="0"
              />
              {touched.sqft && errors.sqft && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.sqft}
                </p>
              )}
            </div>

            {/* Units */}
            <div>
              <label className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Units
              </label>
              <input
                type="number"
                name="units"
                value={projectInfo.units}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getFieldClassName('units')}
                placeholder="4"
                min="0"
              />
              {touched.units && errors.units && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.units}
                </p>
              )}
            </div>

            {/* Bathrooms */}
            <div>
              <label className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Bathrooms
              </label>
              <input
                type="number"
                name="bathrooms"
                value={projectInfo.bathrooms}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getFieldClassName('bathrooms')}
                placeholder="8"
                min="0"
                step="0.5"
              />
              {touched.bathrooms && errors.bathrooms && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.bathrooms}
                </p>
              )}
            </div>

            {/* Stories */}
            <div>
              <label className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Stories <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="stories"
                value={projectInfo.stories}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getFieldClassName('stories')}
                placeholder="2"
                min="1"
                required
              />
              {touched.stories && errors.stories && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.stories}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
