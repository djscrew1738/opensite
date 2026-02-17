# Blueprint PDF Upload & Analysis

OpenSite now supports uploading blueprint PDFs for automatic analysis and project estimation!

## 🎯 Features

### Automatic Data Extraction
- **Square Footage** - Detects project size from blueprints
- **Unit Count** - Identifies number of units/dwellings
- **Bathroom Count** - Extracts fixture counts
- **Story Count** - Determines building height
- **Room Information** - Captures bedroom and bathroom details

### AI-Powered Analysis
Uses your specialized Ollama models to provide:
- **Material Recommendations** - Pipe types, fixtures, water heaters
- **Labor Estimates** - Hours per phase (rough-in, top-out, trim)
- **Timeline Projections** - Project duration and critical path
- **Pricing Recommendations** - Suggested tier (Production/Custom/Premium)
- **Code Compliance** - DFW/Texas specific requirements
- **Cost Factors** - Adjustments and considerations

### Automatic Form Population
- Extracted data auto-fills the pricing calculator
- Instant estimate generation
- No manual data entry required

---

## 🚀 How to Use

### 1. Navigate to Pricing Calculator
Go to **Pricing** page in the OpenSite dashboard

### 2. Select AI Model (Optional)
Choose your preferred model from the dropdown:
- **qwen2.5-coder:7b** - Best for technical blueprint analysis (Recommended)
- **llama3.1** - General purpose analysis
- **deepseek-r1:1.5b** - Fast analysis

### 3. Upload Blueprint
**Drag & Drop** or **Click to Upload**:
- PDF files (recommended)
- JPG/PNG images (future vision support)
- Max 50MB file size

### 4. Click "Analyze with AI"
The system will:
1. Extract text from the PDF
2. Identify project specifications
3. Generate comprehensive AI analysis
4. Calculate pricing estimate
5. Auto-fill the form with extracted data

### 5. Review Results
See:
- **Extracted Information** - Detected project specs
- **AI Analysis** - Detailed recommendations
- **Estimated Pricing** - Calculated costs

---

## 📋 Supported File Types

### PDF Files (.pdf)
- **Best Results**: Text-based PDFs
- **Automatic Extraction**: Yes
- **Max Size**: 50MB
- **Recommended**: Architectural blueprints with specifications

### Image Files (.jpg, .jpeg, .png)
- **Current Status**: Accepted but limited analysis
- **Future Support**: Vision model integration planned
- **Use Case**: Scanned blueprints, photos

---

## 🎨 Recommended Workflows

### Workflow 1: Complete Blueprint Analysis
1. Upload blueprint PDF
2. System extracts all data
3. AI provides comprehensive analysis
4. Review pricing estimate
5. Adjust manually if needed
6. Generate proposal

### Workflow 2: Quick Estimation
1. Upload blueprint
2. Use extracted sqft/units
3. Calculate estimate
4. Skip detailed AI analysis for speed

### Workflow 3: Technical Deep Dive
1. Upload blueprint
2. Select qwen2.5-coder:7b model
3. Get detailed technical analysis
4. Review material specifications
5. Use for bid preparation

---

## 🔧 Technical Details

### Data Extraction Patterns

The system automatically searches for:

**Square Footage**:
- "2,500 sq ft"
- "2500 square feet"
- "2500 SF"

**Unit Count**:
- "4 units"
- "4 dwelling units"

**Bathrooms**:
- "8 bathrooms"
- "8 BR"
- "8 bath"

**Stories**:
- "3 story"
- "3 stories"
- "3 floors"

### AI Analysis Sections

1. **Project Overview**
   - Detected specifications
   - Building type assessment
   - Scope summary

2. **Plumbing Requirements**
   - Pipe materials and sizes
   - Fixture specifications
   - Water heater requirements
   - Drainage system design

3. **Labor Estimate**
   - Hours per phase
   - Crew size recommendations
   - Skill requirements

4. **Timeline Projection**
   - Project duration
   - Phase scheduling
   - Critical dependencies

5. **Pricing Recommendation**
   - Suggested tier
   - Cost factors
   - Adjustment recommendations

6. **Code Compliance**
   - DFW requirements
   - Texas plumbing code
   - Inspection points

---

## ⚙️ API Integration

### Upload Endpoint
```javascript
POST /api/upload/blueprint
Content-Type: multipart/form-data

Parameters:
- file: File (required)
- tier: string (optional) - 'production', 'custom', 'premium'
- model: string (optional) - Ollama model name

Response:
{
  fileName: "blueprint.pdf",
  extractedData: {
    sqft: 2500,
    units: 4,
    bathrooms: 8,
    stories: 2
  },
  aiAnalysis: "...",
  modelUsed: "qwen2.5-coder:7b",
  estimate: { ... },
  textExtracted: true
}
```

### Extract Only Endpoint
```javascript
POST /api/upload/extract
Content-Type: multipart/form-data

Parameters:
- file: File (required)

Response:
{
  fileName: "blueprint.pdf",
  extractedData: { ... },
  pages: 5,
  success: true
}
```

---

## 💡 Best Practices

### For Best Extraction Results:
1. **Use text-based PDFs** (not scanned images)
2. **Include specification sheets** with clear labels
3. **Ensure legible text** in blueprint documents
4. **Provide complete blueprints** with all pages

### For Best AI Analysis:
1. **Select qwen2.5-coder:7b** for technical accuracy
2. **Include plumbing-specific pages** in the PDF
3. **Provide fixture schedules** if available
4. **Upload complete specifications**

### For Speed:
1. Use **Extract Only** endpoint first
2. Review extracted data
3. Run full analysis only if needed
4. Use **deepseek-r1:1.5b** for faster responses

---

## 🚧 Limitations

### Current Limitations:
- **Text-based PDFs only** - Scanned/image PDFs may not extract well
- **English language** - Non-English blueprints not supported
- **Standard formats** - Non-standard blueprint layouts may miss data
- **File size limit** - 50MB maximum

### Future Enhancements:
- [ ] Vision model support for scanned blueprints
- [ ] OCR for image-based PDFs
- [ ] Multi-page analysis with page selection
- [ ] Blueprint markup and annotation
- [ ] Direct CAD file support (.dwg, .dxf)
- [ ] 3D model integration

---

## 🔍 Troubleshooting

### No Data Extracted
**Problem**: Upload succeeds but no specifications detected

**Solutions**:
1. Check if PDF is text-based (try copying text from PDF)
2. Ensure specifications are clearly labeled
3. Try uploading specification sheets separately
4. Manually enter data if extraction fails

### AI Analysis Timeout
**Problem**: Analysis takes too long or times out

**Solutions**:
1. Switch to faster model (deepseek-r1:1.5b)
2. Reduce PDF file size (remove unnecessary pages)
3. Try Extract Only first, then analyze manually
4. Check Ollama server status

### File Upload Fails
**Problem**: Upload rejected or fails

**Solutions**:
1. Check file size (must be < 50MB)
2. Verify file type (.pdf, .jpg, .jpeg, .png)
3. Check backend server is running
4. Review backend logs for errors

### Inaccurate Estimates
**Problem**: Extracted data or estimates seem wrong

**Solutions**:
1. Review extracted data section
2. Manually adjust form fields
3. Verify blueprint specifications
4. Use different AI model for analysis
5. Double-check calculations

---

## 📊 Performance

### Upload Times:
- **Small PDFs** (< 5MB): 2-5 seconds
- **Medium PDFs** (5-20MB): 5-15 seconds
- **Large PDFs** (20-50MB): 15-30 seconds

### Analysis Times:
- **qwen2.5-coder:7b**: 30-60 seconds (best quality)
- **llama3.1**: 30-45 seconds (balanced)
- **deepseek-r1:1.5b**: 10-20 seconds (fastest)

*First analysis always slower due to model loading*

---

## 🎯 Example Use Cases

### Multi-Family Project
1. Upload 4-unit apartment blueprint
2. System detects: 2,500 sqft, 4 units, 8 bathrooms, 2 stories
3. AI recommends: Custom tier, $28,800 total
4. Review material specs for bid preparation

### Commercial Building
1. Upload office building blueprint
2. Extract: 10,000 sqft, 12 bathrooms, 3 stories
3. AI analyzes complex plumbing systems
4. Get detailed code compliance notes

### Quick Residential Estimate
1. Upload single-family home plans
2. Extract basic specs
3. Calculate estimate
4. Send proposal to client

---

## 🔗 Related Features

- **Pricing Calculator** - Manual project estimation
- **AI Assistant** - Chat about blueprint specifications
- **Lead Finder** - Track projects from blueprints
- **Multi-Model Support** - Choose best model for analysis

---

## 📝 Tips

1. **Keep originals** - System deletes files after processing
2. **Review extractions** - Always verify auto-extracted data
3. **Use qwen2.5-coder:7b** - Best for construction/technical analysis
4. **Save analysis** - Copy AI analysis for bid documents
5. **Iterate** - Try different models for comparison

---

**Ready to analyze blueprints! Upload your first PDF in the Pricing Calculator.** 🎉
