import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Database,
  FileSpreadsheet,
  FileText,
  MoreVertical,
  Search,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from "lucide-react";

import * as XLSX
  from "xlsx";

import jsPDF
  from "jspdf";

import autoTable
  from "jspdf-autotable";

import {
  getAuditRecipes,
  subscribeToAuditTrail,
} from "../services/auditService";

import { useTranslation } from "react-i18next";

import "../styles/AuditTrail.css";


const statusOptions = [
  "Draft",
  "Submitted",
  "Pending Approval",
  "Under Review",
  "Approved",
  "Rejected",
  "ERP Pending",
  "ERP Completed",
];


function AuditTrail() {
  const { t } = useTranslation();

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
    fromDate,
    setFromDate,
  ] = useState("");

  const [
    toDate,
    setToDate,
  ] = useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("All");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    search,
    setSearch,
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
    selectedRecipe,
    setSelectedRecipe,
  ] = useState(null);

  const [
    showDetailsExportMenu,
    setShowDetailsExportMenu,
  ] = useState(false);


  const exportRef =
    useRef(null);

  const detailsExportRef =
    useRef(null);

  const actionsRef =
    useRef(null);

  const fromDateRef =
    useRef(null);

  const toDateRef =
    useRef(null);

  const itemsPerPage = 8;


  const translateStatus = (status) => {
    const keys = {
      "Draft": "status.draft",
      "Submitted": "status.submitted",
      "Pending Approval": "status.pendingApproval",
      "Under Review": "status.underReview",
      "Waiting Approval": "status.waitingApproval",
      "Approved": "status.approved",
      "Rejected": "status.rejected",
      "ERP Pending": "status.erpPending",
      "ERP Completed": "status.erpCompleted",
    };
    return keys[status] ? t(keys[status]) : status;
  };

  const translateType = (type) => {
    const keys = {
      "Finished Product": "productTypes.finishedProduct",
      "Semi-Finished": "productTypes.semiFinished",
      "Raw Material": "productTypes.rawMaterial",
      "Packaging": "productTypes.packaging",
    };
    return keys[type] ? t(keys[type]) : type;
  };

  const translateRole = (role) => {
    const keys = {
      "User": "roles.user",
      "Administrator": "roles.administrator",
      "Admin": "roles.admin",
      "Manager": "roles.manager",
      "Head Chef": "roles.headChef",
      "Approver": "roles.approver",
      "ERP User": "roles.erpUser",
    };
    return keys[role] ? t(keys[role]) : role;
  };


  const translateAuditValue = (value) => {
    const keys = {
      "Completed": "auditTrailPage.values.completed",
      "Pending": "auditTrailPage.values.pending",
      "Approved": "status.approved",
      "Rejected": "status.rejected",
      "Draft": "status.draft",
      "Submitted": "status.submitted",
      "Pending Approval": "status.pendingApproval",
      "Under Review": "status.underReview",
      "ERP Pending": "status.erpPending",
      "ERP Completed": "status.erpCompleted",
    };
    return keys[value] ? t(keys[value]) : value;
  };



  const loadAudit =
    async (
      showLoader = true
    ) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const data =
          await getAuditRecipes();

        setRecipes(
          data
        );
      } catch (loadError) {
        console.error(
          "Audit trail error:",
          loadError
        );

        setError(
          loadError?.message ||
            t("auditTrailPage.errors.couldNotLoad")
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    };


  useEffect(() => {
    loadAudit();

    const unsubscribe =
      subscribeToAuditTrail(
        () => {
          loadAudit(
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
          exportRef.current &&
          !exportRef.current.contains(
            event.target
          )
        ) {
          setShowExportMenu(
            false
          );
        }

        if (
          actionsRef.current &&
          !actionsRef.current.contains(
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


  const openDatePicker =
    (
      inputRef
    ) => {
      const input =
        inputRef.current;

      if (!input) {
        return;
      }

      if (
        typeof input.showPicker ===
        "function"
      ) {
        input.showPicker();

        return;
      }

      input.focus();
      input.click();
    };


  const types =
    useMemo(
      () => [
        ...new Set(
          recipes
            .map(
              (recipe) =>
                recipe.type
            )
            .filter(
              (type) =>
                type &&
                type !== "-"
            )
        ),
      ],
      [
        recipes,
      ]
    );


  const filteredRecipes =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();


        return recipes.filter(
          (recipe) => {
            const matchesType =
              typeFilter ===
                "All" ||
              recipe.type ===
                typeFilter;


            const matchesStatus =
              statusFilter ===
                "All" ||
              recipe.status ===
                statusFilter;


            const matchesSearch =
              !normalizedSearch ||
              [
                recipe.recipeCode,
                recipe.recipeName,
                recipe.productCode,
                recipe.type,
                recipe.category,
                recipe.status,
                recipe.createdBy,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(
                  normalizedSearch
                );


            let matchesDate =
              true;


            if (
              fromDate ||
              toDate
            ) {
              const itemDate =
                recipe.createdAt
                  ? new Date(
                      recipe.createdAt
                    )
                  : null;


              if (
                !itemDate ||
                Number.isNaN(
                  itemDate.getTime()
                )
              ) {
                matchesDate =
                  false;
              } else {
                if (fromDate) {
                  const startDate =
                    new Date(
                      `${fromDate}T00:00:00`
                    );

                  if (
                    itemDate <
                    startDate
                  ) {
                    matchesDate =
                      false;
                  }
                }


                if (toDate) {
                  const endDate =
                    new Date(
                      `${toDate}T23:59:59`
                    );

                  if (
                    itemDate >
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
              matchesStatus &&
              matchesSearch &&
              matchesDate
            );
          }
        );
      },
      [
        recipes,
        typeFilter,
        statusFilter,
        search,
        fromDate,
        toDate,
      ]
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredRecipes.length /
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


  const visibleRecipes =
    filteredRecipes.slice(
      startIndex,
      startIndex +
        itemsPerPage
    );


  const firstVisible =
    filteredRecipes.length ===
    0
      ? 0
      : startIndex + 1;


  const lastVisible =
    Math.min(
      startIndex +
        itemsPerPage,
      filteredRecipes.length
    );


  const exportExcel =
    () => {
      const rows =
        filteredRecipes.map(
          (recipe) => ({
            "Recipe ID":
              recipe.recipeCode,

            "Recipe Name":
              recipe.recipeName,

            Type:
              recipe.type,

            Category:
              recipe.category,

            Yield:
              recipe.displayYield,

            "Current Status":
              recipe.status,

            "Created By":
              recipe.createdBy,

            "Created At":
              recipe.createdDateTime,

            "Last Updated":
              recipe.lastUpdated,
          })
        );


      const worksheet =
        XLSX.utils.json_to_sheet(
          rows
        );


      worksheet["!cols"] = [
        { wch: 18 },
        { wch: 26 },
        { wch: 20 },
        { wch: 18 },
        { wch: 15 },
        { wch: 20 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
      ];


      const workbook =
        XLSX.utils.book_new();


      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Recipe Audit"
      );


      XLSX.writeFile(
        workbook,
        "Recipe-Audit-Trail.xlsx"
      );


      setShowExportMenu(
        false
      );
    };


  const exportPDF =
    () => {
      const doc =
        new jsPDF({
          orientation:
            "landscape",
        });


      doc.setFontSize(
        18
      );


      doc.text(
        "Recipe Audit Trail",
        14,
        16
      );


      doc.setFontSize(
        9
      );


      doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        14,
        23
      );


      autoTable(
        doc,
        {
          startY: 29,

          head: [[
            "Recipe ID",
            "Recipe Name",
            "Type",
            "Category",
            "Yield",
            "Status",
            "Created By",
            "Created At",
            "Last Updated",
          ]],

          body:
            filteredRecipes.map(
              (recipe) => [
                recipe.recipeCode,
                recipe.recipeName,
                recipe.type,
                recipe.category,
                recipe.displayYield,
                recipe.status,
                recipe.createdBy,
                recipe.createdDateTime,
                recipe.lastUpdated,
              ]
            ),

          styles: {
            fontSize: 7,
            cellPadding: 2.5,
          },

          headStyles: {
            fillColor: [
              90,
              65,
              42,
            ],
          },
        }
      );


      doc.save(
        "Recipe-Audit-Trail.pdf"
      );


      setShowExportMenu(
        false
      );
    };



  const exportSelectedRecipeExcel =
    () => {
      if (!selectedRecipe) {
        return;
      }

      const workbook =
        XLSX.utils.book_new();


      const summaryRows = [
        {
          Field: "Recipe ID",
          Value:
            selectedRecipe.recipeCode,
        },
        {
          Field: "Recipe Name",
          Value:
            selectedRecipe.recipeName,
        },
        {
          Field: "Product Code",
          Value:
            selectedRecipe.productCode,
        },
        {
          Field: "Product Type",
          Value:
            selectedRecipe.type,
        },
        {
          Field: "Category",
          Value:
            selectedRecipe.category,
        },
        {
          Field: "Yield",
          Value:
            selectedRecipe.displayYield,
        },
        {
          Field: "Current Status",
          Value:
            selectedRecipe.status,
        },
        {
          Field: "Created By",
          Value:
            selectedRecipe.createdBy,
        },
        {
          Field: "Created By Role",
          Value:
            selectedRecipe.createdByRole,
        },
        {
          Field: "Created At",
          Value:
            selectedRecipe.createdDateTime,
        },
        {
          Field: "Submitted At",
          Value:
            selectedRecipe.submittedDateTime,
        },
        {
          Field: "Last Updated",
          Value:
            selectedRecipe.lastUpdated,
        },
        {
          Field: "Approval Decision",
          Value:
            selectedRecipe.approval.decision,
        },
        {
          Field: "Approved By",
          Value:
            selectedRecipe.approval.approvedBy,
        },
        {
          Field: "Approved By Role",
          Value:
            selectedRecipe.approval.approvedByRole,
        },
        {
          Field: "Approved At",
          Value:
            selectedRecipe.approval.approvedDateTime,
        },
        {
          Field: "Rejected By",
          Value:
            selectedRecipe.approval.rejectedBy,
        },
        {
          Field: "Rejected At",
          Value:
            selectedRecipe.approval.rejectedDateTime,
        },
        {
          Field: "Rejection / Return Reason",
          Value:
            selectedRecipe.approval.rejectionReason,
        },
        {
          Field: "Review Round",
          Value:
            selectedRecipe.approval.reviewRound,
        },
        {
          Field: "ERP Reference",
          Value:
            selectedRecipe.erp.reference,
        },
        {
          Field: "ERP Status",
          Value:
            selectedRecipe.erp.status,
        },
        {
          Field: "ERP Entry Date",
          Value:
            selectedRecipe.erp.entryDate,
        },
        {
          Field: "ERP Entered By",
          Value:
            selectedRecipe.erp.enteredBy,
        },
        {
          Field: "ERP Entered By Role",
          Value:
            selectedRecipe.erp.enteredByRole,
        },
        {
          Field: "ERP Created At",
          Value:
            selectedRecipe.erp.createdDateTime,
        },
        {
          Field: "ERP Completed At",
          Value:
            selectedRecipe.erp.completedDateTime,
        },
        {
          Field: "ERP Notes",
          Value:
            selectedRecipe.erp.notes,
        },
      ];


      const summarySheet =
        XLSX.utils.json_to_sheet(
          summaryRows
        );

      summarySheet["!cols"] = [
        { wch: 28 },
        { wch: 42 },
      ];


      XLSX.utils.book_append_sheet(
        workbook,
        summarySheet,
        "Recipe Details"
      );


      const approvalRows =
        (
          selectedRecipe.approval
            .history || []
        ).map(
          (approval) => ({
            Decision:
              approval.decision,
            Approver:
              approval.approver,
            Role:
              approval.approverRole,
            "Review Round":
              approval.reviewRound,
            Comment:
              approval.comment,
            "Reviewed At":
              approval.reviewedDateTime,
          })
        );


      if (approvalRows.length) {
        const approvalSheet =
          XLSX.utils.json_to_sheet(
            approvalRows
          );

        approvalSheet["!cols"] = [
          { wch: 18 },
          { wch: 24 },
          { wch: 18 },
          { wch: 14 },
          { wch: 40 },
          { wch: 24 },
        ];

        XLSX.utils.book_append_sheet(
          workbook,
          approvalSheet,
          "Approval History"
        );
      }


      const timelineRows =
        (
          selectedRecipe.timeline ||
          []
        ).map(
          (activity) => ({
            Date:
              activity.date,
            Time:
              activity.time,
            User:
              activity.user,
            Role:
              activity.userRole,
            Module:
              activity.module,
            Action:
              activity.action,
            "Old Status":
              activity.oldStatus ||
              "",
            "New Status":
              activity.newStatus ||
              "",
            Comments:
              activity.comments ||
              "",
            Details:
              activity.details ||
              "",
          })
        );


      const timelineSheet =
        XLSX.utils.json_to_sheet(
          timelineRows
        );

      timelineSheet["!cols"] = [
        { wch: 15 },
        { wch: 12 },
        { wch: 24 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 32 },
        { wch: 55 },
      ];


      XLSX.utils.book_append_sheet(
        workbook,
        timelineSheet,
        "Activity Timeline"
      );


      XLSX.writeFile(
        workbook,
        `${selectedRecipe.recipeCode}-Audit-Trail.xlsx`
      );


      setShowDetailsExportMenu(
        false
      );
    };


  const exportSelectedRecipePDF =
    () => {
      if (!selectedRecipe) {
        return;
      }


      const doc =
        new jsPDF({
          orientation:
            "portrait",
        });


      doc.setFontSize(
        18
      );

      doc.text(
        "Recipe Audit Details",
        14,
        16
      );


      doc.setFontSize(
        11
      );

      doc.text(
        `${selectedRecipe.recipeCode} - ${selectedRecipe.recipeName}`,
        14,
        24
      );


      autoTable(
        doc,
        {
          startY: 31,

          head: [[
            "Field",
            "Value",
          ]],

          body: [
            [
              "Recipe ID",
              selectedRecipe.recipeCode,
            ],
            [
              "Recipe Name",
              selectedRecipe.recipeName,
            ],
            [
              "Product Code",
              selectedRecipe.productCode,
            ],
            [
              "Product Type",
              selectedRecipe.type,
            ],
            [
              "Category",
              selectedRecipe.category,
            ],
            [
              "Yield",
              selectedRecipe.displayYield,
            ],
            [
              "Current Status",
              selectedRecipe.status,
            ],
            [
              "Created By",
              `${selectedRecipe.createdBy} (${selectedRecipe.createdByRole})`,
            ],
            [
              "Created At",
              selectedRecipe.createdDateTime,
            ],
            [
              "Submitted At",
              selectedRecipe.submittedDateTime,
            ],
            [
              "Approval Decision",
              selectedRecipe.approval.decision,
            ],
            [
              "Approved By",
              `${selectedRecipe.approval.approvedBy} ${selectedRecipe.approval.approvedByRole !== "-" ? `(${selectedRecipe.approval.approvedByRole})` : ""}`.trim(),
            ],
            [
              "Approved At",
              selectedRecipe.approval.approvedDateTime,
            ],
            [
              "Rejected By",
              selectedRecipe.approval.rejectedBy,
            ],
            [
              "Rejected At",
              selectedRecipe.approval.rejectedDateTime,
            ],
            [
              "Rejection / Return Reason",
              selectedRecipe.approval.rejectionReason,
            ],
            [
              "ERP Reference",
              selectedRecipe.erp.reference,
            ],
            [
              "ERP Status",
              selectedRecipe.erp.status,
            ],
            [
              "ERP Entry Date",
              selectedRecipe.erp.entryDate,
            ],
            [
              "ERP Entered By",
              `${selectedRecipe.erp.enteredBy} ${selectedRecipe.erp.enteredByRole !== "-" ? `(${selectedRecipe.erp.enteredByRole})` : ""}`.trim(),
            ],
            [
              "ERP Created At",
              selectedRecipe.erp.createdDateTime,
            ],
            [
              "ERP Completed At",
              selectedRecipe.erp.completedDateTime,
            ],
            [
              "ERP Notes",
              selectedRecipe.erp.notes,
            ],
            [
              "Last Updated",
              selectedRecipe.lastUpdated,
            ],
          ],

          styles: {
            fontSize: 8,
            cellPadding: 2.5,
          },

          headStyles: {
            fillColor: [
              90,
              65,
              42,
            ],
          },

          columnStyles: {
            0: {
              cellWidth: 48,
              fontStyle:
                "bold",
            },
          },
        }
      );




      doc.save(
        `${selectedRecipe.recipeCode}-Audit-Trail.pdf`
      );


      setShowDetailsExportMenu(
        false
      );
    };


  const toggleActionMenu =
    (
      clickEvent,
      recipeId
    ) => {
      clickEvent.stopPropagation();

      if (
        openActionId ===
        recipeId
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
        recipeId
      );
    };


  if (loading) {
    return (
      <div className="audit-page">
        <div className="audit-table-card">
          <div className="audit-empty">
            {t("auditTrailPage.loading")}
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="audit-page">

      {error && (
        <div className="audit-error">
          {error}
        </div>
      )}


      <div className="audit-toolbar">

        <div className="audit-date-field">
          <span className="audit-date-label">
            {t("auditTrailPage.filters.from")}
          </span>

          <div className="audit-date-input-wrap">
            <CalendarDays
              size={16}
            />

            <input
              ref={
                fromDateRef
              }
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

            <button
              type="button"
              className="audit-date-picker-button"
              onClick={() =>
                openDatePicker(
                  fromDateRef
                )
              }
            >
              <CalendarDays
                size={16}
              />
            </button>
          </div>
        </div>


        <div className="audit-date-field">
          <span className="audit-date-label">
            {t("auditTrailPage.filters.to")}
          </span>

          <div className="audit-date-input-wrap">
            <CalendarDays
              size={16}
            />

            <input
              ref={
                toDateRef
              }
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

            <button
              type="button"
              className="audit-date-picker-button"
              onClick={() =>
                openDatePicker(
                  toDateRef
                )
              }
            >
              <CalendarDays
                size={16}
              />
            </button>
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
            {t("auditTrailPage.filters.allTypes")}
          </option>

          {types.map(
            (type) => (
              <option
                key={type}
                value={type}
              >
                {translateType(type)}
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
            {t("auditTrailPage.filters.allStatus")}
          </option>

          {statusOptions.map(
            (status) => (
              <option
                key={status}
                value={status}
              >
                {translateStatus(status)}
              </option>
            )
          )}
        </select>


        <div className="audit-search">
          <Search
            size={16}
          />

          <input
            type="text"
            placeholder={t("auditTrailPage.filters.searchPlaceholder")}
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


        <div
          className="audit-export-wrapper"
          ref={
            exportRef
          }
        >
          <button
            type="button"
            className="audit-export-button"
            onClick={() =>
              setShowExportMenu(
                (current) =>
                  !current
              )
            }
          >
            <Upload
              size={16}
            />

            {t("auditTrailPage.export.export")}

            <ChevronDown
              size={14}
            />
          </button>


          {showExportMenu && (
            <div className="audit-export-menu">

              <button
                type="button"
                onClick={
                  exportPDF
                }
              >
                <FileText
                  size={16}
                />
                {t("auditTrailPage.export.pdf")}
              </button>

              <button
                type="button"
                onClick={
                  exportExcel
                }
              >
                <FileSpreadsheet
                  size={16}
                />
                {t("auditTrailPage.export.excel")}
              </button>

            </div>
          )}
        </div>

      </div>


      <div className="audit-table-card">

        <div className="audit-table-wrapper">
          <table className="audit-table">

            <thead>
              <tr>
                <th>
                  {t("auditTrailPage.table.recipeId")}
                </th>

                <th>
                  {t("auditTrailPage.table.recipeName")}
                </th>

                <th>
                  {t("auditTrailPage.table.type")}
                </th>

                <th>
                  {t("auditTrailPage.table.currentStatus")}
                </th>

                <th>
                  {t("auditTrailPage.table.createdBy")}
                </th>

                <th>
                  {t("auditTrailPage.table.createdAt")}
                </th>

                <th>
                  {t("auditTrailPage.table.lastUpdated")}
                </th>

                <th className="audit-actions-heading">
                  {t("auditTrailPage.table.actions")}
                </th>
              </tr>
            </thead>


            <tbody>
              {visibleRecipes.length >
              0 ? (
                visibleRecipes.map(
                  (recipe) => (
                    <tr
                      key={
                        recipe.id
                      }
                    >
                      <td className="audit-recipe-code">
                        {
                          recipe.recipeCode
                        }
                      </td>

                      <td>
                        <div className="audit-recipe-name">
                          <strong>
                            {
                              recipe.recipeName
                            }
                          </strong>

                          <span>
                            {
                              recipe.category
                            }
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="audit-type-chip">
                          {
                            translateType(
                              recipe.type
                            )
                          }
                        </span>
                      </td>

                      <td>
                        <span
                          className={`audit-status-chip ${String(
                            recipe.status ||
                              ""
                          )
                            .toLowerCase()
                            .replace(
                              /\s+/g,
                              "-"
                            )}`}
                        >
                          {
                            translateStatus(
                              recipe.status
                            )
                          }
                        </span>
                      </td>

                      <td>
                        <div className="audit-person-cell">
                          <strong>
                            {
                              recipe.createdBy
                            }
                          </strong>

                          <span>
                            {
                              translateRole(
                                recipe.createdByRole
                              )
                            }
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="audit-date-cell">
                          <strong>
                            {
                              recipe.createdDate
                            }
                          </strong>

                          <span>
                            {
                              recipe.createdTime
                            }
                          </span>
                        </div>
                      </td>

                      <td>
                        {
                          recipe.lastUpdated
                        }
                      </td>

                      <td className="audit-actions-cell">
                        <div
                          className="audit-row-actions"
                          ref={
                            openActionId ===
                            recipe.id
                              ? actionsRef
                              : null
                          }
                        >
                          <button
                            type="button"
                            className="audit-more-button"
                            onClick={(
                              clickEvent
                            ) =>
                              toggleActionMenu(
                                clickEvent,
                                recipe.id
                              )
                            }
                          >
                            <MoreVertical
                              size={18}
                            />
                          </button>


                          {openActionId ===
                            recipe.id && (
                            <div
                              className="audit-row-menu"
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
                                  setSelectedRecipe(
                                    recipe
                                  );

                                  setOpenActionId(
                                    null
                                  );
                                }}
                              >
                                {t("auditTrailPage.actions.viewDetails")}
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
                    className="audit-empty"
                  >
                    {t("auditTrailPage.noRecords")}
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>


        <div className="audit-pagination-footer">
          <span>
            {t(
              "auditTrailPage.pagination.showing",
              {
                from: firstVisible,
                to: lastVisible,
                total: filteredRecipes.length,
              }
            )}
          </span>


          <div className="audit-pagination">
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


      {selectedRecipe && (
        <div
          className="audit-details-overlay"
          onMouseDown={() =>
            setSelectedRecipe(
              null
            )
          }
        >
          <div
            className="audit-details-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="audit-details-header">
              <div>
                <span className="audit-details-code">
                  {
                    selectedRecipe.recipeCode
                  }
                </span>

                <h2>
                  {
                    selectedRecipe.recipeName
                  }
                </h2>

                <p>
                  {t("auditTrailPage.details.subtitle")}
                </p>
              </div>

              <div className="audit-details-header-actions">

                <div
                  className="audit-details-export-wrapper"
                  ref={
                    detailsExportRef
                  }
                >
                  <button
                    type="button"
                    className="audit-details-export-button"
                    onClick={() =>
                      setShowDetailsExportMenu(
                        (current) =>
                          !current
                      )
                    }
                  >
                    <Upload
                      size={16}
                    />

                    {t("auditTrailPage.export.export")}

                    <ChevronDown
                      size={14}
                    />
                  </button>


                  {showDetailsExportMenu && (
                    <div className="audit-details-export-menu">

                      <button
                        type="button"
                        onClick={
                          exportSelectedRecipePDF
                        }
                      >
                        <FileText
                          size={16}
                        />
                        {t("auditTrailPage.export.pdf")}
                      </button>


                      <button
                        type="button"
                        onClick={
                          exportSelectedRecipeExcel
                        }
                      >
                        <FileSpreadsheet
                          size={16}
                        />
                        {t("auditTrailPage.export.excel")}
                      </button>

                    </div>
                  )}

                </div>


                <button
                  type="button"
                  className="audit-details-close"
                  onClick={() => {
                    setSelectedRecipe(
                      null
                    );

                    setShowDetailsExportMenu(
                      false
                    );
                  }}
                >
                  <X size={20} />
                </button>

              </div>
            </div>


            <div className="audit-details-status-row">
              <span
                className={`audit-status-chip ${String(
                  selectedRecipe.status ||
                    ""
                )
                  .toLowerCase()
                  .replace(
                    /\s+/g,
                    "-"
                  )}`}
              >
                {
                  translateStatus(
                    selectedRecipe.status
                  )
                }
              </span>
            </div>


            <section className="audit-details-section">
              <div className="audit-section-title">
                <FileText
                  size={17}
                />

                <h3>
                  {t("auditTrailPage.details.recipeInformation")}
                </h3>
              </div>

              <div className="audit-info-grid">
                <InfoItem
                  label={t("auditTrailPage.details.recipeId")}
                  value={
                    selectedRecipe.recipeCode
                  }
                />

                <InfoItem
                  label={t("auditTrailPage.details.productCode")}
                  value={
                    selectedRecipe.productCode
                  }
                />

                <InfoItem
                  label={t("auditTrailPage.details.productType")}
                  value={
                    translateType(selectedRecipe.type)
                  }
                />

                <InfoItem
                  label={t("auditTrailPage.details.category")}
                  value={
                    selectedRecipe.category
                  }
                />

                <InfoItem
                  label={t("auditTrailPage.details.yield")}
                  value={
                    selectedRecipe.displayYield
                  }
                />

                <InfoItem
                  label={t("auditTrailPage.details.currentStatus")}
                  value={
                    translateStatus(selectedRecipe.status)
                  }
                />
              </div>
            </section>


            <section className="audit-details-section">
              <div className="audit-section-title">
                <UserRound
                  size={17}
                />

                <h3>
                  {t("auditTrailPage.details.creationInformation")}
                </h3>
              </div>

              <div className="audit-info-grid">
                <InfoItem
                  label={t("auditTrailPage.details.createdBy")}
                  value={
                    selectedRecipe.createdBy
                  }
                  subValue={
                    translateRole(selectedRecipe.createdByRole)
                  }
                />

                <InfoItem
                  label={t("auditTrailPage.details.createdAt")}
                  value={
                    selectedRecipe.createdDateTime
                  }
                />

                <InfoItem
                  label={t("auditTrailPage.details.submittedAt")}
                  value={
                    selectedRecipe.submittedDateTime
                  }
                />

                <InfoItem
                  label={t("auditTrailPage.details.lastUpdated")}
                  value={
                    selectedRecipe.lastUpdated
                  }
                />
              </div>
            </section>


            <section className="audit-details-section">
              <div className="audit-section-title">
                <ShieldCheck
                  size={17}
                />

                <h3>
                  {t("auditTrailPage.details.approvalInformation")}
                </h3>
              </div>

              <div className="audit-info-grid">
                <InfoItem
                  label={t("auditTrailPage.details.decision")}
                  value={
                    translateAuditValue(
                      selectedRecipe.approval.decision
                    )
                  }
                />

                <InfoItem
                  label={t("auditTrailPage.details.approvedBy")}
                  value={
                    selectedRecipe.approval.approvedBy
                  }
                  subValue={
                    translateRole(
                      selectedRecipe.approval.approvedByRole
                    )
                  }
                />

                <InfoItem
                  label={t("auditTrailPage.details.approvedAt")}
                  value={
                    selectedRecipe.approval.approvedDateTime
                  }
                />

                <InfoItem
                  label={t("auditTrailPage.details.rejectedBy")}
                  value={
                    selectedRecipe.approval.rejectedBy
                  }
                />

                <InfoItem
                  label={t("auditTrailPage.details.rejectedAt")}
                  value={
                    selectedRecipe.approval.rejectedDateTime
                  }
                />

                <InfoItem
                  label={t("auditTrailPage.details.reviewRound")}
                  value={
                    selectedRecipe.approval.reviewRound
                  }
                />
              </div>


              {selectedRecipe.approval
                .rejectionReason !==
                "-" && (
                <div className="audit-comment-box">
                  <strong>
                    {t("auditTrailPage.details.rejectionReason")}
                  </strong>

                  <p>
                    {
                      selectedRecipe.approval.rejectionReason
                    }
                  </p>
                </div>
              )}
            </section>


            <section className="audit-details-section">
              <div className="audit-section-title">
                <Database
                  size={17}
                />

                <h3>
                  {t("auditTrailPage.details.erpInformation")}
                </h3>
              </div>

              <div className="audit-info-grid">
                <InfoItem
                  label={t("auditTrailPage.details.erpReference")}
                  value={
                    selectedRecipe.erp.reference
                  }
                />

                <InfoItem
                  label={t("auditTrailPage.details.erpStatus")}
                  value={
                    translateAuditValue(
                      selectedRecipe.erp.status
                    )
                  }
                />

                <InfoItem
                  label={t("auditTrailPage.details.erpEntryDate")}
                  value={
                    selectedRecipe.erp.entryDate
                  }
                />

                <InfoItem
                  label={t("auditTrailPage.details.enteredBy")}
                  value={
                    selectedRecipe.erp.enteredBy
                  }
                  subValue={
                    translateRole(selectedRecipe.erp.enteredByRole)
                  }
                />

                <InfoItem
                  label={t("auditTrailPage.details.erpCreatedAt")}
                  value={
                    selectedRecipe.erp.createdDateTime
                  }
                />

                <InfoItem
                  label={t("auditTrailPage.details.erpCompletedAt")}
                  value={
                    selectedRecipe.erp.completedDateTime
                  }
                />
              </div>


              {selectedRecipe.erp.notes !==
                "-" && (
                <div className="audit-comment-box">
                  <strong>
                    {t("auditTrailPage.details.erpNotes")}
                  </strong>

                  <p>
                    {
                      selectedRecipe.erp.notes
                    }
                  </p>
                </div>
              )}
            </section>


            <section className="audit-details-section">
              <div className="audit-section-title">
                <Clock3
                  size={17}
                />

                <h3>
                  {t("auditTrailPage.details.activityTimeline")}
                </h3>
              </div>


              <div className="audit-timeline">
                {selectedRecipe.timeline
                  .length > 0 ? (
                  selectedRecipe.timeline.map(
                    (
                      activity
                    ) => (
                      <div
                        className="audit-timeline-item"
                        key={
                          activity.id
                        }
                      >
                        <div className="audit-timeline-dot" />

                        <div className="audit-timeline-content">
                          <div className="audit-timeline-top">
                            <div>
                              <strong>
                                {
                                  activity.action
                                }
                              </strong>

                              <span>
                                {
                                  activity.module
                                }
                              </span>
                            </div>

                            <time>
                              {
                                activity.date
                              }{" "}
                              {
                                activity.time
                              }
                            </time>
                          </div>


                          <div className="audit-timeline-user">
                            {
                              activity.user
                            }{" "}
                            <span>
                              {
                                activity.userRole
                              }
                            </span>
                          </div>


                          {activity.details && (
                            <p>
                              {
                                activity.details
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div className="audit-empty-timeline">
                    {t("auditTrailPage.details.noActivity")}
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      )}

    </div>
  );
}


function InfoItem({
  label,
  value,
  subValue,
}) {
  return (
    <div className="audit-info-item">
      <span>
        {label}
      </span>

      <strong>
        {value || "-"}
      </strong>

      {subValue &&
        subValue !== "-" && (
        <small>
          {subValue}
        </small>
      )}
    </div>
  );
}


export default AuditTrail;
