import { 
  supabase, 
} from "../lib/supabaseClient"; 
 
 
const formatNotificationDate = 
  (value) => { 
    if (!value) { 
      return ""; 
    } 
 
    return new Date( 
      value 
    ).toLocaleString( 
      "en-GB", 
      { 
        day: "2-digit", 
        month: "short", 
        year: "numeric", 
        hour: "2-digit", 
        minute: "2-digit", 
      } 
    ); 
  }; 
 
 
const normalizeNotification = 
  (row) => ({ 
    id: 
      row.id, 
 
    userId: 
      row.user_id, 
 
    title: 
      row.title, 
 
    message: 
      row.message, 
 
    type: 
      row.notification_type, 
 
    recipeId: 
      row.recipe_id, 
 
    isRead: 
      Boolean( 
        row.is_read 
      ), 
 
    createdAt: 
      row.created_at, 
 
    createdLabel: 
      formatNotificationDate( 
        row.created_at 
      ), 
  }); 
 
 
export const getNotifications = 
  async ( 
    userId 
  ) => { 
    if (!userId) { 
      return []; 
    } 
 
 
    const { 
      data, 
      error, 
    } = 
      await supabase 
        .from( 
          "notifications" 
        ) 
        .select(` 
          id, 
          user_id, 
          title, 
          message, 
          notification_type, 
          recipe_id, 
          is_read, 
          created_at 
        `) 
        .eq( 
          "user_id", 
          userId 
        ) 
        .order( 
          "created_at", 
          { 
            ascending: 
              false, 
          } 
        ) 
        .limit( 
          30 
        ); 
 
 
    if (error) { 
      throw error; 
    } 
 
 
    return ( 
      data || [] 
    ).map( 
      normalizeNotification 
    ); 
  }; 
 
 
export const markNotificationAsRead = 
  async ( 
    notificationId, 
    userId 
  ) => { 
    if ( 
      !notificationId || 
      !userId 
    ) { 
      return false; 
    } 
 
 
    const { 
      error, 
    } = 
      await supabase 
        .from( 
          "notifications" 
        ) 
        .update({ 
          is_read: 
            true, 
        }) 
        .eq( 
          "id", 
          notificationId 
        ) 
        .eq( 
          "user_id", 
          userId 
        ); 
 
 
    if (error) { 
      throw error; 
    } 
 
 
    return true; 
  }; 
 
 
export const subscribeToNotifications = 
  ( 
    userId, 
    onChange 
  ) => { 
    if (!userId) { 
      return () => {}; 
    } 
 
 
    const channel = 
      supabase 
        .channel( 
          `notifications-${userId}` 
        ) 
        .on( 
          "postgres_changes", 
          { 
            event: "*", 
            schema: 
              "public", 
            table: 
              "notifications", 
            filter: 
              `user_id=eq.${userId}`, 
          }, 
          () => { 
            onChange?.(); 
          } 
        ) 
        .subscribe(); 
 
 
    return () => { 
      supabase 
        .removeChannel( 
          channel 
        ); 
    }; 
  }; 