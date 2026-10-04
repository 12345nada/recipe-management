BEGIN;

-- Extend the existing permission row; leave every previous value intact.
ALTER TABLE public.role_permissions
  ADD COLUMN can_print boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT role_permissions_print_modules_check
    CHECK (NOT can_print OR lower(btrim(module_name)) IN ('reports', 'audit trail'));

-- Preserve the live function's signature, settings, admin override and old branches.
DO $$
DECLARE
  definition text := pg_get_functiondef('public.has_module_permission(text,text)'::regprocedure);
  updated_definition text;
BEGIN
  updated_definition := regexp_replace(definition,
    'else false[[:space:]]+end',
    'when lower(p_action) = ''print'' then rp.can_print AND lower(trim(p_module)) IN (''reports'', ''audit trail'') else false end');
  IF updated_definition = definition THEN
    RAISE EXCEPTION 'Unexpected has_module_permission definition; aborting migration';
  END IF;
  EXECUTE updated_definition;
END;
$$;

COMMIT;
