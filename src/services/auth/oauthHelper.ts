import { AuthError, Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../../config/supabase";

// Complete the web browser session properly
WebBrowser.maybeCompleteAuthSession();

/**
 * Sign in with OAuth provider using Expo WebBrowser
 * This handles the OAuth flow properly in React Native
 */
export async function signInWithOAuthProvider(
  provider: "google" | "apple"
): Promise<{ session: Session | null; error: AuthError | null }> {
  try {
    const redirectTo = Linking.createURL("/auth/callback");

    // Get the OAuth URL from Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      return { session: null, error };
    }

    if (!data.url) {
      return {
        session: null,
        error: {
          name: "OAuthError",
          message: "Failed to get OAuth URL",
        } as AuthError,
      };
    }

    // Open the OAuth URL in the browser
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === "success") {
      // The URL contains the auth code/token
      const url = result.url;

      // Parse the URL to extract the code
      const parsedUrl = new URL(url);
      const code = parsedUrl.searchParams.get("code");
      const errorParam = parsedUrl.searchParams.get("error");
      const errorDescription = parsedUrl.searchParams.get("error_description");

      if (errorParam) {
        return {
          session: null,
          error: {
            name: "OAuthError",
            message: errorDescription || errorParam,
          } as AuthError,
        };
      }

      if (code) {
        // Exchange the code for a session
        const { data: sessionData, error: sessionError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (sessionError) {
          return { session: null, error: sessionError };
        }

        return {
          session: sessionData.session,
          error: null,
        };
      }
    }

    // User cancelled or closed the browser
    if (result.type === "cancel") {
      return {
        session: null,
        error: {
          name: "OAuthError",
          message: "User cancelled the authentication",
        } as AuthError,
      };
    }

    return {
      session: null,
      error: {
        name: "OAuthError",
        message: "OAuth flow failed",
      } as AuthError,
    };
  } catch (error: any) {
    return {
      session: null,
      error: {
        name: "OAuthError",
        message: error.message || "An unexpected error occurred",
      } as AuthError,
    };
  }
}
