BEGIN;

-- Notification-only cutover. Existing application rows, permissions and sequences
-- are untouched. Resolution is not a user's acknowledgement.
DO $preflight$
BEGIN
  IF to_regclass('public.notifications') IS NULL
      OR to_regclass('public.recipe_reader_assignments') IS NULL
      OR to_regprocedure('public.create_recipe_workflow_notifications()') IS NULL
      OR to_regprocedure('public.has_module_permission(text,text)') IS NULL THEN
    RAISE EXCEPTION 'Notification dependencies are missing';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public'
      AND table_name='notifications' AND column_name IN ('metadata','resolved_at'))
      OR to_regprocedure('public.mark_notification_read(uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'Notification cutover already exists; review before replay';
  END IF;
END;
$preflight$;

ALTER TABLE public.notifications
  ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN resolved_at timestamptz;

-- Retain owner SELECT policies; existing UPDATE policies cannot confer grants.
REVOKE ALL ON TABLE public.notifications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.notifications TO authenticated;

CREATE FUNCTION public.mark_notification_read(p_notification_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public AS $function$
DECLARE result public.notifications;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_active) THEN
    RAISE EXCEPTION 'notification_permission' USING ERRCODE='42501';
  END IF;
  UPDATE public.notifications SET is_read=true,read_at=coalesce(read_at,clock_timestamp())
    WHERE id=p_notification_id AND user_id=auth.uid() RETURNING * INTO result;
  IF NOT FOUND THEN RAISE EXCEPTION 'notification_unavailable' USING ERRCODE='42501'; END IF;
  RETURN to_jsonb(result);
END;
$function$;

CREATE FUNCTION public.mark_all_notifications_read()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public AS $function$
DECLARE affected integer;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_active) THEN
    RAISE EXCEPTION 'notification_permission' USING ERRCODE='42501';
  END IF;
  UPDATE public.notifications SET is_read=true,read_at=coalesce(read_at,clock_timestamp())
    WHERE user_id=auth.uid() AND NOT is_read;
  GET DIAGNOSTICS affected=ROW_COUNT;
  RETURN affected;
END;
$function$;

CREATE FUNCTION public.get_notification_unread_count()
RETURNS bigint LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_active) THEN
    RAISE EXCEPTION 'notification_permission' USING ERRCODE='42501';
  END IF;
  RETURN (SELECT count(*) FROM public.notifications WHERE user_id=auth.uid() AND NOT is_read);
END;
$function$;

CREATE FUNCTION public.get_notification_destination(p_notification_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public AS $function$
DECLARE notice public.notifications; assignment_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_active) THEN
    RAISE EXCEPTION 'notification_permission' USING ERRCODE='42501';
  END IF;
  SELECT * INTO notice FROM public.notifications WHERE id=p_notification_id AND user_id=auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'notification_unavailable' USING ERRCODE='42501'; END IF;
  IF notice.notification_type='reader_revoked' THEN RETURN '/recipes?tab=assigned'; END IF;
  IF notice.notification_type='reader_assigned' THEN
    -- Structured IDs are written only by trusted notification triggers.
    BEGIN assignment_id := (notice.metadata->>'assignment_id')::uuid;
    EXCEPTION WHEN invalid_text_representation THEN RETURN NULL; END;
    IF EXISTS (SELECT 1 FROM public.recipe_reader_assignments a JOIN public.recipes r ON r.id=a.recipe_id
        WHERE a.id=assignment_id AND a.assigned_user_id=auth.uid() AND a.revoked_at IS NULL
          AND r.status IN ('Approved','ERP Pending','ERP Completed') AND r.approved_at IS NOT NULL) THEN
      RETURN '/recipes/reader/' || assignment_id::text;
    END IF;
    RETURN NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.recipes WHERE id=notice.recipe_id) THEN RETURN NULL; END IF;
  IF notice.notification_type='erp_pending' THEN
    IF notice.resolved_at IS NULL AND public.has_module_permission('ERP Entry','view')
        AND EXISTS (SELECT 1 FROM public.recipes WHERE id=notice.recipe_id AND status='Approved') THEN
      RETURN '/erp-entry/' || notice.recipe_id::text;
    END IF;
    RETURN NULL;
  END IF;
  IF notice.notification_type IN ('pending_approval','approved','rejected','erp_completed')
      AND public.has_module_permission('Recipes','view') THEN
    RETURN '/recipes/' || notice.recipe_id::text;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_recipe_workflow_notifications()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public AS $function$
DECLARE recipe_name text; recipe_code text; details jsonb;
BEGIN
  IF TG_OP='UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  SELECT coalesce(p.name,'Recipe') INTO recipe_name FROM public.products p WHERE p.id=NEW.product_id;
  recipe_name := coalesce(recipe_name,'Recipe');
  recipe_code := coalesce(NEW.recipe_code,'Recipe');
  details := jsonb_build_object('recipe_name',recipe_name,'recipe_code',recipe_code,
    'reason',nullif(btrim(coalesce(NEW.rejection_comment,'')),''),'version',1);

  -- Superseded tasks stay personally unread until their owner acknowledges them.
  UPDATE public.notifications SET resolved_at=clock_timestamp()
    WHERE recipe_id=NEW.id AND resolved_at IS NULL AND notification_type IN ('pending_approval','erp_pending');

  IF NEW.status='Submitted' THEN
    INSERT INTO public.notifications(user_id,recipe_id,notification_type,title,message,metadata)
    SELECT p.id,NEW.id,'pending_approval','Recipe waiting for approval',
      recipe_name||' ('||recipe_code||') is waiting for your review.',details
    FROM public.profiles p JOIN public.roles r ON r.id=p.role_id
    WHERE p.is_active AND (r.is_system_admin OR
      (lower(btrim(r.name))='approver' AND EXISTS (SELECT 1 FROM public.role_permissions rp
        WHERE rp.role_id=r.id AND rp.module_name='Recipes' AND rp.can_view)));
  END IF;

  IF NEW.status IN ('Approved','Rejected','ERP Completed') AND NEW.created_by IS NOT NULL THEN
    INSERT INTO public.notifications(user_id,recipe_id,notification_type,title,message,metadata)
    SELECT p.id,NEW.id,CASE NEW.status WHEN 'Approved' THEN 'approved' WHEN 'Rejected' THEN 'rejected' ELSE 'erp_completed' END,
      CASE NEW.status WHEN 'Approved' THEN 'Recipe approved' WHEN 'Rejected' THEN 'Recipe rejected' ELSE 'ERP entry completed' END,
      recipe_name||' ('||recipe_code||') '||CASE NEW.status WHEN 'Approved' THEN 'was approved.'
        WHEN 'Rejected' THEN 'was rejected.'||CASE WHEN details->>'reason' IS NOT NULL THEN ' Reason: '||(details->>'reason') ELSE '' END
        ELSE 'has been completed in ERP.' END,details
    FROM public.profiles p WHERE p.id=NEW.created_by AND p.is_active;
  END IF;

  IF NEW.status='Approved' THEN
    INSERT INTO public.notifications(user_id,recipe_id,notification_type,title,message,metadata)
    SELECT p.id,NEW.id,'erp_pending','Recipe ready for ERP',
      recipe_name||' ('||recipe_code||') is approved and ready for ERP entry.',details
    FROM public.profiles p WHERE p.is_active AND EXISTS (SELECT 1 FROM public.role_permissions rp
      WHERE rp.role_id=p.role_id AND rp.module_name='ERP Entry' AND rp.can_view AND (rp.can_add OR rp.can_edit));
  END IF;
  RETURN NEW;
END;
$function$;

CREATE FUNCTION public.create_reader_assignment_notifications()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public AS $function$
DECLARE recipe_name text; recipe_code text; details jsonb;
BEGIN
  IF TG_OP='UPDATE' AND (OLD.revoked_at IS NOT NULL OR NEW.revoked_at IS NULL) THEN RETURN NEW; END IF;
  SELECT coalesce(p.name,'Recipe'),coalesce(r.recipe_code,'Recipe') INTO recipe_name,recipe_code
    FROM public.recipes r LEFT JOIN public.products p ON p.id=r.product_id WHERE r.id=NEW.recipe_id;
  details := jsonb_build_object('recipe_name',recipe_name,'recipe_code',recipe_code,'assignment_id',NEW.id,'version',1);
  IF TG_OP='UPDATE' THEN
    UPDATE public.notifications SET resolved_at=clock_timestamp() WHERE user_id=NEW.assigned_user_id
      AND notification_type='reader_assigned' AND metadata->>'assignment_id'=NEW.id::text AND resolved_at IS NULL;
  END IF;
  INSERT INTO public.notifications(user_id,recipe_id,notification_type,title,message,metadata)
  SELECT p.id,NEW.recipe_id,CASE WHEN TG_OP='INSERT' THEN 'reader_assigned' ELSE 'reader_revoked' END,
    CASE WHEN TG_OP='INSERT' THEN 'Recipe assigned to you' ELSE 'Recipe assignment revoked' END,
    coalesce(recipe_name,'Recipe')||' ('||coalesce(recipe_code,'Recipe')||') '||
      CASE WHEN TG_OP='INSERT' THEN 'was assigned to you for reading.' ELSE 'is no longer assigned to you.' END,details
  FROM public.profiles p WHERE p.id=NEW.assigned_user_id AND p.is_active;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER reader_assignment_notification
  AFTER INSERT OR UPDATE OF revoked_at ON public.recipe_reader_assignments
  FOR EACH ROW EXECUTE FUNCTION public.create_reader_assignment_notifications();

REVOKE ALL ON FUNCTION public.mark_notification_read(uuid),public.mark_all_notifications_read(),
  public.get_notification_unread_count(),public.get_notification_destination(uuid),
  public.create_reader_assignment_notifications(),public.create_recipe_workflow_notifications() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid),public.mark_all_notifications_read(),
  public.get_notification_unread_count(),public.get_notification_destination(uuid) TO authenticated;

COMMIT;
