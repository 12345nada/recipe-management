BEGIN;

-- Change only the existing RPC permission module; retain all other safeguards.
DO $$
DECLARE
  definition text := pg_get_functiondef('public.manage_product_master_value(text,text,uuid,text,timestamptz)'::regprocedure);
  updated_definition text;
BEGIN
  updated_definition := replace(definition,
    'public.has_module_permission(''Product Master'', required_permission)',
    'public.has_module_permission(''Settings'', required_permission)');
  IF updated_definition = definition THEN
    RAISE EXCEPTION 'Unexpected master-value permission definition; aborting migration';
  END IF;
  EXECUTE updated_definition;
END;
$$;

-- Preserve Product Master option selection and admit Settings readers/managers.
ALTER POLICY product_master_values_read ON public.product_master_values
  USING (public.has_module_permission('Product Master', 'view')
    OR public.has_module_permission('Product Master', 'add')
    OR public.has_module_permission('Product Master', 'edit')
    OR public.has_module_permission('Product Master', 'delete')
    OR public.has_module_permission('Settings', 'view')
    OR public.has_module_permission('Settings', 'add')
    OR public.has_module_permission('Settings', 'edit')
    OR public.has_module_permission('Settings', 'delete'));

COMMIT;
