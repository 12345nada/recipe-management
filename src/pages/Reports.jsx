import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CalendarDays,
  CookingPot,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  MoreVertical,
  Utensils,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import {
  initialRecipes,
} from "../data/recipesData";

import "../styles/Reports.css";


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


function Reports() {
  const [
    recipes,
    setRecipes,
  ] = useState(() =>
    loadRecipes()
  );


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
  ] = useState("All");


  const [
    fromDate,
    setFromDate,
  ] = useState("");

  const [
    toDate,
    setToDate,
  ] = useState("");


  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);


  const [
    showExportMenu,
    setShowExportMenu,
  ] = useState(false);


  const exportWrapperRef =
    useRef(null);


  const itemsPerPage = 8;


  /* =========================================
     KEEP REPORTS SYNCED
  ========================================= */

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


  /* =========================================
     CLOSE EXPORT MENU
  ========================================= */

  useEffect(() => {
    const handleOutsideClick =
      (event) => {
        if (
          exportWrapperRef.current &&
          !exportWrapperRef.current.contains(
            event.target
          )
        ) {
          setShowExportMenu(
            false
          );
        }
      };


    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );


    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);


  /* =========================================
     PREPARE REPORT DATA
  ========================================= */

  const reportData =
    useMemo(
      () =>
        recipes.map(
          (recipe) => {
            const name =
              recipe.productName ||
              recipe.name ||
              "Unnamed Recipe";


            const yieldValue =
              `${recipe.yield || ""} ${
                recipe.yieldUnit ||
                ""
              }`.trim();


            let assignedTo =
              "Head Chef";


            if (
              recipe.status ===
                "Submitted" ||
              recipe.status ===
                "Waiting Approval" ||
              recipe.status ===
                "Under Review" ||
              recipe.status ===
                "Rejected"
            ) {
              assignedTo =
                "Approver";
            }


            if (
              recipe.status ===
                "Approved" ||
              recipe.status ===
                "ERP Pending" ||
              recipe.status ===
                "ERP Completed"
            ) {
              assignedTo =
                "ERP User";
            }


            return {
              ...recipe,

              name,

              displayYield:
                yieldValue || "-",

              assignedTo,

              lastUpdated:
                recipe.lastUpdated ||
                recipe.approvedDate ||
                "-",

              reportDate:
                recipe.updatedAt ||
                recipe.erp?.completedAt ||
                recipe.createdAt ||
                recipe.approvedAt ||
                recipe.lastUpdated ||
                recipe.approvedDate ||
                null,
            };
          }
        ),
      [recipes]
    );


  /* =========================================
     DYNAMIC CATEGORIES
  ========================================= */

  const categories =
    useMemo(
      () => [
        ...new Set(
          reportData
            .map(
              (recipe) =>
                recipe.category
            )
            .filter(Boolean)
        ),
      ],
      [reportData]
    );


  /* =========================================
     DYNAMIC TYPES
  ========================================= */

  const types =
    useMemo(
      () => [
        ...new Set(
          reportData
            .map(
              (recipe) =>
                recipe.type
            )
            .filter(Boolean)
        ),
      ],
      [reportData]
    );


  /* =========================================
     FILTER DATA
  ========================================= */

  const filteredReports =
    useMemo(() => {
      return reportData.filter(
        (item) => {
          const matchesType =
            typeFilter ===
              "All" ||
            item.type ===
              typeFilter;

          const matchesCategory =
            categoryFilter ===
              "All" ||
            item.category ===
              categoryFilter;

          const matchesStatus =
            statusFilter ===
              "All" ||
            item.status ===
              statusFilter;

          let matchesDate = true;

          if (
            fromDate ||
            toDate
          ) {
            const parsedDate =
              item.reportDate
                ? new Date(
                    item.reportDate
                  )
                : null;

            if (
              !parsedDate ||
              Number.isNaN(
                parsedDate.getTime()
              )
            ) {
              matchesDate = false;
            } else {
              if (fromDate) {
                const startDate =
                  new Date(
                    `${fromDate}T00:00:00`
                  );

                if (
                  parsedDate <
                  startDate
                ) {
                  matchesDate = false;
                }
              }

              if (toDate) {
                const endDate =
                  new Date(
                    `${toDate}T23:59:59`
                  );

                if (
                  parsedDate >
                  endDate
                ) {
                  matchesDate = false;
                }
              }
            }
          }

          return (
            matchesType &&
            matchesCategory &&
            matchesStatus &&
            matchesDate
          );
        }
      );
    }, [
      reportData,
      typeFilter,
      categoryFilter,
      statusFilter,
      fromDate,
      toDate,
    ]);


  /* =========================================
     PAGINATION
  ========================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredReports.length /
          itemsPerPage
      )
    );


  const startIndex =
    (
      currentPage - 1
    ) *
    itemsPerPage;


  const endIndex =
    startIndex +
    itemsPerPage;


  const visibleReports =
    filteredReports.slice(
      startIndex,
      endIndex
    );


  const firstVisible =
    filteredReports.length ===
    0
      ? 0
      : startIndex + 1;


  const lastVisible =
    Math.min(
      endIndex,
      filteredReports.length
    );


  /* =========================================
     CLEAR FILTERS
  ========================================= */

  const clearFilters =
    () => {
      setFromDate("");
      setToDate("");

      setTypeFilter(
        "All"
      );

      setCategoryFilter(
        "All"
      );

      setStatusFilter(
        "All"
      );

      setCurrentPage(1);
    };


  /* =========================================
     ICON
  ========================================= */

  const getRecipeIcon =
    (type) => {
      if (
        type ===
        "Finished Product"
      ) {
        return (
          <Utensils
            size={18}
          />
        );
      }


      if (
        type ===
        "Semi-Finished"
      ) {
        return (
          <CookingPot
            size={18}
          />
        );
      }


      return (
        <Utensils
          size={18}
        />
      );
    };


  /* =========================================
     EXPORT PDF
  ========================================= */

  const handleExportPDF =
    () => {
      const document =
        new jsPDF({
          orientation:
            "landscape",

          unit:
            "mm",

          format:
            "a4",
        });


      document.setFontSize(
        18
      );


      document.text(
        "Recipe Management Report",
        14,
        18
      );


      document.setFontSize(
        10
      );


      document.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        14,
        25
      );


      document.text(
        `Date Range: ${
          fromDate || "Any"
        } - ${
          toDate || "Any"
        }`,
        14,
        31
      );


      document.text(
        `Type: ${
          typeFilter === "All"
            ? "All Types"
            : typeFilter
        }`,
        14,
        37
      );


      document.text(
        `Category: ${
          categoryFilter ===
          "All"
            ? "All Categories"
            : categoryFilter
        }`,
        70,
        37
      );


      document.text(
        `Status: ${
          statusFilter === "All"
            ? "All Status"
            : statusFilter
        }`,
        145,
        37
      );


      autoTable(
        document,
        {
          startY:
            44,

          head: [[
            "Recipe ID",
            "Recipe Name",
            "Type",
            "Category",
            "Yield",
            "Status",
            "Assigned To",
            "Last Updated",
          ]],

          body:
            filteredReports.map(
              (recipe) => [
                recipe.id ||
                  "-",

                recipe.name,

                recipe.type ||
                  "-",

                recipe.category ||
                  "-",

                recipe.displayYield,

                recipe.status ||
                  "-",

                recipe.assignedTo,

                recipe.lastUpdated,
              ]
            ),

          styles: {
            fontSize:
              8,

            cellPadding:
              3,
          },

          headStyles: {
            fillColor: [
              81,
              60,
              41,
            ],
          },
        }
      );


      document.save(
        "recipe-report.pdf"
      );


      setShowExportMenu(
        false
      );
    };


  /* =========================================
     EXPORT EXCEL
  ========================================= */

  const handleExportExcel =
    () => {
      const excelData =
        filteredReports.map(
          (recipe) => ({
            "Recipe ID":
              recipe.id ||
              "-",

            "Recipe Name":
              recipe.name,

            Type:
              recipe.type ||
              "-",

            Category:
              recipe.category ||
              "-",

            Yield:
              recipe.displayYield,

            Status:
              recipe.status ||
              "-",

            "Assigned To":
              recipe.assignedTo,

            "Last Updated":
              recipe.lastUpdated,
          })
        );


      const worksheet =
        XLSX.utils.json_to_sheet(
          excelData
        );


      const workbook =
        XLSX.utils.book_new();


      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Recipe Report"
      );


      worksheet[
        "!cols"
      ] = [
        {
          wch:
            18,
        },
        {
          wch:
            25,
        },
        {
          wch:
            20,
        },
        {
          wch:
            20,
        },
        {
          wch:
            15,
        },
        {
          wch:
            20,
        },
        {
          wch:
            18,
        },
        {
          wch:
            18,
        },
      ];


      XLSX.writeFile(
        workbook,
        "recipe-report.xlsx"
      );


      setShowExportMenu(
        false
      );
    };


  return (
    <div className="reports-page">


      {/* =====================================
          FILTERS
      ===================================== */}

      <div className="reports-filter-card">

        <div className="reports-filter-card-header">

          <div className="reports-filter-card-title">

            <div className="reports-filter-card-icon">
              <Filter
                size={19}
              />
            </div>

            <div>
              <h2>
                Report Filters
              </h2>

              <p>
                Narrow the report results using the filters below.
              </p>
            </div>

          </div>

        </div>


        <div className="reports-toolbar">


          <div className="reports-date-range">

          <div className="reports-date-field">

            <span className="reports-date-label">
              From
            </span>

            <div className="reports-date-input-wrap">

              <CalendarDays
                size={16}
              />

              <input
                type="date"
                value={
                  fromDate
                }
                max={
                  toDate ||
                  undefined
                }
                onChange={(
                  event
                ) => {
                  setFromDate(
                    event.target.value
                  );

                  setCurrentPage(
                    1
                  );
                }}
              />

            </div>

          </div>

          <div className="reports-date-field">

            <span className="reports-date-label">
              To
            </span>

            <div className="reports-date-input-wrap">

              <CalendarDays
                size={16}
              />

              <input
                type="date"
                value={
                  toDate
                }
                min={
                  fromDate ||
                  undefined
                }
                onChange={(
                  event
                ) => {
                  setToDate(
                    event.target.value
                  );

                  setCurrentPage(
                    1
                  );
                }}
              />

            </div>

          </div>

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


          {types.map(
            (type) => (

              <option
                key={type}
                value={type}
              >
                {type}
              </option>

            )
          )}

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

          <option value="All">
            All Status
          </option>

          <option value="Draft">
            Draft
          </option>

          <option value="Submitted">
            Submitted
          </option>

          <option value="Waiting Approval">
            Waiting Approval
          </option>

          <option value="Under Review">
            Under Review
          </option>

          <option value="Approved">
            Approved
          </option>

          <option value="Rejected">
            Rejected
          </option>

          <option value="ERP Pending">
            ERP Pending
          </option>

          <option value="ERP Completed">
            ERP Completed
          </option>

        </select>


        <div
          className="reports-export-wrapper"
          ref={
            exportWrapperRef
          }
        >

          <button
            type="button"
            className="reports-export-button"
            onClick={() =>
              setShowExportMenu(
                (previous) =>
                  !previous
              )
            }
          >

            <Download
              size={17}
            />

            Export

          </button>


          {showExportMenu && (

            <div className="reports-export-menu">

              <button
                type="button"
                onClick={
                  handleExportPDF
                }
              >

                <FileText
                  size={17}
                />

                Export PDF

              </button>


              <button
                type="button"
                onClick={
                  handleExportExcel
                }
              >

                <FileSpreadsheet
                  size={17}
                />

                Export Excel

              </button>

            </div>

          )}

        </div>

      </div>

      </div>


      {/* =====================================
          TABLE
      ===================================== */}

      <div className="reports-table-card">

        <div className="reports-table-header">

          <div className="reports-table-title">

            <div className="reports-table-title-icon">
              <FileText
                size={18}
              />
            </div>

            <div>
              <h2>
                Recipe Report
              </h2>

              <p>
                Showing {firstVisible} to {lastVisible} of {filteredReports.length} records
              </p>
            </div>

          </div>

        </div>


        <div className="reports-table-wrapper">

          <table className="reports-table">


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
                  Status
                </th>

                <th>
                  Assigned To
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

              {visibleReports.length >
              0 ? (

                visibleReports.map(
                  (item) => (

                    <tr
                      key={
                        item.id
                      }
                    >


                      <td>

                        <div className="report-recipe-cell">


                          <div className="report-recipe-image">

                            {
                              getRecipeIcon(
                                item.type
                              )
                            }

                          </div>


                          <strong>
                            {
                              item.name
                            }
                          </strong>

                        </div>

                      </td>


                      <td>

                        <span
                          className={`report-type ${
                            item.type ===
                            "Semi-Finished"
                              ? "semi"
                              : "finished"
                          }`}
                        >

                          {
                            item.type
                          }

                        </span>

                      </td>


                      <td>

                        <span className="report-category">

                          {
                            item.category
                          }

                        </span>

                      </td>


                      <td>
                        {
                          item.displayYield
                        }
                      </td>


                      <td>

                        <span
                          className={`report-status ${(
                            item.status ||
                            ""
                          )
                            .toLowerCase()
                            .replaceAll(
                              " ",
                              "-"
                            )}`}
                        >

                          {
                            item.status
                          }

                        </span>

                      </td>


                      <td>
                        {
                          item.assignedTo
                        }
                      </td>


                      <td>
                        {
                          item.lastUpdated
                        }
                      </td>


                      <td>

                        <button
                          type="button"
                          className="report-action-button"
                          title="More Actions"
                        >

                          <MoreVertical
                            size={18}
                          />

                        </button>

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="8"
                    className="reports-empty"
                  >
                    No reports found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        {/* ===================================
            PAGINATION
        =================================== */}

        <div className="reports-pagination-footer">


          <span>

            Showing{" "}
            {firstVisible}{" "}
            to{" "}
            {lastVisible}{" "}
            of{" "}
            {
              filteredReports.length
            }{" "}
            recipes

          </span>


          <div className="reports-pagination">


            <button
              type="button"
              disabled={
                currentPage ===
                1
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      1,
                      page - 1
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
              (_, index) =>
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
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      totalPages,
                      page + 1
                    )
                )
              }
            >
              ›
            </button>

          </div>

        </div>

      </div>


      {/* =====================================
          CLEAR FILTERS
      ===================================== */}

      {(
        fromDate ||
        toDate ||
        typeFilter !== "All" ||
        categoryFilter !== "All" ||
        statusFilter !== "All"
      ) && (

        <button
          type="button"
          className="reports-clear-filters"
          onClick={
            clearFilters
          }
        >
          Clear Filters
        </button>

      )}

    </div>
  );
}


export default Reports;