import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronDown,
  CookingPot,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  MoreVertical,
  Utensils,
  X,
} from "lucide-react";

import jsPDF
  from "jspdf";

import autoTable
  from "jspdf-autotable";

import * as XLSX
  from "xlsx";

import {
  getReportRecipes,
  subscribeToReports,
} from "../services/reportService";

import {
  useTranslation,
} from "react-i18next";

import "../styles/Reports.css";



const getDisplayValue = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  if (
    typeof value ===
    "object"
  ) {
    return (
      value.name ||
      value.fullName ||
      value.full_name ||
      value.username ||
      value.role ||
      "-"
    );
  }

  return String(
    value
  );
};


function Reports() {
  const {
    t,
  } = useTranslation();


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
        Draft:
          "status.draft",
        Submitted:
          "status.submitted",
        "Pending Approval":
          "status.pendingApproval",
        "Under Review":
          "status.underReview",
        "Waiting Approval":
          "status.waitingApproval",
        Approved:
          "status.approved",
        Rejected:
          "status.rejected",
        "ERP Pending":
          "status.erpPending",
        "ERP Completed":
          "status.erpCompleted",
      };

      return keys[status]
        ? t(keys[status])
        : status;
    };


  const translateAssigned =
    (assigned) => {
      const keys = {
        "Head Chef":
          "roles.headChef",
        Approver:
          "roles.approver",
        "ERP User":
          "roles.erpUser",
        Administrator:
          "roles.administrator",
        Admin:
          "roles.admin",
        Manager:
          "roles.manager",
      };

      return keys[assigned]
        ? t(keys[assigned])
        : assigned;
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


  const [
    openActionId,
    setOpenActionId,
  ] = useState(null);


  const [
    actionMenuPosition,
    setActionMenuPosition,
  ] = useState({
    top: 0,
    left: 0,
  });


  const [
    selectedReport,
    setSelectedReport,
  ] = useState(null);


  const [
    showDetailsExportMenu,
    setShowDetailsExportMenu,
  ] = useState(false);


  const exportWrapperRef =
    useRef(null);


  const actionsWrapperRef =
    useRef(null);


  const detailsExportRef =
    useRef(null);


  const itemsPerPage = 8;


  const loadReports =
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
          await getReportRecipes();


        setRecipes(
          data
        );
      } catch (
        loadError
      ) {
        console.error(
          "Reports error:",
          loadError
        );


        setError(
          loadError?.message ||
            t("reportsPage.errors.couldNotLoad")
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
    loadReports();


    const unsubscribe =
      subscribeToReports(
        () => {
          loadReports(
            false
          );
        }
      );


    return () => {
      unsubscribe();
    };
  }, []);


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


        if (
          actionsWrapperRef.current &&
          !actionsWrapperRef.current.contains(
            event.target
          )
        ) {
          setOpenActionId(
            null
          );
        }


        if (
          detailsExportRef.current &&
          !detailsExportRef.current.contains(
            event.target
          )
        ) {
          setShowDetailsExportMenu(
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


  const reportData =
    useMemo(
      () =>
        recipes.map(
          (recipe) => ({
            ...recipe,

            name:
              recipe.name ||
              recipe.productName ||
              "Unnamed Recipe",

            displayYield:
              recipe.displayYield ||
              `${recipe.yield ?? ""} ${
                recipe.yieldUnit ||
                ""
              }`.trim() ||
              "-",

            assignedTo:
              recipe.assignedTo ||
              "Head Chef",

            lastUpdated:
              recipe.lastUpdated ||
              "-",

            reportDate:
              recipe.reportDate ||
              recipe.updatedAt ||
              recipe.createdAt ||
              null,
          })
        ),
      [
        recipes,
      ]
    );


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
      [
        reportData,
      ]
    );


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
      [
        reportData,
      ]
    );


  const filteredReports =
    useMemo(
      () => {
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


            let matchesDate =
              true;


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
                matchesDate =
                  false;
              } else {
                if (
                  fromDate
                ) {
                  const startDate =
                    new Date(
                      `${fromDate}T00:00:00`
                    );


                  if (
                    parsedDate <
                    startDate
                  ) {
                    matchesDate =
                      false;
                  }
                }


                if (
                  toDate
                ) {
                  const endDate =
                    new Date(
                      `${toDate}T23:59:59`
                    );


                  if (
                    parsedDate >
                    endDate
                  ) {
                    matchesDate =
                      false;
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
      },
      [
        reportData,
        typeFilter,
        categoryFilter,
        statusFilter,
        fromDate,
        toDate,
      ]
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredReports.length /
          itemsPerPage
      )
    );


  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);


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

      setCurrentPage(
        1
      );
    };


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
                recipe.recipeCode ||
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


  const handleExportExcel =
    () => {
      const excelData =
        filteredReports.map(
          (recipe) => ({
            "Recipe ID":
              recipe.recipeCode ||
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
          wch: 18,
        },
        {
          wch: 25,
        },
        {
          wch: 20,
        },
        {
          wch: 20,
        },
        {
          wch: 15,
        },
        {
          wch: 20,
        },
        {
          wch: 18,
        },
        {
          wch: 18,
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



  const handleExportSelectedPDF =
    () => {
      if (!selectedReport) {
        return;
      }


      const document =
        new jsPDF({
          orientation:
            "portrait",

          unit:
            "mm",

          format:
            "a4",
        });


      document.setFontSize(
        18
      );

      document.text(
        "Recipe Report Details",
        14,
        18
      );


      document.setFontSize(
        11
      );

      document.text(
        `${selectedReport.recipeCode || selectedReport.id || "-"} - ${selectedReport.name}`,
        14,
        26
      );


      autoTable(
        document,
        {
          startY:
            33,

          head: [[
            "Field",
            "Value",
          ]],

          body: [
            [
              "Recipe ID",
              selectedReport.recipeCode ||
                selectedReport.id ||
                "-",
            ],
            [
              "Recipe Name",
              selectedReport.name ||
                "-",
            ],
            [
              "Type",
              selectedReport.type ||
                "-",
            ],
            [
              "Category",
              selectedReport.category ||
                "-",
            ],
            [
              "Yield",
              selectedReport.displayYield ||
                "-",
            ],
            [
              "Status",
              selectedReport.status ||
                "-",
            ],
            [
              "Assigned To",
              selectedReport.assignedTo ||
                "-",
            ],
            [
              "Requested By",
              getDisplayValue(
                selectedReport.requestedBy ||
                selectedReport.createdBy
              ),
            ],
            [
              "Created At",
              selectedReport.createdAt ||
                "-",
            ],
            [
              "Last Updated",
              selectedReport.lastUpdated ||
                "-",
            ],
          ],

          styles: {
            fontSize:
              9,

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

          columnStyles: {
            0: {
              cellWidth:
                48,

              fontStyle:
                "bold",
            },
          },
        }
      );


      document.save(
        `${selectedReport.recipeCode || "recipe"}-report.pdf`
      );


      setShowDetailsExportMenu(
        false
      );
    };


  const handleExportSelectedExcel =
    () => {
      if (!selectedReport) {
        return;
      }


      const data = [
        {
          Field:
            "Recipe ID",
          Value:
            selectedReport.recipeCode ||
            selectedReport.id ||
            "-",
        },
        {
          Field:
            "Recipe Name",
          Value:
            selectedReport.name ||
            "-",
        },
        {
          Field:
            "Type",
          Value:
            selectedReport.type ||
            "-",
        },
        {
          Field:
            "Category",
          Value:
            selectedReport.category ||
            "-",
        },
        {
          Field:
            "Yield",
          Value:
            selectedReport.displayYield ||
            "-",
        },
        {
          Field:
            "Status",
          Value:
            selectedReport.status ||
            "-",
        },
        {
          Field:
            "Assigned To",
          Value:
            selectedReport.assignedTo ||
            "-",
        },
        {
          Field:
            "Requested By",
          Value:
            getDisplayValue(
              selectedReport.requestedBy ||
              selectedReport.createdBy
            ),
        },
        {
          Field:
            "Created At",
          Value:
            selectedReport.createdAt ||
            "-",
        },
        {
          Field:
            "Last Updated",
          Value:
            selectedReport.lastUpdated ||
            "-",
        },
      ];


      const worksheet =
        XLSX.utils.json_to_sheet(
          data
        );


      worksheet["!cols"] = [
        {
          wch:
            25,
        },
        {
          wch:
            42,
        },
      ];


      const workbook =
        XLSX.utils.book_new();


      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Recipe Details"
      );


      XLSX.writeFile(
        workbook,
        `${selectedReport.recipeCode || "recipe"}-report.xlsx`
      );


      setShowDetailsExportMenu(
        false
      );
    };


  const toggleActionMenu =
    (
      clickEvent,
      reportId
    ) => {
      clickEvent.stopPropagation();


      if (
        openActionId ===
        reportId
      ) {
        setOpenActionId(
          null
        );

        return;
      }


      const buttonRect =
        clickEvent.currentTarget
          .getBoundingClientRect();


      const menuWidth = 125;
      const menuHeight = 70;
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


      setOpenActionId(
        reportId
      );
    };


  if (loading) {
    return (
      <div className="reports-page">

        <div className="reports-table-card">

          <div className="reports-empty">
            {t("reportsPage.loading")}
          </div>

        </div>

      </div>
    );
  }


  return (
    <div className="reports-page">

      {error && (

        <div
          style={{
            padding:
              "12px 16px",

            marginBottom:
              "16px",

            borderRadius:
              "10px",

            background:
              "#fff2ef",

            color:
              "#b42318",

            fontSize:
              "13px",
          }}
        >
          {error}
        </div>

      )}


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
                {t("reportsPage.filters.title")}
              </h2>

              <p>
                {t("reportsPage.filters.subtitle")}
              </p>

            </div>

          </div>

        </div>


        <div className="reports-toolbar">

          <div className="reports-date-range">

            <div className="reports-date-field">

              <span className="reports-date-label">
                {t("reportsPage.filters.from")}
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
                {t("reportsPage.filters.to")}
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
              {t("reportsPage.filters.allTypes")}
            </option>


            {types.map(
              (type) => (

                <option
                  key={type}
                  value={type}
                >
                  {translateType(
                    type
                  )}
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
              {t("reportsPage.filters.allCategories")}
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
              {t("reportsPage.filters.allStatus")}
            </option>

            <option value="Draft">
              {t("status.draft")}
            </option>

            <option value="Submitted">
              {t("status.submitted")}
            </option>

            <option value="Pending Approval">
              {t("status.pendingApproval")}
            </option>

            <option value="Under Review">
              {t("status.underReview")}
            </option>

            <option value="Approved">
              {t("status.approved")}
            </option>

            <option value="Rejected">
              {t("status.rejected")}
            </option>

            <option value="ERP Pending">
              {t("status.erpPending")}
            </option>

            <option value="ERP Completed">
              {t("status.erpCompleted")}
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

              {t("reportsPage.export.export")}

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

                  {t("reportsPage.export.pdf")}

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

                  {t("reportsPage.export.excel")}

                </button>

              </div>

            )}

          </div>

        </div>

      </div>


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
                {t("reportsPage.table.title")}
              </h2>

              <p>
                {t(
                  "reportsPage.table.showingRecords",
                  {
                    from:
                      firstVisible,
                    to:
                      lastVisible,
                    total:
                      filteredReports.length,
                  }
                )}
              </p>

            </div>

          </div>

        </div>


        <div className="reports-table-wrapper">

          <table className="reports-table">

            <thead>

              <tr>

                <th>
                  {t("reportsPage.table.recipeName")}
                </th>

                <th>
                  {t("reportsPage.table.type")}
                </th>

                <th>
                  {t("reportsPage.table.category")}
                </th>

                <th>
                  {t("reportsPage.table.yield")}
                </th>

                <th>
                  {t("reportsPage.table.status")}
                </th>

                <th>
                  {t("reportsPage.table.assignedTo")}
                </th>

                <th>
                  {t("reportsPage.table.lastUpdated")}
                </th>

                <th>
                  {t("reportsPage.table.actions")}
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
                            translateType(
                              item.type
                            )
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
                            translateStatus(
                              item.status
                            )
                          }
                        </span>

                      </td>


                      <td>
                        {
                          translateAssigned(
                            item.assignedTo
                          )
                        }
                      </td>


                      <td>
                        {
                          item.lastUpdated
                        }
                      </td>


                      <td className="report-actions-cell">

                        <div
                          className="report-row-actions"
                          ref={
                            openActionId ===
                            item.id
                              ? actionsWrapperRef
                              : null
                          }
                        >

                          <button
                            type="button"
                            className="report-action-button"
                            title={t("reportsPage.actions.moreActions")}
                            onClick={(
                              clickEvent
                            ) =>
                              toggleActionMenu(
                                clickEvent,
                                item.id
                              )
                            }
                          >
                            <MoreVertical
                              size={18}
                            />
                          </button>


                          {openActionId ===
                            item.id && (

                            <div
                              className="report-row-menu"
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

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReport(
                                    item
                                  );

                                  setOpenActionId(
                                    null
                                  );
                                }}
                              >
                                {t("reportsPage.actions.viewDetails")}
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
                    className="reports-empty"
                  >
                    {t("reportsPage.noReports")}
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        <div className="reports-pagination-footer">

          <span>
            {t(
              "reportsPage.pagination.showing",
              {
                from:
                  firstVisible,
                to:
                  lastVisible,
                total:
                  filteredReports.length,
              }
            )}
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



      {selectedReport && (

        <div
          className="report-details-overlay"
          onMouseDown={() => {
            setSelectedReport(
              null
            );

            setShowDetailsExportMenu(
              false
            );
          }}
        >

          <div
            className="report-details-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="report-details-header">

              <div>
                <span className="report-details-code">
                  {
                    selectedReport.recipeCode ||
                    selectedReport.id ||
                    "-"
                  }
                </span>

                <h2>
                  {
                    selectedReport.name
                  }
                </h2>

                <p>
                  {t("reportsPage.details.subtitle")}
                </p>
              </div>


              <div className="report-details-header-actions">

                <div
                  className="report-details-export-wrapper"
                  ref={
                    detailsExportRef
                  }
                >

                  <button
                    type="button"
                    className="report-details-export-button"
                    onClick={() =>
                      setShowDetailsExportMenu(
                        (current) =>
                          !current
                      )
                    }
                  >
                    <Download
                      size={16}
                    />

                    {t("reportsPage.export.export")}

                    <ChevronDown
                      size={14}
                    />
                  </button>


                  {showDetailsExportMenu && (

                    <div className="report-details-export-menu">

                      <button
                        type="button"
                        onClick={
                          handleExportSelectedPDF
                        }
                      >
                        <FileText
                          size={16}
                        />

                        {t("reportsPage.export.pdf")}
                      </button>


                      <button
                        type="button"
                        onClick={
                          handleExportSelectedExcel
                        }
                      >
                        <FileSpreadsheet
                          size={16}
                        />

                        {t("reportsPage.export.excel")}
                      </button>

                    </div>

                  )}

                </div>


                <button
                  type="button"
                  className="report-details-close"
                  onClick={() => {
                    setSelectedReport(
                      null
                    );

                    setShowDetailsExportMenu(
                      false
                    );
                  }}
                >
                  <X
                    size={20}
                  />
                </button>

              </div>

            </div>


            <div className="report-details-status">
              <span
                className={`report-status ${(
                  selectedReport.status ||
                  ""
                )
                  .toLowerCase()
                  .replaceAll(
                    " ",
                    "-"
                  )}`}
              >
                {
                  translateStatus(
                    selectedReport.status
                  )
                }
              </span>
            </div>


            <div className="report-details-grid">

              <ReportInfoItem
                label={t("reportsPage.details.recipeId")}
                value={
                  selectedReport.recipeCode ||
                  selectedReport.id ||
                  "-"
                }
              />

              <ReportInfoItem
                label={t("reportsPage.details.recipeName")}
                value={
                  selectedReport.name
                }
              />

              <ReportInfoItem
                label={t("reportsPage.details.type")}
                value={
                  translateType(
                    selectedReport.type
                  )
                }
              />

              <ReportInfoItem
                label={t("reportsPage.details.category")}
                value={
                  selectedReport.category
                }
              />

              <ReportInfoItem
                label={t("reportsPage.details.yield")}
                value={
                  selectedReport.displayYield
                }
              />

              <ReportInfoItem
                label={t("reportsPage.details.status")}
                value={
                  translateStatus(
                    selectedReport.status
                  )
                }
              />

              <ReportInfoItem
                label={t("reportsPage.details.assignedTo")}
                value={
                  translateAssigned(
                    selectedReport.assignedTo
                  )
                }
              />

              <ReportInfoItem
                label={t("reportsPage.details.requestedBy")}
                value={
                  getDisplayValue(
                    selectedReport.requestedBy ||
                    selectedReport.createdBy
                  )
                }
              />

              <ReportInfoItem
                label={t("reportsPage.details.createdAt")}
                value={
                  selectedReport.createdAt ||
                  "-"
                }
              />

              <ReportInfoItem
                label={t("reportsPage.details.lastUpdated")}
                value={
                  selectedReport.lastUpdated
                }
              />

            </div>

          </div>

        </div>

      )}


      {(
        fromDate ||
        toDate ||
        typeFilter !==
          "All" ||
        categoryFilter !==
          "All" ||
        statusFilter !==
          "All"
      ) && (

        <button
          type="button"
          className="reports-clear-filters"
          onClick={
            clearFilters
          }
        >
          {t("reportsPage.filters.clear")}
        </button>

      )}

    </div>
  );
}


function ReportInfoItem({
  label,
  value,
}) {
  return (
    <div className="report-info-item">

      <span>
        {label}
      </span>

      <strong>
        {
          getDisplayValue(
            value
          )
        }
      </strong>

    </div>
  );
}


export default Reports;