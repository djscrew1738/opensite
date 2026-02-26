# Blueprint Model Selector Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an AI model selection dropdown to the Blueprints panel in Jobs → Estimating, appearing above the Analyze button in the review step.

**Architecture:** `EstimatingTab` owns `selectedModel` state (null = backend default) and passes it plus an `onModelChange` callback to `BlueprintUpload`. `BlueprintUpload` renders the existing `ModelSelector` component in the `review` status block, directly above `ExtractedDataEditor`. The selected model is already wired through to the upload API call (`api.upload.blueprintWithData(file, data, selectedModel)` at line 207).

**Tech Stack:** React 19, existing `ModelSelector` component (`src/components/ai/ModelSelector.jsx`), Dark Forge design tokens.

---

### Task 1: Add `selectedModel` state to EstimatingTab and wire it to BlueprintUpload

**Files:**
- Modify: `frontend/src/components/jobs/EstimatingTab.jsx:45,58`

**Step 1: Add `selectedModel` state**

In `EstimatingTab.jsx`, change line 45 from:
```javascript
const [activePanel, setActivePanel] = useState(null);
```
to:
```javascript
const [activePanel, setActivePanel] = useState(null);
const [selectedModel, setSelectedModel] = useState(null);
```

**Step 2: Pass selectedModel and onModelChange to BlueprintUpload**

Change line 58 from:
```javascript
blueprint: <BlueprintUpload />,
```
to:
```javascript
blueprint: <BlueprintUpload selectedModel={selectedModel} onModelChange={setSelectedModel} />,
```

**Step 3: Verify no runtime errors**

Open the Estimating tab in the browser — Blueprints panel should open and show no console errors.

**Step 4: Commit**
```bash
git add frontend/src/components/jobs/EstimatingTab.jsx
git commit -m "feat: add selectedModel state to EstimatingTab, wire to BlueprintUpload"
```

---

### Task 2: Render ModelSelector in the review step of BlueprintUpload

**Files:**
- Modify: `frontend/src/components/upload/BlueprintUpload.jsx:1,21,372`

**Step 1: Import ModelSelector**

Add to the imports block at the top of `BlueprintUpload.jsx` (after line 16):
```javascript
import { ModelSelector } from '../ai/ModelSelector';
```

**Step 2: Accept onModelChange prop**

Change the function signature at line 21 from:
```javascript
export default function BlueprintUpload({
  onAnalysisComplete,
  selectedModel,
  className = ''
}) {
```
to:
```javascript
export default function BlueprintUpload({
  onAnalysisComplete,
  selectedModel,
  onModelChange,
  className = ''
}) {
```

**Step 3: Add ModelSelector above ExtractedDataEditor in the review block**

In the `review` status block (starting at line 372), add the model selector section between the scanned PDF warning and the `ExtractedDataEditor`. Change:

```javascript
          <ExtractedDataEditor
```
to:
```javascript
          {/* Analysis Model */}
          <div
            className="rounded-xl p-4"
            style={{ background: '#181C24', border: '1px solid #1F2430' }}
          >
            <p className="text-xs font-medium mb-3" style={{ color: '#94A3B8' }}>
              ANALYSIS MODEL
            </p>
            <ModelSelector
              value={selectedModel}
              onChange={onModelChange}
              size="sm"
              showProvider={true}
              showPerformance={true}
            />
          </div>

          <ExtractedDataEditor
```

**Step 4: Verify in browser**

1. Open Jobs → Estimating → Blueprints panel
2. Upload a PDF and click "Extract & Review Data"
3. Confirm the model selector appears above the data editor with the active model pre-selected
4. Change the model in the dropdown
5. Click Analyze — confirm the correct model name is sent in the request (check Network tab: `POST /api/upload/blueprint/enhanced` should include `model: <selected>`)

**Step 5: Commit**
```bash
git add frontend/src/components/upload/BlueprintUpload.jsx
git commit -m "feat: render ModelSelector above Analyze button in blueprint review step"
```

---

### Done

The feature is complete when:
- [ ] Model selector renders in the review step above the data editor
- [ ] Default selection shows the active backend model
- [ ] Changing model updates state in EstimatingTab
- [ ] Selected model is sent with the analysis API call
- [ ] No console errors
