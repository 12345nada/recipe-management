import {
  ArrowLeft,
  CalendarDays,
  Check,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  initialRecipes,
} from "../data/recipesData";

import "../styles/ERPDetails.css";

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

function ERPDetails() {
  const {
    id,
  } = useParams();

  const navigate =
    useNavigate();

  const [
    recipes,
    setRecipes,
  ] = useState(() =>
    loadRecipes()
  );

  useEffect(() => {
    const refresh =
      () => {
        setRecipes(
          loadRecipes()
        );
      };

    window.addEventListener(
      "focus",
      refresh
    );

    window.addEventListener(
      "storage",
      refresh
    );

    return () => {
      window.removeEventListener(
        "focus",
        refresh
      );

      window.removeEventListener(
        "storage",
        refresh
      );
    };
  }, []);

  const recipe =
    useMemo(
      () =>
        recipes.find(
          (item) =>
            item.id === id
        ),
      [
        recipes,
        id,
      ]
    );

  const generateERPReference =
    () => {
      const year =
        new Date()
          .getFullYear();

      const numbers =
        recipes
          .map(
            (item) =>
              item.erp
                ?.reference
          )
          .filter(Boolean)
          .map(
            (reference) => {
              const number =
                Number(
                  reference
                    .split("-")
                    .pop()
                );

              return Number.isNaN(
                number
              )
                ? 0
                : number;
            }
          );

      const next =
        numbers.length
          ? Math.max(
              ...numbers
            ) + 1
          : 1;

      return `ERP-${year}-${String(
        next
      ).padStart(
        4,
        "0"
      )}`;
    };

  const [
    erpReference,
    setErpReference,
  ] = useState("");

  const [
    entryDate,
    setEntryDate,
  ] = useState("");

  const [
    notes,
    setNotes,
  ] = useState("");

  useEffect(() => {
    if (!recipe) {
      return;
    }

    setErpReference(
      recipe.erp?.reference ||
        generateERPReference()
    );

    setEntryDate(
      recipe.erp?.entryDate ||
        new Date()
          .toISOString()
          .split("T")[0]
    );

    setNotes(
      recipe.erp?.notes ||
        ""
    );
  }, [recipe]);

  if (!recipe) {
    return (
      <div className="erp-details-page">

        <div className="erp-details-not-found">

          <h2>
            Recipe not found
          </h2>

          <button
            type="button"
            className="erp-back-button"
            onClick={() =>
              navigate(
                "/erp-entry"
              )
            }
          >
            <ArrowLeft
              size={16}
            />

            Back to ERP Entry
          </button>

        </div>

      </div>
    );
  }

  const recipeName =
    recipe.productName ||
    recipe.name ||
    "Unnamed Recipe";

  const recipeStatus =
    recipe.status ===
    "Approved"
      ? "ERP Pending"
      : recipe.status;

  const yieldValue =
    `${recipe.yield || ""} ${
      recipe.yieldUnit ||
      ""
    }`.trim();

  const approvedBy =
    recipe.approvedBy ||
    recipe.approval
      ?.approvedBy ||
    "Approver";

  const approvedRole =
    recipe.approvedRole ||
    recipe.approval
      ?.approvedRole ||
    "Recipe Approver";

  const approvedDate =
    recipe.approvedDate ||
    recipe.approval
      ?.approvedDate ||
    recipe.lastUpdated ||
    "-";

  const approvedTime =
    recipe.approvedTime ||
    recipe.approval
      ?.approvedTime ||
    recipe.updatedTime ||
    "";

  const approvalStatus =
    recipe.approvalStatus ||
    recipe.approval
      ?.status ||
    "Approved";

  const handleComplete =
    () => {
      if (
        recipeStatus ===
        "ERP Completed"
      ) {
        navigate(
          "/erp-entry"
        );

        return;
      }

      const now =
        new Date();

      const updatedRecipes =
        recipes.map(
          (item) =>
            item.id ===
            recipe.id
              ? {
                  ...item,

                  status:
                    "ERP Completed",

                  erp: {
                    reference:
                      erpReference,

                    entryDate,

                    enteredBy:
                      "ERP User",

                    notes,

                    completedAt:
                      now.toISOString(),
                  },

                  lastUpdated:
                    now.toLocaleDateString(
                      "en-GB",
                      {
                        day:
                          "2-digit",

                        month:
                          "short",

                        year:
                          "numeric",
                      }
                    ),

                  updatedTime:
                    now.toLocaleTimeString(
                      "en-US",
                      {
                        hour:
                          "2-digit",

                        minute:
                          "2-digit",
                      }
                    ),
                }
              : item
        );

      setRecipes(
        updatedRecipes
      );

      localStorage.setItem(
        RECIPES_KEY,
        JSON.stringify(
          updatedRecipes
        )
      );

      navigate(
        "/erp-entry"
      );
    };

  return (
    <div className="erp-details-page">

      <div className="erp-details-top">

        <div>

          <div className="erp-breadcrumb">

            <span>
              ERP Entry
            </span>

            <span>
              ›
            </span>

            <strong>
              {recipeName}
            </strong>

          </div>

          <h1>
            {recipeName}
          </h1>

          <p>
            Recipe Details & ERP Entry
          </p>

        </div>

        <button
          type="button"
          className="erp-back-button"
          onClick={() =>
            navigate(
              "/erp-entry"
            )
          }
        >
          <ArrowLeft
            size={16}
          />

          Back to ERP Entry
        </button>

      </div>

      <div className="erp-details-card recipe-info-card">

        <div className="erp-recipe-photo">
          <span>
            🍽️
          </span>
        </div>

        <div className="erp-recipe-main-info">

          <div className="erp-info-grid">

            <div className="erp-info-item">

              <span>
                Type
              </span>

              <strong className="erp-type-value">
                {
                  recipe.type ||
                  "-"
                }
              </strong>

            </div>

            <div className="erp-info-divider" />

            <div className="erp-info-item">

              <span>
                Category
              </span>

              <strong className="erp-category-value">
                {
                  recipe.category ||
                  "-"
                }
              </strong>

            </div>

            <div className="erp-info-divider" />

            <div className="erp-info-item">

              <span>
                Yield
              </span>

              <strong>
                {
                  yieldValue ||
                  "-"
                }
              </strong>

            </div>

            <div className="erp-info-divider" />

            <div className="erp-info-item">

              <span>
                Status
              </span>

              <strong
                className={
                  recipeStatus ===
                  "ERP Completed"
                    ? "erp-completed-value"
                    : "erp-pending-value"
                }
              >
                {recipeStatus}
              </strong>

            </div>

          </div>

          <div className="erp-description-row">

            <strong>
              ID:
            </strong>

            <span>
              {recipe.id}
            </span>

            <strong>
              Description:
            </strong>

            <span>
              {
                recipe.description ||
                "No description"
              }
            </span>

          </div>

        </div>

      </div>

      <div className="erp-details-card approval-card">

        <h2>
          Approval Information
        </h2>

        <div className="approval-info-grid">

          <div className="approval-user">

            <div className="approval-avatar">
              {
                approvedBy
                  .charAt(0)
                  .toUpperCase()
              }
            </div>

            <div>

              <span>
                Approved By
              </span>

              <strong>
                {approvedBy}
              </strong>

              <small>
                {approvedRole}
              </small>

            </div>

          </div>

          <div className="approval-divider" />

          <div className="approval-item">

            <span>
              Approved On
            </span>

            <strong>
              {approvedDate}
            </strong>

            <small>
              {approvedTime}
            </small>

          </div>

          <div className="approval-divider" />

          <div className="approval-item">

            <span>
              Approval Status
            </span>

            <strong className="approved-badge">
              {approvalStatus}
            </strong>

          </div>

        </div>

      </div>

      <div className="erp-details-card erp-entry-form-card">

        <h2>
          ERP Entry
        </h2>

        <div className="erp-details-form-grid">

          <div className="erp-details-form-group">

            <label>
              ERP Reference
            </label>

            <input
              type="text"
              value={
                erpReference
              }
              readOnly
              className="erp-readonly-field"
            />

          </div>

          <div className="erp-details-form-group">

            <label>
              ERP Entry Date
            </label>

            <div className="erp-date-input">

              <CalendarDays
                size={17}
              />

              <input
                type="date"
                value={
                  entryDate
                }
                readOnly
                className="erp-readonly-field"
              />

            </div>

          </div>

          <div className="erp-details-form-group erp-details-full">

            <label>
              Entered By
            </label>

            <input
              type="text"
              value="ERP User"
              readOnly
              className="erp-readonly-field"
            />

          </div>

          <div className="erp-details-form-group erp-details-full">

            <label>
              ERP Notes

              <small>
                {" "}
                (Optional)
              </small>

            </label>

            <div className="erp-notes-wrapper">

              <textarea
                maxLength="500"
                placeholder="Enter any additional notes..."
                value={notes}
                onChange={(
                  event
                ) =>
                  setNotes(
                    event.target
                      .value
                  )
                }
                disabled={
                  recipeStatus ===
                  "ERP Completed"
                }
              />

              <span>
                {notes.length}/500
              </span>

            </div>

          </div>

        </div>

        <div className="erp-details-actions">

          {recipeStatus ===
          "ERP Completed" ? (

            <button
              type="button"
              className="mark-erp-completed-button completed"
              onClick={() =>
                navigate(
                  "/erp-entry"
                )
              }
            >
              <Check
                size={17}
              />

              ERP Completed
            </button>

          ) : (

            <button
              type="button"
              className="mark-erp-completed-button"
              onClick={
                handleComplete
              }
            >
              <Check
                size={17}
              />

              Mark as ERP Completed
            </button>

          )}

        </div>

      </div>

    </div>
  );
}

export default ERPDetails;