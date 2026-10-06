BEGIN;

-- Local preparation only. No existing recipe/approval/ERP rows are rewritten.
DO $preflight$
DECLARE definition text; replacement text;
BEGIN
  IF to_regclass('public.recipe_reader_assignments') IS NOT NULL THEN
    RAISE EXCEPTION 'Recipe Reader Assignments already exists; review before replay';
  END IF;
  IF to_regprocedure('public.has_module_permission(text,text)') IS NULL
      OR to_regprocedure('public.is_current_user_system_admin()') IS NULL THEN
    RAISE EXCEPTION 'Expected existing permission architecture is missing';
  END IF;
  definition := pg_get_functiondef('public.save_settings_role_permissions(bigint,jsonb)'::regprocedure);
  IF definition NOT LIKE '%''Master Data'')%' OR definition NOT LIKE '%settings_protected_admin%'
      OR definition NOT LIKE '%Unsupported Print%' THEN
    RAISE EXCEPTION 'Unexpected permission-saving RPC; review before applying';
  END IF;
  replacement := replace(definition, '''Master Data'')', '''Master Data'',''Recipe Reader Assignments'')');
  IF replacement = definition THEN RAISE EXCEPTION 'Permission allowlist replacement failed'; END IF;
  replacement := replace(replacement,
    'IF module NOT IN (''Reports'',''Audit Trail'')',
    'IF module=''Recipe Reader Assignments'' AND (row_data->>''can_edit'')::boolean THEN RAISE EXCEPTION ''Reader assignments do not support Edit''; END IF;
    IF module NOT IN (''Reports'',''Audit Trail'')');
  IF replacement NOT LIKE '%Reader assignments do not support Edit%' THEN
    RAISE EXCEPTION 'Unexpected Print validation; review before applying';
  END IF;
  EXECUTE replacement;
END;
$preflight$;

ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_reader_actions_check
  CHECK (module_name <> 'Recipe Reader Assignments' OR (NOT can_edit AND NOT can_print));
INSERT INTO public.role_permissions(role_id,module_name,can_view,can_add,can_edit,can_delete,can_print)
SELECT id,'Recipe Reader Assignments',false,false,false,false,false FROM public.roles
ON CONFLICT (role_id,module_name) DO NOTHING;

CREATE TABLE public.recipe_reader_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE RESTRICT,
  assigned_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  CONSTRAINT reader_revocation_pair CHECK ((revoked_at IS NULL) = (revoked_by IS NULL)),
  CONSTRAINT reader_read_time CHECK (read_at IS NULL OR read_at >= assigned_at),
  CONSTRAINT reader_revoke_time CHECK (revoked_at IS NULL OR revoked_at >= assigned_at)
);
CREATE UNIQUE INDEX recipe_reader_active_unique ON public.recipe_reader_assignments(recipe_id,assigned_user_id)
  WHERE revoked_at IS NULL;
CREATE INDEX recipe_reader_user_index ON public.recipe_reader_assignments(assigned_user_id,assigned_at DESC);
CREATE INDEX recipe_reader_recipe_index ON public.recipe_reader_assignments(recipe_id,assigned_at DESC);
ALTER TABLE public.recipe_reader_assignments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recipe_reader_assignments FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.recipe_reader_assignments TO authenticated;

CREATE FUNCTION public.reader_assignment_manager(p_action text DEFAULT 'view') RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
  SELECT auth.uid() IS NOT NULL
    AND public.has_module_permission('Recipes','view')
    AND public.has_module_permission('Recipe Reader Assignments','view')
    AND public.has_module_permission('Recipe Reader Assignments',p_action);
$function$;
CREATE POLICY recipe_reader_assignments_select ON public.recipe_reader_assignments FOR SELECT TO authenticated
USING (public.reader_assignment_manager('view') OR
  (assigned_user_id=auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.is_active)));

CREATE FUNCTION public.list_recipe_reader_candidates(p_recipe_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
BEGIN
  IF NOT public.reader_assignment_manager('add') THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='reader_permission'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.recipes WHERE id=p_recipe_id AND approved_at IS NOT NULL
    AND status IN ('Approved','ERP Pending','ERP Completed')) THEN
    RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='reader_not_approved'; END IF;
  RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'name',full_name,'username',username)
    ORDER BY full_name,id),'[]'::jsonb) FROM public.profiles WHERE is_active);
END;
$function$;

CREATE FUNCTION public.assign_recipe_reader(p_recipe_id uuid,p_assigned_user_id uuid,p_expected_updated_at timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
DECLARE recipe public.recipes; assignment public.recipe_reader_assignments;
BEGIN
  -- Same security-table lock order as the existing permission-management RPCs.
  LOCK TABLE public.roles,public.role_permissions,public.profiles IN SHARE MODE;
  IF NOT public.reader_assignment_manager('add') THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='reader_permission'; END IF;
  SELECT * INTO recipe FROM public.recipes WHERE id=p_recipe_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'reader_not_found'; END IF;
  IF recipe.status NOT IN ('Approved','ERP Pending','ERP Completed') OR recipe.approved_at IS NULL THEN
    RAISE EXCEPTION 'reader_not_approved'; END IF;
  IF p_expected_updated_at IS NULL OR recipe.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'reader_stale'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=p_assigned_user_id AND is_active) THEN
    RAISE EXCEPTION 'reader_inactive'; END IF;
  BEGIN
    INSERT INTO public.recipe_reader_assignments(recipe_id,assigned_user_id,assigned_by)
      VALUES(p_recipe_id,p_assigned_user_id,auth.uid()) RETURNING * INTO assignment;
  EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'reader_duplicate'; END;
  RETURN to_jsonb(assignment);
END;
$function$;

CREATE FUNCTION public.list_my_recipe_reader_assignments() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_active) THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='reader_permission'; END IF;
  RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object('id',a.id,'recipe_id',a.recipe_id,
    'recipe_code',r.recipe_code,'name',p.name,'status',r.status,'assigned_at',a.assigned_at,
    'assigned_by_name',sender.full_name,'read_at',a.read_at,
    'available',r.approved_at IS NOT NULL AND r.status IN ('Approved','ERP Pending','ERP Completed'))
    ORDER BY a.assigned_at DESC,a.id),'[]'::jsonb)
    FROM public.recipe_reader_assignments a JOIN public.recipes r ON r.id=a.recipe_id
    JOIN public.products p ON p.id=r.product_id JOIN public.profiles sender ON sender.id=a.assigned_by
    WHERE a.assigned_user_id=auth.uid() AND a.revoked_at IS NULL);
END;
$function$;

CREATE FUNCTION public.get_recipe_reader_assignment(p_assignment_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
DECLARE result jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_active) THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='reader_permission'; END IF;
  SELECT jsonb_build_object('id',a.id,'recipe_id',r.id,'recipe_code',r.recipe_code,'name',p.name,
    'description',r.description,'yield_quantity',r.yield_quantity,'yield_unit',r.yield_unit,
    'category',p.category,'product_type',p.product_type,'type_name',m.value,'type_arabic_name',m.arabic_name,
    'status',r.status,'assigned_at',a.assigned_at,'assigned_by_name',sender.full_name,'read_at',a.read_at,
    'ingredients',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',ri.id,'name',ip.name,
      'type_name',im.value,'type_arabic_name',im.arabic_name,'quantity',ri.quantity,'unit',ri.unit,'notes',ri.notes)
      ORDER BY ri.created_at,ri.id),'[]'::jsonb) FROM public.recipe_ingredients ri
      JOIN public.products ip ON ip.id=ri.product_id LEFT JOIN public.product_master_values im
      ON im.kind='product_type' AND im.type_key=ip.product_type WHERE ri.recipe_id=r.id)) INTO result
    FROM public.recipe_reader_assignments a JOIN public.recipes r ON r.id=a.recipe_id
    JOIN public.products p ON p.id=r.product_id JOIN public.profiles sender ON sender.id=a.assigned_by
    LEFT JOIN public.product_master_values m ON m.kind='product_type' AND m.type_key=p.product_type
    WHERE a.id=p_assignment_id AND a.assigned_user_id=auth.uid() AND a.revoked_at IS NULL
      AND r.approved_at IS NOT NULL AND r.status IN ('Approved','ERP Pending','ERP Completed');
  IF result IS NULL THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='reader_unavailable'; END IF;
  RETURN result;
END;
$function$;

CREATE FUNCTION public.mark_recipe_reader_assignment_read(p_assignment_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
DECLARE assignment public.recipe_reader_assignments;
BEGIN
  LOCK TABLE public.roles,public.role_permissions,public.profiles IN SHARE MODE;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_active) THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='reader_permission'; END IF;
  SELECT * INTO assignment FROM public.recipe_reader_assignments WHERE id=p_assignment_id FOR UPDATE;
  IF NOT FOUND OR assignment.assigned_user_id IS DISTINCT FROM auth.uid() OR assignment.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='reader_unavailable'; END IF;
  PERFORM 1 FROM public.recipes WHERE id=assignment.recipe_id AND approved_at IS NOT NULL
    AND status IN ('Approved','ERP Pending','ERP Completed') FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'reader_not_approved'; END IF;
  UPDATE public.recipe_reader_assignments SET read_at=coalesce(read_at,clock_timestamp())
    WHERE id=p_assignment_id RETURNING * INTO assignment;
  RETURN to_jsonb(assignment);
END;
$function$;

CREATE FUNCTION public.list_recipe_reader_assignments(p_recipe_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
BEGIN
  IF NOT public.reader_assignment_manager('view') THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='reader_permission'; END IF;
  RETURN (SELECT coalesce(jsonb_agg(to_jsonb(a)||jsonb_build_object('assigned_user_name',recipient.full_name,
    'assigned_by_name',sender.full_name) ORDER BY a.assigned_at DESC,a.id),'[]'::jsonb)
    FROM public.recipe_reader_assignments a JOIN public.profiles recipient ON recipient.id=a.assigned_user_id
    JOIN public.profiles sender ON sender.id=a.assigned_by WHERE a.recipe_id=p_recipe_id);
END;
$function$;

CREATE FUNCTION public.revoke_recipe_reader_assignment(p_assignment_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
DECLARE assignment public.recipe_reader_assignments;
BEGIN
  LOCK TABLE public.roles,public.role_permissions,public.profiles IN SHARE MODE;
  IF NOT public.reader_assignment_manager('delete') THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='reader_permission'; END IF;
  SELECT * INTO assignment FROM public.recipe_reader_assignments WHERE id=p_assignment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'reader_not_found'; END IF;
  UPDATE public.recipe_reader_assignments SET revoked_at=coalesce(revoked_at,clock_timestamp()),
    revoked_by=coalesce(revoked_by,auth.uid()) WHERE id=p_assignment_id RETURNING * INTO assignment;
  RETURN to_jsonb(assignment);
END;
$function$;

CREATE FUNCTION public.get_recipe_reader_print_data(p_assignment_id uuid) RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
  SELECT public.get_recipe_reader_assignment(p_assignment_id);
$function$;

REVOKE ALL ON FUNCTION public.reader_assignment_manager(text),public.list_recipe_reader_candidates(uuid),
  public.assign_recipe_reader(uuid,uuid,timestamptz),public.list_my_recipe_reader_assignments(),
  public.get_recipe_reader_assignment(uuid),public.mark_recipe_reader_assignment_read(uuid),
  public.list_recipe_reader_assignments(uuid),public.revoke_recipe_reader_assignment(uuid),
  public.get_recipe_reader_print_data(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reader_assignment_manager(text),public.list_recipe_reader_candidates(uuid),
  public.assign_recipe_reader(uuid,uuid,timestamptz),public.list_my_recipe_reader_assignments(),
  public.get_recipe_reader_assignment(uuid),public.mark_recipe_reader_assignment_read(uuid),
  public.list_recipe_reader_assignments(uuid),public.revoke_recipe_reader_assignment(uuid),
  public.get_recipe_reader_print_data(uuid) TO authenticated;

COMMIT;
