import {
  supabase,
} from "../lib/supabaseClient";


const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value)
    .toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
};


const formatTime = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value)
    .toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
};


const formatDateInput = (
  value
) => {
  if (!value) {
    return "";
  }

  return new Date(value)
    .toISOString()
    .split("T")[0];
};


const loadProductsMap =
  async (ids) => {
    const uniqueIds = [
      ...new Set(
        ids.filter(Boolean)
      ),
    ];

    if (!uniqueIds.length) {
      return {};
    }

    const {
      data,
      error,
    } =
      await supabase
        .from("products")
        .select(`
          id,
          product_code,
          name,
          product_type,
          category,
          base_unit,
          description
        `)
        .in(
          "id",
          uniqueIds
        );

    if (error) {
      throw error;
    }

    return Object.fromEntries(
      (data || []).map(
        (product) => [
          product.id,
          product,
        ]
      )
    );
  };


const loadProfilesMap =
  async (ids) => {
    const uniqueIds = [
      ...new Set(
        ids.filter(Boolean)
      ),
    ];

    if (!uniqueIds.length) {
      return {};
    }

    const {
      data,
      error,
    } =
      await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          username,
          roles (
            name
          )
        `)
        .in(
          "id",
          uniqueIds
        );

    if (error) {
      throw error;
    }

    return Object.fromEntries(
      (data || []).map(
        (profile) => [
          profile.id,
          profile,
        ]
      )
    );
  };


const loadApprovalsMap =
  async (recipeIds) => {
    if (!recipeIds.length) {
      return {};
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "recipe_approvals"
        )
        .select(`
          id,
          recipe_id,
          approver_id,
          decision,
          comment,
          reviewed_at,
          created_at
        `)
        .in(
          "recipe_id",
          recipeIds
        )
        .eq(
          "decision",
          "Approved"
        )
        .order(
          "reviewed_at",
          {
            ascending: false,
          }
        );

    if (error) {
      throw error;
    }

    const result = {};

    (data || []).forEach(
      (approval) => {
        if (
          !result[
            approval.recipe_id
          ]
        ) {
          result[
            approval.recipe_id
          ] = approval;
        }
      }
    );

    return result;
  };


const loadERPEntriesMap =
  async (recipeIds) => {
    if (!recipeIds.length) {
      return {};
    }

    const {
      data,
      error,
    } =
      await supabase
        .from("erp_entries")
        .select(`
          id,
          recipe_id,
          erp_reference,
          entry_date,
          entered_by,
          notes,
          status,
          completed_at,
          created_at,
          updated_at
        `)
        .in(
          "recipe_id",
          recipeIds
        );

    if (error) {
      throw error;
    }

    return Object.fromEntries(
      (data || []).map(
        (entry) => [
          entry.recipe_id,
          entry,
        ]
      )
    );
  };


export const getERPRecipes =
  async () => {
    const {
      data,
      error,
    } =
      await supabase
        .from("recipes")
        .select(`
          id,
          recipe_code,
          product_id,
          yield_quantity,
          yield_unit,
          description,
          status,
          approved_at,
          erp_pending_at,
          erp_completed_at,
          created_at,
          updated_at
        `)
        .in(
          "status",
          [
            "Approved",
            "ERP Pending",
            "ERP Completed",
          ]
        )
        .order(
          "updated_at",
          {
            ascending: false,
          }
        );

    if (error) {
      throw error;
    }

    const recipes =
      data || [];

    const recipeIds =
      recipes.map(
        (recipe) =>
          recipe.id
      );

    const productIds =
      recipes.map(
        (recipe) =>
          recipe.product_id
      );

    const [
      productsMap,
      approvalsMap,
      erpEntriesMap,
    ] =
      await Promise.all([
        loadProductsMap(
          productIds
        ),

        loadApprovalsMap(
          recipeIds
        ),

        loadERPEntriesMap(
          recipeIds
        ),
      ]);

    const profileIds = [
      ...Object.values(
        approvalsMap
      ).map(
        (approval) =>
          approval.approver_id
      ),

      ...Object.values(
        erpEntriesMap
      ).map(
        (entry) =>
          entry.entered_by
      ),
    ];

    const profilesMap =
      await loadProfilesMap(
        profileIds
      );

    return recipes.map(
      (recipe) => {
        const product =
          productsMap[
            recipe.product_id
          ];

        const approval =
          approvalsMap[
            recipe.id
          ];

        const erpEntry =
          erpEntriesMap[
            recipe.id
          ];

        const approver =
          approval
            ? profilesMap[
                approval.approver_id
              ]
            : null;

        const enteredBy =
          erpEntry
            ? profilesMap[
                erpEntry.entered_by
              ]
            : null;

        const erpStatus =
          recipe.status ===
          "Approved"
            ? "ERP Pending"
            : recipe.status;

        return {
          id:
            recipe.id,

          recipeCode:
            recipe.recipe_code,

          name:
            product?.name ||
            "Unnamed Recipe",

          productName:
            product?.name ||
            "Unnamed Recipe",

          productCode:
            product?.product_code ||
            "",

          type:
            product?.product_type ||
            "",

          category:
            product?.category ||
            "",

          description:
            recipe.description ||
            product?.description ||
            "",

          yield:
            Number(
              recipe.yield_quantity
            ),

          yieldUnit:
            recipe.yield_unit ||
            product?.base_unit ||
            "",

          displayYield:
            `${Number(
              recipe.yield_quantity
            )} ${
              recipe.yield_unit ||
              product?.base_unit ||
              ""
            }`.trim(),

          status:
            recipe.status,

          erpStatus,

          approvedDate:
            formatDate(
              recipe.approved_at ||
              approval?.reviewed_at
            ),

          approvedTime:
            formatTime(
              recipe.approved_at ||
              approval?.reviewed_at
            ),

          approvedBy:
            approver?.full_name ||
            approver?.username ||
            "Approver",

          approvedRole:
            approver?.roles?.name ||
            "Recipe Approver",

          approvalStatus:
            approval?.decision ||
            (
              recipe.status ===
              "Approved"
                ? "Approved"
                : "Approved"
            ),

          erp: erpEntry
            ? {
                id:
                  erpEntry.id,

                reference:
                  erpEntry.erp_reference,

                entryDate:
                  formatDateInput(
                    erpEntry.entry_date
                  ),

                enteredById:
                  erpEntry.entered_by,

                enteredBy:
                  enteredBy?.full_name ||
                  enteredBy?.username ||
                  "ERP User",

                notes:
                  erpEntry.notes ||
                  "",

                status:
                  erpEntry.status,

                completedAt:
                  erpEntry.completed_at,
              }
            : null,

          updatedAt:
            recipe.updated_at,
        };
      }
    );
  };


export const getERPRecipeById =
  async (recipeId) => {
    const recipes =
      await getERPRecipes();

    return (
      recipes.find(
        (recipe) =>
          recipe.id ===
          recipeId
      ) || null
    );
  };


export const ensureERPEntry =
  async ({
    recipeId,
    userId,
  }) => {
    const {
      data: existing,
      error:
        existingError,
    } =
      await supabase
        .from("erp_entries")
        .select("*")
        .eq(
          "recipe_id",
          recipeId
        )
        .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      return existing;
    }

    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    const {
      data,
      error,
    } =
      await supabase
        .from("erp_entries")
        .insert({
          recipe_id:
            recipeId,

          entry_date:
            today,

          entered_by:
            userId,

          status:
            "Pending",
        })
        .select()
        .single();

    if (error) {
      throw error;
    }

    const {
      error:
        recipeError,
    } =
      await supabase
        .from("recipes")
        .update({
          status:
            "ERP Pending",

          erp_pending_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          recipeId
        );

    if (recipeError) {
      throw recipeError;
    }

    return data;
  };


export const completeERPEntry =
  async ({
    recipeId,
    notes,
    userId,
  }) => {
    let entry =
      await ensureERPEntry({
        recipeId,
        userId,
      });

    const now =
      new Date()
        .toISOString();

    const {
      data:
        updatedEntry,
      error,
    } =
      await supabase
        .from("erp_entries")
        .update({
          notes:
            notes
              ?.trim() ||
            null,

          status:
            "Completed",

          completed_at:
            now,

          entered_by:
            userId ||
            entry.entered_by,
        })
        .eq(
          "recipe_id",
          recipeId
        )
        .select()
        .single();

    if (error) {
      throw error;
    }

    const {
      error:
        recipeError,
    } =
      await supabase
        .from("recipes")
        .update({
          status:
            "ERP Completed",

          erp_completed_at:
            now,
        })
        .eq(
          "id",
          recipeId
        );

    if (recipeError) {
      throw recipeError;
    }

    return updatedEntry;
  };


export const subscribeToERP =
  (onChange) => {
    const channel =
      supabase
        .channel(
          "erp-live"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "recipes",
          },
          () => {
            onChange?.();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "erp_entries",
          },
          () => {
            onChange?.();
          }
        )
        .subscribe();

    return () => {
      supabase
        .removeChannel(
          channel
        );
    };
  };