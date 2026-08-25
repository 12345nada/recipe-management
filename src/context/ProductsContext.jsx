import {
  createContext,
  useContext,
  useState,
} from "react";


const ProductsContext =
  createContext(null);


/* =========================================
   INITIAL PRODUCTS
========================================= */

const initialProducts = [
  {
    id: "RM-0001",
    name: "All Purpose Flour",
    type: "Raw Material",
    category: "Flour",
    unit: "Kg",
    hasRecipe: "No",
    lastUpdated: "20 May 2025",
  },

  {
    id: "RM-0002",
    name: "White Sugar",
    type: "Raw Material",
    category: "Sweeteners",
    unit: "Kg",
    hasRecipe: "No",
    lastUpdated: "20 May 2025",
  },

  {
    id: "SF-0001",
    name: "Tomato Sauce",
    type: "Semi-Finished",
    category: "Sauces",
    unit: "Kg",
    hasRecipe: "Yes",
    lastUpdated: "19 May 2025",
  },

  {
    id: "SF-0002",
    name: "Pizza Dough",
    type: "Semi-Finished",
    category: "Dough",
    unit: "Piece",
    hasRecipe: "Yes",
    lastUpdated: "19 May 2025",
  },

  {
    id: "FP-0001",
    name: "Chocolate Cake",
    type: "Finished Product",
    category: "Desserts",
    unit: "Piece",
    hasRecipe: "Yes",
    lastUpdated: "18 May 2025",
  },

  {
    id: "FP-0002",
    name: "Orange Juice",
    type: "Finished Product",
    category: "Beverages",
    unit: "Litre",
    hasRecipe: "No",
    lastUpdated: "18 May 2025",
  },

  {
    id: "RM-0003",
    name: "Olive Oil",
    type: "Raw Material",
    category: "Oils",
    unit: "Litre",
    hasRecipe: "No",
    lastUpdated: "17 May 2025",
  },

  {
    id: "RM-0004",
    name: "Mozzarella Cheese",
    type: "Raw Material",
    category: "Dairy",
    unit: "Kg",
    hasRecipe: "No",
    lastUpdated: "17 May 2025",
  },
];


/* =========================================
   INITIAL SUMMARY
========================================= */

const initialSummary = {
  totalProducts: 258,
  productsWithRecipe: 68,
  categories: 18,
};


/* =========================================
   PROVIDER
========================================= */

export function ProductsProvider({
  children,
}) {
  const [
    products,
    setProducts,
  ] = useState(
    initialProducts
  );


  const [
    summary,
    setSummary,
  ] = useState(
    initialSummary
  );


  /* =========================================
     ADD PRODUCT
  ========================================= */

  const addProduct = (
    product
  ) => {

    setProducts(
      (
        previousProducts
      ) => [
        product,
        ...previousProducts,
      ]
    );


    setSummary(
      (
        previousSummary
      ) => ({
        ...previousSummary,

        totalProducts:
          previousSummary
            .totalProducts + 1,

        productsWithRecipe:
          product.hasRecipe ===
          "Yes"
            ? previousSummary
                .productsWithRecipe + 1
            : previousSummary
                .productsWithRecipe,
      })
    );
  };


  /* =========================================
     GET PRODUCT
  ========================================= */

  const getProductById = (
    productId
  ) => {

    return products.find(
      (product) =>
        product.id ===
        productId
    );
  };


  /* =========================================
     MARK PRODUCT AS HAVING RECIPE
  ========================================= */

  const markProductHasRecipe = (
    productId
  ) => {

    const currentProduct =
      products.find(
        (product) =>
          product.id ===
          productId
      );


    /*
      لو المنتج مش موجود
      أو عنده Recipe بالفعل
      مش هنزود الـ summary تاني.
    */

    if (
      !currentProduct ||
      currentProduct.hasRecipe ===
      "Yes"
    ) {

      return;
    }


    const currentDate =
      new Date()
        .toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        );


    setProducts(
      (
        previousProducts
      ) =>
        previousProducts.map(
          (product) =>
            product.id ===
            productId
              ? {
                  ...product,

                  hasRecipe:
                    "Yes",

                  lastUpdated:
                    currentDate,
                }
              : product
        )
    );


    setSummary(
      (
        previousSummary
      ) => ({
        ...previousSummary,

        productsWithRecipe:
          previousSummary
            .productsWithRecipe + 1,
      })
    );
  };


  /* =========================================
     UPDATE PRODUCT
  ========================================= */

  const updateProduct = (
    productId,
    updatedData
  ) => {

    setProducts(
      (
        previousProducts
      ) =>
        previousProducts.map(
          (product) =>
            product.id ===
            productId
              ? {
                  ...product,
                  ...updatedData,

                  lastUpdated:
                    new Date()
                      .toLocaleDateString(
                        "en-GB",
                        {
                          day:
                            "2-digit",

                          month:
                            "short",

                          year:
                            "numeric",
                        }
                      ),
                }
              : product
        )
    );
  };


  /* =========================================
     DELETE PRODUCT
  ========================================= */

  const deleteProduct = (
    productId
  ) => {

    const productToDelete =
      products.find(
        (product) =>
          product.id ===
          productId
      );


    if (!productToDelete) {
      return;
    }


    setProducts(
      (
        previousProducts
      ) =>
        previousProducts.filter(
          (product) =>
            product.id !==
            productId
        )
    );


    setSummary(
      (
        previousSummary
      ) => ({
        ...previousSummary,

        totalProducts:
          Math.max(
            0,
            previousSummary
              .totalProducts - 1
          ),

        productsWithRecipe:
          productToDelete
            .hasRecipe ===
          "Yes"
            ? Math.max(
                0,
                previousSummary
                  .productsWithRecipe - 1
              )
            : previousSummary
                .productsWithRecipe,
      })
    );
  };


  return (
    <ProductsContext.Provider
      value={{
        products,
        summary,

        addProduct,
        updateProduct,
        deleteProduct,

        getProductById,
        markProductHasRecipe,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}


/* =========================================
   CUSTOM HOOK
========================================= */

export function useProducts() {
  const context =
    useContext(
      ProductsContext
    );


  if (!context) {
    throw new Error(
      "useProducts must be used inside ProductsProvider"
    );
  }


  return context;
}