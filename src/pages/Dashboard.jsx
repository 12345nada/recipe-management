import {
  ChefHat,
  FileText,
  Clock3,
  Database,
  BadgeCheck,
  X,
  Search,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import StatCard from "../components/StatCard";

import {
  getDashboardData,
  subscribeToDashboard,
} from "../services/dashboardService";

import "../styles/Dashboard.css";


const statusColors = [
  "#714426",
  "#aa4d1c",
  "#d09218",
  "#4f3525",
  "#c7361f",
];


const typeColors = [
  "#5d3b25",
  "#a54d20",
  "#bf7b42",
  "#df8a00",
];


function Dashboard() {
  const navigate =
    useNavigate();


  const [
    dashboardStats,
    setDashboardStats,
  ] = useState({
    totalRecipes: 0,
    draft: 0,
    waitingApproval: 0,
    approved: 0,
    rejected: 0,
    erpPending: 0,
    erpCompleted: 0,
  });


  const [
    statusData,
    setStatusData,
  ] = useState([]);


  const [
    typeData,
    setTypeData,
  ] = useState([]);


  const [
    recipes,
    setRecipes,
  ] = useState([]);


  const [
    trends,
    setTrends,
  ] = useState({
    totalRecipes: {
      value: 0,
      direction: "same",
    },

    erpCompleted: {
      value: 0,
      direction: "same",
    },
  });


  const [
    dashboardLoading,
    setDashboardLoading,
  ] = useState(true);


  const [
    dashboardError,
    setDashboardError,
  ] = useState("");


  const [
    searchValue,
    setSearchValue,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState(
    "all-status"
  );


  const [
    typeFilter,
    setTypeFilter,
  ] = useState(
    "all-types"
  );


  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);


  const itemsPerPage = 5;


  const loadDashboard =
    async (
      showLoader = true
    ) => {
      try {
        if (showLoader) {
          setDashboardLoading(
            true
          );
        }

        setDashboardError(
          ""
        );

        const data =
          await getDashboardData();

        setDashboardStats(
          data.stats
        );

        setStatusData(
          data.statusData
        );

        setTypeData(
          data.typeData
        );

        setRecipes(
          data.recipes
        );

        setTrends(
          data.trends
        );
      } catch (error) {
        console.error(
          "Dashboard error:",
          error
        );

        setDashboardError(
          error?.message ||
            "Could not load dashboard."
        );
      } finally {
        if (showLoader) {
          setDashboardLoading(
            false
          );
        }
      }
    };


  useEffect(() => {
    loadDashboard();

    const unsubscribe =
      subscribeToDashboard(
        () => {
          loadDashboard(
            false
          );
        }
      );

    return () => {
      unsubscribe();
    };
  }, []);


  const total =
    dashboardStats
      .totalRecipes;


  const percentage =
    (value) => {
      if (!total) {
        return "0% of total";
      }

      return `${(
        (
          Number(value) /
          total
        ) *
        100
      ).toFixed(
        1
      )}% of total`;
    };


  const trendText =
    (trend) => {
      if (
        !trend ||
        trend.direction ===
          "same"
      ) {
        return (
          "0% vs last month"
        );
      }

      const arrow =
        trend.direction ===
        "up"
          ? "↑"
          : "↓";

      return `${arrow} ${trend.value}% vs last month`;
    };


  const stats = [
    {
      title:
        "Total Recipes",

      value:
        dashboardStats
          .totalRecipes,

      subtitle:
        trendText(
          trends.totalRecipes
        ),

      icon:
        <ChefHat />,

      className:
        "total",

      onClick: () => {
        navigate(
          "/recipes"
        );
      },
    },

    {
      title:
        "Draft",

      value:
        dashboardStats
          .draft,

      subtitle:
        percentage(
          dashboardStats
            .draft
        ),

      icon:
        <FileText />,

      className:
        "draft",

      onClick: () => {
        navigate(
          "/recipes?status=draft"
        );
      },
    },

    {
      title:
        "Waiting Approval",

      value:
        dashboardStats
          .waitingApproval,

      subtitle:
        percentage(
          dashboardStats
            .waitingApproval
        ),

      icon:
        <Clock3 />,

      className:
        "waiting",

      onClick: () => {
        navigate(
          "/recipes?status=waiting-approval"
        );
      },
    },

    {
      title:
        "ERP Pending",

      value:
        dashboardStats
          .erpPending,

      subtitle:
        percentage(
          dashboardStats
            .erpPending
        ),

      icon:
        <Database />,

      className:
        "pending",

      onClick: () => {
        navigate(
          "/erp-entry"
        );
      },
    },

    {
      title:
        "ERP Completed",

      value:
        dashboardStats
          .erpCompleted,

      subtitle:
        trendText(
          trends.erpCompleted
        ),

      icon:
        <BadgeCheck />,

      className:
        "completed",

      onClick: () => {
        navigate(
          "/recipes?status=erp-completed"
        );
      },
    },

    {
      title:
        "Rejected",

      value:
        dashboardStats
          .rejected,

      subtitle:
        percentage(
          dashboardStats
            .rejected
        ),

      icon:
        <X />,

      className:
        "rejected",

      onClick: () => {
        navigate(
          "/recipes?status=rejected"
        );
      },
    },
  ];


  useEffect(() => {
    const topSearchInput =
      document.querySelector(
        'input[placeholder="search anything..."], input[placeholder="Search anything..."]'
      );

    if (!topSearchInput) {
      return undefined;
    }

    const handleTopSearch =
      (event) => {
        setSearchValue(
          event.target.value
        );

        setCurrentPage(1);
      };

    topSearchInput
      .addEventListener(
        "input",
        handleTopSearch
      );

    return () => {
      topSearchInput
        .removeEventListener(
          "input",
          handleTopSearch
        );
    };
  }, []);


  const filteredRecipes =
    useMemo(
      () => {
        const normalizedSearch =
          searchValue
            .trim()
            .toLowerCase();

        const normalizedStatus =
          statusFilter
            .trim()
            .toLowerCase();

        const normalizedType =
          typeFilter
            .trim()
            .toLowerCase();


        return recipes.filter(
          (recipe) => {
            const searchableRecipe =
              [
                recipe.name,
                recipe.recipeNumber,
                recipe.type,
                recipe.category,
                recipe.yield,
                recipe.status,
                recipe.assigned,
                recipe.createdBy,
                recipe.updated,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchesSearch =
              normalizedSearch ===
                "" ||
              searchableRecipe
                .includes(
                  normalizedSearch
                );


            let matchesStatus =
              normalizedStatus ===
              "all-status";


            if (
              !matchesStatus
            ) {
              if (
                normalizedStatus ===
                "waiting approval"
              ) {
                matchesStatus =
                  [
                    "submitted",
                    "pending approval",
                    "under review",
                  ].includes(
                    recipe.status
                      ?.toLowerCase()
                  );
              } else {
                matchesStatus =
                  recipe.status
                    ?.toLowerCase() ===
                  normalizedStatus;
              }
            }


            const matchesType =
              normalizedType ===
                "all-types" ||
              recipe.type
                ?.toLowerCase() ===
                normalizedType;


            return (
              matchesSearch &&
              matchesStatus &&
              matchesType
            );
          }
        );
      },
      [
        recipes,
        searchValue,
        statusFilter,
        typeFilter,
      ]
    );


  useEffect(() => {
    const totalPages =
      Math.max(
        1,
        Math.ceil(
          filteredRecipes.length /
            itemsPerPage
        )
      );

    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    filteredRecipes.length,
    currentPage,
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


  const firstVisibleItem =
    filteredRecipes.length ===
    0
      ? 0
      : startIndex + 1;


  const lastVisibleItem =
    Math.min(
      endIndex,
      filteredRecipes.length
    );


  const handleStatusClick =
    (item) => {
      if (
        !item?.statusValue
      ) {
        return;
      }

      navigate(
        `/recipes?status=${item.statusValue}`
      );
    };


  const handleTypeClick =
    (item) => {
      if (
        !item?.filterValue
      ) {
        return;
      }

      navigate(
        `/recipes?type=${encodeURIComponent(
          item.filterValue
        )}`
      );
    };


  const handleRecipeClick =
    (recipe) => {
      if (!recipe?.id) {
        return;
      }

      navigate(
        `/recipes/${recipe.id}`
      );
    };


  const goToPreviousPage =
    () => {
      setCurrentPage(
        (
          previousPage
        ) =>
          Math.max(
            1,
            previousPage - 1
          )
      );
    };


  const goToNextPage =
    () => {
      setCurrentPage(
        (
          previousPage
        ) =>
          Math.min(
            totalPages,
            previousPage + 1
          )
      );
    };


  if (
    dashboardLoading
  ) {
    return (
      <section className="dashboard">

        <div className="dashboard-panel">
          Loading dashboard...
        </div>

      </section>
    );
  }


  if (dashboardError) {
    return (
      <section className="dashboard">

        <div className="dashboard-panel">

          <p>
            {dashboardError}
          </p>

          <button
            type="button"
            onClick={() =>
              loadDashboard()
            }
          >
            Try Again
          </button>

        </div>

      </section>
    );
  }


  return (
    <section className="dashboard">

      <div className="dashboard-stats">

        {stats.map(
          (stat) => (

            <StatCard
              key={
                stat.title
              }
              icon={
                stat.icon
              }
              title={
                stat.title
              }
              value={
                stat.value
              }
              subtitle={
                stat.subtitle
              }
              className={
                stat.className
              }
              onClick={
                stat.onClick
              }
            />

          )
        )}

      </div>


      <div className="dashboard-charts">

        <div className="dashboard-panel status-panel">

          <div className="panel-header">

            <h3>
              Recipes by Status
            </h3>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/recipes"
                )
              }
            >
              View all
            </button>

          </div>


          <div className="status-chart-content">

            <div className="donut-wrapper">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Tooltip
                    formatter={(
                      value,
                      name
                    ) => [
                      `${value} recipes`,
                      name,
                    ]}
                    contentStyle={{
                      borderRadius:
                        "8px",

                      border:
                        "1px solid #eadfd8",

                      fontSize:
                        "10px",
                    }}
                  />


                  <Pie
                    data={
                      statusData
                    }
                    dataKey="value"
                    nameKey="name"
                    innerRadius="62%"
                    outerRadius="86%"
                    paddingAngle={0}
                    stroke="none"
                    cursor="pointer"
                    onClick={(
                      data
                    ) => {
                      if (data) {
                        handleStatusClick(
                          data
                        );
                      }
                    }}
                  >

                    {statusData.map(
                      (
                        item,
                        index
                      ) => (

                        <Cell
                          key={
                            item.name
                          }
                          fill={
                            statusColors[
                              index %
                              statusColors.length
                            ]
                          }
                          style={{
                            cursor:
                              "pointer",
                          }}
                        />

                      )
                    )}

                  </Pie>

                </PieChart>

              </ResponsiveContainer>


              <div className="donut-center">

                <strong>
                  {
                    dashboardStats
                      .totalRecipes
                  }
                </strong>

                <span>
                  Total
                </span>

              </div>

            </div>


            <div className="status-legend">

              {statusData.map(
                (
                  item,
                  index
                ) => (

                  <div
                    className="legend-row"
                    key={
                      item.name
                    }
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      handleStatusClick(
                        item
                      )
                    }
                    onKeyDown={(
                      event
                    ) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key ===
                          " "
                      ) {
                        handleStatusClick(
                          item
                        );
                      }
                    }}
                  >

                    <span
                      className="legend-dot"
                      style={{
                        backgroundColor:
                          statusColors[
                            index %
                            statusColors.length
                          ],
                      }}
                    />

                    <span className="legend-name">
                      {item.name}
                    </span>

                    <strong>
                      {item.value}
                    </strong>

                    <span>
                      (
                      {
                        item.percentage
                      }
                      )
                    </span>

                  </div>

                )
              )}

            </div>

          </div>

        </div>


        <div className="dashboard-panel type-panel">

          <div className="panel-header">

            <h3>
              Recipes by Type
            </h3>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/product-master"
                )
              }
            >
              View all
            </button>

          </div>


          <div className="type-chart-content">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={
                  typeData
                }
                margin={{
                  top: 18,
                  right: 12,
                  left: -20,
                  bottom: 0,
                }}
              >

                <Tooltip
                  cursor={{
                    fill:
                      "rgba(81, 60, 41, 0.04)",
                  }}
                  formatter={(
                    value
                  ) => [
                    `${value} recipes`,
                    "Recipes",
                  ]}
                  contentStyle={{
                    borderRadius:
                      "8px",

                    border:
                      "1px solid #eadfd8",

                    fontSize:
                      "10px",
                  }}
                />


                <YAxis
                  allowDecimals={
                    false
                  }
                  axisLine={
                    false
                  }
                  tickLine={
                    false
                  }
                  tick={{
                    fontSize: 9,
                    fill:
                      "#5f554e",
                  }}
                />


                <XAxis
                  dataKey="name"
                  axisLine={{
                    stroke:
                      "#e8e0da",
                  }}
                  tickLine={
                    false
                  }
                  tick={{
                    fontSize: 9,
                    fill:
                      "#342d28",
                  }}
                />


                <Bar
                  dataKey="value"
                  radius={[
                    5,
                    5,
                    0,
                    0,
                  ]}
                  barSize={42}
                  cursor="pointer"
                  onClick={(
                    data
                  ) => {
                    if (data) {
                      handleTypeClick(
                        data
                      );
                    }
                  }}
                  label={{
                    position:
                      "top",

                    fontSize:
                      11,

                    fontWeight:
                      700,

                    fill:
                      "#1f1915",
                  }}
                >

                  {typeData.map(
                    (
                      item,
                      index
                    ) => (

                      <Cell
                        key={
                          item.name
                        }
                        fill={
                          typeColors[
                            index %
                            typeColors.length
                          ]
                        }
                      />

                    )
                  )}

                </Bar>

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>


      <div className="dashboard-panel recent-panel">

        <div className="recent-header">

          <h3>
            Recent Recipes
          </h3>


          <div className="recent-actions">

            <div className="recent-search">

              <Search
                size={14}
              />

              <input
                type="text"
                placeholder="Search recipes..."
                value={
                  searchValue
                }
                onChange={(
                  event
                ) => {
                  setSearchValue(
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

              <option value="all-status">
                All Status
              </option>

              <option value="Draft">
                Draft
              </option>

              <option value="Waiting Approval">
                Waiting Approval
              </option>

              <option value="Approved">
                Approved
              </option>

              <option value="ERP Pending">
                ERP Pending
              </option>

              <option value="ERP Completed">
                ERP Completed
              </option>

              <option value="Rejected">
                Rejected
              </option>

            </select>


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

              <option value="all-types">
                All Types
              </option>

              <option value="Finished Product">
                Finished Product
              </option>

              <option value="Semi-Finished">
                Semi-Finished
              </option>

              <option value="Raw Material">
                Raw Material
              </option>

              <option value="Packaging">
                Packaging
              </option>

            </select>

          </div>

        </div>


        <div className="recent-table-wrapper">

          <table className="recent-table">

            <thead>

              <tr>

                <th>
                  Recipe Name
                </th>

                <th>
                  Type
                </th>

                <th>
                  Yield
                </th>

                <th>
                  Status
                </th>

                <th>
                  Assigned To
                </th>

                <th>
                  Last Updated
                </th>

              </tr>

            </thead>


            <tbody>

              {paginatedRecipes.length >
              0 ? (

                <>

                  {paginatedRecipes.map(
                    (
                      recipe
                    ) => (

                      <tr
                        key={
                          recipe.id
                        }
                        onClick={() =>
                          handleRecipeClick(
                            recipe
                          )
                        }
                      >

                        <td>

                          <div className="recipe-name-cell">

                            <div className="recipe-thumb">
                              {
                                recipe.image
                              }
                            </div>

                            <strong>
                              {
                                recipe.name
                              }
                            </strong>

                          </div>

                        </td>


                        <td>

                          <span className="type-badge">
                            {
                              recipe.type
                            }
                          </span>

                        </td>


                        <td>
                          {
                            recipe.yield
                          }
                        </td>


                        <td>

                          <span
                            className={`status-badge ${String(
                              recipe.status ||
                                ""
                            )
                              .toLowerCase()
                              .replaceAll(
                                " ",
                                "-"
                              )}`}
                          >
                            {
                              recipe.status
                            }
                          </span>

                        </td>


                        <td>
                          {
                            recipe.assigned
                          }
                        </td>


                        <td>
                          {
                            recipe.updated
                          }
                        </td>

                      </tr>

                    )
                  )}


                  {paginatedRecipes.length <
                    itemsPerPage && (

                    <tr
                      aria-hidden="true"
                      style={{
                        height:
                          "100%",

                        cursor:
                          "default",
                      }}
                    >

                      <td
                        colSpan="6"
                        style={{
                          padding: 0,

                          borderBottom:
                            "none",
                        }}
                      />

                    </tr>

                  )}

                </>

              ) : (

                <tr>

                  <td
                    colSpan="6"
                    style={{
                      textAlign:
                        "center",

                      color:
                        "#82766e",
                    }}
                  >
                    No recipes found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        <div className="recent-footer">

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
              filteredRecipes.length
            }{" "}
            recipes

          </span>


          {filteredRecipes.length >
            0 && (

            <div className="pagination">

              <button
                type="button"
                aria-label="Previous page"
                onClick={
                  goToPreviousPage
                }
                disabled={
                  currentPage ===
                  1
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
                aria-label="Next page"
                onClick={
                  goToNextPage
                }
                disabled={
                  currentPage ===
                    totalPages ||
                  totalPages ===
                    0
                }
              >
                ›
              </button>

            </div>

          )}

        </div>

      </div>

    </section>
  );
}


export default Dashboard;