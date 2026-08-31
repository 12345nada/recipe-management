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
  Leaf,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Search,
  Tag,
  X,
} from "lucide-react";

import {
  useAuth,
} from "../context/AuthContext";

import {
  createProduct,
  deleteProduct,
  getProducts,
  subscribeToProducts,
  updateProduct,
} from "../services/productService";

import "../styles/ProductMaster.css";


const initialFormData = {
  name: "",
  type: "Raw Material",
  category: "",
  unit: "Kg",
  description: "",
};


function ProductMaster() {
  const {
    profile,
    isAdmin,
    hasPermission,
  } = useAuth();


  const [
    products,
    setProducts,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    deleting,
    setDeleting,
  ] = useState(false);


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
    actionMenuPosition,
    setActionMenuPosition,
  ] = useState({
    top: 0,
    left: 0,
  });


  const [
    editingProductId,
    setEditingProductId,
  ] = useState(null);


  const [
    formData,
    setFormData,
  ] = useState(
    initialFormData
  );


  const itemsPerPage = 8;


  const canAdd =
    isAdmin ||
    hasPermission(
      "Product Master",
      "add"
    );


  const canEdit =
    isAdmin ||
    hasPermission(
      "Product Master",
      "edit"
    );


  const canDelete =
    isAdmin ||
    hasPermission(
      "Product Master",
      "delete"
    );


  const loadProducts =
    async (
      showLoader = true
    ) => {
      try {
        if (showLoader) {
          setLoading(
            true
          );
        }

        setError(
          ""
        );


        const data =
          await getProducts();


        setProducts(
          data
        );
      } catch (loadError) {
        console.error(
          "Products error:",
          loadError
        );


        setError(
          loadError?.message ||
            "Could not load products."
        );
      } finally {
        if (showLoader) {
          setLoading(
            false
          );
        }
      }
    };


  useEffect(() => {
    loadProducts();


    const unsubscribe =
      subscribeToProducts(
        () => {
          loadProducts(
            false
          );
        }
      );


    return () => {
      unsubscribe();
    };
  }, []);


  useEffect(() => {
    if (
      openActionMenu ===
      null
    ) {
      return undefined;
    }


    const closeActionMenu =
      () => {
        setOpenActionMenu(
          null
        );
      };


    const closeOnPageMove =
      () => {
        setOpenActionMenu(
          null
        );
      };


    document.addEventListener(
      "mousedown",
      closeActionMenu
    );


    window.addEventListener(
      "scroll",
      closeOnPageMove,
      true
    );


    window.addEventListener(
      "resize",
      closeOnPageMove
    );


    return () => {
      document.removeEventListener(
        "mousedown",
        closeActionMenu
      );


      window.removeEventListener(
        "scroll",
        closeOnPageMove,
        true
      );


      window.removeEventListener(
        "resize",
        closeOnPageMove
      );
    };
  }, [
    openActionMenu,
  ]);


  useEffect(() => {
    const openModal =
      () => {
        if (!canAdd) {
          return;
        }


        setEditingProductId(
          null
        );


        setFormData(
          initialFormData
        );


        setError(
          ""
        );


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
  }, [
    canAdd,
  ]);


  const summary =
    useMemo(
      () => {
        const uniqueCategories =
          new Set(
            products
              .map(
                (product) =>
                  product.category
              )
              .filter(
                Boolean
              )
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

          rawMaterials:
            products.filter(
              (product) =>
                product.type ===
                "Raw Material"
            ).length,
        };
      },
      [
        products,
      ]
    );


  const categories =
    useMemo(
      () => [
        ...new Set(
          products
            .map(
              (product) =>
                product.category
            )
            .filter(
              Boolean
            )
        ),
      ],
      [
        products,
      ]
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
            .filter(
              Boolean
            )
        ),
      ],
      [
        products,
      ]
    );


  const filteredProducts =
    useMemo(
      () => {
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
                .includes(
                  value
                ) ||
              product.code
                ?.toLowerCase()
                .includes(
                  value
                ) ||
              product.category
                ?.toLowerCase()
                .includes(
                  value
                );


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
      },
      [
        products,
        search,
        typeFilter,
        categoryFilter,
        unitFilter,
      ]
    );


  const totalPages =
    Math.ceil(
      filteredProducts.length /
        itemsPerPage
    );


  useEffect(() => {
    const availablePages =
      Math.max(
        1,
        totalPages
      );


    if (
      currentPage >
      availablePages
    ) {
      setCurrentPage(
        availablePages
      );
    }
  }, [
    totalPages,
    currentPage,
  ]);


  const startIndex =
    (
      currentPage - 1
    ) *
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
    filteredProducts.length ===
    0
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
      } =
        event.target;


      setFormData(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );


      setError(
        ""
      );
    };


  const resetForm =
    () => {
      setEditingProductId(
        null
      );


      setFormData(
        initialFormData
      );


      setError(
        ""
      );
    };


  const closeProductModal =
    () => {
      if (saving) {
        return;
      }


      setShowAddModal(
        false
      );


      resetForm();
    };


  const toggleActionMenu =
    (
      clickEvent,
      productId
    ) => {
      clickEvent.stopPropagation();


      if (
        openActionMenu ===
        productId
      ) {
        setOpenActionMenu(
          null
        );

        return;
      }


      const buttonRect =
        clickEvent.currentTarget
          .getBoundingClientRect();


      const menuWidth = 125;
      const menuHeight = 110;
      const gap = 10;


      const availableSpaceBelow =
        window.innerHeight -
        buttonRect.bottom;


      const top =
        availableSpaceBelow >=
        menuHeight + gap
          ? buttonRect.bottom +
            gap
          : buttonRect.top -
            menuHeight -
            gap;


      const preferredLeft =
        buttonRect.right -
        menuWidth;


      const left =
        Math.max(
          12,
          Math.min(
            preferredLeft,
            window.innerWidth -
              menuWidth -
              12
          )
        );


      setActionMenuPosition({
        top:
          Math.max(
            12,
            top
          ),

        left,
      });


      setOpenActionMenu(
        productId
      );
    };


  const handleEditProduct =
    (product) => {
      if (!canEdit) {
        return;
      }


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
          product.category ||
          "",

        unit:
          product.unit ||
          "Kg",

        description:
          product.description ||
          "",
      });


      setError(
        ""
      );


      setShowAddModal(
        true
      );


      setOpenActionMenu(
        null
      );
    };


  const handleDeleteProduct =
    (product) => {
      if (!canDelete) {
        return;
      }


      setProductToDelete(
        product
      );


      setOpenActionMenu(
        null
      );
    };


  const confirmDeleteProduct =
    async () => {
      if (
        !productToDelete ||
        deleting
      ) {
        return;
      }


      try {
        setDeleting(
          true
        );


        setError(
          ""
        );


        await deleteProduct(
          productToDelete.id
        );


        setProductToDelete(
          null
        );


        await loadProducts(
          false
        );
      } catch (deleteError) {
        console.error(
          "Delete product error:",
          deleteError
        );


        if (
          deleteError?.code ===
          "23503"
        ) {
          alert(
            "This product cannot be deleted because it is already used in a recipe."
          );
        } else {
          alert(
            deleteError?.message ||
              "Could not delete product."
          );
        }
      } finally {
        setDeleting(
          false
        );
      }
    };


  const handleSaveProduct =
    async (
      event
    ) => {
      event.preventDefault();


      if (saving) {
        return;
      }


      if (
        !formData.name
          .trim() ||
        !formData.category
          .trim()
      ) {
        setError(
          "Product name and category are required."
        );

        return;
      }


      try {
        setSaving(
          true
        );


        setError(
          ""
        );


        if (
          editingProductId
        ) {
          if (!canEdit) {
            setError(
              "You do not have permission to edit products."
            );

            return;
          }


          await updateProduct(
            editingProductId,
            formData,
            profile?.id
          );
        } else {
          if (!canAdd) {
            setError(
              "You do not have permission to add products."
            );

            return;
          }


          await createProduct(
            formData,
            profile?.id
          );
        }


        setShowAddModal(
          false
        );


        resetForm();


        setCurrentPage(
          1
        );


        await loadProducts(
          false
        );
      } catch (saveError) {
        console.error(
          "Save product error:",
          saveError
        );


        if (
          saveError?.code ===
          "23505"
        ) {
          setError(
            "A product with the same code or unique value already exists."
          );
        } else {
          setError(
            saveError?.message ||
              "Could not save product."
          );
        }
      } finally {
        setSaving(
          false
        );
      }
    };


  const handleClearFilters =
    () => {
      setSearch(
        ""
      );

      setTypeFilter(
        "All"
      );

      setCategoryFilter(
        "All"
      );

      setUnitFilter(
        "All"
      );

      setCurrentPage(
        1
      );
    };


  if (loading) {
    return (
      <div className="product-master-page">

        <div className="product-content-card">

          <div className="product-empty">
            Loading products...
          </div>

        </div>

      </div>
    );
  }


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


          <div className="product-stat-card">

            <div className="product-stat-icon">
              <Leaf />
            </div>

            <div>

              <span>
                Raw Materials
              </span>

              <strong>
                {
                  summary.rawMaterials
                }
              </strong>

              <small>
                Total raw materials
              </small>

            </div>

          </div>

        </div>


        <div className="product-content-card">

          {error && (
            <div
              style={{
                padding:
                  "10px 14px",

                marginBottom:
                  "12px",

                borderRadius:
                  "8px",

                background:
                  "#fff2ef",

                color:
                  "#a53b28",

                fontSize:
                  "13px",
              }}
            >
              {error}
            </div>
          )}


          <div className="product-filters">

            <div className="product-search">

              <Search
                size={17}
              />

              <input
                type="text"
                placeholder="Search products..."
                value={
                  search
                }
                onChange={(
                  event
                ) => {
                  setSearch(
                    event.target
                      .value
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
                  event.target
                    .value
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
                  event.target
                    .value
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
                  event.target
                    .value
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
                    key={
                      unit
                    }
                    value={
                      unit
                    }
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
                    (
                      product
                    ) => (

                      <tr
                        key={
                          product.id
                        }
                      >

                        <td className="product-id">
                          {
                            product.code
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

                          {(canEdit ||
                            canDelete) ? (

                            <div
                              className="product-action-wrap"
                              onMouseDown={(
                                event
                              ) =>
                                event
                                  .stopPropagation()
                              }
                            >

                              <button
                                type="button"
                                className="product-more-button"
                                onClick={(
                                  clickEvent
                                ) =>
                                  toggleActionMenu(
                                    clickEvent,
                                    product.id
                                  )
                                }
                              >

                                <MoreVertical
                                  size={17}
                                />

                              </button>


                              {openActionMenu ===
                                product.id && (

                                <div
                                  className="product-action-menu"
                                  style={{
                                    position:
                                      "fixed",

                                    top:
                                      actionMenuPosition.top,

                                    left:
                                      actionMenuPosition.left,

                                    zIndex:
                                      10000,
                                  }}
                                >

                                  {canEdit && (

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

                                  )}


                                  {canDelete && (

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

                                  )}

                                </div>

                              )}

                            </div>

                          ) : (

                            <span>
                              —
                            </span>

                          )}

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
              {
                firstVisibleItem
              }{" "}
              to{" "}
              {
                lastVisibleItem
              }{" "}
              of{" "}
              {
                filteredProducts.length
              }{" "}
              products

            </span>


            <div className="product-pagination">

              <button
                type="button"
                disabled={
                  currentPage ===
                  1
                }
                onClick={() =>
                  setCurrentPage(
                    (
                      previous
                    ) =>
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
                    (
                      previous
                    ) =>
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
            !deleting &&
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
              event
                .stopPropagation()
            }
          >

            <button
              type="button"
              className="delete-confirm-close"
              aria-label="Close"
              disabled={
                deleting
              }
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
                {
                  productToDelete.name
                }
              </strong>

              ?

            </p>


            <div className="delete-confirm-actions">

              <button
                type="button"
                className="delete-confirm-cancel"
                disabled={
                  deleting
                }
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
                disabled={
                  deleting
                }
                onClick={
                  confirmDeleteProduct
                }
              >

                {
                  deleting
                    ? "Deleting..."
                    : "Confirm"
                }

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
              event
                .stopPropagation()
            }
          >

            <div className="product-modal-header">

              <div>

                <h2>

                  {
                    editingProductId
                      ? "Edit Product"
                      : "Add New Product"
                  }

                </h2>


                <p>

                  {
                    editingProductId
                      ? "Update product information."
                      : "Add a new product to Product Master."
                  }

                </p>

              </div>


              <button
                type="button"
                className="product-modal-close"
                disabled={
                  saving
                }
                onClick={
                  closeProductModal
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

                    <span>
                      *
                    </span>

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

                    <span>
                      *
                    </span>

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

                    <span>
                      *
                    </span>

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

                    <span>
                      *
                    </span>

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


              {error && (

                <div
                  style={{
                    marginTop:
                      "12px",

                    color:
                      "#a53b28",

                    fontSize:
                      "13px",
                  }}
                >
                  {error}
                </div>

              )}


              <div className="product-modal-actions">

                <button
                  type="button"
                  className="product-cancel-button"
                  disabled={
                    saving
                  }
                  onClick={
                    closeProductModal
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="product-save-button"
                  disabled={
                    saving
                  }
                >

                  <Plus
                    size={16}
                  />

                  {
                    saving
                      ? "Saving..."
                      : editingProductId
                        ? "Save Changes"
                        : "Add Product"
                  }

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