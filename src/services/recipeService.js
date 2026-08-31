import {
  supabase,
} from "../lib/supabaseClient";

import {
  getProducts,
} from "./productService";


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


const getProfilesMap =
  async (ids = []) => {
    const uniqueIds = [
      ...new Set(
        ids.filter(Boolean)
      ),
    ];

    if (uniqueIds.length === 0) {
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
          role_id,
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


const getProductsMap =
  async (ids = []) => {
    const uniqueIds = [
      ...new Set(
        ids.filter(Boolean)
      ),
    ];

    if (uniqueIds.length === 0) {
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


const loadIngredientsForRecipes =
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
          "recipe_ingredients"
        )
        .select(`
          id,
          recipe_id,
          product_id,
          quantity,
          unit,
          notes
        `)
        .in(
          "recipe_id",
          recipeIds
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        );

    if (error) {
      throw error;
    }

    const productIds =
      (data || []).map(
        (ingredient) =>
          ingredient.product_id
      );

    const productsMap =
      await getProductsMap(
        productIds
      );

    return (
      data || []
    ).reduce(
      (
        result,
        ingredient
      ) => {
        const product =
          productsMap[
            ingredient.product_id
          ];

        if (
          !result[
            ingredient.recipe_id
          ]
        ) {
          result[
            ingredient.recipe_id
          ] = [];
        }

        result[
          ingredient.recipe_id
        ].push({
          id:
            ingredient.id,

          productId:
            ingredient.product_id,

          name:
            product?.name ||
            "Unknown Product",

          type:
            product?.product_type ||
            "",

          quantity:
            Number(
              ingredient.quantity
            ),

          unit:
            ingredient.unit ||
            product?.base_unit ||
            "",

          notes:
            ingredient.notes ||
            "",
        });

        return result;
      },
      {}
    );
  };


export const getAllRecipeProducts =
  async () => {
    return getProducts();
  };


export const getRecipes =
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
          created_by,
          assigned_to,
          submitted_at,
          approved_at,
          rejected_at,
          erp_pending_at,
          erp_completed_at,
          rejection_comment,
          version,
          created_at,
          updated_at
        `)
        .order(
          "updated_at",
          {
            ascending: false,
          }
        );

    if (error) {
      throw error;
    }

    const rows =
      data || [];

    const productIds =
      rows.map(
        (recipe) =>
          recipe.product_id
      );

    const profileIds =
      rows.flatMap(
        (recipe) => [
          recipe.created_by,
          recipe.assigned_to,
        ]
      );

    const [
      productsMap,
      profilesMap,
      ingredientsMap,
    ] =
      await Promise.all([
        getProductsMap(
          productIds
        ),

        getProfilesMap(
          profileIds
        ),

        loadIngredientsForRecipes(
          rows.map(
            (recipe) =>
              recipe.id
          )
        ),
      ]);

    return rows.map(
      (recipe) => {
        const product =
          productsMap[
            recipe.product_id
          ];

        const creator =
          profilesMap[
            recipe.created_by
          ];

        const assigned =
          profilesMap[
            recipe.assigned_to
          ];

        return {
          id:
            recipe.id,

          recipeCode:
            recipe.recipe_code,

          productId:
            recipe.product_id,

          productName:
            product?.name ||
            "Unknown Product",

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
            recipe.yield_unit,

          ingredients:
            ingredientsMap[
              recipe.id
            ] || [],

          status:
            recipe.status,

          requestedBy: {
            id:
              creator?.id ||
              null,

            name:
              creator?.full_name ||
              creator?.username ||
              "-",

            role:
              creator?.roles?.name ||
              "-",
          },

          assignedTo:
            assigned?.full_name ||
            assigned?.username ||
            null,

          assignedRole:
            assigned?.roles?.name ||
            null,

          rejectionComment:
            recipe.rejection_comment ||
            "",

          approvedDate:
            formatDate(
              recipe.approved_at
            ),

          approvedTime:
            formatTime(
              recipe.approved_at
            ),

          lastUpdated:
            formatDate(
              recipe.updated_at
            ),

          updatedTime:
            formatTime(
              recipe.updated_at
            ),

          createdAt:
            recipe.created_at,

          updatedAt:
            recipe.updated_at,

          version:
            recipe.version || 1,
        };
      }
    );
  };


export const getRecipeById =
  async (recipeId) => {
    const recipes =
      await getRecipes();

    return (
      recipes.find(
        (recipe) =>
          recipe.id ===
          recipeId
      ) || null
    );
  };


const validateRecipe =
  (
    formData,
    ingredients,
    status
  ) => {
    if (
      !formData.productId
    ) {
      throw new Error(
        "Please select a product."
      );
    }

    if (
      !formData.yield ||
      Number(
        formData.yield
      ) <= 0
    ) {
      throw new Error(
        "Please enter a valid yield."
      );
    }

    if (
      status ===
        "Submitted" &&
      ingredients.length ===
        0
    ) {
      throw new Error(
        "Please add at least one ingredient."
      );
    }
  };


const insertIngredients =
  async (
    recipeId,
    ingredients
  ) => {
    if (
      !ingredients.length
    ) {
      return;
    }

    const rows =
      ingredients.map(
        (ingredient) => ({
          recipe_id:
            recipeId,

          product_id:
            ingredient.productId,

          quantity:
            Number(
              ingredient.quantity
            ),

          unit:
            ingredient.unit,

          notes:
            ingredient.notes ||
            null,
        })
      );

    const {
      error,
    } =
      await supabase
        .from(
          "recipe_ingredients"
        )
        .insert(rows);

    if (error) {
      throw error;
    }
  };


export const createRecipe =
  async ({
    formData,
    ingredients,
    status,
    userId,
  }) => {
    validateRecipe(
      formData,
      ingredients,
      status
    );

    const now =
      new Date()
        .toISOString();

    const {
      data: recipe,
      error,
    } =
      await supabase
        .from("recipes")
        .insert({
          product_id:
            formData.productId,

          yield_quantity:
            Number(
              formData.yield
            ),

          yield_unit:
            formData.yieldUnit,

          description:
            formData.description
              ?.trim() ||
            null,

          status,

          created_by:
            userId,

          submitted_at:
            status ===
            "Submitted"
              ? now
              : null,
        })
        .select()
        .single();

    if (error) {
      throw error;
    }

    try {
      await insertIngredients(
        recipe.id,
        ingredients
      );
    } catch (
      ingredientError
    ) {
      await supabase
        .from("recipes")
        .delete()
        .eq(
          "id",
          recipe.id
        );

      throw ingredientError;
    }

    return recipe;
  };


export const updateRecipe =
  async ({
    recipeId,
    formData,
    ingredients,
    status,
    currentStatus,
  }) => {
    validateRecipe(
      formData,
      ingredients,
      status ||
        currentStatus
    );

    const nextStatus =
      status ||
      currentStatus;

    const updateData = {
      product_id:
        formData.productId,

      yield_quantity:
        Number(
          formData.yield
        ),

      yield_unit:
        formData.yieldUnit,

      description:
        formData.description
          ?.trim() ||
        null,

      status:
        nextStatus,
    };

    if (
      nextStatus ===
        "Submitted" &&
      currentStatus !==
        "Submitted"
    ) {
      updateData.submitted_at =
        new Date()
          .toISOString();

      updateData.rejection_comment =
        null;
    }

    const {
      error,
    } =
      await supabase
        .from("recipes")
        .update(
          updateData
        )
        .eq(
          "id",
          recipeId
        );

    if (error) {
      throw error;
    }

    const {
      error:
        deleteIngredientsError,
    } =
      await supabase
        .from(
          "recipe_ingredients"
        )
        .delete()
        .eq(
          "recipe_id",
          recipeId
        );

    if (
      deleteIngredientsError
    ) {
      throw (
        deleteIngredientsError
      );
    }

    await insertIngredients(
      recipeId,
      ingredients
    );

    return true;
  };


export const removeRecipe =
  async (recipeId) => {
    const {
      error,
    } =
      await supabase
        .from("recipes")
        .delete()
        .eq(
          "id",
          recipeId
        );

    if (error) {
      throw error;
    }

    return true;
  };


export const approveRecipe =
  async ({
    recipeId,
    userId,
  }) => {
    const now =
      new Date()
        .toISOString();

    const {
      error:
        approvalError,
    } =
      await supabase
        .from(
          "recipe_approvals"
        )
        .insert({
          recipe_id:
            recipeId,

          approver_id:
            userId,

          decision:
            "Approved",

          reviewed_at:
            now,
        });

    if (approvalError) {
      throw approvalError;
    }

    const {
      error:
        recipeError,
    } =
      await supabase
        .from("recipes")
        .update({
          status:
            "Approved",

          approved_at:
            now,

          rejection_comment:
            null,
        })
        .eq(
          "id",
          recipeId
        );

    if (recipeError) {
      throw recipeError;
    }

    return true;
  };


export const rejectRecipe =
  async ({
    recipeId,
    userId,
    comment,
  }) => {
    const cleanComment =
      comment?.trim();

    if (!cleanComment) {
      throw new Error(
        "Rejection comment is required."
      );
    }

    const now =
      new Date()
        .toISOString();

    const {
      error:
        approvalError,
    } =
      await supabase
        .from(
          "recipe_approvals"
        )
        .insert({
          recipe_id:
            recipeId,

          approver_id:
            userId,

          decision:
            "Rejected",

          comment:
            cleanComment,

          reviewed_at:
            now,
        });

    if (approvalError) {
      throw approvalError;
    }

    const {
      error:
        recipeError,
    } =
      await supabase
        .from("recipes")
        .update({
          status:
            "Rejected",

          rejected_at:
            now,

          rejection_comment:
            cleanComment,
        })
        .eq(
          "id",
          recipeId
        );

    if (recipeError) {
      throw recipeError;
    }

    return true;
  };


export const subscribeToRecipes =
  (onChange) => {
    const channel =
      supabase
        .channel(
          "recipes-live"
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
              "recipe_ingredients",
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
              "recipe_approvals",
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