import "jsr:@supabase/functions-js/edge-runtime.d.ts";

console.info("Check Pronunciation Edge Function initialized");

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const googleApiKey = Deno.env.get("GOOGLE_AI_KEY");

    if (!googleApiKey) {
      throw new Error("Missing GOOGLE_AI_KEY environment variable");
    }

    // Parse multipart/form-data
    const formData = await req.formData();
    const audioFile = formData.get("audio");
    const targetText = formData.get("targetText") as string;

    if (!audioFile || !targetText || !(audioFile instanceof File)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: audio, targetText" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Convert audio file to base64
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = btoa(
      String.fromCharCode(...new Uint8Array(audioBuffer))
    );

    // Use Gemini 1.5 Flash for both transcription and feedback
    // It supports audio input directly
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a pronunciation coach. 
1. Transcribe the audio provided.
2. Compare the user's pronunciation with the target text: "${targetText}"
3. Provide a JSON response with:
   - transcribedText: What you heard
   - score: A number from 0-100 indicating pronunciation accuracy (be lenient, if it sounds mostly correct give >80)
   - hints: An array of specific, actionable hints to improve pronunciation (max 3 hints). If the score is high, give positive reinforcement.

Response format (JSON only, no markdown):
{
  "transcribedText": "text heard",
  "score": 85,
  "hints": ["hint 1", "hint 2"]
}`,
                },
                {
                  inline_data: {
                    mime_type: "audio/mp4",
                    data: audioBase64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    const responseText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log("Gemini raw response:", responseText);

    // Parse JSON from response
    let feedback;
    try {
      // Extract JSON from markdown if present
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      } else {
        feedback = JSON.parse(responseText);
      }
    } catch (error) {
      console.error("Error parsing feedback:", error);
      // Fallback feedback
      feedback = {
        transcribedText: "(Could not parse response)",
        score: 0,
        hints: ["Could not analyze pronunciation. Please try again."],
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        transcribedText: feedback.transcribedText,
        score: feedback.score || 0,
        hints: feedback.hints || [],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in check-pronunciation:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        score: 0,
        hints: ["An error occurred. Please try again."],
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
