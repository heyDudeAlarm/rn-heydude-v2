import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

interface PushNotificationRequest {
  recipientUserId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// 환경 변수에서 Firebase 설정 로드
const firebaseProjectId = Deno.env.get("FIREBASE_PROJECT_ID") || "";
const firebasePrivateKey = Deno.env.get("FIREBASE_PRIVATE_KEY") || "";
const firebaseClientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL") || "";

// Supabase 클라이언트 초기화
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Firebase Admin SDK를 사용해 FCM 토큰으로 푸시 발송
 */
async function sendFirebaseMessage(
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Firebase Admin SDK용 인증 토큰 생성
    const token = await getFirebaseAccessToken();
    
    const payload = {
      message: {
        token: deviceToken,
        notification: {
          title,
          body,
        },
        data: data || {},
      },
    };

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${firebaseProjectId}/messages:send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Firebase FCM error:", error);
      return { success: false, error };
    }

    const result = await response.json();
    return { success: true, messageId: result.name };
  } catch (error) {
    console.error("Error sending Firebase message:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Firebase 액세스 토큰 생성 (JWT)
 */
async function getFirebaseAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expirationTime = now + 3600; // 1시간 유효

  const header = {
    alg: "RS256",
    kid: firebaseClientEmail,
  };

  const payload = {
    iss: firebaseClientEmail,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: expirationTime,
    iat: now,
  };

  // JWT 서명 생성 (간단한 예제, 실제로는 proper JWT 라이브러리 사용권장)
  // 현재는 테스트용으로 placeholder 반환
  console.warn("⚠️ Firebase JWT generation requires proper setup");
  
  // 실제 구현을 위해서는 deno에서 사용 가능한 JWT 라이브러리 필요
  // 가정: 이 부분은 별도로 Firebase Admin SDK 또는 proper library로 구현해야함
  
  return "placeholder_token"; // 임시 placeholder
}

Deno.serve(async (req: Request) => {
  // CORS 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const payload: PushNotificationRequest = await req.json();
    const { recipientUserId, title, body, data } = payload;

    // 입력값 검증
    if (!recipientUserId || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. 수신자의 디바이스 토큰 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("device_token")
      .eq("id", recipientUserId)
      .single();

    if (userError || !userData?.device_token) {
      console.error("User not found or has no device token:", userError);
      return new Response(
        JSON.stringify({ error: "Device token not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const deviceToken = userData.device_token;

    // 2. Firebase FCM으로 푸시 발송
    const sendResult = await sendFirebaseMessage(deviceToken, title, body, data);

    if (!sendResult.success) {
      return new Response(
        JSON.stringify({
          error: "Failed to send push notification",
          details: sendResult.error,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        message: "Push notification sent",
        deviceToken: deviceToken.substring(0, 20) + "...",
        messageId: sendResult.messageId,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
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
