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
  useTranslation,
} from "react-i18next";

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
    t,
  } = useTranslation();


  const {
    profile,
    isAdmin,
    hasPermission,
  } = useAuth();


  const translateType =
    (type) => {
      const typeKeys = {
        "Finished Product":
          "productTypes.finishedProduct",
        "Semi-Finished":
          "productTypes.semiFinished",
        "Raw Material":
          "productTypes.rawMaterial",
        "Packaging":
          "productTypes.packaging",
      };

      return typeKeys[type]
        ? t(typeKeys[type])
        : type;
    };


  const translateUnit =
    (unit) => {
      const unitKeys = {
        Kg: "productMasterPage.units.kg",
        Gram: "productMasterPage.units.gram",
        Piece: "productMasterPage.units.piece",
        Litre: "productMasterPage.units.litre",
        ml: "productMasterPage.units.ml",
        Pack: "productMasterPage.units.pack",
      };

      return unitKeys[unit]
        ? t(unitKeys[unit])
        : unit;
    };


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
            t("productMasterPage.errors.couldNotLoad")
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
            t("productMasterPage.errors.usedInRecipe")
          );
        } else {
          alert(
            deleteError?.message ||
              t("productMasterPage.errors.couldNotDelete")
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
          t("productMasterPage.errors.nameCategoryRequired")
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
              t("productMasterPage.errors.noEditPermission")
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
              t("productMasterPage.errors.noAddPermission")
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
            t("productMasterPage.errors.duplicateProduct")
          );
        } else {
          setError(
            saveError?.message ||
              t("productMasterPage.errors.couldNotSave")
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
            {t("productMasterPage.loading")}
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
                {t("productMasterPage.stats.totalProducts")}
              </span>

              <strong>
                {
                  summary.totalProducts
                }
              </strong>

              <small>
                {t("productMasterPage.stats.hundredPercent")}
              </small>

            </div>

          </div>


          <div className="product-stat-card">

            <div className="product-stat-icon">
              <FileText />
            </div>

            <div>

              <span>
                {t("productMasterPage.stats.productsWithRecipe")}
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
                      )}% ${t("productMasterPage.stats.ofTotal")}`

                    : `0% ${t("productMasterPage.stats.ofTotal")}`
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
                {t("productMasterPage.stats.categories")}
              </span>

              <strong>
                {
                  summary.categories
                }
              </strong>

              <small>
                {t("productMasterPage.stats.totalCategories")}
              </small>

            </div>

          </div>


          <div className="product-stat-card">

            <div className="product-stat-icon">
              <Leaf />
            </div>

            <div>

              <span>
                {t("productMasterPage.stats.rawMaterials")}
              </span>

              <strong>
                {
                  summary.rawMaterials
                }
              </strong>

              <small>
                {t("productMasterPage.stats.totalRawMaterials")}
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
                placeholder={t("productMasterPage.filters.searchPlaceholder")}
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
                {t("productMasterPage.filters.allTypes")}
              </option>

              <option value="Raw Material">
                {t("productTypes.rawMaterial")}
              </option>

              <option value="Semi-Finished">
                {t("productTypes.semiFinished")}
              </option>

              <option value="Finished Product">
                {t("productTypes.finishedProduct")}
              </option>

              <option value="Packaging">
                {t("productTypes.packaging")}
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
                {t("productMasterPage.filters.allCategories")}
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
                {t("productMasterPage.filters.allUnits")}
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
                    {translateUnit(
                      unit
                    )}
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

              {t("productMasterPage.filters.clear")}

            </button>

          </div>


          <div className="product-table-wrapper">

            <table className="product-table">

              <thead>

                <tr>

                  <th>
                    {t("productMasterPage.table.productCode")}
                  </th>

                  <th>
                    {t("productMasterPage.table.productName")}
                  </th>

                  <th>
                    {t("productMasterPage.table.type")}
                  </th>

                  <th>
                    {t("productMasterPage.table.category")}
                  </th>

                  <th>
                    {t("productMasterPage.table.baseUnit")}
                  </th>

                  <th>
                    {t("productMasterPage.table.recipeStatus")}
                  </th>

                  <th>
                    {t("productMasterPage.table.lastUpdated")}
                  </th>

                  <th>
                    {t("productMasterPage.table.actions")}
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
                            translateType(
                              product.type
                            )
                          }
                        </td>


                        <td>
                          {
                            product.category
                          }
                        </td>


                        <td>
                          {
                            translateUnit(
                              product.unit
                            )
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
                                  ? t("productMasterPage.recipeStatus.available")
                                  : t("productMasterPage.recipeStatus.none")
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

                                      {t("common.edit")}

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

                                      {t("common.delete")}

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
                      {t("productMasterPage.noProducts")}
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>


          <div className="product-pagination-footer">

            <span>

              {t(
                "productMasterPage.pagination.showing",
                {
                  from:
                    firstVisibleItem,
                  to:
                    lastVisibleItem,
                  total:
                    filteredProducts.length,
                }
              )}

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
              aria-label={t("common.close")}
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
              {t("productMasterPage.delete.title")}
            </h2>


            <p>

              {t("productMasterPage.delete.prompt")}{" "}

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
                {t("common.cancel")}
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
                    ? t("productMasterPage.delete.deleting")
                    : t("productMasterPage.delete.confirm")
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
                      ? t("productMasterPage.form.editProduct")
                      : t("productMasterPage.form.addNewProduct")
                  }

                </h2>


                <p>

                  {
                    editingProductId
                      ? t("productMasterPage.form.editSubtitle")
                      : t("productMasterPage.form.addSubtitle")
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

                    {t("productMasterPage.table.productName")}

                    <span>
                      *
                    </span>

                  </label>


                  <input
                    type="text"
                    name="name"
                    placeholder={t("productMasterPage.form.namePlaceholder")}
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

                    {t("productMasterPage.form.productType")}

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
                      {t("productTypes.rawMaterial")}
                    </option>

                    <option value="Semi-Finished">
                      {t("productTypes.semiFinished")}
                    </option>

                    <option value="Finished Product">
                      {t("productTypes.finishedProduct")}
                    </option>

                    <option value="Packaging">
                      {t("productTypes.packaging")}
                    </option>

                  </select>

                </div>


                <div className="product-form-group">

                  <label>

                    {t("productMasterPage.form.category")}

                    <span>
                      *
                    </span>

                  </label>


                  <input
                    type="text"
                    name="category"
                    placeholder={t("productMasterPage.form.categoryPlaceholder")}
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

                    {t("productMasterPage.table.baseUnit")}

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
                      {t("productMasterPage.units.kg")}
                    </option>

                    <option value="Gram">
                      {t("productMasterPage.units.gram")}
                    </option>

                    <option value="Piece">
                      {t("productMasterPage.units.piece")}
                    </option>

                    <option value="Litre">
                      {t("productMasterPage.units.litre")}
                    </option>

                    <option value="ml">
                      {t("productMasterPage.units.ml")}
                    </option>

                    <option value="Pack">
                      {t("productMasterPage.units.pack")}
                    </option>

                  </select>

                </div>


                <div className="product-form-group product-form-full">

                  <label>
                    {t("productMasterPage.form.description")}
                  </label>


                  <textarea
                    name="description"
                    placeholder={t("productMasterPage.form.descriptionPlaceholder")}
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
                  {t("common.cancel")}
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
                      ? t("common.saving")
                      : editingProductId
                        ? t("productMasterPage.form.saveChanges")
                        : t("productMasterPage.form.addProduct")
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