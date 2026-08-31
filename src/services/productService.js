import {
  supabase,
} from "../lib/supabaseClient";


const formatDate = (
  value
) => {
  if (!value) {
    return "-";
  }

  return new Date(
    value
  ).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};


const normalizeProduct = (
  product
) => ({
  id:
    product.id,

  code:
    product.product_code,

  name:
    product.name,

  type:
    product.product_type,

  category:
    product.category,

  unit:
    product.base_unit,

  description:
    product.description || "",

  hasRecipe:
    product.has_recipe === true
      ? "Yes"
      : "No",

  isActive:
    product.is_active,

  lastUpdated:
    formatDate(
      product.updated_at
    ),

  updatedAt:
    product.updated_at,

  createdAt:
    product.created_at,
});


export const getProducts =
  async () => {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "v_product_master"
        )
        .select("*")
        .eq(
          "is_active",
          true
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


    return (
      data || []
    ).map(
      normalizeProduct
    );
  };


export const createProduct =
  async (
    formData,
    userId
  ) => {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "products"
        )
        .insert({
          name:
            formData.name
              .trim(),

          product_type:
            formData.type,

          category:
            formData.category
              .trim(),

          base_unit:
            formData.unit,

          description:
            formData.description
              ?.trim() || null,

          created_by:
            userId || null,

          updated_by:
            userId || null,
        })
        .select(`
          id,
          product_code,
          name,
          product_type,
          category,
          base_unit,
          description,
          is_active,
          created_at,
          updated_at
        `)
        .single();


    if (error) {
      throw error;
    }


    return data;
  };


export const updateProduct =
  async (
    productId,
    formData,
    userId
  ) => {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "products"
        )
        .update({
          name:
            formData.name
              .trim(),

          product_type:
            formData.type,

          category:
            formData.category
              .trim(),

          base_unit:
            formData.unit,

          description:
            formData.description
              ?.trim() || null,

          updated_by:
            userId || null,
        })
        .eq(
          "id",
          productId
        )
        .select()
        .single();


    if (error) {
      throw error;
    }


    return data;
  };


export const deleteProduct =
  async (
    productId
  ) => {
    const {
      error,
    } =
      await supabase
        .from(
          "products"
        )
        .delete()
        .eq(
          "id",
          productId
        );


    if (error) {
      throw error;
    }


    return true;
  };


export const subscribeToProducts =
  (
    onChange
  ) => {
    const channel =
      supabase
        .channel(
          "product-master-live"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "products",
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
              "recipes",
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