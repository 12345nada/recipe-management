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

import "../styles/Dashboard.css";


/* =========================================================
   STATUS CHART DATA
========================================================= */

const statusData = [
  {
    name: "ERP Completed",
    value: 310,
    percentage: "88.4%",
    statusValue: "erp-completed",
  },

  {
    name: "ERP Pending",
    value: 18,
    percentage: "5.1%",
    statusValue: "erp-pending",
  },

  {
    name: "Waiting Approval",
    value: 7,
    percentage: "2%",
    statusValue: "waiting-approval",
  },

  {
    name: "Draft",
    value: 12,
    percentage: "3.4%",
    statusValue: "draft",
  },

  {
    name: "Rejected",
    value: 3,
    percentage: "0.9%",
    statusValue: "rejected",
  },
];


const statusColors = [
  "#714426",
  "#aa4d1c",
  "#d09218",
  "#4f3525",
  "#c7361f",
];


/* =========================================================
   TYPE CHART DATA
========================================================= */

const typeData = [
  {
    name: "Finished Product",
    value: 190,
    filterValue: "Finished Product",
  },

  {
    name: "Semi-Finished",
    value: 80,
    filterValue: "Semi-Finished",
  },

  {
    name: "Raw Material",
    value: 50,
    filterValue: "Raw Material",
  },

  {
    name: "Packaging",
    value: 30,
    filterValue: "Packaging",
  },
];


/* =========================================================
   RECENT RECIPES DATA
========================================================= */

const recipes = [
  {
    id: 1,
    name: "Shawarma Box",
    type: "Finished Product",
    yield: "40 Pieces",
    status: "ERP Pending",
    assigned: "ERP User",
    updated: "20 May 2025",
    image: "🥙",
  },

  {
    id: 2,
    name: "Chicken Box",
    type: "Finished Product",
    yield: "40 Pieces",
    status: "Draft",
    assigned: "Head Chef",
    updated: "20 May 2025",
    image: "🍗",
  },

  {
    id: 3,
    name: "Tahini Sauce",
    type: "Semi-Finished",
    yield: "1 Kg",
    status: "Approved",
    assigned: "ERP User",
    updated: "19 May 2025",
    image: "🥣",
  },

  {
    id: 4,
    name: "Bread",
    type: "Semi-Finished",
    yield: "100 Pieces",
    status: "ERP Completed",
    assigned: "ERP User",
    updated: "19 May 2025",
    image: "🥖",
  },

  {
    id: 5,
    name: "Mini Burger",
    type: "Finished Product",
    yield: "50 Pieces",
    status: "Waiting Approval",
    assigned: "Approver",
    updated: "18 May 2025",
    image: "🍔",
  },
];


function Dashboard() {
  const navigate =
    useNavigate();


  const [
    searchValue,
    setSearchValue,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all-status");


  const [
    typeFilter,
    setTypeFilter,
  ] = useState("all-types");


  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);


  /* =======================================================
     PAGINATION SETTINGS
  ======================================================= */

  const itemsPerPage = 5;


  /* =======================================================
     DASHBOARD CARDS
  ======================================================= */

  const stats = [
    {
      title: "Total Recipes",
      value: "350",
      subtitle: "↑ 12% vs last month",
      icon: <ChefHat />,
      className: "total",

      onClick: () => {
        navigate("/recipes");
      },
    },

    {
      title: "Draft",
      value: "12",
      subtitle: "3.4% of total",
      icon: <FileText />,
      className: "draft",

      onClick: () => {
        navigate(
          "/recipes?status=draft"
        );
      },
    },

    {
      title: "Waiting Approval",
      value: "7",
      subtitle: "2% of total",
      icon: <Clock3 />,
      className: "waiting",

      onClick: () => {
        navigate(
          "/recipes?status=waiting-approval"
        );
      },
    },

    {
      title: "ERP Pending",
      value: "18",
      subtitle: "5.1% of total",
      icon: <Database />,
      className: "pending",

      onClick: () => {
        navigate("/erp-entry");
      },
    },

    {
      title: "ERP Completed",
      value: "310",
      subtitle: "↑ 12% vs last month",
      icon: <BadgeCheck />,
      className: "completed",

      onClick: () => {
        navigate(
          "/recipes?status=erp-completed"
        );
      },
    },

    {
      title: "Rejected",
      value: "3",
      subtitle: "0.9% of total",
      icon: <X />,
      className: "rejected",

      onClick: () => {
        navigate(
          "/recipes?status=rejected"
        );
      },
    },
  ];


  /* =======================================================
     TOP SEARCH
  ======================================================= */

  useEffect(() => {
    const topSearchInput =
      document.querySelector(
        'input[placeholder="search anything..."], input[placeholder="Search anything..."]'
      );

    if (!topSearchInput) {
      return undefined;
    }

    const handleTopSearch = (event) => {
      setSearchValue(
        event.target.value
      );

      setCurrentPage(1);
    };

    topSearchInput.addEventListener(
      "input",
      handleTopSearch
    );

    return () => {
      topSearchInput.removeEventListener(
        "input",
        handleTopSearch
      );
    };
  }, []);


  /* =======================================================
     FILTERED RECIPES
  ======================================================= */

  const filteredRecipes =
    useMemo(() => {
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

          const searchableRecipe = [
            recipe.name,
            recipe.type,
            recipe.yield,
            recipe.status,
            recipe.assigned,
            recipe.updated,
          ]
            .join(" ")
            .toLowerCase();


          const matchesSearch =
            normalizedSearch === "" ||
            searchableRecipe.includes(
              normalizedSearch
            );


          const matchesStatus =
            normalizedStatus ===
              "all-status" ||
            recipe.status
              .toLowerCase() ===
              normalizedStatus;


          const matchesType =
            normalizedType ===
              "all-types" ||
            recipe.type
              .toLowerCase() ===
              normalizedType;


          return (
            matchesSearch &&
            matchesStatus &&
            matchesType
          );
        }
      );
    }, [
      searchValue,
      statusFilter,
      typeFilter,
    ]);


  /* =======================================================
     DYNAMIC PAGINATION
  ======================================================= */

  const totalPages =
    Math.ceil(
      filteredRecipes.length /
        itemsPerPage
    );


  const startIndex =
    (currentPage - 1) *
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
    filteredRecipes.length === 0
      ? 0
      : startIndex + 1;


  const lastVisibleItem =
    Math.min(
      endIndex,
      filteredRecipes.length
    );


  /* =======================================================
     CHART CLICKS
  ======================================================= */

  const handleStatusClick = (
    item
  ) => {
    navigate(
      `/recipes?status=${item.statusValue}`
    );
  };


  const handleTypeClick = (
    item
  ) => {
    navigate(
      `/recipes?type=${encodeURIComponent(
        item.filterValue
      )}`
    );
  };


  /* =======================================================
     RECIPE CLICK
  ======================================================= */

  const handleRecipeClick = (
    recipe
  ) => {
    navigate(
      `/recipes/${recipe.id}`
    );
  };


  /* =======================================================
     PREVIOUS PAGE
  ======================================================= */

  const goToPreviousPage = () => {
    setCurrentPage(
      (previousPage) =>
        Math.max(
          1,
          previousPage - 1
        )
    );
  };


  /* =======================================================
     NEXT PAGE
  ======================================================= */

  const goToNextPage = () => {
    setCurrentPage(
      (previousPage) =>
        Math.min(
          totalPages,
          previousPage + 1
        )
    );
  };


  return (
    <section className="dashboard">


      {/* =================================================
          STATS
      ================================================= */}

      <div className="dashboard-stats">

        {stats.map(
          (stat) => (

            <StatCard
              key={stat.title}
              icon={stat.icon}
              title={stat.title}
              value={stat.value}
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


      {/* =================================================
          CHARTS
      ================================================= */}

      <div className="dashboard-charts">


        {/* ===============================================
            STATUS CHART
        =============================================== */}

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
                              index
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
                  350
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
                            index
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


        {/* ===============================================
            TYPE CHART
        =============================================== */}

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
                  domain={[
                    0,
                    200,
                  ]}
                  ticks={[
                    0,
                    40,
                    80,
                    120,
                    160,
                    200,
                  ]}
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

                  <Cell
                    fill="#5d3b25"
                  />

                  <Cell
                    fill="#a54d20"
                  />

                  <Cell
                    fill="#bf7b42"
                  />

                  <Cell
                    fill="#df8a00"
                  />

                </Bar>

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>


      {/* =================================================
          RECENT RECIPES
      ================================================= */}

      <div className="dashboard-panel recent-panel">


        {/* ===============================================
            HEADER
        =============================================== */}

        <div className="recent-header">

          <h3>
            Recent Recipes
          </h3>


          <div className="recent-actions">


            {/* SEARCH */}

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
                    event.target.value
                  );

                  setCurrentPage(
                    1
                  );

                }}
              />

            </div>


            {/* STATUS FILTER */}

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


            {/* TYPE FILTER */}

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


        {/* ===============================================
            TABLE
        =============================================== */}

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


                      {/* NAME */}

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


                      {/* TYPE */}

                      <td>

                        <span className="type-badge">
                          {
                            recipe.type
                          }
                        </span>

                      </td>


                      {/* YIELD */}

                      <td>

                        {
                          recipe.yield
                        }

                      </td>


                      {/* STATUS */}

                      <td>

                        <span
                          className={`status-badge ${recipe.status
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


                      {/* ASSIGNED */}

                      <td>

                        {
                          recipe.assigned
                        }

                      </td>


                      {/* UPDATED */}

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
                        height: "100%",
                        cursor: "default",
                      }}
                    >
                      <td
                        colSpan="6"
                        style={{
                          padding: 0,
                          borderBottom: "none",
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


        {/* ===============================================
            DYNAMIC PAGINATION
        =============================================== */}

        <div className="recent-footer">


          {/* RESULT COUNT */}

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


          {/* PAGINATION */}

          {filteredRecipes.length >
            0 && (

            <div className="pagination">


              {/* PREVIOUS */}

              <button
                type="button"
                aria-label="Previous page"
                onClick={
                  goToPreviousPage
                }
                disabled={
                  currentPage === 1
                }
              >

                ‹

              </button>


              {/* DYNAMIC PAGE NUMBERS */}

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


              {/* NEXT */}

              <button
                type="button"
                aria-label="Next page"
                onClick={
                  goToNextPage
                }
                disabled={
                  currentPage ===
                    totalPages ||
                  totalPages === 0
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