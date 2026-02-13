import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import BlueprintCanvas from '../components/takeoff/BlueprintCanvas';
import MeasurementsSidebar from '../components/takeoff/MeasurementsSidebar';
import TakeoffList from '../components/takeoff/TakeoffList';
import TakeoffReport from '../components/takeoff/TakeoffReport';
import MaterialManager from '../components/takeoff/MaterialManager';
import MaterialPicker from '../components/takeoff/MaterialPicker';
import {
  Upload, Ruler, Package, FileText, Save, Loader,
  ChevronLeft, Image, X, AlertCircle
} from 'lucide-react';

const TABS = {
  TAKEOFFS: 'takeoffs',
  EDITOR: 'editor',
  MATERIALS: 'materials',
  REPORT: 'report'
};

export default function Takeoff() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // State
  const [activeTab, setActiveTab] = useState(TABS.TAKEOFFS);
  const [selectedTakeoff, setSelectedTakeoff] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [scale, setScale] = useState(null);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState(null);
  const [blueprintImageUrl, setBlueprintImageUrl] = useState(null);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [assigningMeasurementId, setAssigningMeasurementId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'saved', 'error'
  const [error, setError] = useState(null);

  // Load takeoff details when selected
  const { data: takeoffDetail } = useQuery({
    queryKey: ['takeoff', selectedTakeoff?.id],
    queryFn: () => api.takeoff.getOne(selectedTakeoff.id),
    enabled: !!selectedTakeoff?.id
  });

  // Sync takeoff detail data into local state when it loads
  useEffect(() => {
    if (takeoffDetail) {
      setMeasurements(takeoffDetail.measurements || []);
      setScale(takeoffDetail.scale && takeoffDetail.scale.pixelsPerUnit ? takeoffDetail.scale : null);
      if (takeoffDetail.canvasData?.imageUrl) {
        setBlueprintImageUrl(takeoffDetail.canvasData.imageUrl);
      }
    }
  }, [takeoffDetail]);

  // Save takeoff mutation
  const saveMutation = useMutation({
    mutationFn: ({ id, data }) => api.takeoff.update(id, data),
    onSuccess: () => {
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['takeoffs'] });
      setTimeout(() => setSaveStatus(null), 2000);
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  });

  // Add takeoff item mutation
  const addItemMutation = useMutation({
    mutationFn: ({ takeoffId, data }) => api.takeoff.addItem(takeoffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['takeoff-summary', selectedTakeoff?.id] });
    }
  });

  // Save current state
  const handleSave = useCallback(() => {
    if (!selectedTakeoff?.id) return;
    setSaveStatus('saving');
    saveMutation.mutate({
      id: selectedTakeoff.id,
      data: {
        measurements,
        scale: scale || {},
        canvasData: { imageUrl: blueprintImageUrl }
      }
    });
  }, [selectedTakeoff, measurements, scale, blueprintImageUrl, saveMutation]);

  // Handle takeoff selection
  const handleSelectTakeoff = (takeoff) => {
    setSelectedTakeoff(takeoff);
    setMeasurements(takeoff.measurements || []);
    setScale(takeoff.scale && Object.keys(takeoff.scale).length > 0 ? takeoff.scale : null);
    setBlueprintImageUrl(takeoff.canvasData?.imageUrl || null);
    setActiveTab(TABS.EDITOR);
    setError(null);
  };

  // Handle measurements change
  const handleMeasurementsChange = (newMeasurements) => {
    setMeasurements(newMeasurements);
  };

  // Handle blueprint upload
  const handleBlueprintUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - accept images for canvas viewing
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
    if (!allowed.includes(file.type)) {
      setError('Please upload an image file (JPEG, PNG, WebP, or BMP). PDF blueprints should be converted to images first.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Create object URL for local canvas display
      const url = URL.createObjectURL(file);
      setBlueprintImageUrl(url);
      setMeasurements([]);
      setScale(null);
    } catch (err) {
      setError('Failed to load blueprint image: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle material assignment to measurement
  const handleAssignMaterial = (measurementId, material) => {
    if (material === null) {
      // Remove assignment
      setMeasurements(prev => prev.map(m =>
        m.id === measurementId ? { ...m, materialId: null, materialName: null } : m
      ));
      return;
    }

    setAssigningMeasurementId(measurementId);
    setShowMaterialPicker(true);
  };

  const handleMaterialSelected = (material) => {
    if (!assigningMeasurementId) return;

    // Update the measurement with material info
    setMeasurements(prev => prev.map(m =>
      m.id === assigningMeasurementId
        ? { ...m, materialId: material.id, materialName: material.name, materialUnitCost: material.unitCost, materialUnit: material.unit }
        : m
    ));

    // Also add as takeoff item if we have a takeoff selected
    if (selectedTakeoff?.id) {
      const measurement = measurements.find(m => m.id === assigningMeasurementId);
      if (measurement) {
        let quantity = 1;
        if (measurement.type === 'count') quantity = measurement.count || 1;
        if (measurement.type === 'length' && measurement.points?.length === 2 && scale?.pixelsPerUnit) {
          const dist = Math.sqrt(
            (measurement.points[1].x - measurement.points[0].x) ** 2 +
            (measurement.points[1].y - measurement.points[0].y) ** 2
          );
          quantity = dist / scale.pixelsPerUnit;
        }
        if (measurement.type === 'area' && measurement.points?.length >= 3 && scale?.pixelsPerUnit) {
          let area = 0;
          const pts = measurement.points;
          for (let i = 0; i < pts.length; i++) {
            const j = (i + 1) % pts.length;
            area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
          }
          quantity = Math.abs(area / 2) / (scale.pixelsPerUnit * scale.pixelsPerUnit);
        }
        if (measurement.type === 'rectangle' && measurement.points?.length === 2 && scale?.pixelsPerUnit) {
          const w = Math.abs(measurement.points[1].x - measurement.points[0].x);
          const h = Math.abs(measurement.points[1].y - measurement.points[0].y);
          quantity = (w * h) / (scale.pixelsPerUnit * scale.pixelsPerUnit);
        }
        if (measurement.type === 'circle' && measurement.points?.length === 2 && scale?.pixelsPerUnit) {
          const dx = measurement.points[1].x - measurement.points[0].x;
          const dy = measurement.points[1].y - measurement.points[0].y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          quantity = (Math.PI * radius * radius) / (scale.pixelsPerUnit * scale.pixelsPerUnit);
        }

        addItemMutation.mutate({
          takeoffId: selectedTakeoff.id,
          data: {
            materialId: material.id,
            measurementType: measurement.type,
            label: measurement.label || `${measurement.type} measurement`,
            quantity: Math.round(quantity * 100) / 100,
            unit: material.unit,
            unitCost: material.unitCost,
            measurementData: { points: measurement.points },
            notes: ''
          }
        });
      }
    }

    setAssigningMeasurementId(null);
  };

  const tabConfig = [
    { id: TABS.TAKEOFFS, label: 'Takeoffs', icon: FileText },
    { id: TABS.EDITOR, label: 'Editor', icon: Ruler, disabled: !selectedTakeoff },
    { id: TABS.MATERIALS, label: 'Materials', icon: Package },
    { id: TABS.REPORT, label: 'Report', icon: FileText, disabled: !selectedTakeoff }
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Page Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Material Takeoff</h1>
          {selectedTakeoff && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSelectedTakeoff(null); setActiveTab(TABS.TAKEOFFS); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-primary-600">
                {selectedTakeoff.name}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeTab === TABS.EDITOR && selectedTakeoff && (
            <>
              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                {saveStatus === 'saving' ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 bg-white border-b border-gray-200 flex-shrink-0">
        <nav className="flex -mb-px">
          {tabConfig.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? 'border-primary-500 text-primary-600'
                    : tab.disabled
                      ? 'border-transparent text-gray-300 cursor-not-allowed'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* Takeoffs List Tab */}
        {activeTab === TABS.TAKEOFFS && (
          <div className="p-6 overflow-y-auto h-full">
            <div className="max-w-2xl mx-auto">
              <TakeoffList
                onSelectTakeoff={handleSelectTakeoff}
                selectedId={selectedTakeoff?.id}
              />
            </div>
          </div>
        )}

        {/* Editor Tab */}
        {activeTab === TABS.EDITOR && selectedTakeoff && (
          <div className="flex h-full">
            {/* Canvas area */}
            <div className="flex-1 flex flex-col">
              {/* Blueprint upload bar */}
              {!blueprintImageUrl && (
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
                  >
                    {uploading ? (
                      <Loader className="w-8 h-8 mx-auto mb-2 text-primary-600 animate-spin" />
                    ) : (
                      <Image className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    )}
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-primary-600">Click to upload</span> a blueprint image
                    </p>
                    <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, BMP</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/bmp"
                    onChange={handleBlueprintUpload}
                    className="hidden"
                  />
                </div>
              )}

              {/* Canvas */}
              <div className="flex-1 relative">
                {blueprintImageUrl && (
                  <div className="absolute top-2 right-2 z-10">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 bg-white/90 border border-gray-200 rounded text-xs text-gray-600 hover:bg-white transition-colors"
                    >
                      Change Image
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/bmp"
                      onChange={handleBlueprintUpload}
                      className="hidden"
                    />
                  </div>
                )}
                <BlueprintCanvas
                  imageUrl={blueprintImageUrl}
                  measurements={measurements}
                  onMeasurementsChange={handleMeasurementsChange}
                  scale={scale}
                  onScaleChange={setScale}
                />
              </div>
            </div>

            {/* Measurements Sidebar */}
            <div className="w-72 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700">Measurements</h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                <MeasurementsSidebar
                  measurements={measurements}
                  onMeasurementsChange={handleMeasurementsChange}
                  selectedId={selectedMeasurementId}
                  onSelect={setSelectedMeasurementId}
                  scale={scale}
                  onAssignMaterial={handleAssignMaterial}
                />
              </div>

              {/* Quick stats */}
              {measurements.length > 0 && (
                <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 space-y-0.5">
                  {[
                    { type: 'length', label: 'Lengths', color: '#2563eb' },
                    { type: 'area', label: 'Polygons', color: '#16a34a' },
                    { type: 'rectangle', label: 'Rectangles', color: '#7c3aed' },
                    { type: 'circle', label: 'Circles', color: '#0891b2' },
                    { type: 'count', label: 'Counts', color: '#dc2626' },
                    { type: 'annotation', label: 'Notes', color: '#64748b' },
                  ].map(({ type, label, color }) => {
                    const items = measurements.filter(m => m.type === type);
                    if (items.length === 0) return null;
                    const count = type === 'count'
                      ? items.reduce((s, m) => s + (m.count || 1), 0)
                      : items.length;
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                          {label}
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === TABS.MATERIALS && (
          <div className="p-6 overflow-y-auto h-full">
            <div className="max-w-4xl mx-auto">
              <MaterialManager />
            </div>
          </div>
        )}

        {/* Report Tab */}
        {activeTab === TABS.REPORT && selectedTakeoff && (
          <div className="p-6 overflow-y-auto h-full">
            <div className="max-w-4xl mx-auto">
              <TakeoffReport
                takeoffId={selectedTakeoff.id}
                takeoffName={selectedTakeoff.name}
              />
            </div>
          </div>
        )}
      </div>

      {/* Material Picker Modal */}
      {showMaterialPicker && (
        <MaterialPicker
          onSelect={handleMaterialSelected}
          onClose={() => { setShowMaterialPicker(false); setAssigningMeasurementId(null); }}
        />
      )}
    </div>
  );
}
