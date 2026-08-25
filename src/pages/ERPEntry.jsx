import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Filter,
  MoreVertical,
  Search,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  initialRecipes,
} from "../data/recipesData";

import "../styles/ERPEntry.css";


const RECIPES_KEY =
  "recipe-management-recipes";


function loadRecipes() {
  const saved =
    localStorage.getItem(
      RECIPES_KEY
    );

  if (saved) {
    try {
      return JSON.parse(
        saved
      );
    } catch {
      return initialRecipes;
    }
  }

  return initialRecipes;
}


function ERPEntry() {
  const navigate =
    useNavigate();


  const [
    recipes,
    setRecipes,
  ] = useState(() =>
    loadRecipes()
  );


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


  useEffect(() => {
    const refreshRecipes =
      () => {
        setRecipes(
          loadRecipes()
        );
      };


    window.addEventListener(
      "focus",
      refreshRecipes
    );


    window.addEventListener(
      "storage",
      refreshRecipes
    );


    return () => {
      window.removeEventListener(
        "focus",
        refreshRecipes
      );

      window.removeEventListener(
        "storage",
        refreshRecipes
      );
    };
  }, []);


  const erpRecipes =
    useMemo(
      () =>
        recipes
          .filter(
            (recipe) =>
              recipe.status ===
                "Approved" ||
              recipe.status ===
                "ERP Pending" ||
              recipe.status ===
                "ERP Completed"
          )
          .map(
            (recipe) => ({
              ...recipe,

              name:
                recipe.productName ||
                recipe.name ||
                "Unnamed Recipe",

              erpStatus:
                recipe.status ===
                "Approved"
                  ? "ERP Pending"
                  : recipe.status,

              displayYield:
                `${recipe.yield || ""} ${
                  recipe.yieldUnit ||
                  ""
                }`.trim(),

              approvedDate:
                recipe.approvedDate ||
                recipe.lastUpdated ||
                "-",

              approvedTime:
                recipe.approvedTime ||
                recipe.updatedTime ||
                "",
            })
          ),
      [recipes]
    );


  const categories =
    useMemo(
      () => [
        ...new Set(
          erpRecipes
            .map(
              (recipe) =>
                recipe.category
            )
            .filter(Boolean)
        ),
      ],
      [erpRecipes]
    );


  const filteredRecipes =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();


      return erpRecipes.filter(
        (recipe) => {
          const searchMatch =
            !value ||
            recipe.name
              .toLowerCase()
              .includes(value) ||
            recipe.id
              ?.toLowerCase()
              .includes(value);


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
    }, [
      erpRecipes,
      search,
      typeFilter,
      categoryFilter,
      statusFilter,
    ]);


  const totalPages =
    Math.ceil(
      filteredRecipes.length /
        itemsPerPage
    );


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


  return (
    <>

      <div className="erp-entry-page">

        <div className="erp-entry-card">

          <div className="erp-filters">

            <div className="erp-search">

              <Search
                size={18}
              />

              <input
                type="text"
                placeholder="Search recipes..."
                value={search}
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
                statusFilter
              }
              onChange={(
                event
              ) => {
                setStatusFilter(
                  event.target
                    .value
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
                    (recipe) => (

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


                            <button
                              type="button"
                              className="erp-more-button"
                            >
                              <MoreVertical
                                size={18}
                              />
                            </button>

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

    </>
  );
}


export default ERPEntry;