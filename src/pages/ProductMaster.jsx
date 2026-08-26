import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Box,
  FileText,
  Filter,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Search,
  Tag,
  X,
} from "lucide-react";

import {
  productOptions,
} from "../data/recipesData";

import "../styles/ProductMaster.css";

const PRODUCTS_KEY =
  "recipe-management-products";

const normalizeProducts = (
  products
) =>
  products.map(
    (product) => ({
      ...product,

      hasRecipe:
        product.hasRecipe ||
        "No",

      description:
        product.description ||
        "",

      lastUpdated:
        product.lastUpdated ||
        "-",
    })
  );

function ProductMaster() {
  const [
    products,
    setProducts,
  ] = useState(() => {
    const saved =
      localStorage.getItem(
        PRODUCTS_KEY
      );

    if (saved) {
      try {
        return normalizeProducts(
          JSON.parse(saved)
        );
      } catch {
        return normalizeProducts(
          productOptions
        );
      }
    }

    return normalizeProducts(
      productOptions
    );
  });

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("All");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("All");

  const [
    unitFilter,
    setUnitFilter,
  ] = useState("All");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    showAddModal,
    setShowAddModal,
  ] = useState(false);

  const [
    productToDelete,
    setProductToDelete,
  ] = useState(null);

  const [
    openActionMenu,
    setOpenActionMenu,
  ] = useState(null);

  const [
    editingProductId,
    setEditingProductId,
  ] = useState(null);

  const [
    formData,
    setFormData,
  ] = useState({
    name: "",
    type:
      "Raw Material",
    category: "",
    unit: "Kg",
    description: "",
  });

  const itemsPerPage = 8;

  useEffect(() => {
    localStorage.setItem(
      PRODUCTS_KEY,
      JSON.stringify(
        products
      )
    );
  }, [products]);

  useEffect(() => {
    const closeActionMenu =
      () => {
        setOpenActionMenu(
          null
        );
      };

    document.addEventListener(
      "mousedown",
      closeActionMenu
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeActionMenu
      );
    };
  }, []);


  useEffect(() => {
    const openModal =
      () => {
        setEditingProductId(
          null
        );

        setFormData({
          name: "",
          type:
            "Raw Material",
          category: "",
          unit: "Kg",
          description: "",
        });

        setShowAddModal(
          true
        );
      };

    window.addEventListener(
      "open-product-modal",
      openModal
    );

    return () => {
      window.removeEventListener(
        "open-product-modal",
        openModal
      );
    };
  }, []);

  const summary =
    useMemo(() => {
      const uniqueCategories =
        new Set(
          products
            .map(
              (product) =>
                product.category
            )
            .filter(Boolean)
        );

      return {
        totalProducts:
          products.length,

        productsWithRecipe:
          products.filter(
            (product) =>
              product.hasRecipe ===
              "Yes"
          ).length,

        categories:
          uniqueCategories.size,
      };
    }, [products]);

  const categories =
    useMemo(
      () => [
        ...new Set(
          products
            .map(
              (product) =>
                product.category
            )
            .filter(Boolean)
        ),
      ],
      [products]
    );

  const units =
    useMemo(
      () => [
        ...new Set(
          products
            .map(
              (product) =>
                product.unit
            )
            .filter(Boolean)
        ),
      ],
      [products]
    );

  const filteredProducts =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const searchMatch =
            !value ||
            product.name
              ?.toLowerCase()
              .includes(value) ||
            product.id
              ?.toLowerCase()
              .includes(value);

          const typeMatch =
            typeFilter ===
              "All" ||
            product.type ===
              typeFilter;

          const categoryMatch =
            categoryFilter ===
              "All" ||
            product.category ===
              categoryFilter;

          const unitMatch =
            unitFilter ===
              "All" ||
            product.unit ===
              unitFilter;

          return (
            searchMatch &&
            typeMatch &&
            categoryMatch &&
            unitMatch
          );
        }
      );
    }, [
      products,
      search,
      typeFilter,
      categoryFilter,
      unitFilter,
    ]);

  const totalPages =
    Math.ceil(
      filteredProducts.length /
        itemsPerPage
    );

  const startIndex =
    (currentPage - 1) *
    itemsPerPage;

  const endIndex =
    startIndex +
    itemsPerPage;

  const paginatedProducts =
    filteredProducts.slice(
      startIndex,
      endIndex
    );

  const firstVisibleItem =
    filteredProducts.length === 0
      ? 0
      : startIndex + 1;

  const lastVisibleItem =
    Math.min(
      endIndex,
      filteredProducts.length
    );

  const handleFormChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setFormData(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };

  const generateProductCode =
    () => {
      const prefixMap = {
        "Raw Material":
          "RM",

        "Semi-Finished":
          "SF",

        "Finished Product":
          "FP",

        Packaging:
          "PK",
      };

      const prefix =
        prefixMap[
          formData.type
        ] || "PRD";

      const numbers =
        products
          .filter(
            (product) =>
              product.id
                ?.startsWith(
                  `${prefix}-`
                )
          )
          .map(
            (product) =>
              Number(
                product.id
                  .split("-")[1]
              )
          )
          .filter(
            (number) =>
              !Number.isNaN(
                number
              )
          );

      const nextNumber =
        numbers.length === 0
          ? 1
          : Math.max(
              ...numbers
            ) + 1;

      return `${prefix}-${String(
        nextNumber
      ).padStart(
        4,
        "0"
      )}`;
    };

  const handleAddProduct =
    (event) => {
      event.preventDefault();

      if (
        !formData.name.trim() ||
        !formData.category.trim()
      ) {
        return;
      }

      const newProduct = {
        id:
          generateProductCode(),

        name:
          formData.name.trim(),

        type:
          formData.type,

        category:
          formData.category.trim(),

        unit:
          formData.unit,

        hasRecipe:
          "No",

        description:
          formData.description.trim(),

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
      };

      setProducts(
        (previous) => [
          newProduct,
          ...previous,
        ]
      );

      setFormData({
        name: "",
        type:
          "Raw Material",
        category: "",
        unit: "Kg",
        description: "",
      });

      setCurrentPage(1);
      setShowAddModal(false);
    };

  const handleEditProduct =
    (product) => {
      setEditingProductId(
        product.id
      );

      setFormData({
        name:
          product.name || "",
        type:
          product.type ||
          "Raw Material",
        category:
          product.category || "",
        unit:
          product.unit || "Kg",
        description:
          product.description || "",
      });

      setShowAddModal(
        true
      );

      setOpenActionMenu(
        null
      );
    };


  const handleDeleteProduct =
    (product) => {
      setProductToDelete(
        product
      );

      setOpenActionMenu(
        null
      );
    };


  const confirmDeleteProduct =
    () => {
      if (!productToDelete) {
        return;
      }

      setProducts(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              productToDelete.id
          )
      );

      setProductToDelete(
        null
      );
    };


  const handleSaveProduct =
    (event) => {
      if (!editingProductId) {
        handleAddProduct(
          event
        );

        return;
      }

      event.preventDefault();

      if (
        !formData.name.trim() ||
        !formData.category.trim()
      ) {
        return;
      }

      setProducts(
        (previous) =>
          previous.map(
            (product) =>
              product.id ===
              editingProductId
                ? {
                    ...product,
                    name:
                      formData.name.trim(),
                    type:
                      formData.type,
                    category:
                      formData.category.trim(),
                    unit:
                      formData.unit,
                    description:
                      formData.description.trim(),
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

      setEditingProductId(
        null
      );

      setFormData({
        name: "",
        type:
          "Raw Material",
        category: "",
        unit: "Kg",
        description: "",
      });

      setShowAddModal(
        false
      );
    };


  const closeProductModal =
    () => {
      setShowAddModal(
        false
      );

      setEditingProductId(
        null
      );

      setFormData({
        name: "",
        type:
          "Raw Material",
        category: "",
        unit: "Kg",
        description: "",
      });
    };


  const handleClearFilters =
    () => {
      setSearch("");
      setTypeFilter("All");
      setCategoryFilter("All");
      setUnitFilter("All");
      setCurrentPage(1);
    };

  return (
    <>
      <div className="product-master-page">

        <div className="product-stat-grid">

          <div className="product-stat-card">
            <div className="product-stat-icon">
              <Box />
            </div>

            <div>
              <span>
                Total Products
              </span>

              <strong>
                {
                  summary.totalProducts
                }
              </strong>

              <small>
                100% of total
              </small>
            </div>
          </div>

          <div className="product-stat-card">
            <div className="product-stat-icon">
              <FileText />
            </div>

            <div>
              <span>
                Products With Recipe
              </span>

              <strong>
                {
                  summary
                    .productsWithRecipe
                }
              </strong>

              <small>
                {
                  summary.totalProducts >
                  0
                    ? `${(
                        (
                          summary
                            .productsWithRecipe /
                          summary
                            .totalProducts
                        ) *
                        100
                      ).toFixed(
                        1
                      )}% of total`
                    : "0% of total"
                }
              </small>
            </div>
          </div>

          <div className="product-stat-card">
            <div className="product-stat-icon">
              <Tag />
            </div>

            <div>
              <span>
                Categories
              </span>

              <strong>
                {
                  summary.categories
                }
              </strong>

              <small>
                Total categories
              </small>
            </div>
          </div>

        </div>

        <div className="product-content-card">

          <div className="product-filters">

            <div className="product-search">
              <Search
                size={17}
              />

              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(
                  event
                ) => {
                  setSearch(
                    event.target.value
                  );

                  setCurrentPage(
                    1
                  );
                }}
              />
            </div>

            <select
              value={
                typeFilter
              }
              onChange={(
                event
              ) => {
                setTypeFilter(
                  event.target.value
                );

                setCurrentPage(
                  1
                );
              }}
            >
              <option value="All">
                All Types
              </option>

              <option value="Raw Material">
                Raw Material
              </option>

              <option value="Semi-Finished">
                Semi-Finished
              </option>

              <option value="Finished Product">
                Finished Product
              </option>

              <option value="Packaging">
                Packaging
              </option>
            </select>

            <select
              value={
                categoryFilter
              }
              onChange={(
                event
              ) => {
                setCategoryFilter(
                  event.target.value
                );

                setCurrentPage(
                  1
                );
              }}
            >
              <option value="All">
                All Categories
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={
                      category
                    }
                    value={
                      category
                    }
                  >
                    {category}
                  </option>
                )
              )}
            </select>

            <select
              value={
                unitFilter
              }
              onChange={(
                event
              ) => {
                setUnitFilter(
                  event.target.value
                );

                setCurrentPage(
                  1
                );
              }}
            >
              <option value="All">
                All Units
              </option>

              {units.map(
                (unit) => (
                  <option
                    key={unit}
                    value={unit}
                  >
                    {unit}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              className="product-filter-button"
              onClick={
                handleClearFilters
              }
            >
              <Filter
                size={15}
              />

              Clear
            </button>

          </div>

          <div className="product-table-wrapper">

            <table className="product-table">

              <thead>
                <tr>
                  <th>
                    Product Code
                  </th>

                  <th>
                    Product Name
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    Base Unit
                  </th>

                  <th>
                    Recipe Status
                  </th>

                  <th>
                    Last Updated
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>

                {paginatedProducts.length >
                0 ? (

                  paginatedProducts.map(
                    (product) => (

                      <tr
                        key={
                          product.id
                        }
                      >

                        <td className="product-id">
                          {
                            product.id
                          }
                        </td>

                        <td>
                          <div className="product-name-cell">

                            <div className="product-icon-box">
                              <Box
                                size={17}
                              />
                            </div>

                            <strong>
                              {
                                product.name
                              }
                            </strong>

                          </div>
                        </td>

                        <td>
                          {
                            product.type
                          }
                        </td>

                        <td>
                          {
                            product.category
                          }
                        </td>

                        <td>
                          {
                            product.unit
                          }
                        </td>

                        <td>
                          {(
                            product.type ===
                              "Raw Material" ||
                            product.type ===
                              "Packaging"
                          ) ? (
                            <span className="has-recipe no">
                              —
                            </span>
                          ) : (
                            <span
                              className={
                                product.hasRecipe ===
                                "Yes"
                                  ? "has-recipe yes"
                                  : "has-recipe no"
                              }
                            >
                              {
                                product.hasRecipe ===
                                "Yes"
                                  ? "Recipe Available"
                                  : "No Recipe"
                              }
                            </span>
                          )}
                        </td>

                        <td>
                          {
                            product.lastUpdated
                          }
                        </td>

                        <td>
                          <div
                            className="product-action-wrap"
                            onMouseDown={(
                              event
                            ) =>
                              event.stopPropagation()
                            }
                          >
                            <button
                              type="button"
                              className="product-more-button"
                              onClick={() =>
                                setOpenActionMenu(
                                  (
                                    current
                                  ) =>
                                    current ===
                                    product.id
                                      ? null
                                      : product.id
                                )
                              }
                            >
                              <MoreVertical
                                size={17}
                              />
                            </button>

                            {openActionMenu ===
                              product.id && (
                              <div className="product-action-menu">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditProduct(
                                      product
                                    )
                                  }
                                >
                                  <Pencil
                                    size={15}
                                  />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="delete"
                                  onClick={() =>
                                    handleDeleteProduct(
                                      product
                                    )
                                  }
                                >
                                  <Trash2
                                    size={15}
                                  />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                      </tr>

                    )
                  )

                ) : (

                  <tr>
                    <td
                      colSpan="8"
                      className="product-empty"
                    >
                      No products found.
                    </td>
                  </tr>

                )}

              </tbody>

            </table>

          </div>

          <div className="product-pagination-footer">

            <span>
              Showing{" "}
              {firstVisibleItem}{" "}
              to{" "}
              {lastVisibleItem}{" "}
              of{" "}
              {filteredProducts.length}{" "}
              products
            </span>

            <div className="product-pagination">

              <button
                type="button"
                disabled={
                  currentPage === 1
                }
                onClick={() =>
                  setCurrentPage(
                    (previous) =>
                      Math.max(
                        1,
                        previous - 1
                      )
                  )
                }
              >
                ‹
              </button>

              {Array.from(
                {
                  length:
                    totalPages,
                },
                (
                  _,
                  index
                ) =>
                  index + 1
              ).map(
                (
                  pageNumber
                ) => (

                  <button
                    type="button"
                    key={
                      pageNumber
                    }
                    className={
                      currentPage ===
                      pageNumber
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setCurrentPage(
                        pageNumber
                      )
                    }
                  >
                    {
                      pageNumber
                    }
                  </button>

                )
              )}

              <button
                type="button"
                disabled={
                  currentPage ===
                    totalPages ||
                  totalPages ===
                    0
                }
                onClick={() =>
                  setCurrentPage(
                    (previous) =>
                      Math.min(
                        totalPages,
                        previous + 1
                      )
                  )
                }
              >
                ›
              </button>

            </div>

          </div>

        </div>

      </div>

      {productToDelete && (

        <div
          className="delete-confirm-overlay"
          onMouseDown={() =>
            setProductToDelete(
              null
            )
          }
        >

          <div
            className="delete-confirm-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="delete-confirm-close"
              aria-label="Close"
              onClick={() =>
                setProductToDelete(
                  null
                )
              }
            >
              <X
                size={20}
              />
            </button>


            <div className="delete-confirm-icon">
              <AlertTriangle
                size={32}
              />
            </div>


            <h2>
              Confirm Action
            </h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>
                {productToDelete.name}
              </strong>
              ?
            </p>


            <div className="delete-confirm-actions">

              <button
                type="button"
                className="delete-confirm-cancel"
                onClick={() =>
                  setProductToDelete(
                    null
                  )
                }
              >
                Cancel
              </button>


              <button
                type="button"
                className="delete-confirm-button"
                onClick={
                  confirmDeleteProduct
                }
              >
                Confirm
              </button>

            </div>

          </div>

        </div>

      )}


      {showAddModal && (

        <div
          className="product-modal-overlay"
          onMouseDown={
            closeProductModal
          }
        >

          <div
            className="product-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="product-modal-header">

              <div>
                <h2>
                  {editingProductId
                    ? "Edit Product"
                    : "Add New Product"}
                </h2>

                <p>
                  {editingProductId
                    ? "Update product information."
                    : "Add a new product to Product Master."}
                </p>
              </div>

              <button
                type="button"
                className="product-modal-close"
                onClick={() =>
                  setShowAddModal(
                    false
                  )
                }
              >
                <X
                  size={19}
                />
              </button>

            </div>

            <form
              onSubmit={
                handleSaveProduct
              }
            >

              <div className="product-form-grid">

                <div className="product-form-group product-form-full">

                  <label>
                    Product Name
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Enter product name"
                    value={
                      formData.name
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                  />

                </div>

                <div className="product-form-group">

                  <label>
                    Product Type
                    <span>*</span>
                  </label>

                  <select
                    name="type"
                    value={
                      formData.type
                    }
                    onChange={
                      handleFormChange
                    }
                  >
                    <option value="Raw Material">
                      Raw Material
                    </option>

                    <option value="Semi-Finished">
                      Semi-Finished
                    </option>

                    <option value="Finished Product">
                      Finished Product
                    </option>

                    <option value="Packaging">
                      Packaging
                    </option>
                  </select>

                </div>

                <div className="product-form-group">

                  <label>
                    Category
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="category"
                    placeholder="Example: Flour"
                    value={
                      formData.category
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                  />

                </div>

                <div className="product-form-group">

                  <label>
                    Base Unit
                    <span>*</span>
                  </label>

                  <select
                    name="unit"
                    value={
                      formData.unit
                    }
                    onChange={
                      handleFormChange
                    }
                  >
                    <option value="Kg">
                      Kg
                    </option>

                    <option value="Gram">
                      Gram
                    </option>

                    <option value="Piece">
                      Piece
                    </option>

                    <option value="Litre">
                      Litre
                    </option>

                    <option value="ml">
                      ml
                    </option>

                    <option value="Pack">
                      Pack
                    </option>
                  </select>

                </div>

                <div className="product-form-group product-form-full">

                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    placeholder="Enter product description..."
                    value={
                      formData.description
                    }
                    onChange={
                      handleFormChange
                    }
                  />

                </div>

              </div>

              <div className="product-modal-actions">

                <button
                  type="button"
                  className="product-cancel-button"
                  onClick={
                    closeProductModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="product-save-button"
                >
                  <Plus
                    size={16}
                  />

                  {editingProductId
                    ? "Save Changes"
                    : "Add Product"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </>
  );
}

export default ProductMaster;