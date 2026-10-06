// Isolated PGlite only: this test has no Supabase client or network requests.
// READER_SCHEMA_FIXTURE points to a previously captured SELECT-only schema snapshot.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const root = path.resolve(import.meta.dirname, "..");
assert(process.env.READER_SCHEMA_FIXTURE, "Set READER_SCHEMA_FIXTURE to the captured schema snapshot");
const capture = JSON.parse(fs.readFileSync(process.env.READER_SCHEMA_FIXTURE, "utf8").replace(/^\uFEFF/, ""));
const fixture = capture.snapshot || capture.rows[0].snapshot;
const { PGlite } = await import(process.env.PGLITE_MODULE ? pathToFileURL(process.env.PGLITE_MODULE).href : "@electric-sql/pglite");
const migration = fs.readFileSync(path.join(root, "supabase/migrations/20261005000100_recipe_reader_assignments.sql"), "utf8");
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const uid = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let passed = 0;
const pass = (name) => { passed++; console.log(`PASS ${name}`); };
const db = new PGlite(process.env.READER_DB_DIRECTORY || undefined);
try {
  await db.exec(`CREATE ROLE authenticated; CREATE ROLE anon; CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated,anon;`);
  for (const table of [...new Set(fixture.columns.map((column) => column.table))]) {
    const columns = fixture.columns.filter((column) => column.table === table).map((column) =>
      `"${column.name}" ${column.type}${column.identity ? ` GENERATED ${column.identity === "a" ? "ALWAYS" : "BY DEFAULT"} AS IDENTITY`
        : column.default ? ` DEFAULT ${column.default}` : ""}${column.notnull ? " NOT NULL" : ""}`).join(",");
    await db.exec(`CREATE TABLE public.${table}(${columns});`);
  }
  for (const sequence of fixture.sequences) {
    if (!["roles_id_seq", "role_permissions_id_seq", "audit_logs_id_seq", "system_settings_id_seq"].includes(sequence.sequencename)) {
      await db.exec(`CREATE SEQUENCE public.${sequence.sequencename};`);
    }
  }
  for (const constraint of [...fixture.constraints.filter((c) => !c.definition.startsWith("FOREIGN KEY")), ...fixture.constraints.filter((c) => c.definition.startsWith("FOREIGN KEY"))]) {
    await db.exec(`ALTER TABLE public.${constraint.table} ADD CONSTRAINT ${constraint.name} ${constraint.definition};`);
  }
  for (const [table, rows] of [["roles", fixture.roles], ["role_permissions", fixture.permissions], ["product_master_values", fixture.metadata]]) {
    const columns = fixture.columns.filter((column) => column.table === table).map((column) => `"${column.name}"`).join(",");
    await db.exec(`INSERT INTO public.${table}(${columns}) OVERRIDING SYSTEM VALUE SELECT ${columns}
      FROM jsonb_populate_recordset(NULL::public.${table},${quote(JSON.stringify(rows))}::jsonb);`);
  }
  // Explicit fixture IDs must not collide with locally inserted permission IDs.
  await db.exec(`SELECT setval('role_permissions_id_seq',(SELECT max(id) FROM role_permissions),true);`);
  for (const definition of fixture.functions) await db.exec(definition.definition);
  await db.exec(`INSERT INTO auth.users VALUES('${uid(1)}'),('${uid(2)}'),('${uid(3)}'),('${uid(4)}');
    INSERT INTO profiles(id,full_name,username,email,role_id) VALUES
      ('${uid(1)}','Local admin','local-admin','admin@example.invalid',1),
      ('${uid(2)}','Local delegate','local-delegate','delegate@example.invalid',4),
      ('${uid(3)}','Local reader','local-reader','reader@example.invalid',4),
      ('${uid(4)}','Other reader','other-reader','other@example.invalid',4);
    INSERT INTO products(id,product_code,name,product_type,category,base_unit,created_by) VALUES
      ('${uid(10)}','LOCAL-SF','خبز bread','Semi-Finished','مخبوزات','Kg','${uid(1)}'),
      ('${uid(11)}','LOCAL-RM','طحين flour','Raw Material','Flour','Kg','${uid(1)}');
    INSERT INTO recipes(id,recipe_number,recipe_code,product_id,description,yield_quantity,yield_unit,status,created_by,approved_at,updated_at)
      VALUES('${uid(20)}','LOCAL-R','LOCAL-R','${uid(10)}','وصف عربي English',1,'Kg','Approved','${uid(1)}',now(),now());
    INSERT INTO recipe_ingredients(id,recipe_id,product_id,quantity,unit) VALUES('${uid(30)}','${uid(20)}','${uid(11)}',1,'Kg');`);
  for (const table of ["recipes", "recipe_ingredients", "recipe_approvals", "products", "profiles", "roles", "role_permissions", "product_master_values", "erp_entries"]) {
    await db.exec(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY; GRANT SELECT,INSERT,UPDATE,DELETE ON public.${table} TO authenticated;`);
    for (const policy of fixture.policies.filter((p) => p.tablename === table)) {
      await db.exec(`CREATE POLICY "${policy.policyname}" ON public.${table} AS ${policy.permissive} FOR ${policy.cmd} TO ${policy.roles.join(",")}${policy.qual ? ` USING (${policy.qual})` : ""}${policy.with_check ? ` WITH CHECK (${policy.with_check})` : ""};`);
    }
  }
  await db.exec("GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;");
  const snapshot = async () => (await db.query(`SELECT jsonb_build_object(
    'recipes',(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM recipes x),
    'products',(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM products x),
    'ingredients',(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM recipe_ingredients x),
    'approvals',(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM recipe_approvals x),
    'erp',(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM erp_entries x),
    'roles',(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM roles x),
    'profiles',(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM profiles x),
    'masters',(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM product_master_values x),
    'permissions',(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM role_permissions x WHERE module_name<>'Recipe Reader Assignments'),
    'policies',(SELECT jsonb_agg(to_jsonb(x) ORDER BY tablename,policyname) FROM pg_policies x WHERE tablename<>'recipe_reader_assignments'),
    'functions',(SELECT jsonb_agg(jsonb_build_object('name',p.proname,'definition',pg_get_functiondef(p.oid)) ORDER BY p.proname)
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f'
      AND p.proname<>'save_settings_role_permissions' AND p.proname NOT LIKE '%reader%')) AS state`)).rows[0].state;
  const before = await snapshot();
  await db.exec(migration);
  assert.deepEqual(await snapshot(), before);
  pass("migration preserves existing application rows, roles, profiles, permissions, master values, policies and workflow functions");
  assert.equal((await db.query("SELECT count(*) FROM role_permissions WHERE module_name='Recipe Reader Assignments' AND (can_view OR can_add OR can_edit OR can_delete OR can_print)")).rows[0].count, 0);
  pass("missing management permissions initialized OFF; system-admin override unchanged");
  const runAs = async (id, sql, args = []) => {
    await db.exec("RESET ROLE"); await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [id]); await db.exec("SET ROLE authenticated");
    try { return await db.query(sql, args); } finally { await db.exec("RESET ROLE"); }
  };
  const recipe = async () => (await db.query("SELECT * FROM recipes WHERE id=$1", [uid(20)])).rows[0];
  const assign = async (who = uid(1), target = uid(3), stamp) => (await runAs(who,
    "SELECT assign_recipe_reader($1,$2,$3) AS result", [uid(20), target, stamp || (await recipe()).updated_at])).rows[0].result;
  for (const action of ["add", "delete"]) {
    await db.query(`UPDATE role_permissions SET can_view=false,can_${action}=true WHERE role_id=4 AND module_name='Recipe Reader Assignments'`);
    if (action === "add") await assert.rejects(assign(uid(2)), /reader_permission/);
    else await assert.rejects(runAs(uid(2), "SELECT revoke_recipe_reader_assignment($1)", [uid(99)]), /reader_permission/);
    await db.query(`UPDATE role_permissions SET can_view=true,can_${action}=false WHERE role_id=4 AND module_name='Recipe Reader Assignments'`);
    if (action === "add") await assert.rejects(assign(uid(2)), /reader_permission/);
    else await assert.rejects(runAs(uid(2), "SELECT revoke_recipe_reader_assignment($1)", [uid(99)]), /reader_permission/);
  }
  pass("management View OFF + action ON and View ON + action OFF are denied server-side");
  for (const status of ["Draft", "Submitted", "Rejected", "Pending Approval", "Under Review"]) {
    await db.query("UPDATE recipes SET status=$1 WHERE id=$2", [status, uid(20)]);
    await assert.rejects(assign(), /reader_not_approved/);
  }
  await db.query("UPDATE recipes SET status='Approved' WHERE id=$1", [uid(20)]);
  await assert.rejects(assign(uid(1), uid(3), "2000-01-01T00:00:00Z"), /reader_stale/);
  await db.query("UPDATE profiles SET is_active=false WHERE id=$1", [uid(4)]);
  await assert.rejects(assign(uid(1), uid(4)), /reader_inactive/);
  await db.query("UPDATE profiles SET is_active=true WHERE id=$1", [uid(4)]);
  pass("assignment eligibility, stale state and inactive-recipient protections");
  const assignment = await assign();
  const adminAssignment = await assign(uid(1), uid(1));
  assert.equal(adminAssignment.assigned_user_id, uid(1));
  pass("recipient may be an existing Approver or system-admin; assignment is not a Reader-only role");
  await assert.rejects(assign(), /reader_duplicate/);
  const duplicateResults = await Promise.allSettled([assign(uid(1), uid(4)), assign(uid(1), uid(4))]);
  assert.equal(duplicateResults.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(duplicateResults.filter((r) => r.status === "rejected" && /reader_duplicate/.test(r.reason.message)).length, 1);
  pass("duplicate and concurrently submitted assignment attempts create only one active row (PGlite serial execution)");
  await db.query("UPDATE role_permissions SET can_view=false,can_add=false,can_edit=false,can_delete=false,can_print=false WHERE role_id=4");
  const listed = (await runAs(uid(3), "SELECT list_my_recipe_reader_assignments() AS result")).rows[0].result;
  assert.equal(listed.length, 1); assert.equal(listed[0].id, assignment.id);
  const content = (await runAs(uid(3), "SELECT get_recipe_reader_assignment($1) AS result", [assignment.id])).rows[0].result;
  assert.equal(content.description, "وصف عربي English"); assert.equal(content.ingredients[0].name, "طحين flour");
  assert.equal((await runAs(uid(3), "SELECT * FROM recipes")).rows.length, 0);
  assert.equal((await runAs(uid(3), "UPDATE recipes SET status='Rejected' RETURNING id")).rows.length, 0);
  assert.equal((await runAs(uid(3), "DELETE FROM recipes RETURNING id")).rows.length, 0);
  assert.equal((await runAs(uid(3), "UPDATE recipe_ingredients SET quantity=9 RETURNING id")).rows.length, 0);
  assert.equal((await runAs(uid(3), "SELECT * FROM recipe_reader_assignments")).rows.length, 1);
  pass("assignment-only access works without Recipes/management View; existing base-table RLS stays unchanged");
  for (const rpc of ["get_recipe_reader_assignment", "get_recipe_reader_print_data", "mark_recipe_reader_assignment_read"]) {
    await assert.rejects(runAs(uid(4), `SELECT ${rpc}($1)`, [assignment.id]), /reader_unavailable/);
    await assert.rejects(runAs(uid(1), `SELECT ${rpc}($1)`, [assignment.id]), /reader_unavailable/);
  }
  pass("cross-user read, print and acknowledgement denied, including an admin acknowledging another user");
  await assert.rejects(runAs(uid(3), "UPDATE recipe_reader_assignments SET read_at=now() WHERE id=$1", [assignment.id]), /permission denied/);
  await assert.rejects(runAs(uid(3), "DELETE FROM recipe_reader_assignments WHERE id=$1", [assignment.id]), /permission denied/);
  await assert.rejects(runAs(uid(3), "INSERT INTO recipe_reader_assignments(recipe_id,assigned_user_id,assigned_by) VALUES($1,$2,$2)", [uid(20), uid(3)]), /permission denied/);
  await db.exec("SET ROLE anon");
  await assert.rejects(db.query("SELECT list_my_recipe_reader_assignments()"), /permission denied/);
  await db.exec("RESET ROLE");
  pass("direct mutation/forged timestamps and anonymous RPC execution denied");
  const unchangedBeforeActions = await recipe();
  const firstRead = (await runAs(uid(3), "SELECT mark_recipe_reader_assignment_read($1) AS result", [assignment.id])).rows[0].result;
  const repeated = (await runAs(uid(3), "SELECT mark_recipe_reader_assignment_read($1) AS result", [assignment.id])).rows[0].result;
  assert(firstRead.read_at); assert.equal(repeated.read_at, firstRead.read_at);
  assert.equal((await runAs(uid(3), "SELECT get_recipe_reader_print_data($1) AS result", [assignment.id])).rows[0].result.description, content.description);
  assert.deepEqual(await recipe(), unchangedBeforeActions);
  pass("Mark as Read is server-timed/idempotent; print and acknowledgement do not update the recipe");
  for (const status of ["ERP Pending", "ERP Completed"]) {
    await db.query("UPDATE recipes SET status=$1 WHERE id=$2", [status, uid(20)]);
    assert.equal((await runAs(uid(3), "SELECT get_recipe_reader_assignment($1) AS result", [assignment.id])).rows[0].result.status, status);
    await runAs(uid(3), "SELECT get_recipe_reader_print_data($1)", [assignment.id]);
  }
  await db.query("UPDATE recipes SET status='Submitted' WHERE id=$1", [uid(20)]);
  await assert.rejects(runAs(uid(3), "SELECT get_recipe_reader_assignment($1)", [assignment.id]), /reader_unavailable/);
  await assert.rejects(runAs(uid(3), "SELECT mark_recipe_reader_assignment_read($1)", [assignment.id]), /reader_not_approved/);
  await assert.rejects(runAs(uid(3), "SELECT get_recipe_reader_print_data($1)", [assignment.id]), /reader_unavailable/);
  await db.query("UPDATE recipes SET status='Approved' WHERE id=$1", [uid(20)]);
  assert.equal((await runAs(uid(3), "SELECT get_recipe_reader_assignment($1) AS result", [assignment.id])).rows[0].result.read_at, firstRead.read_at);
  pass("ERP-state access remains available; resubmission suspends Reader access without resetting read history");
  await db.query("UPDATE profiles SET is_active=false WHERE id=$1", [uid(3)]);
  await assert.rejects(runAs(uid(3), "SELECT get_recipe_reader_assignment($1)", [assignment.id]), /reader_permission/);
  assert.equal((await runAs(uid(3), "SELECT * FROM recipe_reader_assignments")).rows.length, 0);
  await db.query("UPDATE profiles SET is_active=true WHERE id=$1", [uid(3)]);
  pass("inactive Reader loses RPC and RLS access");
  await runAs(uid(1), "SELECT revoke_recipe_reader_assignment($1)", [assignment.id]);
  for (const rpc of ["get_recipe_reader_assignment", "get_recipe_reader_print_data", "mark_recipe_reader_assignment_read"]) {
    await assert.rejects(runAs(uid(3), `SELECT ${rpc}($1)`, [assignment.id]), /reader_unavailable/);
  }
  assert.equal((await runAs(uid(3), "SELECT list_my_recipe_reader_assignments() AS result")).rows[0].result.length, 0);
  const reassigned = await assign(); assert.notEqual(reassigned.id, assignment.id); assert.equal(reassigned.read_at, null);
  assert.equal((await db.query("SELECT read_at FROM recipe_reader_assignments WHERE id=$1", [assignment.id])).rows[0].read_at.toISOString(), new Date(firstRead.read_at).toISOString());
  await assert.rejects(db.query("DELETE FROM recipes WHERE id=$1", [uid(20)]), /foreign key/);
  await assert.rejects(db.query("DELETE FROM profiles WHERE id=$1", [uid(3)]), /foreign key/);
  pass("revocation blocks access, reassignment starts unread and FK RESTRICT preserves history");
  const flags = [{ role_id: 4, module_name: "Recipe Reader Assignments", can_view: true, can_add: true, can_edit: false, can_delete: true, can_print: false }];
  await db.query("UPDATE role_permissions SET can_view=true WHERE role_id=4 AND module_name='Recipes'");
  await runAs(uid(1), "SELECT save_settings_role_permissions($1,$2)", [4, JSON.stringify(flags)]);
  assert.equal((await assign(uid(2), uid(2))).assigned_by, uid(2));
  await runAs(uid(2), "SELECT revoke_recipe_reader_assignment($1)", [reassigned.id]);
  await assert.rejects(runAs(uid(1), "SELECT save_settings_role_permissions($1,$2)", [4, JSON.stringify([{ ...flags[0], can_edit: true }])]), /do not support Edit/);
  await assert.rejects(runAs(uid(1), "SELECT save_settings_role_permissions($1,$2)", [4, JSON.stringify([{ ...flags[0], can_print: true }])]), /Unsupported Print/);
  await db.query("UPDATE role_permissions SET can_view=false WHERE role_id=4 AND module_name='Recipes'");
  await assert.rejects(assign(uid(2), uid(2)), /reader_permission/);
  pass("delegated assignment/revocation permissions work; Recipes View prerequisite and unsupported Edit/Print enforced");
  const contracts = {
    list_recipe_reader_candidates: ["p_recipe_id"], assign_recipe_reader: ["p_recipe_id", "p_assigned_user_id", "p_expected_updated_at"],
    list_my_recipe_reader_assignments: [], get_recipe_reader_assignment: ["p_assignment_id"],
    mark_recipe_reader_assignment_read: ["p_assignment_id"], list_recipe_reader_assignments: ["p_recipe_id"],
    revoke_recipe_reader_assignment: ["p_assignment_id"], get_recipe_reader_print_data: ["p_assignment_id"],
  };
  const service = fs.readFileSync(path.join(root, "src/services/recipeReaderService.js"), "utf8");
  for (const [name, params] of Object.entries(contracts)) {
    const definition = migration.match(new RegExp(`CREATE FUNCTION public\\.${name}\\(([^)]*)\\)`));
    assert(definition, name); assert.deepEqual(definition[1] ? definition[1].split(",").map((part) => part.trim().split(/\s+/)[0]) : [], params);
    assert(service.includes(`"${name}"`)); for (const param of params) assert(service.includes(`${param}:`));
  }
  assert(!/UPDATE\s+public\.(recipes|recipe_approvals|erp_entries)|DELETE\s+FROM\s+public\.(recipes|recipe_approvals|erp_entries)|nextval|setval|TRUNCATE/i.test(migration));
  pass("all eight RPC/service contracts match; migration contains no recipe/approval/ERP writes or sequence operations");
  // Reinstall existing workflow triggers only in this isolated database and verify their behavior.
  for (const trigger of fixture.triggers.filter((item) => ["recipe_workflow_notifications", "trigger_recipe_status_dates", "trigger_handle_erp_entry"].includes(item.name))) await db.exec(trigger.definition);
  await db.query("UPDATE recipes SET status='Draft' WHERE id=$1", [uid(20)]);
  await db.query("UPDATE recipes SET status='Submitted' WHERE id=$1", [uid(20)]);
  await db.query("INSERT INTO recipe_approvals(recipe_id,approver_id,decision) VALUES($1,$2,'Approved')", [uid(20), uid(1)]);
  await db.query("UPDATE recipes SET status='Approved' WHERE id=$1", [uid(20)]);
  await db.query("INSERT INTO erp_entries(recipe_id,entered_by,status) VALUES($1,$2,'Pending')", [uid(20), uid(1)]);
  assert.equal((await recipe()).status, "ERP Pending");
  await db.query("UPDATE erp_entries SET status='Completed' WHERE recipe_id=$1", [uid(20)]);
  assert.equal((await recipe()).status, "ERP Completed");
  pass("existing Draft → Submitted → Approved → ERP Pending → ERP Completed trigger workflow remains unchanged");
  console.log(`Reader assignment tests: ${passed} PASS`);
} finally { await db.close(); }
