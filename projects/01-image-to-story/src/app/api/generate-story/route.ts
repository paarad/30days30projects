import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, settings } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Step 1: Get image description using OpenAI Vision
    let imageDescription: string;
    
    try {
      const visionResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image and provide a detailed description focusing on: the main subjects, setting/environment, mood/atmosphere, colors, composition, and any notable details that could inspire a story. Be creative and observant."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      });

      imageDescription = visionResponse.choices[0]?.message?.content || 'A mysterious image that sparks the imagination.';
    } catch (visionError) {
      console.error('Vision API error:', visionError);
      // Fallback description if vision fails
      imageDescription = 'An intriguing image that holds many stories within its frame.';
    }

    // Step 2: Generate story using the description and user settings
    const storyPrompt = `Based on the following image description, write a ${settings.style.toLowerCase()} story with a ${settings.tone.toLowerCase()} tone. The story should be approximately ${settings.length} words long.

Image Description: ${imageDescription}

Additional Instructions:
- Style: ${settings.style} (capture the essence and conventions of this genre)
- Tone: ${settings.tone} (maintain this emotional atmosphere throughout)
- Target length: ${settings.length} words
${settings.hints ? `- User hints: ${settings.hints}` : ''}

Write a complete, engaging story that brings this image to life. Focus on vivid descriptions, compelling characters, and a satisfying narrative arc. Make the story feel authentic to the chosen style and tone.`;

    const storyResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a master storyteller who can craft compelling narratives in any style and tone. Your stories are vivid, engaging, and perfectly capture the requested mood and genre conventions."
        },
        {
          role: "user",
          content: storyPrompt
        }
      ],
      max_tokens: Math.max(500, Math.floor(settings.length * 2)), // Adjust tokens based on desired length
      temperature: 0.8, // More creative
    });

    const story = storyResponse.choices[0]?.message?.content || 'Unable to generate story at this time.';

    return NextResponse.json({ 
      story,
      imageDescription,
      settings 
    });

  } catch (error) {
    console.error('Story generation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to generate story. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 