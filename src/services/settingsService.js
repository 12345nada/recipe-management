import {
  supabase,
} from "../lib/supabaseClient";


const formatUsername = (
  value
) => {
  const clean =
    String(
      value || ""
    ).trim();

  if (!clean) {
    return "";
  }

  return clean.startsWith("@")
    ? clean
    : `@${clean}`;
};


const unwrapFunctionError =
  async (
    error
  ) => {
    const context =
      error?.context;

    if (
      context &&
      typeof context.json ===
        "function"
    ) {
      try {
        const body =
          await context.json();

        if (body?.error) {
          return new Error(
            body.error
          );
        }
      } catch {
      }
    }

    return error;
  };


export const getSettingsData =
  async () => {
    const [
      rolesResult,
      profilesResult,
      permissionsResult,
    ] =
      await Promise.all([
        supabase
          .from("roles")
          .select(`
            id,
            name,
            description,
            is_system_admin
          `)
          .order(
            "id",
            {
              ascending: true,
            }
          ),

        supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            username,
            email,
            is_active,
            role_id,
            roles (
              id,
              name,
              description,
              is_system_admin
            )
          `)
          .eq(
            "is_active",
            true
          )
          .order(
            "full_name",
            {
              ascending: true,
            }
          ),

        supabase
          .from(
            "role_permissions"
          )
          .select(`
            id,
            role_id,
            module_name,
            can_view,
            can_add,
            can_edit,
            can_delete,
            can_print
          `)
          .order(
            "module_name",
            {
              ascending: true,
            }
          ),
      ]);


    if (rolesResult.error) {
      throw rolesResult.error;
    }

    if (profilesResult.error) {
      throw profilesResult.error;
    }

    if (permissionsResult.error) {
      throw permissionsResult.error;
    }


    const roles =
      (
        rolesResult.data ||
        []
      ).map(
        (role) => ({
          id:
            Number(
              role.id
            ),

          name:
            role.name,

          description:
            role.description ||
            "Custom role",

          isSystemAdmin:
            Boolean(
              role.is_system_admin
            ),

          removable:
            !Boolean(
              role.is_system_admin
            ),
        })
      );


    const employees =
      (
        profilesResult.data ||
        []
      ).map(
        (profile) => ({
          id:
            profile.id,

          name:
            profile.full_name ||
            profile.username ||
            "Unnamed User",

          username:
            formatUsername(
              profile.username
            ),

          email:
            profile.email ||
            "",

          roleId:
            profile.role_id
              ? Number(
                  profile.role_id
                )
              : null,

          role:
            profile.roles
              ?.name ||
            "No Role",

          isActive:
            Boolean(
              profile.is_active
            ),
          isSystemAdmin: Boolean(profile.roles?.is_system_admin),
        })
      );


    return {
      roles,
      employees,
      permissions:
        permissionsResult.data ||
        [],
    };
  };


export const updateCurrentProfile =
  async ({
    userId,
    fullName,
    currentEmail,
    email,
  }) => {
    if (!userId) {
      throw new Error(
        "No signed-in user."
      );
    }

    const cleanName =
      String(
        fullName || ""
      ).trim();

    if (!cleanName) {
      throw new Error(
        "Full name is required."
      );
    }

    const cleanEmail =
      String(
        email || ""
      )
        .trim()
        .toLowerCase();

    const existingEmail =
      String(
        currentEmail || ""
      )
        .trim()
        .toLowerCase();

    if (
      cleanEmail &&
      existingEmail &&
      cleanEmail !==
        existingEmail
    ) {
      throw new Error(
        "Email changes must be handled through the authentication account. Keep the current email for now."
      );
    }

    const { data, error } = await supabase.rpc("update_settings_profile", {
      p_full_name: cleanName,
    });

    if (error) {
      throw error;
    }

    return data;
  };


export const updateEmployeeRole =
  async ({
    userId,
    roleId,
  }) => {
    const { data, error } = await supabase.rpc("assign_settings_user_role", {
      p_user_id: userId,
      p_role_id: Number(roleId),
    });

    if (error) {
      throw error;
    }

    return data;
  };


export const createRole =
  async ({
    name,
    description,
  }) => {
    const { data, error } = await supabase.rpc("create_settings_role", {
      p_name: String(name || "").trim(),
      p_description: String(description || "").trim() || "Custom role",
    });

    if (error) {
      throw error;
    }

    return {
      id:
        Number(
          data.id
        ),
      name:
        data.name,
      description:
        data.description,
      isSystemAdmin:
        Boolean(
          data.is_system_admin
        ),
      removable:
        !Boolean(
          data.is_system_admin
        ),
    };
  };


export const deleteRole =
  async (
    roleId
  ) => {
    const { error } = await supabase.rpc("delete_settings_role", {
      p_role_id: Number(roleId),
    });

    if (error) {
      throw error;
    }

    return true;
  };


export const saveRolePermissions =
  async ({
    roleId,
    permissions,
  }) => {
    const rows =
      Object.entries(
        permissions
      ).map(
        ([
          moduleName,
          permission,
        ]) => ({
          role_id:
            Number(
              roleId
            ),
          module_name:
            moduleName,
          can_view:
            Boolean(
              permission.view
            ),
          can_add:
            Boolean(
              permission.add
            ),
          can_edit:
            Boolean(
              permission.edit
            ),
          can_delete:
            Boolean(
              permission.delete
            ),
          can_print: ["Reports", "Audit Trail"].includes(moduleName) && Boolean(permission.print),
        })
      );

    const { error } = await supabase.rpc("save_settings_role_permissions", {
      p_role_id: Number(roleId),
      p_permissions: rows,
    });
    if (error) throw error;

    return true;
  };


const invokeManageUser =
  async (
    body
  ) => {
    const {
      data:
        sessionData,
      error:
        sessionError,
    } =
      await supabase.auth
        .getSession();

    if (sessionError) {
      throw sessionError;
    }

    const accessToken =
      sessionData
        ?.session
        ?.access_token;

    if (!accessToken) {
      throw new Error(
        "Your session has expired. Please sign in again."
      );
    }

    const {
      data,
      error,
    } =
      await supabase
        .functions
        .invoke(
          "manage-user-index-ts",
          {
            body,

            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          }
        );

    if (error) {
      console.error(
        "manage-user Edge Function error:",
        error
      );

      throw await unwrapFunctionError(
        error
      );
    }

    if (data?.error) {
      throw new Error(
        data.error
      );
    }

    return data;
  };


export const createUser =
  async ({
    fullName,
    username,
    password,
    roleId,
  }) => {
    return invokeManageUser({
      action:
        "create",
      fullName,
      username,
      password,
      roleId,
      });
  };


export const resetUserPassword =
  async ({
    userId,
    password,
  }) => {
    return invokeManageUser({
      action:
        "reset-password",
      userId,
      password,
    });
  };


export const deleteUser =
  async (
    userId
  ) => {
    return invokeManageUser({
      action:
        "delete",
      userId,
    });
  };
