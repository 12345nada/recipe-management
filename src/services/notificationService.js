import { supabase } from "../lib/supabaseClient";

const normalizeNotification = (row) => ({
  id: row.id, userId: row.user_id, title: row.title, message: row.message,
  type: row.notification_type, recipeId: row.recipe_id,
  isRead: Boolean(row.is_read), readAt: row.read_at, resolvedAt: row.resolved_at,
  createdAt: row.created_at, metadata: row.metadata || {},
});

export const getNotifications = async (userId) => {
  if (!userId) return [];
  const { data, error } = await supabase.from("notifications")
    .select("id,user_id,title,message,notification_type,recipe_id,is_read,read_at,created_at,resolved_at,metadata")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(30);
  if (error) throw error;
  return (data || []).map(normalizeNotification);
};

const callNotificationRpc = async (name, parameters = {}) => {
  const { data, error } = await supabase.rpc(name, parameters);
  if (error) throw error;
  return data;
};

export const getNotificationUnreadCount = () => callNotificationRpc("get_notification_unread_count");
export const markAllNotificationsAsRead = () => callNotificationRpc("mark_all_notifications_read");
export const getNotificationDestination = (id) => callNotificationRpc("get_notification_destination", { p_notification_id: id });
export const markNotificationAsRead = async (id) => {
  const result = await callNotificationRpc("mark_notification_read", { p_notification_id: id });
  if (!result?.id || !result.is_read || !result.read_at) throw new Error("notification_unavailable");
  return normalizeNotification(result);
};

const eventKeys = new Set(["pending_approval", "approved", "rejected", "erp_pending", "erp_completed", "reader_assigned", "reader_revoked"]);
export const presentNotification = (notice, t, language) => {
  const localized = notice.metadata?.version === 1 && eventKeys.has(notice.type);
  const values = { name: notice.metadata.recipe_name, code: notice.metadata.recipe_code, reason: notice.metadata.reason };
  return {
    title: localized ? t(`notifications.events.${notice.type}.title`) : notice.title,
    message: localized ? t(`notifications.events.${notice.type}.message`, values)
      + (notice.type === "rejected" && values.reason ? " " + t("notifications.reason", values) : "") : notice.message,
    date: notice.createdAt ? new Date(notice.createdAt).toLocaleString(language?.startsWith("ar") ? "ar-EG" : "en-GB",
      { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "",
  };
};

export const subscribeToNotifications = (userId, onChange) => {
  if (!userId) return () => {};
  const channel = supabase.channel(`notifications-${userId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => onChange?.())
    .subscribe((status) => { if (status === "SUBSCRIBED") onChange?.(); });
  return () => { supabase.removeChannel(channel); };
};
