import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";

console.info("Generate Vocabulary Suggestions Edge Function initialized");

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const googleApiKey = Deno.env.get("GOOGLE_AI_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !googleApiKey) {
      throw new Error("Missing environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user's language preferences
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("native_language, target_languages")
      .eq("id", user.id)
      .single();

    const targetLanguage = profile?.target_languages?.[0] || null;
    
    if (!profile || !profile.native_language || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: "User language preferences not set" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user's existing photos/vocabulary
    const { data: posts } = await supabaseAdmin
      .from("user_posts")
      .select("ai_data")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Extract vocabulary from posts
    const existingVocabulary: string[] = [];
    if (posts) {
      posts.forEach((post) => {
        const aiData = post.ai_data || {};
        const target = aiData.detectedObjectTarget || aiData.detected_object_target;
        if (target) {
          existingVocabulary.push(target);
        }
      });
    }

    // Use Gemini to generate vocabulary suggestions based on existing photos
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${googleApiKey}`,
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
                  text: `You are a language learning assistant. Generate 10 random, diverse vocabulary words that are CONCRETE OBJECTS that users can photograph.

Base Language: ${profile.native_language}
Target Language: ${targetLanguage}

IMPORTANT: Generate ONLY concrete nouns (objects) that can be photographed, such as:
- Physical objects: cup, chair, book, phone, car, tree, flower, etc.
- Food items: apple, bread, coffee, etc.
- Animals: cat, dog, bird, etc.
- Clothing: shirt, shoes, hat, etc.
- Furniture: table, bed, lamp, etc.

DO NOT include:
- Abstract concepts (love, happiness, idea)
- Verbs (run, eat, think)
- Adjectives (beautiful, fast, big)
- Emotions or feelings
- Places or locations (unless they're physical objects like "sign" or "building")

For each suggestion, provide:
- target: The word in target language (must be a concrete object)
- base: The translation in base language
- contextSentence: A simple sentence using the word in target language (e.g., "I see a [word] on the table")
- suggestion: A brief hint about what kind of object it is (e.g., "A common household item" or "A type of food")

If target language is Chinese, also provide pinyin.

Return ONLY valid JSON array format:
[
  {
    "target": "concrete object in target language",
    "base": "translation in base language",
    "pinyin": "pinyin if Chinese, else empty string",
    "contextSentence": "A simple sentence in target language",
    "suggestion": "Brief description of the object type"
  }
]`,
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

    // Parse JSON from response
    let suggestions;
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = JSON.parse(responseText);
      }
    } catch (error) {
      console.error("Error parsing suggestions:", error);
      // Return empty array if parsing fails
      suggestions = [];
    }

    return new Response(
      JSON.stringify({
        success: true,
        suggestions: suggestions || [],
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
    console.error("Error in generate-vocabulary-suggestions:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        suggestions: [],
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

