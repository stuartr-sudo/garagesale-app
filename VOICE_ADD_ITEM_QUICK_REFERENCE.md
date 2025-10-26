# Voice-Enhanced Add Item - Quick Reference Card

## 🎯 3-Step Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: UPLOAD IMAGES                                       │
│  • Upload photos (camera/gallery)                           │
│  • Compress: 1200x1200, 80% quality                        │
│  • Set main image                                           │
│  ✅ Validation: ≥1 image                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: VOICE + AI DETAILS (NEW!)                          │
│  1. 🎤 Record voice description (optional)                  │
│  2. ✨ Click "Generate with AI"                             │
│  3. ✏️ Review & edit all fields:                            │
│     • Title (50 chars)                                      │
│     • Description (500 chars)                               │
│     • Price ($)                                             │
│     • Minimum Price ($)                                     │
│     • Category (dropdown)                                   │
│     • Condition (dropdown)                                  │
│     • Tags (multi-input)                                    │
│  4. 🎤 Add more details (optional)                          │
│  ✅ Validation: title, description, price                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: COLLECTION & SUBMIT                                │
│  • Collection date (picker)                                 │
│  • Collection address (text)                                │
│  • Postcode (text)                                          │
│  • Flexible collection (checkbox)                           │
│  • ✅ Confirm ownership (checkbox)                          │
│  • Review summary                                           │
│  • Submit                                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Integration

### Endpoint
```
POST /api/analyze-image-with-voice
```

### Request
```json
{
  "imageUrl": "https://your-image-url.jpg",
  "voiceTranscript": "Optional voice description" // Can be null
}
```

### Response
```json
{
  "success": true,
  "title": "AI-generated title",
  "description": "AI-generated description",
  "price": 50,
  "minimum_price": 35,
  "category": "electronics",
  "condition": "good",
  "tags": ["tag1", "tag2", "tag3"],
  "selling_points": ["point1", "point2"],
  "sources_used": {
    "image": true,
    "voice": false
  }
}
```

---

## 📱 Mobile Code Snippets

### Voice Recording
```javascript
import * as Audio from 'expo-av';

const recordVoice = async () => {
  // Start recording
  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );
  
  // Stop & get URI
  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  
  // Transcribe (use existing Whisper API integration)
  const transcript = await transcribeAudio(uri);
  setVoiceTranscript(transcript);
};
```

### AI Analysis Call
```javascript
const generateWithAI = async () => {
  setIsLoading(true);
  
  try {
    const response = await fetch(`${API_URL}/api/analyze-image-with-voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: images[0],
        voiceTranscript: voiceTranscript || null
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      setTitle(data.title);
      setDescription(data.description);
      setPrice(data.price.toString());
      setMinPrice(data.minimum_price?.toString() || '');
      setCategory(data.category);
      setCondition(data.condition);
      setTags(data.tags);
    }
  } catch (error) {
    Alert.alert('Error', 'AI analysis failed');
  } finally {
    setIsLoading(false);
  }
};
```

### Step Navigation
```javascript
const [currentStep, setCurrentStep] = useState(1);

const goToStep = (step) => {
  // Validate before going forward
  if (step > currentStep) {
    if (currentStep === 1 && images.length === 0) {
      Alert.alert('Error', 'Upload at least 1 image');
      return;
    }
    if (currentStep === 2 && (!title || !description || !price)) {
      Alert.alert('Error', 'Fill required fields');
      return;
    }
  }
  setCurrentStep(step);
};
```

---

## 🎨 UI Components

### Step Indicator
```jsx
<View style={styles.steps}>
  {[1, 2, 3].map(num => (
    <TouchableOpacity
      key={num}
      onPress={() => goToStep(num)}
      style={[
        styles.step,
        currentStep === num && styles.stepActive,
        currentStep > num && styles.stepComplete
      ]}
    >
      <Text>{num}</Text>
      {currentStep > num && <Icon name="check" />}
    </TouchableOpacity>
  ))}
</View>
```

### Voice Button
```jsx
<TouchableOpacity
  style={styles.voiceButton}
  onPress={recordVoice}
>
  <Icon name="microphone" size={24} />
  <Text>Record Voice Description</Text>
</TouchableOpacity>

{voiceTranscript && (
  <View style={styles.transcriptPreview}>
    <Text>Voice captured ✓</Text>
    <Text numberOfLines={3}>{voiceTranscript}</Text>
  </View>
)}
```

### AI Generate Button
```jsx
<TouchableOpacity
  style={styles.aiButton}
  onPress={generateWithAI}
  disabled={isLoading || images.length === 0}
>
  <Icon name="sparkles" />
  <Text>
    {isLoading
      ? 'Analyzing...'
      : voiceTranscript
      ? 'Generate with AI + Voice'
      : 'Generate with AI'}
  </Text>
</TouchableOpacity>
```

---

## ✅ Validation Checklist

### Step 1 → 2
- [ ] `images.length > 0`

### Step 2 → 3
- [ ] `title.length > 0`
- [ ] `description.length > 0`
- [ ] `parseFloat(price) > 0`

### Step 3 → Submit
- [ ] `collectionDate` is set
- [ ] `collectionAddress.length > 0`
- [ ] `ownershipConfirmed === true`

---

## 💾 Database Insert

```javascript
// Insert item
const { data: item } = await supabase
  .from('items')
  .insert({
    title,
    description,
    price: parseFloat(price),
    condition,
    category,
    location: postcode,
    image_urls: images,
    seller_id: user.id,
    status: 'active',
    collection_date: collectionDate,
    collection_address: collectionAddress,
    collection_flexible: isFlexible,
    tags: tags
  })
  .select()
  .single();

// Insert knowledge
await supabase
  .from('item_knowledge')
  .insert({
    item_id: item.id,
    minimum_price: minPrice ? parseFloat(minPrice) : null,
    negotiation_enabled: !!minPrice,
    selling_points: tags,
    additional_info: {
      voice_transcription: voiceTranscript,
      has_voice_input: !!voiceTranscript,
      ai_generated: true
    }
  });
```

---

## 🐛 Common Issues

### Issue: Voice recording fails
```javascript
// Solution: Check permissions
const { status } = await Audio.requestPermissionsAsync();
if (status !== 'granted') {
  Alert.alert('Permission required', 'Enable microphone access');
  return;
}
```

### Issue: AI returns empty fields
```javascript
// Solution: Fallback to defaults
setTitle(data.title || 'Untitled Item');
setDescription(data.description || '');
setPrice(data.price?.toString() || '');
```

### Issue: Can't navigate back
```javascript
// Solution: Remove restrictions on backward navigation
const goToStep = (step) => {
  if (step < currentStep) {
    setCurrentStep(step); // Always allow backward
    return;
  }
  // Validate only for forward navigation
  validateAndProceed(step);
};
```

---

## 🎯 Key Features

| Feature | Implementation |
|---------|---------------|
| **Voice Input** | `expo-av` Audio Recording |
| **Transcription** | Whisper API (existing) |
| **AI Analysis** | `/api/analyze-image-with-voice` |
| **Image Compression** | `expo-image-manipulator` |
| **Step Navigation** | State-based with validation |
| **Editable Fields** | All TextInput/Select components |
| **Tags** | Array with add/remove |
| **Summary** | Pre-submit preview card |

---

## 📊 Expected Metrics

| Metric | Before | Target |
|--------|--------|--------|
| **Time to List** | 7 min | 3 min |
| **Steps** | 7 | 3 |
| **Voice Usage** | 0% | 40%+ |
| **Completion Rate** | 60% | 80%+ |

---

## 🚀 Implementation Time

| Task | Estimate |
|------|----------|
| Add 3-step UI | 2 hours |
| Integrate voice recording | 1 hour |
| Connect AI API | 1 hour |
| Testing | 1 hour |
| **Total** | **4-5 hours** |

---

## 📚 Full Documentation

- **Implementation Guide:** `VOICE_ENHANCED_ADD_ITEM_GUIDE.md`
- **Summary:** `VOICE_ENHANCED_IMPLEMENTATION_SUMMARY.md`
- **This Card:** `VOICE_ADD_ITEM_QUICK_REFERENCE.md`

---

## ✨ Remember

1. **Voice is optional** - Users can skip and type
2. **AI is a helper** - All fields are editable
3. **Navigation is free** - Can go back anytime
4. **Validation is smart** - Only blocks forward movement
5. **Mobile-first** - Designed for touch and voice

---

**Status:** Web app LIVE ✅ | Mobile app ready for implementation ⏳

