import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Filter,
  Search,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useTranslation,
} from "react-i18next";

import {
  getERPRecipes,
  subscribeToERP,
} from "../services/erpService";

import "../styles/ERPEntry.css";


function ERPEntry() {
  const {
    t,
  } = useTranslation();

  const navigate =
    useNavigate();


  const translateType =
    (type) => {
      const keys = {
        "Finished Product":
          "productTypes.finishedProduct",
        "Semi-Finished":
          "productTypes.semiFinished",
        "Raw Material":
          "productTypes.rawMaterial",
        "Packaging":
          "productTypes.packaging",
      };

      return keys[type]
        ? t(keys[type])
        : type;
    };


  const translateStatus =
    (status) => {
      const keys = {
        "ERP Pending":
          "status.erpPending",
        "ERP Completed":
          "status.erpCompleted",
      };

      return keys[status]
        ? t(keys[status])
        : status;
    };


  const [
    recipes,
    setRecipes,
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
    statusFilter,
    setStatusFilter,
  ] = useState(
    "ERP Pending"
  );


  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);


  const itemsPerPage = 5;


  const loadRecipes =
    async (
      showLoader = true
    ) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const data =
          await getERPRecipes();

        setRecipes(data);
      } catch (
        loadError
      ) {
        console.error(
          "ERP load error:",
          loadError
        );

        setError(
          loadError?.message ||
            t("erpEntryPage.errors.couldNotLoad")
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    };


  useEffect(() => {
    loadRecipes();

    const unsubscribe =
      subscribeToERP(
        () => {
          loadRecipes(false);
        }
      );

    return () => {
      unsubscribe();
    };
  }, []);


  const categories =
    useMemo(
      () => [
        ...new Set(
          recipes
            .map(
              (recipe) =>
                recipe.category
            )
            .filter(Boolean)
        ),
      ],
      [
        recipes,
      ]
    );


  const filteredRecipes =
    useMemo(
      () => {
        const value =
          search
            .trim()
            .toLowerCase();

        return recipes.filter(
          (recipe) => {
            const searchMatch =
              !value ||
              recipe.name
                ?.toLowerCase()
                .includes(
                  value
                ) ||
              recipe.recipeCode
                ?.toLowerCase()
                .includes(
                  value
                );

            const typeMatch =
              typeFilter ===
                "All" ||
              recipe.type ===
                typeFilter;

            const categoryMatch =
              categoryFilter ===
                "All" ||
              recipe.category ===
                categoryFilter;

            const statusMatch =
              statusFilter ===
                "All" ||
              recipe.erpStatus ===
                statusFilter;

            return (
              searchMatch &&
              typeMatch &&
              categoryMatch &&
              statusMatch
            );
          }
        );
      },
      [
        recipes,
        search,
        typeFilter,
        categoryFilter,
        statusFilter,
      ]
    );


  const totalPages =
    Math.ceil(
      filteredRecipes.length /
        itemsPerPage
    );


  useEffect(() => {
    const safePages =
      Math.max(
        1,
        totalPages
      );

    if (
      currentPage >
      safePages
    ) {
      setCurrentPage(
        safePages
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


  const paginatedRecipes =
    filteredRecipes.slice(
      startIndex,
      endIndex
    );


  const firstVisible =
    filteredRecipes.length ===
    0
      ? 0
      : startIndex + 1;


  const lastVisible =
    Math.min(
      endIndex,
      filteredRecipes.length
    );


  const handleClearFilters =
    () => {
      setSearch("");

      setTypeFilter(
        "All"
      );

      setCategoryFilter(
        "All"
      );

      setStatusFilter(
        "ERP Pending"
      );

      setCurrentPage(1);
    };


  const handleOpenDetails =
    (recipeId) => {
      navigate(
        `/erp-entry/${recipeId}`
      );
    };


  if (loading) {
    return (
      <div className="erp-entry-page">

        <div className="erp-entry-card">

          <div className="erp-empty">
            {t("erpEntryPage.loading")}
          </div>

        </div>

      </div>
    );
  }


  return (
    <div className="erp-entry-page">

      <div className="erp-entry-card">

        {error && (
          <div
            className="erp-empty"
            style={{
              color:
                "#b42318",
            }}
          >
            {error}
          </div>
        )}


        <div className="erp-filters">

          <div className="erp-search">

            <Search
              size={18}
            />

            <input
              type="text"
              placeholder={t("erpEntryPage.filters.searchPlaceholder")}
              value={
                search
              }
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
              {t("erpEntryPage.filters.allTypes")}
            </option>

            <option value="Finished Product">
              {t("productTypes.finishedProduct")}
            </option>

            <option value="Semi-Finished">
              {t("productTypes.semiFinished")}
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
              {t("erpEntryPage.filters.allCategories")}
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
              statusFilter
            }
            onChange={(
              event
            ) => {
              setStatusFilter(
                event.target.value
              );

              setCurrentPage(
                1
              );
            }}
          >

            <option value="ERP Pending">
              {t("erpEntryPage.filters.erpPending")}
            </option>

            <option value="ERP Completed">
              {t("erpEntryPage.filters.erpCompleted")}
            </option>

            <option value="All">
              {t("erpEntryPage.filters.allStatuses")}
            </option>

          </select>


          <button
            type="button"
            className="erp-filter-button"
            onClick={
              handleClearFilters
            }
          >

            <Filter
              size={17}
            />

            {t("erpEntryPage.filters.clearFilters")}

          </button>

        </div>


        <div className="erp-table-wrapper">

          <table className="erp-table">

            <thead>

              <tr>

                <th>
                  {t("erpEntryPage.table.recipeName")}
                </th>

                <th>
                  {t("erpEntryPage.table.type")}
                </th>

                <th>
                  {t("erpEntryPage.table.category")}
                </th>

                <th>
                  {t("erpEntryPage.table.yield")}
                </th>

                <th>
                  {t("erpEntryPage.table.approvedOn")}
                </th>

                <th>
                  {t("erpEntryPage.table.status")}
                </th>

                <th>
                  {t("erpEntryPage.table.action")}
                </th>

              </tr>

            </thead>


            <tbody>

              {paginatedRecipes.length >
              0 ? (

                paginatedRecipes.map(
                  (
                    recipe
                  ) => (

                    <tr
                      key={
                        recipe.id
                      }
                    >

                      <td>

                        <div className="erp-recipe-cell">

                          <button
                            type="button"
                            className="erp-recipe-image"
                            onClick={() =>
                              handleOpenDetails(
                                recipe.id
                              )
                            }
                          >
                            <span>
                              🍽️
                            </span>
                          </button>


                          <div>

                            <button
                              type="button"
                              className="erp-recipe-name-button"
                              onClick={() =>
                                handleOpenDetails(
                                  recipe.id
                                )
                              }
                            >
                              {
                                recipe.name
                              }
                            </button>


                            {recipe.description && (

                              <span>
                                {
                                  recipe.description
                                }
                              </span>

                            )}

                          </div>

                        </div>

                      </td>


                      <td>
                        {
                          translateType(
                            recipe.type
                          )
                        }
                      </td>


                      <td>
                        {
                          recipe.category
                        }
                      </td>


                      <td>
                        {
                          recipe
                            .displayYield
                        }
                      </td>


                      <td>

                        <div className="erp-approved-date">

                          <span>
                            {
                              recipe
                                .approvedDate
                            }
                          </span>

                          <small>
                            {
                              recipe
                                .approvedTime
                            }
                          </small>

                        </div>

                      </td>


                      <td>

                        <span
                          className={
                            recipe.erpStatus ===
                            "ERP Completed"
                              ? "erp-status completed"
                              : "erp-status pending"
                          }
                        >
                          {
                            translateStatus(
                              recipe.erpStatus
                            )
                          }
                        </span>

                      </td>


                      <td>

                        <div className="erp-actions">

                          {recipe.erpStatus ===
                          "ERP Pending" ? (

                            <button
                              type="button"
                              className="enter-erp-button"
                              onClick={() =>
                                navigate(
                                  `/erp-entry/${recipe.id}`
                                )
                              }
                            >
                              {t("erpEntryPage.actions.enterERP")}
                            </button>

                          ) : (

                            <span className="erp-completed-label">
                              {t("erpEntryPage.actions.completed")}
                            </span>

                          )}

                        </div>

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="7"
                    className="erp-empty"
                  >
                    {t("erpEntryPage.empty")}
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        <div className="erp-pagination-footer">

          <span>
            {t(
              "erpEntryPage.pagination.showing",
              {
                from:
                  firstVisible,
                to:
                  lastVisible,
                total:
                  filteredRecipes.length,
              }
            )}
          </span>


          <div className="erp-pagination">

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
  );
}


export default ERPEntry;