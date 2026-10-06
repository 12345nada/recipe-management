// All mutations are in an isolated PGlite instance; no Supabase/network client.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
assert(process.env.NOTIFICATION_SCHEMA_FIXTURE && process.env.PGLITE_MODULE);
const fixture = JSON.parse(fs.readFileSync(process.env.NOTIFICATION_SCHEMA_FIXTURE, "utf8")).snapshot;
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_MODULE).href);
const db = new PGlite(process.env.NOTIFICATION_DB_DIRECTORY || undefined);
const uid = (n) => `00000000-0000-0000-0000-${String(n).padStart(12,"0")}`;
const pass = (name) => console.log(`PASS ${name}`);
try {
  await db.exec(`CREATE ROLE authenticated; CREATE ROLE anon; CREATE ROLE service_role; CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated,anon;`);
  for (const table of [...new Set(fixture.columns.map((c) => c.table))]) {
    const columns = fixture.columns.filter((c) => c.table === table).map((c) =>
      `"${c.name}" ${c.type}${c.identity ? ` GENERATED ${c.identity === "a" ? "ALWAYS" : "BY DEFAULT"} AS IDENTITY` : c.default ? ` DEFAULT ${c.default}` : ""}${c.notnull ? " NOT NULL" : ""}`).join(",");
    await db.exec(`CREATE TABLE public.${table}(${columns});`);
  }
  for (const sequence of fixture.sequences) {
    if (!["roles_id_seq","role_permissions_id_seq","audit_logs_id_seq","system_settings_id_seq"].includes(sequence.sequencename)) await db.exec(`CREATE SEQUENCE public.${sequence.sequencename};`);
  }
  for (const c of [...fixture.constraints.filter((c) => !c.definition.startsWith("FOREIGN KEY")), ...fixture.constraints.filter((c) => c.definition.startsWith("FOREIGN KEY"))]) await db.exec(`ALTER TABLE public.${c.table} ADD CONSTRAINT "${c.name}" ${c.definition};`);
  for (const index of fixture.indexes) {
    if (!(await db.query("SELECT to_regclass($1) AS name",["public."+index.indexname])).rows[0].name) await db.exec(index.indexdef);
  }
  for (const f of fixture.functions) await db.exec(f.definition);
  // Recreate the current notification policies/grants, including the unsafe
  // historical grants, so the real migration has to remove them.
  await db.exec(`ALTER TABLE notifications ENABLE ROW LEVEL SECURITY; GRANT SELECT,UPDATE,TRUNCATE,REFERENCES,TRIGGER ON notifications TO authenticated;
    GRANT TRUNCATE,REFERENCES,TRIGGER ON notifications TO anon;
    GRANT ALL ON notifications TO service_role;`);
  for (const p of fixture.policies.filter((p) => p.tablename === "notifications")) await db.exec(`CREATE POLICY "${p.policyname}" ON notifications FOR ${p.cmd} TO ${p.roles.join(",")}${p.qual ? ` USING (${p.qual})` : ""}${p.with_check ? ` WITH CHECK (${p.with_check})` : ""};`);
  await db.exec(`CREATE TRIGGER recipe_workflow_notifications AFTER INSERT OR UPDATE OF status ON recipes
    FOR EACH ROW EXECUTE FUNCTION create_recipe_workflow_notifications();
    INSERT INTO roles(id,name,description,is_system_admin) OVERRIDING SYSTEM VALUE VALUES
      (1,'Administrator','local',true),(2,'Approver','local',false),(3,'Unrelated administrator erp approver','local',false),
      (4,'Processing staff','local',false),(5,'Reader','local',false),(6,'Inactive staff','inactive',false);
    INSERT INTO auth.users SELECT ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid FROM generate_series(1,6) n;
    INSERT INTO profiles(id,full_name,username,email,role_id,is_active)
      SELECT id,'Local '||n,'local-'||n,'local-'||n||'@example.invalid',CASE WHEN n=6 THEN 2 ELSE n END,n<>6 FROM auth.users JOIN generate_series(1,6) n ON id=('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid;
    INSERT INTO role_permissions(role_id,module_name,can_view,can_add,can_edit,can_delete,can_print) VALUES
      (1,'Recipes',true,true,true,true,false),(1,'ERP Entry',false,false,false,false,false),
      (2,'Recipes',true,false,false,false,false),(3,'Recipes',true,false,false,false,false),
      (3,'ERP Entry',false,true,true,false,false),(4,'ERP Entry',true,true,false,false,false),
      (5,'Recipes',false,false,false,false,false),(6,'Recipes',true,false,false,false,false);
    INSERT INTO product_master_values(kind,value,is_active,type_key,arabic_name,code_prefix,allows_ingredient,allows_recipe_product,is_system_type,code_counter)
      VALUES('product_type','Semi-Finished',true,'Semi-Finished','منتج نصف مصنع','SF',true,true,true,NULL);
    INSERT INTO products(id,product_code,name,product_type,category,base_unit,created_by)
      VALUES('${uid(10)}','LOCAL-SF','خبز bread','Semi-Finished','Bakery','Kg','${uid(1)}');
    INSERT INTO recipes(id,recipe_number,recipe_code,product_id,description,yield_quantity,yield_unit,status,created_by)
      VALUES('${uid(20)}','LOCAL-R','LOCAL-R','${uid(10)}','Description',1,'Kg','Draft','${uid(1)}');`);
  const migration = fs.readFileSync(path.resolve("supabase/migrations/20261006000100_notification_system.sql"), "utf8");
  const businessSnapshot = async () => (await db.query(`SELECT jsonb_build_object(
    'products',(SELECT jsonb_agg(to_jsonb(x)) FROM products x),'recipes',(SELECT jsonb_agg(to_jsonb(x)) FROM recipes x),
    'profiles',(SELECT jsonb_agg(to_jsonb(x)) FROM profiles x),'roles',(SELECT jsonb_agg(to_jsonb(x)) FROM roles x),
    'permissions',(SELECT jsonb_agg(to_jsonb(x)) FROM role_permissions x),'metadata',(SELECT jsonb_agg(to_jsonb(x)) FROM product_master_values x),
    'approvals',(SELECT jsonb_agg(to_jsonb(x)) FROM recipe_approvals x),'erp',(SELECT jsonb_agg(to_jsonb(x)) FROM erp_entries x),
    'sequences',(SELECT jsonb_agg(to_jsonb(x) ORDER BY sequencename) FROM pg_sequences x WHERE schemaname='public')) AS state`)).rows[0].state;
  const before = await businessSnapshot();
  const unrelatedDefinitions = async () => (await db.query(`SELECT jsonb_agg(jsonb_build_object('name',p.proname,'definition',pg_get_functiondef(p.oid),'acl',p.proacl) ORDER BY p.proname) AS value
    FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.prokind='f' AND p.proname NOT IN
      ('create_recipe_workflow_notifications','create_reader_assignment_notifications','mark_notification_read','mark_all_notifications_read','get_notification_unread_count','get_notification_destination')`)).rows[0].value;
  const functionsBefore=await unrelatedDefinitions();
  const policiesBefore=(await db.query("SELECT * FROM pg_policies ORDER BY schemaname,tablename,policyname")).rows;
  await db.exec(migration); assert.deepEqual(await businessSnapshot(),before);
  assert.deepEqual(await unrelatedDefinitions(),functionsBefore);
  assert.deepEqual((await db.query("SELECT * FROM pg_policies ORDER BY schemaname,tablename,policyname")).rows,policiesBefore);
  pass("migration preserves application rows, roles/permissions, metadata and numbering");
  const as = async (id,sql,args=[]) => {
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[id || ""]); await db.exec("SET ROLE authenticated");
    try { return await db.query(sql,args); } finally { await db.exec("RESET ROLE"); }
  };
  const all = async (type) => (await db.query("SELECT * FROM notifications WHERE notification_type=$1 ORDER BY created_at,id",[type])).rows;
  const status = (value) => db.query("UPDATE recipes SET status=$1 WHERE id=$2",[value,uid(20)]);
  assert.equal((await db.query("SELECT count(*) FROM notifications")).rows[0].count,0);
  await status("Submitted"); let review=await all("pending_approval");
  assert.deepEqual(review.map((r)=>r.user_id).sort(),[uid(1),uid(2)]);
  await status("Submitted"); assert.equal((await all("pending_approval")).length,2);
  pass("submission: actual reviewers only; substrings/inactive recipients excluded; unchanged-status retry creates no duplicates");
  await status("Draft"); review=await all("pending_approval"); assert(review.every((r)=>r.resolved_at && !r.is_read && !r.read_at));
  await status("Submitted"); assert.equal((await all("pending_approval")).filter((r)=>!r.resolved_at).length,2);
  pass("withdrawal resolves tasks without personal acknowledgement; resubmission creates fresh tasks");
  await db.query("UPDATE recipes SET status='Rejected',rejection_comment='تحتاج تعديل' WHERE id=$1",[uid(20)]);
  const rejection=(await all("rejected"))[0]; assert.equal(rejection.user_id,uid(1));assert.equal(rejection.metadata.reason,"تحتاج تعديل");
  await status("Submitted"); await db.query("UPDATE recipes SET status='Approved',approved_at=now() WHERE id=$1",[uid(20)]);
  assert.deepEqual((await all("approved")).map((r)=>r.user_id),[uid(1)]);
  assert.deepEqual((await all("erp_pending")).map((r)=>r.user_id),[uid(4)]);
  await status("Approved"); assert.equal((await all("approved")).length,1);
  assert.equal((await as(uid(4),"SELECT get_notification_destination($1) AS value",[(await all("erp_pending"))[0].id])).rows[0].value,`/erp-entry/${uid(20)}`);
  await status("ERP Pending"); assert.equal((await all("erp_pending")).length,1);assert((await all("erp_pending"))[0].resolved_at);
  await status("ERP Completed"); assert.deepEqual((await all("erp_completed")).map((r)=>r.user_id),[uid(1)]);
  pass("approval/rejection/ERP: active creator, reason, permission-based ERP recipients, no duplicate ReadyERP; obsolete task resolved");
  const businessBeforeReader=await businessSnapshot();
  const stamp=(await db.query("SELECT updated_at FROM recipes WHERE id=$1",[uid(20)])).rows[0].updated_at;
  const assignment=(await as(uid(1),"SELECT assign_recipe_reader($1,$2,$3) AS value",[uid(20),uid(5),stamp])).rows[0].value;
  await assert.rejects(as(uid(1),"SELECT assign_recipe_reader($1,$2,$3)",[uid(20),uid(5),stamp]),/reader_duplicate/);
  await assert.rejects(as(uid(1),"SELECT assign_recipe_reader($1,$2,$3)",[uid(20),uid(4),"2000-01-01T00:00:00Z"]),/reader_stale/);
  assert.equal((await all("reader_assigned")).length,1);
  let assigned=(await all("reader_assigned"))[0]; assert.equal(assigned.user_id,uid(5));assert.equal(assigned.metadata.assignment_id,assignment.id);
  assert.equal((await as(uid(5),"SELECT get_notification_destination($1) AS value",[assigned.id])).rows[0].value,`/recipes/reader/${assignment.id}`);
  const countBeforeRead=(await db.query("SELECT count(*) FROM notifications")).rows[0].count;
  await as(uid(5),"SELECT mark_recipe_reader_assignment_read($1)",[assignment.id]);
  assert.equal((await db.query("SELECT count(*) FROM notifications")).rows[0].count,countBeforeRead);
  await as(uid(1),"SELECT revoke_recipe_reader_assignment($1)",[assignment.id]);
  await as(uid(1),"SELECT revoke_recipe_reader_assignment($1)",[assignment.id]);
  assert.equal((await all("reader_revoked")).length,1);assert.equal((await all("reader_revoked"))[0].user_id,uid(5));
  assert.equal((await as(uid(5),"SELECT get_notification_destination($1) AS value",[assigned.id])).rows[0].value,null);
  assert.equal((await as(uid(5),"SELECT get_notification_destination($1) AS value",[(await all("reader_revoked"))[0].id])).rows[0].value,"/recipes?tab=assigned");
  assert.deepEqual(await businessSnapshot(),businessBeforeReader);
  pass("real Reader RPCs: assignment-only destination, first revoke once, silent Mark as Read, no recipe/approval/ERP/business writes");
  await assert.rejects(as(uid(3),"SELECT mark_notification_read($1)",[assigned.id]),/notification_unavailable/);
  await assert.rejects(as(uid(3),"SELECT get_notification_destination($1)",[assigned.id]),/notification_unavailable/);
  await assert.rejects(as(uid(1),"SELECT mark_notification_read($1)",[uid(99)]),/notification_unavailable/);
  const ack=(await as(uid(5),"SELECT mark_notification_read($1) AS value",[assigned.id])).rows[0].value;
  assert(ack.is_read && ack.read_at);
  assert.equal((await as(uid(5),"SELECT mark_notification_read($1) AS value",[assigned.id])).rows[0].value.read_at,ack.read_at);
  for(const statement of ["UPDATE notifications SET title='forged'","DELETE FROM notifications","INSERT INTO notifications(user_id,notification_type,title,message) VALUES(auth.uid(),'forged','bad','bad')","TRUNCATE notifications"]) await assert.rejects(as(uid(5),statement),/permission denied/);
  assert((await as(uid(5),"SELECT * FROM notifications")).rows.every((n)=>n.user_id===uid(5)));
  for(const role of ["anon","authenticated"]) assert.equal((await db.query("SELECT has_table_privilege($1,'notifications','TRUNCATE') AS value",[role])).rows[0].value,false);
  await db.exec("SET ROLE anon");await assert.rejects(db.query("SELECT get_notification_unread_count()"),/permission denied/);await db.exec("RESET ROLE");
  pass("owner-only read/acknowledgement; nonexistent/cross-user operations denied; server timestamps; direct mutations/TRUNCATE/anonymous RPCs blocked");
  await db.query(`INSERT INTO notifications(user_id,notification_type,title,message) SELECT $1,'legacy','Stored title','Stored message' FROM generate_series(1,40)`,[uid(5)]);
  assert.equal((await as(uid(5),"SELECT get_notification_unread_count() AS value")).rows[0].value,41);
  assert.equal((await as(uid(5),"SELECT mark_all_notifications_read() AS value")).rows[0].value,41);
  assert.equal((await as(uid(5),"SELECT get_notification_unread_count() AS value")).rows[0].value,0);
  assert.equal((await db.query("SELECT count(*) FROM notifications WHERE user_id=$1 AND (NOT is_read OR read_at IS NULL)",[uid(5)])).rows[0].count,0);
  assert((await all("pending_approval")).some((r)=>!r.is_read));
  await db.query("UPDATE profiles SET is_active=false WHERE id=$1",[uid(1)]);await status("Submitted");await status("Rejected");
  assert.equal((await all("rejected")).length,1);
  await assert.rejects(as(uid(1),"SELECT get_notification_unread_count()"),/notification_permission/);
  pass("all-row unread count >30; Mark All affects owner only; inactive creator suppressed; inactive caller denied");
  await db.query("UPDATE profiles SET is_active=true WHERE id=$1",[uid(1)]);
  await db.query("UPDATE role_permissions SET can_view=false WHERE role_id=2 AND module_name='Recipes'");
  await status("Draft");await status("Submitted");
  assert.deepEqual((await all("pending_approval")).filter((n)=>!n.resolved_at).map((n)=>n.user_id),[uid(1)]);
  await db.query("UPDATE role_permissions SET can_view=true WHERE role_id=2 AND module_name='Recipes'");
  const activeReview=(await all("pending_approval")).find((n)=>!n.resolved_at);
  assert.equal((await as(uid(1),"SELECT get_notification_destination($1) AS value",[activeReview.id])).rows[0].value,`/recipes/${uid(20)}`);
  await db.query("INSERT INTO notifications(user_id,recipe_id,notification_type,title,message) VALUES($1,$2,'approved','test','test')",[uid(5),uid(20)]);
  const noAccess=(await db.query("SELECT id FROM notifications WHERE user_id=$1 AND notification_type='approved'",[uid(5)])).rows[0].id;
  assert.equal((await as(uid(5),"SELECT get_notification_destination($1) AS value",[noAccess])).rows[0].value,null);
  pass("reviewer requires Recipes access; notification links do not grant normal Recipe access to assignment-only users");
  console.log("ALL NOTIFICATION DATABASE/SECURITY TESTS PASSED");
} finally { await db.close(); }
