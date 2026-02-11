# Multi-Model Support in 1stein

1stein now supports multiple Ollama models, allowing you to choose the best AI model for different tasks!

## 🤖 Supported Models

### Currently Available Models

1. **llama3.1** (Default)
   - General purpose conversational AI
   - Best for: Lead scoring, general chat, business analysis
   - Size: ~4.7GB

2. **qwen2.5-coder:7b**
   - Specialized coding and technical analysis
   - Best for: Blueprint analysis, material recommendations, technical questions
   - Size: ~4.7GB
   - Excellent for construction/technical documentation

3. **deepseek-r1:1.5b**
   - Fast reasoning model
   - Best for: Quick responses, logical analysis, decision support
   - Size: ~1.1GB
   - Fastest response times

4. **sam860/phi4-mini:3.8b-Q4_K_S**
   - Lightweight, fast model
   - Best for: Quick Q&A, simple tasks, rapid iteration
   - Size: ~2.3GB
   - Optimized for speed

## 📋 Model Recommendations

The system automatically recommends models for specific tasks:

### Chat & Conversation
- **Primary**: llama3.1
- **Alternatives**: qwen2.5-coder:7b, deepseek-r1:1.5b

### Coding & Technical
- **Primary**: qwen2.5-coder:7b
- **Alternatives**: deepseek-r1:1.5b

### Lead Scoring
- **Primary**: llama3.1
- **Alternatives**: qwen2.5-coder:7b

### Blueprint Analysis
- **Primary**: qwen2.5-coder:7b
- **Alternatives**: llama3.1, deepseek-r1:1.5b

### Fast Responses
- **Primary**: sam860/phi4-mini:3.8b-Q4_K_S
- **Alternatives**: deepseek-r1:1.5b

## 🚀 Using Multiple Models

### In the AI Assistant

1. Navigate to **AI Assistant** page
2. Look for the **Model** dropdown in the header
3. Select your preferred model from the list
4. Start chatting - responses will use the selected model
5. Switch models anytime during conversation

### Viewing Available Models

1. Go to **Settings** page
2. Scroll to **Available Models** section
3. See all installed models with:
   - Model name
   - Size (in GB)
   - Last modified date
   - Model recommendations for different tasks

### API Usage

When making API calls, you can specify a model:

```javascript
// Chat with specific model
api.ai.chat('Your message', conversationId, 'qwen2.5-coder:7b');

// Analyze with specific model
api.estimates.analyze(estimateData, 'qwen2.5-coder:7b');
```

## 📥 Installing Additional Models

### Install New Models

```bash
# Install qwen2.5-coder:7b (coding specialist)
ollama pull qwen2.5-coder:7b

# Install deepseek-r1:1.5b (fast reasoning)
ollama pull deepseek-r1:1.5b

# Install phi4-mini (lightweight)
ollama pull sam860/phi4-mini:3.8b-Q4_K_S

# Install llama3.1 (default)
ollama pull llama3.1
```

### List Installed Models

```bash
ollama list
```

### Remove Models

```bash
ollama rm model-name
```

## 🎯 Choosing the Right Model

### For Lead Scoring
**Recommended**: llama3.1 or qwen2.5-coder:7b
- Need accurate business analysis
- Understanding of commercial context
- Balanced speed and accuracy

### For Blueprint Analysis
**Recommended**: qwen2.5-coder:7b
- Technical understanding required
- Material specifications
- Code compliance details
- Construction knowledge

### For Chat Assistance
**Recommended**: llama3.1 (general), qwen2.5-coder:7b (technical)
- General business questions → llama3.1
- Technical/construction questions → qwen2.5-coder:7b
- Quick simple questions → deepseek-r1:1.5b

### For Speed
**Recommended**: sam860/phi4-mini:3.8b-Q4_K_S or deepseek-r1:1.5b
- Fastest response times
- Good for rapid prototyping
- Simple Q&A scenarios

## ⚙️ Configuration

### Set Default Model

Edit `backend/.env`:

```bash
# Set default model
OLLAMA_MODEL=qwen2.5-coder:7b
```

### Model-Specific Settings

The backend automatically handles:
- Temperature optimization per task
- Timeout adjustments
- Context window management
- Fallback to rule-based logic if model unavailable

## 📊 Performance Comparison

| Model | Size | Speed | Accuracy | Best For |
|-------|------|-------|----------|----------|
| llama3.1 | 4.7GB | Medium | High | General purpose, lead scoring |
| qwen2.5-coder:7b | 4.7GB | Medium | Very High | Technical analysis, blueprints |
| deepseek-r1:1.5b | 1.1GB | Fast | Good | Quick reasoning, fast responses |
| phi4-mini | 2.3GB | Very Fast | Good | Simple Q&A, rapid iteration |

## 🔧 Troubleshooting

### Model Not Appearing in List

1. Check if Ollama is running: `ollama list`
2. Restart backend server
3. Refresh Settings page
4. Verify model is installed: `ollama pull model-name`

### Slow Responses

- First response is always slower (model loading)
- Switch to faster model (deepseek-r1:1.5b or phi4-mini)
- Check system resources (RAM, CPU)
- Consider using smaller models

### Model Not Available

The system will automatically fallback to:
1. Default model (llama3.1)
2. Rule-based logic (for scoring)
3. Error message if no models available

## 🎨 Model Characteristics

### llama3.1 (Meta)
- **Strengths**: Balanced, conversational, business understanding
- **Use When**: General chat, lead analysis, business questions
- **Avoid When**: Need extreme speed, coding-specific tasks

### qwen2.5-coder:7b (Alibaba)
- **Strengths**: Technical knowledge, code understanding, documentation
- **Use When**: Blueprint analysis, material specs, technical docs
- **Avoid When**: Simple conversational tasks

### deepseek-r1:1.5b (DeepSeek)
- **Strengths**: Fast, efficient reasoning, logical analysis
- **Use When**: Quick decisions, logical problems, rapid responses
- **Avoid When**: Need deep technical detail, long-form content

### phi4-mini (Microsoft via sam860)
- **Strengths**: Very fast, efficient, compact
- **Use When**: Simple Q&A, testing, rapid iteration
- **Avoid When**: Complex analysis, detailed technical questions

## 📈 Future Models

Consider trying these models:

```bash
# More specialized options
ollama pull codellama:7b        # Code generation
ollama pull mistral:7b          # Balanced performance
ollama pull neural-chat:7b      # Conversational AI
ollama pull orca-mini:3b        # Very lightweight
```

## 🔗 Resources

- [Ollama Model Library](https://ollama.com/library)
- [Model Comparison](https://ollama.com/models)
- [Ollama Documentation](https://github.com/ollama/ollama)

---

**Tip**: Start with llama3.1 for general use, then experiment with specialized models for specific tasks!
