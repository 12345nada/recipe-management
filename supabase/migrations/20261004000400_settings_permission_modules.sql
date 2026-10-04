BEGIN;
SET LOCAL TIME ZONE 'UTC';
LOCK TABLE public.roles,public.role_permissions,public.profiles IN SHARE ROW EXCLUSIVE MODE;

-- Verified project: lxljoolqvukyngvajxga. LOCAL ONLY until separately approved.
-- Abort if the inspected permission architecture changed. No application rows,
-- codes, allocation counters, or sequences are rewritten or consumed here.
DO $preflight$
DECLARE
  definition text;
BEGIN
  IF (SELECT jsonb_agg(jsonb_build_array(id,name,is_system_admin) ORDER BY id) FROM public.roles)
     IS DISTINCT FROM '[[1,"Administrator",true],[4,"Approver",false],[5,"Head Chef",false],[7,"ERP User",false],[8,"QA E2E Viewer - 20261001T121057",false]]'::jsonb THEN
    RAISE EXCEPTION 'Unexpected role inventory; revalidate and approve the role matrix';
  END IF;
  IF (SELECT md5(string_agg(to_jsonb(rp)::text,'|' ORDER BY id)) FROM public.role_permissions rp
      WHERE module_name NOT IN ('General Settings','Permissions & User Rights','Master Data'))
     IS DISTINCT FROM '20a951f9c4810d5b1b9b23cceb71e738' THEN
    RAISE EXCEPTION 'Existing permissions changed; revalidate before migration';
  END IF;
  IF EXISTS (SELECT 1 FROM public.role_permissions WHERE
      lower(btrim(module_name)) IN ('general settings','permissions & user rights','master data')
      AND (module_name NOT IN ('General Settings','Permissions & User Rights','Master Data')
        OR role_id NOT IN (4,5,7,8) OR can_view OR can_add OR can_edit OR can_delete OR can_print)) THEN
    RAISE EXCEPTION 'Unexpected target permission rows; never overwrite them';
  END IF;
  IF md5(pg_get_functiondef('public.has_module_permission(text,text)'::regprocedure))
     <> 'df6032fdd7a5a71453b2ce8f46c3c906' THEN
    RAISE EXCEPTION 'Unexpected permission helper';
  END IF;
  IF md5(pg_get_functiondef('public.manage_product_master_value(text,text,uuid,text,timestamptz)'::regprocedure))
     <> '46a4d922b9ac811f795cac8def3e00bd' OR
     md5(pg_get_functiondef('public.manage_product_type(text,uuid,text,text,boolean,boolean,timestamptz)'::regprocedure))
     <> '9801eaf7b59a2bfd3fc756ee8c5d9dc2' THEN
    RAISE EXCEPTION 'Unexpected master-data RPC definitions';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname IN ('update_settings_profile','assign_settings_user_role',
      'create_settings_role','delete_settings_role','save_settings_role_permissions')) THEN
    RAISE EXCEPTION 'Target RPC already exists; inspect before replacing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.role_permissions'::regclass
      AND conname='role_permissions_print_modules_check') THEN
    RAISE EXCEPTION 'Print protection is missing';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename IN ('roles','profiles','role_permissions')
      AND cmd IN ('ALL','INSERT','UPDATE','DELETE')
      AND (coalesce(qual,'')||coalesce(with_check,'')) !~ 'is_system_admin|is_current_user_system_admin') THEN
    RAISE EXCEPTION 'Unexpected account write policy';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND
      ((tablename='roles' AND policyname='roles_select_safe') OR
       (tablename='role_permissions' AND policyname='role_permissions_select_safe') OR
       (tablename='profiles' AND policyname='settings_admin_profiles_select') OR
       (tablename='product_master_values' AND policyname='product_master_values_read') OR
       (tablename='system_settings' AND policyname IN ('settings_select','settings_insert','settings_update')))) <> 7 THEN
    RAISE EXCEPTION 'Expected policies are missing';
  END IF;
END;
$preflight$;

-- Only missing, explicitly approved non-admin module rows are inserted.
-- Legacy Settings / Users / Role rows and every existing flag remain untouched.
INSERT INTO public.role_permissions (role_id,module_name,can_view,can_add,can_edit,can_delete,can_print)
SELECT r.id,m.module,false,false,false,false,false
FROM public.roles r CROSS JOIN (VALUES ('General Settings'),('Permissions & User Rights'),('Master Data')) m(module)
WHERE r.id IN (4,5,7,8) AND NOT r.is_system_admin
  AND NOT EXISTS (SELECT 1 FROM public.role_permissions p WHERE p.role_id=r.id AND p.module_name=m.module);

-- Change authorization only; preserve the exact existing master-data bodies.
DO $authorization$
DECLARE definition text; changed text;
BEGIN
  definition := pg_get_functiondef('public.manage_product_master_value(text,text,uuid,text,timestamptz)'::regprocedure);
  changed := replace(definition,
    'OR NOT public.has_module_permission(''Settings'', required_permission)',
    'OR NOT public.has_module_permission(''Master Data'', ''view'') OR NOT public.has_module_permission(''Master Data'', required_permission)');
  IF changed=definition THEN RAISE EXCEPTION 'Master-value permission replacement failed'; END IF;
  EXECUTE changed;
  definition := pg_get_functiondef('public.manage_product_type(text,uuid,text,text,boolean,boolean,timestamptz)'::regprocedure);
  changed := replace(definition,
    'OR NOT public.has_module_permission(''Settings'',permission)',
    'OR NOT public.has_module_permission(''Master Data'',''view'') OR NOT public.has_module_permission(''Master Data'',permission)');
  IF changed=definition THEN RAISE EXCEPTION 'Product-type permission replacement failed'; END IF;
  EXECUTE changed;
END;
$authorization$;

ALTER POLICY product_master_values_read ON public.product_master_values USING (
  public.has_module_permission('Master Data','view')
  OR public.has_module_permission('Product Master','view') OR public.has_module_permission('Product Master','add')
  OR public.has_module_permission('Product Master','edit') OR public.has_module_permission('Product Master','delete')
  OR (kind='product_type' AND (public.has_module_permission('Recipes','view')
    OR public.has_module_permission('Recipes','add') OR public.has_module_permission('Recipes','edit')
    OR public.has_module_permission('Dashboard','view') OR public.has_module_permission('Reports','view')
    OR public.has_module_permission('Audit Trail','view') OR public.has_module_permission('ERP Entry','view'))));

-- Preserve own-profile / own-role reads and admin write policies.
-- Delegated writes use the narrow RPCs below, never a broad table UPDATE grant.
ALTER POLICY roles_select_safe ON public.roles USING (
  public.is_current_user_system_admin() OR id=public.current_user_role_id()
  OR public.has_module_permission('Permissions & User Rights','view'));
ALTER POLICY role_permissions_select_safe ON public.role_permissions USING (
  public.is_current_user_system_admin() OR role_id=public.current_user_role_id()
  OR public.has_module_permission('Permissions & User Rights','view'));
ALTER POLICY settings_admin_profiles_select ON public.profiles USING (
  public.is_current_user_system_admin() OR public.has_module_permission('Permissions & User Rights','view'));
ALTER POLICY settings_select ON public.system_settings USING (public.has_module_permission('General Settings','view'));
ALTER POLICY settings_update ON public.system_settings
  USING (public.has_module_permission('General Settings','view') AND public.has_module_permission('General Settings','edit'))
  WITH CHECK (public.has_module_permission('General Settings','view') AND public.has_module_permission('General Settings','edit'));
ALTER POLICY settings_insert ON public.system_settings WITH CHECK (public.is_current_user_system_admin());

CREATE FUNCTION public.update_settings_profile(p_full_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
DECLARE result jsonb; trimmed_name text := btrim(p_full_name);
BEGIN
  LOCK TABLE public.roles,public.role_permissions,public.profiles IN SHARE ROW EXCLUSIVE MODE;
  IF auth.uid() IS NULL OR NOT public.has_module_permission('General Settings','view')
      OR NOT public.has_module_permission('General Settings','edit') THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='settings_permission';
  END IF;
  IF trimmed_name IS NULL OR trimmed_name !~ '[^[:space:]]' THEN RAISE EXCEPTION 'Full name is required.'; END IF;
  -- No target-user argument or arbitrary patch: only the caller's full_name.
  UPDATE public.profiles SET full_name=trimmed_name WHERE id=auth.uid()
    RETURNING jsonb_build_object('id',id,'full_name',full_name) INTO result;
  IF result IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  RETURN result;
END;
$function$;

CREATE FUNCTION public.assign_settings_user_role(p_user_id uuid,p_role_id bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
DECLARE target_admin boolean; destination_admin boolean;
BEGIN
  LOCK TABLE public.roles,public.role_permissions,public.profiles IN SHARE ROW EXCLUSIVE MODE;
  IF auth.uid() IS NULL OR NOT public.has_module_permission('Permissions & User Rights','view')
      OR NOT public.has_module_permission('Permissions & User Rights','edit') THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='settings_permission';
  END IF;
  SELECT coalesce(r.is_system_admin,false) INTO target_admin FROM public.profiles p
    LEFT JOIN public.roles r ON r.id=p.role_id WHERE p.id=p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
  SELECT is_system_admin INTO destination_admin FROM public.roles WHERE id=p_role_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Selected role does not exist.'; END IF;
  IF NOT public.is_current_user_system_admin() AND (target_admin OR destination_admin) THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='settings_protected_admin';
  END IF;
  UPDATE public.profiles SET role_id=p_role_id WHERE id=p_user_id;
  RETURN jsonb_build_object('id',p_user_id,'role_id',p_role_id);
END;
$function$;

CREATE FUNCTION public.create_settings_role(p_name text,p_description text)
RETURNS public.roles LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
DECLARE result public.roles; trimmed_name text := btrim(p_name);
BEGIN
  LOCK TABLE public.roles,public.role_permissions,public.profiles IN SHARE ROW EXCLUSIVE MODE;
  IF auth.uid() IS NULL OR NOT public.has_module_permission('Permissions & User Rights','view')
      OR NOT public.has_module_permission('Permissions & User Rights','add') THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='settings_permission';
  END IF;
  IF trimmed_name IS NULL OR trimmed_name !~ '[^[:space:]]' THEN RAISE EXCEPTION 'Role name is required.'; END IF;
  IF EXISTS (SELECT 1 FROM public.roles WHERE lower(name)=lower(trimmed_name)) THEN RAISE EXCEPTION 'Role already exists.'; END IF;
  INSERT INTO public.roles(name,description,is_system_admin)
    VALUES(trimmed_name,coalesce(nullif(btrim(p_description),''),'Custom role'),false) RETURNING * INTO result;
  RETURN result;
END;
$function$;

CREATE FUNCTION public.delete_settings_role(p_role_id bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
DECLARE target_admin boolean;
BEGIN
  LOCK TABLE public.roles,public.role_permissions,public.profiles IN SHARE ROW EXCLUSIVE MODE;
  IF auth.uid() IS NULL OR NOT public.has_module_permission('Permissions & User Rights','view')
      OR NOT public.has_module_permission('Permissions & User Rights','delete') THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='settings_permission';
  END IF;
  SELECT is_system_admin INTO target_admin FROM public.roles WHERE id=p_role_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Role not found'; END IF;
  IF NOT public.is_current_user_system_admin() AND target_admin THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='settings_protected_admin';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE role_id=p_role_id AND is_active=true) THEN
    RAISE EXCEPTION 'You cannot delete a role while users are assigned to it.';
  END IF;
  DELETE FROM public.role_permissions WHERE role_id=p_role_id;
  DELETE FROM public.roles WHERE id=p_role_id;
  RETURN true;
END;
$function$;

CREATE FUNCTION public.save_settings_role_permissions(p_role_id bigint,p_permissions jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
DECLARE target_admin boolean; row_data jsonb; module text; key text;
BEGIN
  LOCK TABLE public.roles,public.role_permissions,public.profiles IN SHARE ROW EXCLUSIVE MODE;
  IF auth.uid() IS NULL OR NOT public.has_module_permission('Permissions & User Rights','view')
      OR NOT public.has_module_permission('Permissions & User Rights','edit') THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='settings_permission';
  END IF;
  SELECT is_system_admin INTO target_admin FROM public.roles WHERE id=p_role_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Role not found'; END IF;
  IF NOT public.is_current_user_system_admin() AND target_admin THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='settings_protected_admin';
  END IF;
  IF p_permissions IS NULL OR jsonb_typeof(p_permissions)<>'array' THEN RAISE EXCEPTION 'Invalid permissions'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_permissions) r GROUP BY r->>'module_name' HAVING count(*)>1) THEN
    RAISE EXCEPTION 'Duplicate permission module';
  END IF;
  -- Validate the whole payload before writing; never write legacy module rows.
  FOR row_data IN SELECT value FROM jsonb_array_elements(p_permissions) LOOP
    module := row_data->>'module_name';
    IF jsonb_typeof(row_data)<>'object' OR module IS NULL OR module NOT IN
      ('Dashboard','Recipes','Product Master','ERP Entry','Reports','Audit Trail','General Settings','Permissions & User Rights','Master Data')
      OR row_data->>'role_id' IS DISTINCT FROM p_role_id::text THEN RAISE EXCEPTION 'Invalid permission module or role'; END IF;
    FOREACH key IN ARRAY ARRAY['can_view','can_add','can_edit','can_delete','can_print'] LOOP
      IF jsonb_typeof(row_data->key) IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Invalid permission flag'; END IF;
    END LOOP;
    IF module='General Settings' AND ((row_data->>'can_add')::boolean OR (row_data->>'can_delete')::boolean)
      THEN RAISE EXCEPTION 'General Settings supports only View and Edit'; END IF;
    IF module NOT IN ('Reports','Audit Trail') AND (row_data->>'can_print')::boolean THEN RAISE EXCEPTION 'Unsupported Print'; END IF;
  END LOOP;
  FOR row_data IN SELECT value FROM jsonb_array_elements(p_permissions) LOOP
    INSERT INTO public.role_permissions(role_id,module_name,can_view,can_add,can_edit,can_delete,can_print)
    VALUES(p_role_id,row_data->>'module_name',(row_data->>'can_view')::boolean,(row_data->>'can_add')::boolean,
      (row_data->>'can_edit')::boolean,(row_data->>'can_delete')::boolean,(row_data->>'can_print')::boolean)
    ON CONFLICT(role_id,module_name) DO UPDATE SET
      can_view=excluded.can_view,can_add=excluded.can_add,can_edit=excluded.can_edit,
      can_delete=excluded.can_delete,can_print=excluded.can_print,updated_at=now();
  END LOOP;
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_settings_profile(text),public.assign_settings_user_role(uuid,bigint),
  public.create_settings_role(text,text),public.delete_settings_role(bigint),public.save_settings_role_permissions(bigint,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.update_settings_profile(text),public.assign_settings_user_role(uuid,bigint),
  public.create_settings_role(text,text),public.delete_settings_role(bigint),public.save_settings_role_permissions(bigint,jsonb) TO authenticated;

COMMIT;
