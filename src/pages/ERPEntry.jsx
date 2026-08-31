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
  getERPRecipes,
  subscribeToERP,
} from "../services/erpService";

import "../styles/ERPEntry.css";


function ERPEntry() {
  const navigate =
    useNavigate();


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
            "Could not load ERP recipes."
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
            Loading ERP recipes...
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
              placeholder="Search recipes..."
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
              All Types
            </option>

            <option value="Finished Product">
              Finished Product
            </option>

            <option value="Semi-Finished">
              Semi-Finished
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
              ERP Status: Pending
            </option>

            <option value="ERP Completed">
              ERP Status: Completed
            </option>

            <option value="All">
              All ERP Status
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

            Filter

          </button>

        </div>


        <div className="erp-table-wrapper">

          <table className="erp-table">

            <thead>

              <tr>

                <th>
                  Recipe Name
                </th>

                <th>
                  Type
                </th>

                <th>
                  Category
                </th>

                <th>
                  Yield
                </th>

                <th>
                  Approved On
                </th>

                <th>
                  Status
                </th>

                <th>
                  Action
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
                          recipe.type
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
                            recipe
                              .erpStatus
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
                              Enter ERP
                            </button>

                          ) : (

                            <span className="erp-completed-label">
                              Completed
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
                    No approved recipes ready for ERP.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        <div className="erp-pagination-footer">

          <span>
            Showing{" "}
            {firstVisible}{" "}
            to{" "}
            {lastVisible}{" "}
            of{" "}
            {
              filteredRecipes.length
            }{" "}
            recipes
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