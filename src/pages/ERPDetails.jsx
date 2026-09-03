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
  useTranslation,
} from "react-i18next";

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
    t,
  } = useTranslation();

  const {
    id,
  } =
    useParams();


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
        "Approved":
          "status.approved",
        "ERP Pending":
          "status.erpPending",
        "ERP Completed":
          "status.erpCompleted",
      };

      return keys[status]
        ? t(keys[status])
        : status;
    };

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
            t("erpDetailsPage.errors.couldNotLoad")
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
              t("erpDetailsPage.errors.couldNotCreate")
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
            t("erpDetailsPage.errors.couldNotComplete")
        );
      } finally {
        setSaving(false);
      }
    };


  if (loading) {
    return (
      <div className="erp-details-page">

        <div className="erp-details-not-found">
          {t("erpDetailsPage.loading")}
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
            {t("erpDetailsPage.notFound")}
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

            {t("erpDetailsPage.back")}
          </button>

        </div>

      </div>
    );
  }


  const recipeName =
    recipe.productName ||
    recipe.name ||
    t("erpDetailsPage.unnamedRecipe");


  const yieldValue =
    recipe.displayYield ||
    `${recipe.yield || ""} ${
      recipe.yieldUnit ||
      ""
    }`.trim();


  const approvedBy =
    recipe.approvedBy ||
    t("roles.approver");


  const approvedRole =
    recipe.approvedRole ||
    t("erpDetailsPage.recipeApprover");


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
    t("roles.erpUser");


  return (
    <div className="erp-details-page">

      <div className="erp-details-top">

        <div>

          <div className="erp-breadcrumb">

            <span>
              {t("erpDetailsPage.erpEntry")}
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
            {t("erpDetailsPage.subtitle")}
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

          {t("erpDetailsPage.back")}
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
                {t("erpDetailsPage.fields.type")}
              </span>

              <strong className="erp-type-value">
                {
                  translateType(
                    recipe.type
                  ) ||
                  "-"
                }
              </strong>

            </div>


            <div className="erp-info-divider" />


            <div className="erp-info-item">

              <span>
                {t("erpDetailsPage.fields.category")}
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
                {t("erpDetailsPage.fields.yield")}
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
                {t("erpDetailsPage.fields.status")}
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
                  translateStatus(
                    recipeStatus
                  )
                }
              </strong>

            </div>

          </div>


          <div className="erp-description-row">

            <strong>
              {t("erpDetailsPage.fields.id")}:
            </strong>

            <span>
              {
                recipe.recipeCode
              }
            </span>


            <strong>
              {t("erpDetailsPage.fields.description")}:
            </strong>

            <span>
              {
                recipe.description ||
                t("erpDetailsPage.noDescription")
              }
            </span>

          </div>

        </div>

      </div>


      <div className="erp-details-card approval-card">

        <h2>
          {t("erpDetailsPage.approval.title")}
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
                {t("erpDetailsPage.approval.approvedBy")}
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
              {t("erpDetailsPage.approval.approvedOn")}
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
              {t("erpDetailsPage.approval.status")}
            </span>

            <strong className="approved-badge">
              {translateStatus(
                approvalStatus
              )}
            </strong>

          </div>

        </div>

      </div>


      <div className="erp-details-card erp-entry-form-card">

        <h2>
          {t("erpDetailsPage.erpEntry")}
        </h2>


        <div className="erp-details-form-grid">

          <div className="erp-details-form-group">

            <label>
              {t("erpDetailsPage.form.reference")}
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
              {t("erpDetailsPage.form.entryDate")}
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
              {t("erpDetailsPage.form.enteredBy")}
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
              {t("erpDetailsPage.form.notes")}

              <small>
                {" "}
                (Optional)
              </small>

            </label>


            <div className="erp-notes-wrapper">

              <textarea
                maxLength="500"
                placeholder={t("erpDetailsPage.form.notesPlaceholder")}
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

              {t("erpDetailsPage.actions.completed")}
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
                    ? t("erpDetailsPage.actions.completing")
                    : t("erpDetailsPage.actions.markCompleted")
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