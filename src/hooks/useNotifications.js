import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  getNotifications, getNotificationUnreadCount, getNotificationDestination,
  markNotificationAsRead, markAllNotificationsAsRead, subscribeToNotifications,
} from "../services/notificationService";

export default function useNotifications(userId, open, navigate, close) {
  const [state, setState] = useState({ owner: userId, items: [], count: 0, loading: Boolean(userId), error: "", busy: false });
  const owner = useRef(userId);
  useLayoutEffect(() => {
    owner.current = userId;
    return () => { owner.current = null; };
  }, [userId]);
  const generation = useRef(0);
  const pendingAction = useRef(false);
  const invalidate = useCallback(() => { ++generation.current; }, []);
  const refresh = useCallback(async (showLoader = false) => {
    const ticket = ++generation.current;
    if (!userId) return;
    // Defer startup updates and check cancellation before touching React state.
    await Promise.resolve();
    if (ticket !== generation.current || owner.current !== userId) return;
    if (showLoader) setState((s) => s.owner === userId ? { ...s, loading: true }
      : { owner: userId, items: [], count: 0, loading: true, error: "", busy: false });
    try {
      const [items, count] = await Promise.all([getNotifications(userId), getNotificationUnreadCount()]);
      if (ticket === generation.current && owner.current === userId) {
        setState((s) => ({ owner: userId, items, count: Number(count), loading: false, error: "", busy: s.owner === userId && s.busy }));
      }
    } catch {
      if (ticket === generation.current && owner.current === userId) setState((s) => ({ ...s, loading: false, error: "loadError" }));
    }
  }, [userId]);

  useEffect(() => {
    invalidate();
    pendingAction.current = false;
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setState({ owner: userId, items: [], count: 0, loading: Boolean(userId), error: "", busy: false });
      if (userId) refresh(true);
    });
    if (!userId) return () => { active = false; };
    const reload = () => refresh();
    const visible = () => { if (document.visibilityState === "visible") reload(); };
    const unsubscribe = subscribeToNotifications(userId, reload);
    window.addEventListener("focus", reload);
    document.addEventListener("visibilitychange", visible);
    return () => {
      active = false;
      invalidate();
      unsubscribe();
      window.removeEventListener("focus", reload);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [userId, refresh, invalidate]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    Promise.resolve().then(() => { if (active) refresh(); });
    return () => { active = false; };
  }, [open, refresh]);

  const perform = async (notice) => {
    if (!userId || pendingAction.current) return;
    pendingAction.current = true;
    ++generation.current;
    setState((s) => ({ ...s, busy: true, error: "" }));
    try {
      const destination = notice ? await getNotificationDestination(notice.id) : null;
      if (owner.current !== userId) return;
      if (notice) await markNotificationAsRead(notice.id);
      else await markAllNotificationsAsRead();
      if (owner.current !== userId) return;
      await refresh();
      if (owner.current !== userId) return;
      if (notice && destination) { close(false); navigate(destination); }
      else if (notice) setState((s) => ({ ...s, error: "unavailable" }));
    } catch {
      if (owner.current === userId) setState((s) => ({ ...s, error: "readError" }));
    } finally {
      if (owner.current === userId) {
        pendingAction.current = false;
        setState((s) => ({ ...s, busy: false }));
      }
    }
  };
  return {
    ...(state.owner === userId ? state : { items: [], count: 0, loading: Boolean(userId), error: "", busy: false }),
    markRead: perform, markAllRead: () => perform(null),
  };
}
