// Actual local React application + actual guarded RPCs in isolated PGlite.
// HTTP fixture server cannot contact Supabase; the browser blocks external requests.
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createServer } from "vite";
const root = path.resolve(import.meta.dirname, "..");
assert(process.env.READER_DB_DIRECTORY, "Run isolated schema tests first with READER_DB_DIRECTORY");
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_MODULE).href);
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const db = new PGlite(process.env.READER_DB_DIRECTORY);
const uid = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let passed = 0;
const pass = (label) => { passed++; console.log(`PASS ${label}`); };
const apiRequests = [];
const errors = [];
let queue = Promise.resolve();
const rpcArguments = {
  list_recipe_reader_candidates: ["p_recipe_id"], assign_recipe_reader: ["p_recipe_id", "p_assigned_user_id", "p_expected_updated_at"],
  list_my_recipe_reader_assignments: [], get_recipe_reader_assignment: ["p_assignment_id"],
  mark_recipe_reader_assignment_read: ["p_assignment_id"], list_recipe_reader_assignments: ["p_recipe_id"],
  revoke_recipe_reader_assignment: ["p_assignment_id"], get_recipe_reader_print_data: ["p_assignment_id"],
};
const api = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") { res.end(); return; }
  queue = queue.then(async () => {
    const url = new URL(req.url, "http://127.0.0.1");
    const token = req.headers.authorization?.slice(7);
    const actor = token ? JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).sub : null;
    const input = []; for await (const part of req) input.push(part);
    const body = input.length ? JSON.parse(Buffer.concat(input)) : {};
    apiRequests.push({ actor, method: req.method, path: url.pathname, body });
    try {
      let data;
      if (url.pathname.includes("/rpc/")) {
        const name = url.pathname.split("/").at(-1);
        assert(rpcArguments[name], `Unexpected RPC ${name}`);
        await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [actor || ""]);
        await db.exec("SET ROLE authenticated");
        try { data = (await db.query(`SELECT public.${name}(${rpcArguments[name].map((_, i) => `$${i + 1}`).join(",")}) AS result`, rpcArguments[name].map((key) => body[key]))).rows[0].result; }
        finally { await db.exec("RESET ROLE"); }
      } else {
        assert.equal(req.method, "GET", "Only guarded Reader RPCs may mutate the isolated fixture");
        const table = url.pathname.split("/").at(-1);
        assert(["profiles", "roles", "role_permissions", "products", "v_product_master", "recipes", "recipe_ingredients", "product_master_values", "notifications"].includes(table), `Unexpected fixture table ${table}`);
        data = (await db.query(`SELECT * FROM public.${table === "v_product_master" ? "products" : table}`)).rows;
        for (const [key, value] of url.searchParams) {
          if (value.startsWith("eq.")) data = data.filter((item) => String(item[key]) === value.slice(3));
          if (value.startsWith("in.(")) { const allowed = value.slice(4, -1).split(","); data = data.filter((item) => allowed.includes(String(item[key]))); }
        }
        if (table === "profiles" && url.searchParams.get("select")?.includes("roles")) {
          for (const item of data) {
            const role = (await db.query("SELECT * FROM roles WHERE id=$1", [item.role_id])).rows[0];
            item.roles = role ? { ...role, role_permissions: (await db.query("SELECT * FROM role_permissions WHERE role_id=$1", [item.role_id])).rows } : null;
          }
        }
        if (table === "v_product_master") data = data.map((item) => ({ ...item, has_recipe: item.id === uid(10) }));
        if (req.headers.accept?.includes("vnd.pgrst.object")) data = data[0] || null;
      }
      res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(data));
    } catch (error) { res.statusCode = 400; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ message: error.message, code: error.code || "P0001" })); }
  }).catch((error) => { errors.push(error.message); res.statusCode = 500; res.end(); });
});
await new Promise((resolve) => api.listen(55439, "127.0.0.1", resolve));
process.env.VITE_SUPABASE_URL = "http://127.0.0.1:55439";
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = "isolated-local-only";
const vite = await createServer({ root, server: { host: "127.0.0.1", port: 55173, strictPort: true } });
await vite.listen();
const browser = await chromium.launch({ executablePath: process.env.CHROME_EXECUTABLE, headless: true });
const directory = process.env.READER_UI_OUTPUT || path.join(process.env.READER_DB_DIRECTORY, "browser-results");
fs.mkdirSync(directory, { recursive: true });
const createPage = async (user, language) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  await context.route("**/*", (route) => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  await context.addInitScript(({ user, language }) => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })) + "." + btoa(JSON.stringify({ sub: user, exp, role: "authenticated" })) + ".isolated";
    localStorage.setItem("sb-127-auth-token", JSON.stringify({ access_token: token, refresh_token: "isolated", token_type: "bearer", expires_at: exp, expires_in: 3600, user: { id: user, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {} } }));
    localStorage.setItem("recipe-language", language);
  }, { user, language });
  const page = await context.newPage(); page.on("pageerror", (error) => errors.push(error.message)); page.on("dialog", (dialog) => dialog.accept());
  return page;
};
try {
  const assignment = (await db.query("SELECT id FROM recipe_reader_assignments WHERE assigned_user_id=$1 AND revoked_at IS NULL", [uid(4)])).rows[0].id;
  for (const language of ["en", "ar"]) {
    await db.query("UPDATE recipe_reader_assignments SET read_at=NULL WHERE id=$1", [assignment]); // isolated fixture reset only
    const page = await createPage(uid(4), language);
    await page.goto("http://127.0.0.1:55173/recipes");
    await page.locator(".recipe-tabs button").waitFor();
    assert.equal(await page.locator(".recipe-tabs button").count(), 1);
    assert.equal(await page.locator(".recipes-filters").count(), 0);
    assert.equal(await page.locator("a[href='/recipe-readers']").count(), 0);
    await page.locator(`a[href='/recipes/reader/${assignment}']`).click();
    await page.locator(".reader-description").waitFor();
    assert.equal(await page.locator(".reader-description").innerText(), "وصف عربي English");
    assert.equal(await page.locator(".reader-actions button").count(), 2);
    assert.equal(await page.locator("main input,main select,main textarea").count(), 0);
    assert.equal(await page.locator(".reader-page button").count(), 2);
    const mark = page.locator(".reader-actions button").first();
    if (await mark.isEnabled()) { await mark.click(); await mark.waitFor({ state: "visible" }); await page.waitForFunction(() => document.querySelector(".reader-actions button")?.disabled); }
    assert((await db.query("SELECT read_at FROM recipe_reader_assignments WHERE id=$1", [assignment])).rows[0].read_at);
    const downloadPromise = page.waitForEvent("download");
    await page.locator(".reader-actions button").nth(1).click();
    const download = await downloadPromise; await download.saveAs(path.join(directory, `reader-${language}.pdf`));
    await page.screenshot({ path: path.join(directory, `reader-${language}-desktop.png`), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(directory, `reader-${language}-mobile.png`), fullPage: true });
    assert(await page.locator(".reader-page").evaluate((node) => node.scrollWidth <= node.clientWidth + 1));
    pass(`${language}: actual Reader list/details, acknowledgement, PDF download, read-only controls and mobile layout`);
    await page.close();
  }
  const manager = await createPage(uid(1), "en");
  await manager.goto("http://127.0.0.1:55173/recipes");
  await manager.getByRole("button", { name: "Assigned to Me", exact: true }).click();
  await manager.locator(".reader-table").waitFor();
  assert.equal(await manager.locator(".recipe-tabs button").count(), 8);
  assert.equal(await manager.locator(".recipes-filters").count(), 0);
  assert.equal(await manager.locator("a[href='/recipe-readers']").count(), 0);
  pass("normal Recipes tabs include Assigned to Me; separate Reader navigation removed");
  await manager.goto(`http://127.0.0.1:55173/recipes/${uid(20)}`);
  await manager.getByRole("button", { name: "Assign to Reader", exact: true }).click();
  await manager.getByRole("dialog").waitFor();
  await manager.getByLabel("Search users…", { exact: true }).fill("local reader");
  await manager.getByLabel("Select a reader", { exact: true }).selectOption(uid(3));
  await manager.getByRole("dialog").getByRole("button", { name: "Assign to Reader", exact: true }).click();
  await manager.getByRole("dialog").locator("tbody").getByText("Local reader", { exact: true }).first().waitFor();
  await manager.getByRole("dialog").locator("tr").filter({ has: manager.getByText("Local reader", { exact: true }) }).first().getByRole("button", { name: "Revoke", exact: true }).click();
  await manager.getByRole("dialog").locator("tr").filter({ has: manager.getByText("Local reader", { exact: true }) }).first().getByText("Revoked", { exact: true }).waitFor();
  pass("actual manager modal: user search, assignment and guarded revocation update the list");
  await manager.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).last().click();
  await manager.goto("http://127.0.0.1:55173/settings");
  await manager.getByRole("button", { name: "Permissions & User Rights", exact: true }).click();
  const permissionRow = manager.locator("tr").filter({ has: manager.getByText("Recipe Reader Assignments", { exact: true }) });
  await permissionRow.waitFor(); assert.equal(await permissionRow.locator("button").count(), 3);
  pass("Settings exposes management View/Add/Delete only, with no Edit/Print toggles");
  const wrongUser = await createPage(uid(3), "en");
  await wrongUser.goto(`http://127.0.0.1:55173/recipes/reader/${assignment}`);
  await wrongUser.locator("main [role=alert]").waitFor();
  assert.equal(await wrongUser.locator(".reader-actions button").count(), 0);
  pass("actual Reader route rejects another user's assignment and exposes no actions");
  await db.query("UPDATE recipes SET status='Submitted' WHERE id=$1", [uid(20)]);
  const suspended = await createPage(uid(4), "ar");
  await suspended.goto(`http://127.0.0.1:55173/recipes/reader/${assignment}`);
  await suspended.locator("main [role=alert]").waitFor();
  assert.equal(await suspended.locator(".reader-description").count(), 0);
  pass("actual Arabic Reader screen suppresses content/actions after recipe resubmission");
  await db.query("UPDATE recipes SET status='ERP Completed' WHERE id=$1", [uid(20)]);
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(directory, "results.json"), JSON.stringify({ passed, apiRequests, errors }, null, 2));
  pass("no runtime errors; all API mutations were isolated Reader RPCs");
  console.log(`Reader UI tests: ${passed} PASS; artifacts: ${directory}`);
} finally { await browser.close(); await vite.close(); await new Promise((resolve) => api.close(resolve)); await queue; await db.close(); }
