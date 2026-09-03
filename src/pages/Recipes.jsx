import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowLeft,
  ChefHat,
  ClipboardList,
  Eye,
  FileText,
  Leaf,
  MoreVertical,
  Plus,
  Save,
  Search,
  Send,
  Soup,
  Trash2,
  X,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useTranslation,
} from "react-i18next";

import StatusBadge
  from "../components/StatusBadge";

import {
  useAuth,
} from "../context/AuthContext";

import {
  approveRecipe,
  createRecipe,
  getAllRecipeProducts,
  getRecipes,
  rejectRecipe,
  removeRecipe,
  subscribeToRecipes,
  updateRecipe,
} from "../services/recipeService";

import "../styles/Recipes.css";


const tabs = [
  "All Recipes",
  "Draft",
  "Submitted",
  "Pending Approval",
  "Approved",
  "Rejected",
  "ERP Pending",
  "ERP Completed",
];


const initialFormData = {
  productId: "",
  productName: "",
  type: "",
  category: "",
  description: "",
  yield: "",
  yieldUnit: "",
};


const initialIngredient = {
  productId: "",
  productName: "",
  type: "",
  quantity: "",
  unit: "",
};


function Recipes() {
  const {
    t,
  } = useTranslation();


  const translateStatus =
    (status) => {
      const statusKeys = {
        "Draft":
          "status.draft",
        "Submitted":
          "status.submitted",
        "Pending Approval":
          "status.pendingApproval",
        "Under Review":
          "status.underReview",
        "Waiting Approval":
          "status.waitingApproval",
        "Approved":
          "status.approved",
        "Rejected":
          "status.rejected",
        "ERP Pending":
          "status.erpPending",
        "ERP Completed":
          "status.erpCompleted",
      };

      return statusKeys[status]
        ? t(statusKeys[status])
        : status;
    };


  const translateType =
    (type) => {
      const typeKeys = {
        "Finished Product":
          "productTypes.finishedProduct",
        "Semi-Finished":
          "productTypes.semiFinished",
        "Raw Material":
          "productTypes.rawMaterial",
        "Packaging":
          "productTypes.packaging",
      };

      return typeKeys[type]
        ? t(typeKeys[type])
        : type;
    };


  const translateRole =
    (role) => {
      const roleKeys = {
        "User":
          "roles.user",
        "Administrator":
          "roles.administrator",
        "Admin":
          "roles.admin",
        "Manager":
          "roles.manager",
        "Head Chef":
          "roles.headChef",
        "Approver":
          "roles.approver",
        "ERP User":
          "roles.erpUser",
      };

      return roleKeys[role]
        ? t(roleKeys[role])
        : role;
    };


  const translateTab =
    (tab) => {
      const tabKeys = {
        "All Recipes":
          "recipesPage.tabs.allRecipes",
        "Draft":
          "recipesPage.tabs.draft",
        "Submitted":
          "recipesPage.tabs.submitted",
        "Pending Approval":
          "recipesPage.tabs.pendingApproval",
        "Approved":
          "recipesPage.tabs.approved",
        "Rejected":
          "recipesPage.tabs.rejected",
        "ERP Pending":
          "recipesPage.tabs.erpPending",
        "ERP Completed":
          "recipesPage.tabs.erpCompleted",
      };

      return tabKeys[tab]
        ? t(tabKeys[tab])
        : tab;
    };


  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    id,
  } =
    useParams();

  const {
    profile,
    isAdmin,
    hasPermission,
  } =
    useAuth();


  const isCreateMode =
    location.pathname ===
    "/recipes/new";


  const isEditMode =
    Boolean(id) &&
    id !== "new" &&
    new URLSearchParams(
      location.search
    ).get("edit") ===
      "true";


  const isDetailsMode =
    Boolean(id) &&
    id !== "new" &&
    !isEditMode;


  const [
    recipes,
    setRecipes,
  ] = useState([]);


  const [
    products,
    setProducts,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    approving,
    setApproving,
  ] = useState(false);


  const [
    deleting,
    setDeleting,
  ] = useState(false);


  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "All Recipes"
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
    currentPage,
    setCurrentPage,
  ] = useState(1);


  const [
    openActionMenu,
    setOpenActionMenu,
  ] = useState(null);


  const [
    actionMenuPosition,
    setActionMenuPosition,
  ] = useState({
    top: 0,
    left: 0,
  });


  const [
    recipeToDelete,
    setRecipeToDelete,
  ] = useState(null);


  const [
    recipeToReject,
    setRecipeToReject,
  ] = useState(null);


  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");


  const [
    formData,
    setFormData,
  ] = useState(
    initialFormData
  );


  const [
    ingredients,
    setIngredients,
  ] = useState([]);


  const [
    showIngredientModal,
    setShowIngredientModal,
  ] = useState(false);


  const [
    ingredientForm,
    setIngredientForm,
  ] = useState(
    initialIngredient
  );


  const [
    error,
    setError,
  ] = useState("");


  const itemsPerPage = 5;


  const roleName =
    profile?.roles?.name ||
    "";


  const canAdd =
    isAdmin ||
    hasPermission(
      "Recipes",
      "add"
    );


  const canEdit =
    isAdmin ||
    hasPermission(
      "Recipes",
      "edit"
    );


  const canDelete =
    isAdmin ||
    hasPermission(
      "Recipes",
      "delete"
    );


  const canApprove =
    isAdmin ||
    roleName
      .trim()
      .toLowerCase() ===
      "approver";


  const loadData =
    async (
      showLoader = true
    ) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const [
          recipesData,
          productsData,
        ] =
          await Promise.all([
            getRecipes(),
            getAllRecipeProducts(),
          ]);

        setRecipes(
          recipesData
        );

        setProducts(
          productsData
        );
      } catch (
        loadError
      ) {
        console.error(
          "Recipes load error:",
          loadError
        );

        setError(
          loadError?.message ||
            t("recipesPage.errors.couldNotLoad")
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    };


  useEffect(() => {
    loadData();

    const unsubscribe =
      subscribeToRecipes(
        () => {
          loadData(false);
        }
      );

    return () => {
      unsubscribe();
    };
  }, []);


  useEffect(() => {
    if (
      openActionMenu ===
      null
    ) {
      return undefined;
    }


    const closeActionMenu =
      () => {
        setOpenActionMenu(
          null
        );
      };


    const closeOnPageMove =
      () => {
        setOpenActionMenu(
          null
        );
      };


    document.addEventListener(
      "mousedown",
      closeActionMenu
    );


    window.addEventListener(
      "scroll",
      closeOnPageMove,
      true
    );


    window.addEventListener(
      "resize",
      closeOnPageMove
    );


    return () => {
      document.removeEventListener(
        "mousedown",
        closeActionMenu
      );


      window.removeEventListener(
        "scroll",
        closeOnPageMove,
        true
      );


      window.removeEventListener(
        "resize",
        closeOnPageMove
      );
    };
  }, [
    openActionMenu,
  ]);


  const currentRecipe =
    useMemo(
      () =>
        recipes.find(
          (recipe) =>
            recipe.id ===
            id
        ) || null,
      [
        recipes,
        id,
      ]
    );


  useEffect(() => {
    if (
      !isEditMode ||
      !currentRecipe
    ) {
      return;
    }

    setFormData({
      productId:
        currentRecipe.productId ||
        "",

      productName:
        currentRecipe.productName ||
        "",

      type:
        currentRecipe.type ||
        "",

      category:
        currentRecipe.category ||
        "",

      description:
        currentRecipe.description ||
        "",

      yield:
        currentRecipe.yield ??
        "",

      yieldUnit:
        currentRecipe.yieldUnit ||
        "",
    });

    setIngredients(
      currentRecipe.ingredients ||
      []
    );

    setError("");
  }, [
    isEditMode,
    currentRecipe,
  ]);


  const stats =
    useMemo(
      () => ({
        finished:
          recipes.filter(
            (recipe) =>
              recipe.type ===
              "Finished Product"
          ).length,

        semiFinished:
          recipes.filter(
            (recipe) =>
              recipe.type ===
              "Semi-Finished"
          ).length,

        rawMaterials:
          recipes.filter(
            (recipe) =>
              recipe.type ===
              "Raw Material"
          ).length,

        pendingApproval:
          recipes.filter(
            (recipe) =>
              [
                "Pending Approval",
                "Submitted",
                "Under Review",
              ].includes(
                recipe.status
              )
          ).length,
      }),
      [
        recipes,
      ]
    );


  const recipeProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.type ===
              "Finished Product" ||
            product.type ===
              "Semi-Finished"
        ),
      [
        products,
      ]
    );


  const ingredientProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.id !==
              formData.productId &&
            (
              product.type ===
                "Raw Material" ||
              product.type ===
                "Semi-Finished" ||
              product.type ===
                "Packaging"
            )
        ),
      [
        products,
        formData.productId,
      ]
    );


  const categories =
    useMemo(
      () => [
        ...new Set(
          recipes
            .map(
              (recipe) =>
                recipe.category
            )
            .filter(Boolean)
        ),
      ],
      [
        recipes,
      ]
    );


  const filteredRecipes =
    useMemo(
      () =>
        recipes.filter(
          (recipe) => {
            const tabMatch =
              activeTab ===
                "All Recipes" ||
              recipe.status ===
                activeTab;

            const value =
              search
                .trim()
                .toLowerCase();

            const searchMatch =
              !value ||
              recipe.productName
                ?.toLowerCase()
                .includes(
                  value
                ) ||
              recipe.recipeCode
                ?.toLowerCase()
                .includes(
                  value
                );

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

            return (
              tabMatch &&
              searchMatch &&
              typeMatch &&
              categoryMatch
            );
          }
        ),
      [
        recipes,
        activeTab,
        search,
        typeFilter,
        categoryFilter,
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


  const countTab =
    (tab) => {
      if (
        tab ===
        "All Recipes"
      ) {
        return recipes.length;
      }

      return recipes.filter(
        (recipe) =>
          recipe.status ===
          tab
      ).length;
    };


  const resetForm =
    () => {
      setFormData(
        initialFormData
      );

      setIngredients([]);

      setIngredientForm(
        initialIngredient
      );

      setError("");
    };


  const handleProductChange =
    (event) => {
      const product =
        products.find(
          (item) =>
            item.id ===
            event.target.value
        );

      if (!product) {
        resetForm();

        return;
      }

      setFormData({
        productId:
          product.id,

        productName:
          product.name,

        type:
          product.type,

        category:
          product.category,

        description:
          product.description ||
          "",

        yield: "",

        yieldUnit:
          product.unit ||
          "",
      });

      setIngredients([]);

      setError("");
    };


  const handleChange =
    (event) => {
      const {
        name,
        value,
      } =
        event.target;

      setFormData(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );

      setError("");
    };


  const handleOpenIngredient =
    () => {
      if (
        !formData.productId
      ) {
        setError(
          t("recipesPage.errors.selectProductFirst")
        );

        return;
      }

      setIngredientForm(
        initialIngredient
      );

      setShowIngredientModal(
        true
      );
    };


  const handleIngredientProduct =
    (event) => {
      const product =
        products.find(
          (item) =>
            item.id ===
            event.target.value
        );

      if (!product) {
        setIngredientForm(
          initialIngredient
        );

        return;
      }

      setIngredientForm(
        (previous) => ({
          ...previous,

          productId:
            product.id,

          productName:
            product.name,

          type:
            product.type,

          unit:
            product.unit,
        })
      );
    };


  const addIngredient =
    (event) => {
      event.preventDefault();

      const quantity =
        Number(
          ingredientForm.quantity
        );

      if (
        !ingredientForm.productId ||
        quantity <= 0
      ) {
        return;
      }

      const exists =
        ingredients.some(
          (ingredient) =>
            ingredient.productId ===
            ingredientForm.productId
        );

      if (exists) {
        alert(
          t("recipesPage.errors.ingredientAlreadyAdded")
        );

        return;
      }

      setIngredients(
        (previous) => [
          ...previous,

          {
            id:
              `temp-${ingredientForm.productId}-${Date.now()}`,

            productId:
              ingredientForm.productId,

            name:
              ingredientForm.productName,

            type:
              ingredientForm.type,

            quantity,

            unit:
              ingredientForm.unit,
          },
        ]
      );

      setShowIngredientModal(
        false
      );
    };


  const deleteIngredient =
    (ingredientId) => {
      setIngredients(
        (previous) =>
          previous.filter(
            (ingredient) =>
              ingredient.id !==
              ingredientId
          )
      );
    };


  const saveRecipe =
    async (status) => {
      if (
        saving ||
        !canAdd
      ) {
        return;
      }

      try {
        setSaving(true);
        setError("");

        await createRecipe({
          formData,
          ingredients,
          status,
          userId:
            profile?.id,
        });

        resetForm();

        navigate(
          "/recipes"
        );

        await loadData(false);
      } catch (
        saveError
      ) {
        console.error(
          "Create recipe error:",
          saveError
        );

        setError(
          saveError?.message ||
            t("recipesPage.errors.couldNotSave")
        );
      } finally {
        setSaving(false);
      }
    };


  const saveRecipeChanges =
    async (
      newStatus = null
    ) => {
      if (
        saving ||
        !canEdit ||
        !currentRecipe
      ) {
        return;
      }

      try {
        setSaving(true);
        setError("");

        await updateRecipe({
          recipeId:
            currentRecipe.id,

          formData,

          ingredients,

          status:
            newStatus,

          currentStatus:
            currentRecipe.status,
        });

        resetForm();

        navigate(
          "/recipes"
        );

        await loadData(false);
      } catch (
        saveError
      ) {
        console.error(
          "Update recipe error:",
          saveError
        );

        setError(
          saveError?.message ||
            t("recipesPage.errors.couldNotUpdate")
        );
      } finally {
        setSaving(false);
      }
    };


  const toggleActionMenu =
    (
      clickEvent,
      recipeId
    ) => {
      clickEvent.stopPropagation();


      if (
        openActionMenu ===
        recipeId
      ) {
        setOpenActionMenu(
          null
        );

        return;
      }


      const buttonRect =
        clickEvent.currentTarget
          .getBoundingClientRect();


      const menuWidth = 125;
      const menuHeight = 110;
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


      setOpenActionMenu(
        recipeId
      );
    };


  const deleteRecipe =
    (recipe) => {
      if (!canDelete) {
        return;
      }

      setRecipeToDelete(
        recipe
      );

      setOpenActionMenu(
        null
      );
    };


  const confirmDeleteRecipe =
    async () => {
      if (
        !recipeToDelete ||
        deleting
      ) {
        return;
      }

      try {
        setDeleting(true);

        await removeRecipe(
          recipeToDelete.id
        );

        setRecipeToDelete(
          null
        );

        await loadData(false);
      } catch (
        deleteError
      ) {
        console.error(
          "Delete recipe error:",
          deleteError
        );

        alert(
          deleteError?.message ||
            t("recipesPage.errors.couldNotDelete")
        );
      } finally {
        setDeleting(false);
      }
    };


  const handleApproveRecipe =
    async (recipe) => {
      if (
        approving ||
        !canApprove
      ) {
        return;
      }

      try {
        setApproving(true);

        await approveRecipe({
          recipeId:
            recipe.id,

          userId:
            profile?.id,
        });

        await loadData(false);
      } catch (
        approvalError
      ) {
        console.error(
          "Approve recipe error:",
          approvalError
        );

        alert(
          approvalError?.message ||
            t("recipesPage.errors.couldNotApprove")
        );
      } finally {
        setApproving(false);
      }
    };


  const handleRejectRecipe =
    (recipe) => {
      if (
        approving ||
        !canApprove
      ) {
        return;
      }

      setRecipeToReject(
        recipe
      );

      setRejectionReason(
        ""
      );

      setError("");
    };


  const confirmRejectRecipe =
    async () => {
      if (
        !recipeToReject ||
        approving
      ) {
        return;
      }

      if (
        !rejectionReason.trim()
      ) {
        setError(
          t("recipesPage.errors.enterRejectionReason")
        );

        return;
      }

      try {
        setApproving(true);

        setError("");

        await rejectRecipe({
          recipeId:
            recipeToReject.id,

          userId:
            profile?.id,

          comment:
            rejectionReason.trim(),
        });

        setRecipeToReject(
          null
        );

        setRejectionReason(
          ""
        );

        await loadData(false);
      } catch (
        rejectionError
      ) {
        console.error(
          "Reject recipe error:",
          rejectionError
        );

        setError(
          rejectionError?.message ||
            t("recipesPage.errors.couldNotReject")
        );
      } finally {
        setApproving(false);
      }
    };


  if (loading) {
    return (
      <div className="recipes-page">
        <div className="recipes-content-card">
          <div className="no-recipes">
            {t("recipesPage.loading")}
          </div>
        </div>
      </div>
    );
  }


  if (
    isCreateMode ||
    isEditMode
  ) {
    return (
      <>
        <div className="create-recipe-page">

          <button
            type="button"
            className="create-recipe-back"
            onClick={() =>
              navigate(
                "/recipes"
              )
            }
          >
            <ArrowLeft size={17} />
            {t("recipesPage.backToRecipes")}
          </button>


          <div className="create-recipe-heading">

            <h1>
              {
                isEditMode
                  ? t("recipesPage.form.editRecipe")
                  : t("recipesPage.form.createRecipe")
              }
            </h1>

            <p>
              {
                isEditMode
                  ? t("recipesPage.form.editSubtitle")
                  : t("recipesPage.form.createSubtitle")
              }
            </p>

          </div>


          {error && (
            <div className="create-recipe-error">
              {error}
            </div>
          )}


          <div className="create-recipe-card">

            <div className="create-recipe-section-heading">

              <h2>
                {t("recipesPage.form.recipeInformation")}
              </h2>

              <p>
                {t("recipesPage.form.selectProductHelp")}
              </p>

            </div>


            <div className="create-recipe-grid">

              <div className="create-recipe-field">

                <label>
                  {t("recipesPage.form.product")}
                </label>

                <select
                  value={
                    formData.productId
                  }
                  onChange={
                    handleProductChange
                  }
                  disabled={
                    saving
                  }
                >

                  <option value="">
                    {t("recipesPage.form.selectProduct")}
                  </option>

                  {recipeProducts.map(
                    (product) => (
                      <option
                        key={
                          product.id
                        }
                        value={
                          product.id
                        }
                      >
                        {product.code} - {product.name}
                      </option>
                    )
                  )}

                </select>

              </div>


              <div className="create-recipe-field">

                <label>
                  {t("recipesPage.form.productType")}
                </label>

                <input
                  value={
                    translateType(
                      formData.type
                    )
                  }
                  readOnly
                />

              </div>


              <div className="create-recipe-field">

                <label>
                  {t("recipesPage.form.category")}
                </label>

                <input
                  value={
                    formData.category
                  }
                  readOnly
                />

              </div>


              <div className="create-recipe-field">

                <label>
                  {t("recipesPage.form.yield")}
                </label>

                <input
                  type="number"
                  name="yield"
                  min="0"
                  step="0.01"
                  value={
                    formData.yield
                  }
                  onChange={
                    handleChange
                  }
                  placeholder={t("recipesPage.form.yieldPlaceholder")}
                />

              </div>


              <div className="create-recipe-field">

                <label>
                  {t("recipesPage.form.yieldUnit")}
                </label>

                <input
                  value={
                    formData.yieldUnit
                  }
                  readOnly
                />

              </div>


              <div className="create-recipe-field create-recipe-full">

                <label>
                  {t("recipesPage.form.description")}
                </label>

                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                  placeholder={t("recipesPage.form.descriptionPlaceholder")}
                />

              </div>

            </div>

          </div>


          <div className="create-recipe-card">

            <div className="ingredients-section-header">

              <div>

                <h2>
                  {t("recipesPage.ingredients.title")}
                </h2>

                <p>
                  {t("recipesPage.ingredients.subtitle")}
                </p>

              </div>


              <button
                type="button"
                className="add-ingredient-button"
                onClick={
                  handleOpenIngredient
                }
              >
                <Plus size={17} />
                {t("recipesPage.ingredients.addIngredient")}
              </button>

            </div>


            <div className="create-ingredients-table-wrapper">

              <table className="create-ingredients-table">

                <thead>
                  <tr>
                    <th>{t("recipesPage.form.product")}</th>
                    <th>{t("recipesPage.form.type")}</th>
                    <th>{t("recipesPage.form.quantity")}</th>
                    <th>{t("recipesPage.form.unit")}</th>
                    <th>{t("recipesPage.table.action")}</th>
                  </tr>
                </thead>


                <tbody>

                  {ingredients.length > 0 ? (

                    ingredients.map(
                      (ingredient) => (

                        <tr
                          key={
                            ingredient.id
                          }
                        >

                          <td>
                            <strong>
                              {ingredient.name}
                            </strong>
                          </td>

                          <td>
                            {translateType(
                              ingredient.type
                            )}
                          </td>

                          <td>
                            {ingredient.quantity}
                          </td>

                          <td>
                            {ingredient.unit}
                          </td>

                          <td>

                            <button
                              type="button"
                              className="delete-ingredient-button"
                              onClick={() =>
                                deleteIngredient(
                                  ingredient.id
                                )
                              }
                            >
                              <Trash2 size={16} />
                            </button>

                          </td>

                        </tr>

                      )
                    )

                  ) : (

                    <tr>
                      <td
                        colSpan="5"
                        className="empty-ingredients"
                      >
                        {t("recipesPage.ingredients.noneAdded")}
                      </td>
                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </div>


          <div className="create-recipe-actions">

            <button
              type="button"
              className="create-cancel-button"
              disabled={
                saving
              }
              onClick={() =>
                navigate(
                  "/recipes"
                )
              }
            >
              {t("common.cancel")}
            </button>


            {isEditMode ? (
              <>

                <button
                  type="button"
                  className="create-draft-button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    saveRecipeChanges(
                      "Draft"
                    )
                  }
                >
                  <Save size={17} />
                  {
                    saving
                      ? t("common.saving")
                      : t("recipesPage.actions.saveDraft")
                  }
                </button>


                <button
                  type="button"
                  className="create-submit-button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    saveRecipeChanges(
                      "Submitted"
                    )
                  }
                >
                  <Send size={17} />
                  {t("recipesPage.actions.submitForApproval")}
                </button>


                <button
                  type="button"
                  className="create-submit-button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    saveRecipeChanges()
                  }
                >
                  <Save size={17} />
                  {t("recipesPage.actions.saveChanges")}
                </button>

              </>

            ) : (
              <>

                <button
                  type="button"
                  className="create-draft-button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    saveRecipe(
                      "Draft"
                    )
                  }
                >
                  <Save size={17} />

                  {
                    saving
                      ? t("common.saving")
                      : t("recipesPage.actions.saveDraft")
                  }
                </button>


                <button
                  type="button"
                  className="create-submit-button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    saveRecipe(
                      "Submitted"
                    )
                  }
                >
                  <Send size={17} />
                  {t("recipesPage.actions.submitForApproval")}
                </button>

              </>
            )}

          </div>

        </div>


        {showIngredientModal && (

          <div
            className="ingredient-modal-overlay"
            onMouseDown={() =>
              setShowIngredientModal(
                false
              )
            }
          >

            <div
              className="ingredient-modal"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >

              <div className="ingredient-modal-header">

                <div>

                  <h2>
                    {t("recipesPage.ingredients.addIngredient")}
                  </h2>

                  <p>
                    {t("recipesPage.form.selectProductHelp")}
                  </p>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    setShowIngredientModal(
                      false
                    )
                  }
                >
                  <X size={19} />
                </button>

              </div>


              <form
                onSubmit={
                  addIngredient
                }
              >

                <div className="ingredient-modal-field">

                  <label>
                    {t("recipesPage.ingredients.ingredient")}
                  </label>

                  <select
                    value={
                      ingredientForm.productId
                    }
                    onChange={
                      handleIngredientProduct
                    }
                  >

                    <option value="">
                      {t("recipesPage.ingredients.selectIngredient")}
                    </option>

                    {ingredientProducts.map(
                      (product) => (

                        <option
                          key={
                            product.id
                          }
                          value={
                            product.id
                          }
                        >
                          {product.code} - {product.name}
                        </option>

                      )
                    )}

                  </select>

                </div>


                <div className="ingredient-modal-grid">

                  <div className="ingredient-modal-field">

                    <label>
                      {t("recipesPage.form.type")}
                    </label>

                    <input
                      value={
                        translateType(
                          ingredientForm.type
                        )
                      }
                      readOnly
                    />

                  </div>


                  <div className="ingredient-modal-field">

                    <label>
                      {t("recipesPage.form.unit")}
                    </label>

                    <input
                      value={
                        ingredientForm.unit
                      }
                      readOnly
                    />

                  </div>

                </div>


                <div className="ingredient-modal-field">

                  <label>
                    {t("recipesPage.form.quantity")}
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      ingredientForm.quantity
                    }
                    onChange={(
                      event
                    ) =>
                      setIngredientForm(
                        (previous) => ({
                          ...previous,
                          quantity:
                            event.target.value,
                        })
                      )
                    }
                  />

                </div>


                <div className="ingredient-modal-actions">

                  <button
                    type="button"
                    className="ingredient-cancel-button"
                    onClick={() =>
                      setShowIngredientModal(
                        false
                      )
                    }
                  >
                    {t("common.cancel")}
                  </button>


                  <button
                    type="submit"
                    className="ingredient-save-button"
                  >
                    <Plus size={16} />
                    {t("recipesPage.ingredients.addIngredient")}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      </>
    );
  }


  if (isDetailsMode) {
    const recipe =
      currentRecipe;


    if (!recipe) {
      return (
        <div className="recipe-details-page">

          <button
            type="button"
            className="recipe-details-back"
            onClick={() =>
              navigate(
                "/recipes"
              )
            }
          >
            <ArrowLeft size={17} />
            {t("recipesPage.backToRecipes")}
          </button>

          <div className="details-empty-page">
            <h2>
              {t("recipesPage.details.notFound")}
            </h2>
          </div>

        </div>
      );
    }


    return (
      <div className="recipe-details-page">

        <button
          type="button"
          className="recipe-details-back"
          onClick={() =>
            navigate(
              "/recipes"
            )
          }
        >
          <ArrowLeft size={17} />
          {t("recipesPage.backToRecipes")}
        </button>


        <div className="recipe-details-header">

          <div>

            <span className="recipe-details-id">
              {recipe.recipeCode}
            </span>

            <h1>
              {recipe.productName}
            </h1>

            <p>
              {recipe.description}
            </p>

          </div>


          <div className="recipe-details-status-area">

            <StatusBadge
              status={
                recipe.status
              }
              displayLabel={
                translateStatus(
                  recipe.status
                )
              }
            />


            {canApprove &&
              (
                recipe.status ===
                  "Submitted" ||
                recipe.status ===
                  "Pending Approval" ||
                recipe.status ===
                  "Under Review"
              ) && (

              <div className="recipe-approval-actions">

                <button
                  type="button"
                  className="approve-recipe-button"
                  disabled={
                    approving
                  }
                  onClick={() =>
                    handleApproveRecipe(
                      recipe
                    )
                  }
                >
                  {
                    approving
                      ? t("recipesPage.actions.processing")
                      : t("recipesPage.actions.approve")
                  }
                </button>


                <button
                  type="button"
                  className="reject-recipe-button"
                  disabled={
                    approving
                  }
                  onClick={() =>
                    handleRejectRecipe(
                      recipe
                    )
                  }
                >
                  {t("recipesPage.actions.reject")}
                </button>

              </div>

            )}

          </div>

        </div>


        {recipe.rejectionComment && (

          <div className="create-recipe-error">
            {t("recipesPage.details.rejectionReason")}{" "}
            {recipe.rejectionComment}
          </div>

        )}


        <div className="recipe-details-grid">

          <div>
            <span>
              {t("recipesPage.form.productType")}
            </span>
            <strong>
              {translateType(
                recipe.type
              )}
            </strong>
          </div>


          <div>
            <span>
              {t("recipesPage.form.category")}
            </span>
            <strong>
              {recipe.category}
            </strong>
          </div>


          <div>
            <span>
              {t("recipesPage.form.yield")}
            </span>
            <strong>
              {recipe.yield}{" "}
              {recipe.yieldUnit}
            </strong>
          </div>


          <div>
            <span>
              {t("recipesPage.details.createdBy")}
            </span>
            <strong>
              {
                recipe.requestedBy
                  ?.name ||
                "-"
              }
            </strong>
          </div>

        </div>


        <div className="recipe-details-ingredients">

          <h2>
            {t("recipesPage.ingredients.title")}
          </h2>


          <table>

            <thead>
              <tr>
                <th>{t("recipesPage.ingredients.ingredient")}</th>
                <th>{t("recipesPage.form.type")}</th>
                <th>{t("recipesPage.form.quantity")}</th>
                <th>{t("recipesPage.form.unit")}</th>
              </tr>
            </thead>


            <tbody>

              {recipe.ingredients
                ?.length ? (

                recipe.ingredients.map(
                  (ingredient) => (

                    <tr
                      key={
                        ingredient.id
                      }
                    >
                      <td>
                        {ingredient.name}
                      </td>

                      <td>
                        {translateType(
                          ingredient.type
                        )}
                      </td>

                      <td>
                        {ingredient.quantity}
                      </td>

                      <td>
                        {ingredient.unit}
                      </td>
                    </tr>

                  )
                )

              ) : (

                <tr>
                  <td
                    colSpan="4"
                    className="details-empty"
                  >
                    {t("recipesPage.ingredients.noIngredients")}
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>


        {recipeToReject && (

          <div
            className="recipe-delete-overlay"
            onMouseDown={() => {
              if (!approving) {
                setRecipeToReject(
                  null
                );

                setRejectionReason(
                  ""
                );

                setError("");
              }
            }}
          >

            <div
              className="recipe-delete-modal"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >

              <button
                type="button"
                className="recipe-delete-close"
                aria-label={t("common.close")}
                disabled={
                  approving
                }
                onClick={() => {
                  setRecipeToReject(
                    null
                  );

                  setRejectionReason(
                    ""
                  );

                  setError("");
                }}
              >
                <X size={20} />
              </button>


              <div className="recipe-delete-icon">
                <AlertTriangle
                  size={32}
                />
              </div>


              <h2>
                {t("recipesPage.reject.title")}
              </h2>


              <p>
                {t(
                  "recipesPage.reject.prompt"
                )}{" "}

                <strong>
                  {
                    recipeToReject.productName
                  }
                </strong>

                .
              </p>


              <textarea
                placeholder={t("recipesPage.reject.placeholder")}
                value={
                  rejectionReason
                }
                maxLength={500}
                onChange={(
                  event
                ) => {
                  setRejectionReason(
                    event.target.value
                  );

                  setError("");
                }}
                style={{
                  width: "100%",
                  minHeight: "110px",
                  resize: "vertical",
                  boxSizing: "border-box",
                  marginTop: "14px",
                  padding: "13px 14px",
                  border: "1px solid #e6d8ce",
                  borderRadius: "10px",
                  outline: "none",
                  fontFamily: "inherit",
                  fontSize: "14px",
                  color: "#2f251f",
                  background: "#ffffff",
                }}
              />


              <div
                style={{
                  marginTop: "5px",
                  textAlign: "right",
                  fontSize: "11px",
                  color: "#9a8d84",
                }}
              >
                {
                  rejectionReason.length
                }/500
              </div>


              {error && (
                <div
                  style={{
                    marginTop: "8px",
                    textAlign: "left",
                    fontSize: "12px",
                    color: "#b42318",
                  }}
                >
                  {error}
                </div>
              )}


              <div className="recipe-delete-actions">

                <button
                  type="button"
                  className="recipe-delete-cancel"
                  disabled={
                    approving
                  }
                  onClick={() => {
                    setRecipeToReject(
                      null
                    );

                    setRejectionReason(
                      ""
                    );

                    setError("");
                  }}
                >
                  {t("common.cancel")}
                </button>


                <button
                  type="button"
                  className="recipe-delete-confirm"
                  disabled={
                    approving ||
                    !rejectionReason.trim()
                  }
                  onClick={
                    confirmRejectRecipe
                  }
                >
                  {
                    approving
                      ? t("recipesPage.reject.rejecting")
                      : t("recipesPage.reject.confirmReject")
                  }
                </button>

              </div>

            </div>

          </div>

        )}

      </div>
    );
  }


  return (
    <>

      <div className="recipes-page">

        <div className="recipe-stat-grid">

          <div className="recipe-stat-card">
            <div className="recipe-stat-icon">
              <ChefHat />
            </div>

            <div>
              <span>
                {t("recipesPage.stats.finishedProducts")}
              </span>

              <strong>
                {stats.finished}
              </strong>

              <small>
                {t("recipesPage.stats.recipeProducts")}
              </small>
            </div>
          </div>


          <div className="recipe-stat-card">
            <div className="recipe-stat-icon">
              <Soup />
            </div>

            <div>
              <span>
                {t("productTypes.semiFinished")}
              </span>

              <strong>
                {stats.semiFinished}
              </strong>

              <small>
                {t("recipesPage.stats.recipeProducts")}
              </small>
            </div>
          </div>


          

          <div className="recipe-stat-card">
            <div className="recipe-stat-icon">
              <ClipboardList />
            </div>

            <div>
              <span>
                {t("recipesPage.stats.pendingApproval")}
              </span>

              <strong>
                {
                  stats.pendingApproval
                }
              </strong>

              <small>
                {t("recipesPage.stats.requiresReview")}
              </small>
            </div>
          </div>

        </div>


        <div className="recipes-content-card">

          {error && (
            <div className="create-recipe-error">
              {error}
            </div>
          )}


          <div className="recipe-tabs">

            {tabs.map(
              (tab) => (

                <button
                  type="button"
                  key={tab}
                  className={
                    activeTab ===
                    tab
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setActiveTab(
                      tab
                    );

                    setCurrentPage(
                      1
                    );
                  }}
                >

                  {translateTab(tab)}

                  <span>
                    {
                      countTab(
                        tab
                      )
                    }
                  </span>

                </button>

              )
            )}

          </div>


          <div className="recipes-filters">

            <div className="recipes-search">

              <Search size={17} />

              <input
                type="text"
                placeholder={t("recipesPage.filters.searchPlaceholder")}
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
                {t("recipesPage.filters.allTypes")}
              </option>

              <option value="Finished Product">
                {t("productTypes.finishedProduct")}
              </option>

              <option value="Semi-Finished">
                {t("productTypes.semiFinished")}
              </option>

              <option value="Raw Material">
                {t("productTypes.rawMaterial")}
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
                  event.target.value
                );

                setCurrentPage(
                  1
                );
              }}
            >
              <option value="All">
                {t("recipesPage.filters.allCategories")}
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

          </div>


          <div className="recipes-table-wrapper">

            <table className="recipes-table">

              <thead>
                <tr>
                  <th>{t("recipesPage.table.id")}</th>
                  <th>{t("recipesPage.table.recipeName")}</th>
                  <th>{t("recipesPage.form.type")}</th>
                  <th>{t("recipesPage.form.category")}</th>
                  <th>{t("recipesPage.table.status")}</th>
                  <th>{t("recipesPage.table.requestedBy")}</th>
                  <th>{t("recipesPage.table.lastUpdated")}</th>
                  <th>{t("recipesPage.table.actions")}</th>
                </tr>
              </thead>


              <tbody>

                {visibleRecipes.map(
                  (recipe) => (

                    <tr
                      key={
                        recipe.id
                      }
                    >

                      <td className="recipe-id">
                        {
                          recipe.recipeCode
                        }
                      </td>


                      <td>

                        <div className="recipe-name-cell">

                          <div className="recipe-image-placeholder">
                            <ChefHat
                              size={19}
                            />
                          </div>

                          <div>

                            <strong>
                              {
                                recipe.productName
                              }
                            </strong>

                            <span>
                              {
                                recipe.description ||
                                t("recipesPage.noDescription")
                              }
                            </span>

                          </div>

                        </div>

                      </td>


                      <td>
                        <span className="recipe-type">
                          {
                            translateType(
                              recipe.type
                            )
                          }
                        </span>
                      </td>


                      <td>
                        {
                          recipe.category
                        }
                      </td>


                      <td>
                        <StatusBadge
                          status={
                            recipe.status
                          }
                          displayLabel={
                            translateStatus(
                              recipe.status
                            )
                          }
                        />
                      </td>


                      <td>

                        <div className="requested-by">

                          <strong>
                            {
                              recipe.requestedBy
                                ?.name ||
                              "-"
                            }
                          </strong>

                          <span>
                            {
                              recipe.requestedBy
                                ?.role ||
                              "-"
                            }
                          </span>

                        </div>

                      </td>


                      <td>

                        <div className="updated-date">

                          <span>
                            {
                              recipe.lastUpdated ||
                              "-"
                            }
                          </span>

                          <small>
                            {
                              recipe.updatedTime ||
                              ""
                            }
                          </small>

                        </div>

                      </td>


                      <td>

                        <div className="recipe-actions">

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/recipes/${recipe.id}`
                              )
                            }
                          >
                            <Eye size={16} />
                          </button>


                          {(canEdit ||
                            canDelete) && (

                            <div
                              style={{
                                position:
                                  "relative",
                              }}
                              onMouseDown={(
                                event
                              ) =>
                                event.stopPropagation()
                              }
                            >

                              <button
                                type="button"
                                aria-label={t("recipesPage.table.actionsFor", { name: recipe.productName })}
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
                                  size={16}
                                />
                              </button>


                              {openActionMenu ===
                                recipe.id && (

                                <div
                                  onClick={(
                                    event
                                  ) =>
                                    event.stopPropagation()
                                  }
                                  style={{
                                    position:
                                      "fixed",

                                    top:
                                      actionMenuPosition.top,

                                    left:
                                      actionMenuPosition.left,

                                    minWidth:
                                      "125px",

                                    padding:
                                      "6px",

                                    background:
                                      "#ffffff",

                                    border:
                                      "1px solid #eadfd8",

                                    borderRadius:
                                      "10px",

                                    boxShadow:
                                      "0 10px 28px rgba(81, 60, 41, 0.14)",

                                    zIndex: 50,
                                  }}
                                >

                                  {canEdit && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenu(
                                          null
                                        );

                                        navigate(
                                          `/recipes/${recipe.id}?edit=true`
                                        );
                                      }}
                                      style={{
                                        width:
                                          "100%",

                                        display:
                                          "flex",

                                        alignItems:
                                          "center",

                                        gap:
                                          "8px",

                                        padding:
                                          "9px 10px",

                                        border:
                                          "none",

                                        background:
                                          "transparent",

                                        borderRadius:
                                          "7px",

                                        cursor:
                                          "pointer",

                                        fontSize:
                                          "13px",

                                        textAlign:
                                          "left",

                                        color:
                                          "#513c29",
                                      }}
                                    >
                                      <FileText
                                        size={15}
                                      />
                                      {t("common.edit")}
                                    </button>
                                  )}


                                  {canDelete && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        deleteRecipe(
                                          recipe
                                        )
                                      }
                                      style={{
                                        width:
                                          "100%",

                                        display:
                                          "flex",

                                        alignItems:
                                          "center",

                                        gap:
                                          "8px",

                                        padding:
                                          "9px 10px",

                                        border:
                                          "none",

                                        background:
                                          "transparent",

                                        borderRadius:
                                          "7px",

                                        cursor:
                                          "pointer",

                                        fontSize:
                                          "13px",

                                        textAlign:
                                          "left",

                                        color:
                                          "#b42318",
                                      }}
                                    >
                                      <Trash2
                                        size={15}
                                      />
                                      {t("common.delete")}
                                    </button>
                                  )}

                                </div>

                              )}

                            </div>

                          )}

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>


          {filteredRecipes.length ===
            0 && (

            <div className="no-recipes">
              {t("recipesPage.noRecipesFound")}
            </div>

          )}


          {filteredRecipes.length >
            0 && (

            <div className="recipes-pagination-footer">

              <span>
                {t(
                  "recipesPage.pagination.showing",
                  {
                    from:
                      startIndex + 1,
                    to:
                      Math.min(
                        startIndex +
                          itemsPerPage,
                        filteredRecipes.length
                      ),
                    total:
                      filteredRecipes.length,
                  }
                )}
              </span>


              <div className="recipes-pagination">

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
                  (page) => (

                    <button
                      type="button"
                      key={page}
                      className={
                        currentPage ===
                        page
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setCurrentPage(
                          page
                        )
                      }
                    >
                      {page}
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

          )}

        </div>

      </div>


      {recipeToDelete && (

        <div
          className="recipe-delete-overlay"
          onMouseDown={() =>
            !deleting &&
            setRecipeToDelete(
              null
            )
          }
        >

          <div
            className="recipe-delete-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="recipe-delete-close"
              aria-label={t("common.close")}
              disabled={
                deleting
              }
              onClick={() =>
                setRecipeToDelete(
                  null
                )
              }
            >
              <X size={20} />
            </button>


            <div className="recipe-delete-icon">
              <AlertTriangle
                size={32}
              />
            </div>


            <h2>
              {t("recipesPage.delete.title")}
            </h2>


            <p>
              {t(
                "recipesPage.delete.prompt"
              )}{" "}

              <strong>
                {
                  recipeToDelete.productName
                }
              </strong>

              ?
            </p>


            <div className="recipe-delete-actions">

              <button
                type="button"
                className="recipe-delete-cancel"
                disabled={
                  deleting
                }
                onClick={() =>
                  setRecipeToDelete(
                    null
                  )
                }
              >
                {t("common.cancel")}
              </button>


              <button
                type="button"
                className="recipe-delete-confirm"
                disabled={
                  deleting
                }
                onClick={
                  confirmDeleteRecipe
                }
              >
                {
                  deleting
                    ? t("recipesPage.delete.deleting")
                    : t("recipesPage.delete.confirm")
                }
              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}


export default Recipes;