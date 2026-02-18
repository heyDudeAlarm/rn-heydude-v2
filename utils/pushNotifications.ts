import { supabase } from "./supabase";

/**
 * Supabase Edge Function을 사용해 푸시 알림 발송
 * - 사용자의 디바이스 토큰 조회 후 Firebase Admin SDK로 발송
 */
export async function sendPushNotification(
  recipientUserId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    const response = await supabase.functions.invoke("send-push-notification", {
      body: {
        recipientUserId,
        title,
        body,
        data,
      },
    });

    if (response.error) {
      console.error("Edge Function error:", response.error);
      throw new Error(response.error.message || "Failed to send push notification");
    }

    console.log("Push notification sent:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending push notification:", error);
    throw error;
  }
}

/**
 * 현재 사용자의 디바이스 토큰 조회
 */
export async function getCurrentUserDeviceToken(): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("users")
      .select("device_token")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching current user token:", error);
      return null;
    }

    return data?.device_token || null;
  } catch (error) {
    console.error("Error in getCurrentUserDeviceToken:", error);
    return null;
  }
}
