import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Search,
  Upload,
} from "lucide-react";

import * as XLSX from "xlsx";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  getAuditLogs,
} from "../utils/auditLogger";

import "../styles/AuditTrail.css";

function AuditTrail() {
  const [auditData, setAuditData] =
    useState(() => getAuditLogs());

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [moduleFilter, setModuleFilter] =
    useState("All");

  const [actionFilter, setActionFilter] =
    useState("All");

  const [search, setSearch] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [
    showExportMenu,
    setShowExportMenu,
  ] = useState(false);

  const exportRef =
    useRef(null);

  const fromDateRef =
    useRef(null);

  const toDateRef =
    useRef(null);

  const openDatePicker =
    (inputRef) => {

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

  const itemsPerPage = 10;

  useEffect(() => {
    const refresh = () => {
      setAuditData(
        getAuditLogs()
      );
    };

    window.addEventListener(
      "audit-updated",
      refresh
    );

    window.addEventListener(
      "storage",
      refresh
    );

    window.addEventListener(
      "focus",
      refresh
    );

    return () => {
      window.removeEventListener(
        "audit-updated",
        refresh
      );

      window.removeEventListener(
        "storage",
        refresh
      );

      window.removeEventListener(
        "focus",
        refresh
      );
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
          setShowExportMenu(false);
        }
      };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
  }, []);

  const filteredAudit =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return auditData.filter(
        (item) => {
          const matchesModule =
            moduleFilter === "All" ||
            item.module ===
              moduleFilter;

          const matchesAction =
            actionFilter === "All" ||
            item.action ===
              actionFilter;

          const matchesSearch =
            !normalizedSearch ||
            item.user
              ?.toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            item.details
              ?.toLowerCase()
              .includes(
                normalizedSearch
              );

          let matchesDate = true;

          if (
            fromDate ||
            toDate
          ) {
            const itemDate =
              item.createdAt
                ? new Date(
                    item.createdAt
                  )
                : null;

            if (
              !itemDate ||
              Number.isNaN(
                itemDate.getTime()
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
                  itemDate <
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
                  itemDate >
                  endDate
                ) {
                  matchesDate = false;
                }
              }
            }
          }

          return (
            matchesModule &&
            matchesAction &&
            matchesSearch &&
            matchesDate
          );
        }
      );
    }, [
      auditData,
      fromDate,
      toDate,
      moduleFilter,
      actionFilter,
      search,
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredAudit.length /
          itemsPerPage
      )
    );

  const startIndex =
    (currentPage - 1) *
    itemsPerPage;

  const endIndex =
    startIndex +
    itemsPerPage;

  const visibleAudit =
    filteredAudit.slice(
      startIndex,
      endIndex
    );

  const firstVisible =
    filteredAudit.length === 0
      ? 0
      : startIndex + 1;

  const lastVisible =
    Math.min(
      endIndex,
      filteredAudit.length
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

  const exportExcel = () => {
    const rows =
      filteredAudit.map(
        (item) => ({
          Date: item.date,
          Time: item.time,
          User: item.user,
          Module: item.module,
          Action: item.action,
          Details: item.details,
        })
      );

    const worksheet =
      XLSX.utils.json_to_sheet(
        rows
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Audit Trail"
    );

    XLSX.writeFile(
      workbook,
      "Audit-Trail.xlsx"
    );

    setShowExportMenu(false);
  };

  const exportPDF = () => {
    const doc =
      new jsPDF({
        orientation: "landscape",
      });

    doc.setFontSize(18);

    doc.text(
      "Audit Trail Report",
      14,
      16
    );

    doc.setFontSize(9);

    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      14,
      23
    );

    autoTable(doc, {
      startY: 29,

      head: [[
        "Date",
        "Time",
        "User",
        "Module",
        "Action",
        "Details",
      ]],

      body:
        filteredAudit.map(
          (item) => [
            item.date,
            item.time,
            item.user,
            item.module,
            item.action,
            item.details,
          ]
        ),

      styles: {
        fontSize: 8,
        cellPadding: 3,
      },

      headStyles: {
        fillColor: [
          90,
          65,
          42,
        ],
      },
    });

    doc.save(
      "Audit-Trail.pdf"
    );

    setShowExportMenu(false);
  };

  return (
    <div className="audit-page">

      <div className="audit-toolbar">

        <div className="audit-date-range">

          <div className="audit-date-field">

            <span className="audit-date-label">
              From
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
                onChange={(event) => {
                  setFromDate(
                    event.target.value
                  );

                  setCurrentPage(1);
                }}
              />

              <button
                type="button"
                className="audit-date-picker-button"
                aria-label="Open from date calendar"
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
              To
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
                onChange={(event) => {
                  setToDate(
                    event.target.value
                  );

                  setCurrentPage(1);
                }}
              />

              <button
                type="button"
                className="audit-date-picker-button"
                aria-label="Open to date calendar"
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

        </div>

        <select
          value={
            moduleFilter
          }
          onChange={(event) => {
            setModuleFilter(
              event.target.value
            );

            setCurrentPage(1);
          }}
        >
          <option value="All">
            All Modules
          </option>

          <option value="Recipes">
            Recipes
          </option>

          <option value="Product Master">
            Product Master
          </option>

          <option value="ERP Entry">
            ERP Entry
          </option>

          <option value="Reports">
            Reports
          </option>

          <option value="Settings">
            Settings
          </option>

          <option value="Audit Trail">
            Audit Trail
          </option>
        </select>

        <select
          value={
            actionFilter
          }
          onChange={(event) => {
            setActionFilter(
              event.target.value
            );

            setCurrentPage(1);
          }}
        >
          <option value="All">
            All Actions
          </option>

          <option value="Created">
            Created
          </option>

          <option value="Updated">
            Updated
          </option>

          <option value="Deleted">
            Deleted
          </option>

          <option value="Viewed">
            Viewed
          </option>

          <option value="Submitted">
            Submitted
          </option>

          <option value="Approved">
            Approved
          </option>

          <option value="Rejected">
            Rejected
          </option>

          <option value="Completed">
            Completed
          </option>
        </select>

        <div className="audit-search">
          <Search
            size={16}
          />

          <input
            type="text"
            placeholder="Search by user or details..."
            value={search}
            onChange={(event) => {
              setSearch(
                event.target.value
              );

              setCurrentPage(1);
            }}
          />
        </div>

        <div
          className="audit-export-wrapper"
          ref={exportRef}
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

            Export

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

                Export PDF
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

                Export Excel
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
                  Date & Time
                </th>

                <th>
                  User
                </th>

                <th>
                  Module
                </th>

                <th>
                  Action
                </th>

                <th>
                  Details
                </th>
              </tr>
            </thead>

            <tbody>

              {visibleAudit.length >
              0 ? (

                visibleAudit.map(
                  (item) => (

                    <tr
                      key={
                        item.id
                      }
                    >

                      <td>
                        <div className="audit-date-cell">
                          <strong>
                            {
                              item.date
                            }
                          </strong>

                          <span>
                            {
                              item.time
                            }
                          </span>
                        </div>
                      </td>

                      <td>
                        {
                          item.user
                        }
                      </td>

                      <td>
                        {
                          item.module
                        }
                      </td>

                      <td>
                        <span
                          className={`audit-action ${item.action
                            .toLowerCase()
                            .replace(
                              /\s+/g,
                              "-"
                            )}`}
                        >
                          {
                            item.action
                          }
                        </span>
                      </td>

                      <td className="audit-details">
                        {
                          item.details
                        }
                      </td>

                    </tr>
                  )
                )

              ) : (

                <tr>
                  <td
                    colSpan="5"
                    className="audit-empty"
                  >
                    No audit records found.
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

        <div className="audit-pagination-footer">

          <span>
            Showing{" "}
            {firstVisible}{" "}
            to{" "}
            {lastVisible}{" "}
            of{" "}
            {
              filteredAudit.length
            }{" "}
            entries
          </span>

          <div className="audit-pagination">

            <button
              type="button"
              disabled={
                currentPage === 1
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
              (pageNumber) => (

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

    </div>
  );
}

export default AuditTrail;