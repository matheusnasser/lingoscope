import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";

import { encodeBase64 } from "jsr:@std/encoding/base64";

console.info("Analyze Image Gemini (REST, Deno Edge) initialized");

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
    // 1. Env vars
    const apiKey = Deno.env.get("GOOGLE_AI_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!apiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    // 2. Supabase admin client (service role – bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Parse multipart/form-data
    const formData = await req.formData();

    // Frontend sends images or GIFs as "image"
    const mediaFile = formData.get("image");
    const baseLanguage = formData.get("baseLanguage");
    const targetLanguage = formData.get("targetLanguage");
    const userId = formData.get("userId");

    if (
      !mediaFile ||
      !baseLanguage ||
      !targetLanguage ||
      !(mediaFile instanceof File)
    ) {
      throw new Error("Missing required fields or invalid file");
    }

    if (!userId) {
      throw new Error("Missing userId (must be auth user UUID)");
    }

    const mimeType = mediaFile.type || "image/jpeg";
    if (!mimeType.startsWith("image/")) {
      throw new Error(
        `Unsupported media type: ${mimeType}. Send image/* or image/gif (if converted from video on the client).`
      );
    }

    const isGif = mimeType === "image/gif";
    const mediaType = isGif ? "gif" : "image";

    console.log(
      `Processing media for user ${userId}. Base: ${baseLanguage}, Target: ${targetLanguage}, mimeType: ${mimeType}, mediaType: ${mediaType}`
    );

    // 4. Upload to Supabase Storage
    const extension = mimeType.split("/")[1] || (isGif ? "gif" : "jpg");
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${extension}`;

    console.log(`Uploading media to storage path: ${fileName}`);

    const { data: uploadData, error: uploadError } =
      await supabaseAdmin.storage.from("captures").upload(fileName, mediaFile, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase Storage Upload Error:", uploadError);
      throw new Error(
        `Failed to upload media to storage: ${uploadError.message}`
      );
    }

    console.log("Upload successful!");

    // 5. Convert media to Base64 (for Gemini)
    console.log("Converting media to Base64...");
    const arrayBuffer = await mediaFile.arrayBuffer();
    const base64Image = encodeBase64(new Uint8Array(arrayBuffer));

    // 6. Strong JSON-only prompt (with Chinese + pinyin logic)
    const systemPrompt = `
You are an expert language tutor in the Lingoscope app. Your task is to analyze images or GIFs and teach vocabulary.

User settings: Base Language: ${baseLanguage}, Target Language: ${targetLanguage}.

Instructions:

1. Identify the main object in the image or GIF.

2. Translate its name to the Base Language and Target Language.

3. Create a simple descriptive context sentence in the Target Language.

4. Generate exactly 3 distinct example phrases using the object in both languages.

5. If the Target Language is any form of Chinese (e.g. Chinese, Mandarin, Simplified Chinese, Traditional Chinese, zh, zh-CN, zh-TW), you MUST also provide pinyin for:
   - The detected object in the target language
   - The context sentence in the target language
   - Each target example phrase

6. If the Target Language is NOT Chinese, still include the pinyin fields but set them to an empty string "".

7. CRITICAL: Phrase Detection on Image - Extract and Translate Visible Text Content
   - Look ONLY for text that is part of the ACTUAL CONTENT of the image (not UI elements, tooltips, or interface instructions)
   - IGNORE:
     * UI elements, buttons, menus, tooltips
     * Instructions or help text from applications (e.g., "To move canvas, hold Scroll wheel...")
     * Interface labels or system messages
     * Watermarks or copyright text
   - EXTRACT ONLY:
     * Text that is part of the actual content being photographed/captured
     * Names, phrases, or words that appear as CONTENT (e.g., "Buffer", "Matheus", "Hello World")
     * Text written on objects, signs, documents, screens, or surfaces that is the SUBJECT of the image
   - Extract the EXACT phrase/text as it appears in the content (not descriptions or explanations)
   - If multiple phrases are found, extract the most prominent or main phrase
   - MANDATORY: Translate the extracted phrase to the Base Language (${baseLanguage})
   - The contextFoundPhrase MUST be in the Base Language, not the original language found in the image
   - Examples:
     * Image shows Chinese text "Buffer请雇佣Matheus" → contextFoundPhrase: "Buffer please hire Matheus" (translated to base language)
     * Image shows English text "Buffer please hire Matheus" → contextFoundPhrase: "Buffer please hire Matheus" (if base is English) OR "Buffer por favor contrate Matheus" (if base is Portuguese)
     * Image shows name "Matheus" on a document → contextFoundPhrase: "Matheus" (names stay the same, but if in Chinese characters, transliterate)
     * Image shows Chinese text "欢迎" on a sign → contextFoundPhrase: "Welcome" (translated to base language)
     * Image shows "Hello World" written on paper → contextFoundPhrase: "Hello World" (translated to base language if base is not English)
   - If NO content text is found (only UI/interface text), set contextFoundPhrase to an empty string ""
   - DO NOT include descriptions, instructions, or context - ONLY the actual text/phrase visible in the content, TRANSLATED to Base Language

IMPORTANT: You must output ONLY raw JSON matching this exact structure. Do not include markdown formatting like \`\`\`json at the start or end.

{
  "detectedObjectBase": "String in base language",
  "detectedObjectTarget": "String in target language",
  "detectedObjectTargetPinyin": "Pinyin for the target word if Chinese, otherwise empty string",
  "contextSentence": "A simple sentence describing the image in target language.",
  "contextFoundPhrase": "The actual text/phrase visible in the image content (not UI or descriptions), TRANSLATED to the Base Language (${baseLanguage}). Extract the phrase and translate it. If no content text found, use empty string.",
  "contextSentencePinyin": "Pinyin for the context sentence if Chinese, otherwise empty string",
  "examplePhrases": [
    {
      "base": "Example 1 in base lang",
      "target": "Example 1 in target lang",
      "targetPinyin": "Pinyin for example 1 in target lang if Chinese, otherwise empty string"
    },
    {
      "base": "Example 2 in base lang",
      "target": "Example 2 in target lang",
      "targetPinyin": "Pinyin for example 2 in target lang if Chinese, otherwise empty string"
    },
    {
      "base": "Example 3 in base lang",
      "target": "Example 3 in target lang",
      "targetPinyin": "Pinyin for example 3 in target lang if Chinese, otherwise empty string"
    }
  ]
}
`;

    // 7. Call Gemini REST (2.5 Flash)
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    console.log("Sending to Gemini REST API...");

    const geminiResponse = await fetch(geminiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt,
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API Error:", errText);
      throw new Error(
        `Gemini API request failed: ${geminiResponse.status} - ${errText}`
      );
    }

    const geminiData = await geminiResponse.json();

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      throw new Error("Gemini returned no candidates.");
    }

    const rawTextResponse = geminiData.candidates[0].content.parts[0].text;

    const cleanJsonText = rawTextResponse.replace(/```json|```/g, "").trim();

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanJsonText);
    } catch {
      console.error("Failed to parse JSON:", cleanJsonText);
      throw new Error("Gemini response was not valid JSON.");
    }

    // Log the parsed result for debugging
    console.log("=== GEMINI ANALYSIS RESULT ===");
    console.log("Full parsed result:", JSON.stringify(parsedResult, null, 2));
    console.log("contextFoundPhrase:", parsedResult.contextFoundPhrase);
    console.log("=================================");

    // 8. Prepare AI data for DB (without storagePath/mediaType)
    const storagePath = uploadData.path;
    const aiDataToStore = {
      ...parsedResult,
    };

    delete aiDataToStore.storagePath;
    delete aiDataToStore.mediaType;

    // 9. Insert into public.user_posts
    console.log("Inserting user post into user_posts...");

    const { data: insertData, error: insertError } =
      await supabaseAdmin
        .from("user_posts")
        .insert({
          user_id: userId,
          storage_path: storagePath,
          ai_data: aiDataToStore,
        })
        .select("id")
        .single();

    if (insertError) {
      console.error("Error inserting into user_posts:", insertError);
      throw new Error(`Failed to insert user post: ${insertError.message}`);
    }

    // 10. Attach DB + media info to response back to client
    parsedResult.storagePath = storagePath;
    parsedResult.postId = insertData.id;
    parsedResult.mediaType = mediaType; // "image" or "gif"

    console.log("Analysis + DB insert successful, returning JSON.");

    return new Response(JSON.stringify(parsedResult), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
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

