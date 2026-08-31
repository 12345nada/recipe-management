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
  useState,
} from "react";

import {
  useAuth,
} from "../context/AuthContext";

import {
  completeERPEntry,
  ensureERPEntry,
  getERPRecipeById,
  subscribeToERP,
} from "../services/erpService";

import "../styles/ERPDetails.css";


function ERPDetails() {
  const {
    id,
  } =
    useParams();

  const navigate =
    useNavigate();


  const {
    profile,
    isAdmin,
    hasPermission,
  } =
    useAuth();


  const [
    recipe,
    setRecipe,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


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


  const canEditERP =
    isAdmin ||
    hasPermission(
      "ERP Entry",
      "edit"
    ) ||
    hasPermission(
      "ERP Entry",
      "add"
    );


  const loadRecipe =
    async (
      showLoader = true
    ) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const data =
          await getERPRecipeById(
            id
          );

        setRecipe(data);

        if (data?.erp) {
          setErpReference(
            data.erp.reference ||
            ""
          );

          setEntryDate(
            data.erp.entryDate ||
            ""
          );

          setNotes(
            data.erp.notes ||
            ""
          );
        }
      } catch (
        loadError
      ) {
        console.error(
          "ERP details error:",
          loadError
        );

        setError(
          loadError?.message ||
            "Could not load ERP details."
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    };


  useEffect(() => {
    loadRecipe();

    const unsubscribe =
      subscribeToERP(
        () => {
          loadRecipe(false);
        }
      );

    return () => {
      unsubscribe();
    };
  }, [
    id,
  ]);


  useEffect(() => {
    if (
      !recipe ||
      recipe.erp ||
      recipe.erpStatus ===
        "ERP Completed" ||
      !canEditERP ||
      !profile?.id
    ) {
      return;
    }


    const createPendingEntry =
      async () => {
        try {
          const entry =
            await ensureERPEntry({
              recipeId:
                recipe.id,

              userId:
                profile.id,
            });

          setErpReference(
            entry.erp_reference ||
            ""
          );

          setEntryDate(
            entry.entry_date ||
            ""
          );

          setNotes(
            entry.notes ||
            ""
          );

          await loadRecipe(
            false
          );
        } catch (
          createError
        ) {
          console.error(
            "Create ERP entry error:",
            createError
          );

          setError(
            createError?.message ||
              "Could not create ERP entry."
          );
        }
      };


    createPendingEntry();
  }, [
    recipe?.id,
    recipe?.erpStatus,
    profile?.id,
    canEditERP,
  ]);


  const recipeStatus =
    recipe?.erpStatus ||
    recipe?.status ||
    "";


  const handleComplete =
    async () => {
      if (
        !recipe ||
        saving ||
        !canEditERP
      ) {
        return;
      }


      if (
        recipeStatus ===
        "ERP Completed"
      ) {
        navigate(
          "/erp-entry"
        );

        return;
      }


      try {
        setSaving(true);

        setError("");


        await completeERPEntry({
          recipeId:
            recipe.id,

          notes,

          userId:
            profile?.id,
        });


        await loadRecipe(
          false
        );


        navigate(
          "/erp-entry"
        );
      } catch (
        completeError
      ) {
        console.error(
          "Complete ERP error:",
          completeError
        );

        setError(
          completeError?.message ||
            "Could not complete ERP entry."
        );
      } finally {
        setSaving(false);
      }
    };


  if (loading) {
    return (
      <div className="erp-details-page">

        <div className="erp-details-not-found">
          Loading ERP details...
        </div>

      </div>
    );
  }


  if (
    !recipe
  ) {
    return (
      <div className="erp-details-page">

        <div className="erp-details-not-found">

          <h2>
            Recipe not found
          </h2>

          {error && (
            <p>
              {error}
            </p>
          )}


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


  const yieldValue =
    recipe.displayYield ||
    `${recipe.yield || ""} ${
      recipe.yieldUnit ||
      ""
    }`.trim();


  const approvedBy =
    recipe.approvedBy ||
    "Approver";


  const approvedRole =
    recipe.approvedRole ||
    "Recipe Approver";


  const approvedDate =
    recipe.approvedDate ||
    "-";


  const approvedTime =
    recipe.approvedTime ||
    "";


  const approvalStatus =
    recipe.approvalStatus ||
    "Approved";


  const enteredBy =
    recipe.erp?.enteredBy ||
    profile?.full_name ||
    profile?.username ||
    "ERP User";


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


      {error && (
        <div
          style={{
            marginBottom:
              "16px",

            color:
              "#b42318",
          }}
        >
          {error}
        </div>
      )}


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
                {
                  recipeStatus
                }
              </strong>

            </div>

          </div>


          <div className="erp-description-row">

            <strong>
              ID:
            </strong>

            <span>
              {
                recipe.recipeCode
              }
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
              value={
                enteredBy
              }
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
                value={
                  notes
                }
                onChange={(
                  event
                ) =>
                  setNotes(
                    event.target.value
                  )
                }
                disabled={
                  recipeStatus ===
                    "ERP Completed" ||
                  saving ||
                  !canEditERP
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

            canEditERP && (

              <button
                type="button"
                className="mark-erp-completed-button"
                disabled={
                  saving
                }
                onClick={
                  handleComplete
                }
              >
                <Check
                  size={17}
                />

                {
                  saving
                    ? "Completing..."
                    : "Mark as ERP Completed"
                }
              </button>

            )

          )}

        </div>

      </div>

    </div>
  );
}


export default ERPDetails;