import {
  createClient,
} from "npm:@supabase/supabase-js@2";


const relatedRole = (roles: { is_system_admin?: boolean } | { is_system_admin?: boolean }[] | null) =>
  Array.isArray(roles) ? roles[0] : roles;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};


const jsonResponse = (
  body: Record<string, unknown>,
  status = 200
) =>
  new Response(
    JSON.stringify(body),
    {
      status,

      headers: {
        ...corsHeaders,

        "Content-Type":
          "application/json",
      },
    }
  );


const normalizeUsername = (
  value: unknown
) =>
  String(
    value || ""
  )
    .trim()
    .replace(
      /^@/,
      ""
    )
    .toLowerCase();


const createInternalEmail = (
  username: string
) => {
  const safe =
    username
      .replace(
        /[^a-z0-9._-]/g,
        ""
      )
      .replace(
        /^\.+|\.+$/g,
        ""
      );

  return `${safe}@users.bites.internal`;
};


Deno.serve(
  async (req) => {
    if (
      req.method ===
      "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers:
            corsHeaders,
        }
      );
    }


    try {
      const supabaseUrl =
        Deno.env.get(
          "SUPABASE_URL"
        );

      const anonKey =
        Deno.env.get(
          "SUPABASE_ANON_KEY"
        );

      const serviceRoleKey =
        Deno.env.get(
          "SUPABASE_SERVICE_ROLE_KEY"
        );


      if (
        !supabaseUrl ||
        !anonKey ||
        !serviceRoleKey
      ) {
        throw new Error(
          "Missing Supabase function secrets."
        );
      }


      const authHeader =
        req.headers.get(
          "Authorization"
        );


      if (!authHeader) {
        return jsonResponse(
          {
            error:
              "Missing authorization token.",
          },
          401
        );
      }


      const callerClient =
        createClient(
          supabaseUrl,
          anonKey,
          {
            global: {
              headers: {
                Authorization:
                  authHeader,
              },
            },

            auth: {
              autoRefreshToken:
                false,

              persistSession:
                false,
            },
          }
        );


      const {
        data:
          callerAuth,
        error:
          callerAuthError,
      } =
        await callerClient
          .auth
          .getUser();


      if (
        callerAuthError ||
        !callerAuth.user
      ) {
        return jsonResponse(
          {
            error:
              "Invalid or expired session.",
          },
          401
        );
      }


      const adminClient =
        createClient(
          supabaseUrl,
          serviceRoleKey,
          {
            auth: {
              autoRefreshToken:
                false,

              persistSession:
                false,
            },
          }
        );


      const {
        data:
          callerProfile,
        error:
          profileError,
      } =
        await adminClient
          .from(
            "profiles"
          )
          .select(`
            id,
            is_active,
            role_id,
            roles (
              id,
              name,
              is_system_admin
            )
          `)
          .eq(
            "id",
            callerAuth
              .user.id
          )
          .maybeSingle();


      if (profileError) {
        console.error(
          "Caller profile error:",
          profileError
        );

        return jsonResponse(
          {
            error:
              "Could not verify administrator account.",
          },
          500
        );
      }


      if (!callerProfile?.is_active) {
        return jsonResponse({ error: "Active account required." }, 403);
      }
      const body = await req.json();
      const action = String(body.action || "").trim().toLowerCase();
      const permission = ({ create: "add", "reset-password": "edit", delete: "delete" } as Record<string, string>)[action];
      if (!permission) return jsonResponse({ error: "Invalid action." }, 400);
      const isSystemAdmin = Boolean(relatedRole(callerProfile.roles)?.is_system_admin);
      if (!isSystemAdmin) {
        const [view, operation] = await Promise.all([
          callerClient.rpc("has_module_permission", { p_module: "Permissions & User Rights", p_action: "view" }),
          callerClient.rpc("has_module_permission", { p_module: "Permissions & User Rights", p_action: permission }),
        ]);
        if (view.error || operation.error || view.data !== true || operation.data !== true) {
          return jsonResponse({ error: "You do not have permission for this account operation." }, 403);
        }
      }
      // The service-role client bypasses RLS: protected targets MUST be checked here.
      if (!isSystemAdmin && action !== "create") {
        const targetId = String(body.userId || "").trim();
        const { data: target, error: targetError } = await adminClient.from("profiles")
          .select("id, roles(is_system_admin)").eq("id", targetId).maybeSingle();
        if (targetError || !target) return jsonResponse({ error: "User not found." }, 400);
        if (relatedRole(target.roles)?.is_system_admin) {
          return jsonResponse({ error: "System administrator accounts are protected." }, 403);
        }
      }

      if (
        action ===
        "create"
      ) {
        const fullName =
          String(
            body.fullName ||
            ""
          ).trim();

        const username =
          normalizeUsername(
            body.username
          );

        const password =
          String(
            body.password ||
            ""
          );

        const roleId =
          Number(
            body.roleId
          );


        if (
          !fullName ||
          !username ||
          !password ||
          !roleId
        ) {
          return jsonResponse(
            {
              error:
                "Full name, username, password and role are required.",
            },
            400
          );
        }


        if (
          password.length <
          6
        ) {
          return jsonResponse(
            {
              error:
                "Password must be at least 6 characters.",
            },
            400
          );
        }


        const {
          data:
            duplicateProfile,
          error:
            duplicateError,
        } =
          await adminClient
            .from(
              "profiles"
            )
            .select(
              "id"
            )
            .ilike(
              "username",
              username
            )
            .maybeSingle();


        if (duplicateError) {
          throw duplicateError;
        }


        if (
          duplicateProfile
        ) {
          return jsonResponse(
            {
              error:
                "This username already exists.",
            },
            409
          );
        }


        const {
          data:
            role,
          error:
            roleError,
        } =
          await adminClient
            .from(
              "roles"
            )
            .select(
              "id, is_system_admin"
            )
            .eq(
              "id",
              roleId
            )
            .maybeSingle();


        if (
          roleError ||
          !role
        ) {
          return jsonResponse(
            {
              error:
                "Selected role does not exist.",
            },
            400
          );
        }


        if (!isSystemAdmin && role.is_system_admin) {
          return jsonResponse({ error: "Cannot create a system administrator account." }, 403);
        }

        const email =
          createInternalEmail(
            username
          );


        const {
          data:
            createdAuth,
          error:
            createAuthError,
        } =
          await adminClient
            .auth
            .admin
            .createUser({
              email,
              password,

              email_confirm:
                true,

              user_metadata: {
                full_name:
                  fullName,

                username,
              },
            });


        if (
          createAuthError ||
          !createdAuth.user
        ) {
          console.error(
            "Create auth user error:",
            createAuthError
          );

          return jsonResponse(
            {
              error:
                createAuthError
                  ?.message ||
                "Could not create authentication account.",
            },
            400
          );
        }


        const newUserId =
          createdAuth
            .user.id;


        const {
          error:
            profileInsertError,
        } =
          await adminClient
            .from(
              "profiles"
            )
            .upsert({
              id:
                newUserId,

              full_name:
                fullName,

              username,

              email,

              role_id:
                roleId,

              is_active:
                true,

              must_change_password:
                true,

              created_by:
                callerAuth
                  .user.id,
            });


        if (
          profileInsertError
        ) {
          console.error(
            "Create profile error:",
            profileInsertError
          );


          await adminClient
            .auth
            .admin
            .deleteUser(
              newUserId
            );


          return jsonResponse(
            {
              error:
                profileInsertError
                  .message,
            },
            400
          );
        }


        return jsonResponse({
          success:
            true,

          user: {
            id:
              newUserId,

            fullName,

            username,

            email,

            roleId,
          },
        });
      }


      if (
        action ===
        "reset-password"
      ) {
        const userId =
          String(
            body.userId ||
            ""
          ).trim();

        const password =
          String(
            body.password ||
            ""
          );


        if (
          !userId ||
          !password
        ) {
          return jsonResponse(
            {
              error:
                "User and password are required.",
            },
            400
          );
        }


        if (
          password.length <
          6
        ) {
          return jsonResponse(
            {
              error:
                "Password must be at least 6 characters.",
            },
            400
          );
        }


        const {
          error:
            updateError,
        } =
          await adminClient
            .auth
            .admin
            .updateUserById(
              userId,
              {
                password,
              }
            );


        if (
          updateError
        ) {
          return jsonResponse(
            {
              error:
                updateError
                  .message,
            },
            400
          );
        }


        await adminClient
          .from(
            "profiles"
          )
          .update({
            must_change_password:
              true,
          })
          .eq(
            "id",
            userId
          );


        return jsonResponse({
          success:
            true,
        });
      }


      if (
        action ===
        "delete"
      ) {
        const userId =
          String(
            body.userId ||
            ""
          ).trim();


        if (!userId) {
          return jsonResponse(
            {
              error:
                "User is required.",
            },
            400
          );
        }


        if (
          userId ===
          callerAuth.user.id
        ) {
          return jsonResponse(
            {
              error:
                "You cannot delete your own account while signed in.",
            },
            400
          );
        }


        const {
          error:
            deleteAuthError,
        } =
          await adminClient
            .auth
            .admin
            .deleteUser(
              userId
            );


        if (
          deleteAuthError
        ) {
          return jsonResponse(
            {
              error:
                deleteAuthError
                  .message,
            },
            400
          );
        }


        await adminClient
          .from(
            "profiles"
          )
          .delete()
          .eq(
            "id",
            userId
          );


        return jsonResponse({
          success:
            true,
        });
      }


      return jsonResponse(
        {
          error:
            "Invalid action.",
        },
        400
      );


    } catch (error) {
      console.error(
        "manage-user error:",
        error
      );


      return jsonResponse(
        {
          error:
            error instanceof
            Error
              ? error.message
              : "Unexpected server error.",
        },
        500
      );
    }
  }
);