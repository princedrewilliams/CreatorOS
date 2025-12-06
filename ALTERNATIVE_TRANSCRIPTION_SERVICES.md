# Alternative Transcription Services for Auto-Clip Feature

Since Replicate has rate limits on free accounts, here are alternative services you can use for video transcription:

## 1. **AssemblyAI** (Recommended)
- **Pros**: 
  - Free tier: 5 hours/month
  - High accuracy
  - Easy API integration
  - Real-time transcription
  - Word-level timestamps included
- **Cons**: Requires API key
- **Pricing**: Free tier available, then $0.00025/second
- **Setup**: https://www.assemblyai.com/

```typescript
// Example integration
const response = await fetch("https://api.assemblyai.com/v2/transcript", {
  method: "POST",
  headers: {
    authorization: process.env.ASSEMBLYAI_API_KEY,
    "content-type": "application/json",
  },
  body: JSON.stringify({
    audio_url: audioUrl, // Upload video/audio first
    word_timestamps: true,
  }),
});
```

## 2. **Deepgram**
- **Pros**: 
  - Free tier: 12,000 minutes/month
  - Very fast
  - Good accuracy
  - Word-level timestamps
- **Cons**: Requires API key
- **Pricing**: Free tier, then pay-as-you-go
- **Setup**: https://deepgram.com/

## 3. **Google Cloud Speech-to-Text**
- **Pros**: 
  - Free tier: 60 minutes/month
  - Very accurate
  - Multiple language support
- **Cons**: Requires Google Cloud account and billing setup
- **Pricing**: Free tier, then $0.006 per 15 seconds
- **Setup**: https://cloud.google.com/speech-to-text

## 4. **AWS Transcribe**
- **Pros**: 
  - Free tier: 60 minutes/month for 12 months
  - Highly accurate
  - Enterprise-grade
- **Cons**: Requires AWS account
- **Pricing**: Free tier, then $0.024 per minute
- **Setup**: https://aws.amazon.com/transcribe/

## 5. **OpenAI Whisper API** (Direct)
- **Pros**: 
  - Official OpenAI service
  - High accuracy
  - No rate limits (with paid account)
- **Cons**: Requires OpenAI API key (paid)
- **Pricing**: $0.006 per minute
- **Setup**: https://platform.openai.com/docs/guides/speech-to-text

## 6. **Rev AI**
- **Pros**: 
  - Free tier: 5 hours/month
  - Human-level accuracy
  - Fast turnaround
- **Cons**: Requires API key
- **Pricing**: Free tier, then $0.025 per minute
- **Setup**: https://www.rev.ai/

## Implementation Recommendation

For the auto-clip feature, I recommend **AssemblyAI** because:
1. Generous free tier (5 hours/month)
2. Word-level timestamps (perfect for finding engaging moments)
3. Easy integration
4. Good documentation
5. No strict rate limits on free tier

## Quick Integration Example

```typescript
// Upload video to temporary storage first
const uploadResponse = await fetch("https://api.assemblyai.com/v2/upload", {
  method: "POST",
  headers: {
    authorization: process.env.ASSEMBLYAI_API_KEY,
  },
  body: videoBuffer,
});

const { upload_url } = await uploadResponse.json();

// Start transcription
const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
  method: "POST",
  headers: {
    authorization: process.env.ASSEMBLYAI_API_KEY,
    "content-type": "application/json",
  },
  body: JSON.stringify({
    audio_url: upload_url,
    word_timestamps: true,
    punctuate: true,
  }),
});

const { id } = await transcriptResponse.json();

// Poll for completion
let transcript;
do {
  await new Promise(resolve => setTimeout(resolve, 3000));
  const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
    headers: { authorization: process.env.ASSEMBLYAI_API_KEY },
  });
  transcript = await statusResponse.json();
} while (transcript.status !== "completed");

// Use transcript.words for word-level timestamps
```

## Environment Variable

Add to your `.env.local`:
```
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
```

