import {
  useEffect,
  useMemo,
  useRef,
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
  Pencil,
  Plus,
  Save,
  Search,
  Send,
  Soup,
  Trash2,
  X,
} from "lucide-react";

import {
  Navigate,
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
  isRecipeDeletable,
  isRecipeEditable,
  REVIEW_RECIPE_STATUSES,
  rejectRecipe,
  removeRecipe,
  subscribeToRecipes,
  updateRecipe,
  withdrawSubmittedRecipe,
} from "../services/recipeService";

import "../styles/Recipes.css";
import { useProductTypes } from "../context/ProductTypesContext";
import ProductTypesReadiness from "../components/ProductTypesReadiness";


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


  const { types: productTypes, label: translateType, allowsRecipes, allowsIngredient, ready: typesReady, loading: typesLoading, error: typesError, isReady: typesAreReady } = useProductTypes();


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

  const [recipeToWithdraw, setRecipeToWithdraw] = useState(null);


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
  ] = useState(
    () =>
      new URLSearchParams(
        location.search
      ).get("search") ||
      ""
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
    currentPage,
    setCurrentPage,
  ] = useState(1);


  const [
    openActionMenu,
    setOpenActionMenu,
  ] = useState(null);


  const [
    actionMenuAnchor,
    setActionMenuAnchor,
  ] = useState(null);


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

  const [ingredientSearch, setIngredientSearch] = useState("");
  const [ingredientSearchOpen, setIngredientSearchOpen] = useState(false);
  const [activeIngredientIndex, setActiveIngredientIndex] = useState(-1);
  const [editingIngredientId, setEditingIngredientId] = useState(null);


  const [
    error,
    setError,
  ] = useState("");

  const [recipeFieldError, setRecipeFieldError] = useState(null);
  const recipeProductRef = useRef(null);
  const recipeYieldRef = useRef(null);
  const recipeIngredientsRef = useRef(null);

  useEffect(() => {
    if (!recipeFieldError) return;

    const target = {
      product: recipeProductRef.current,
      yield: recipeYieldRef.current,
      ingredients: recipeIngredientsRef.current,
    }[recipeFieldError.field];

    if (!target) return;

    target.focus({ preventScroll: true });
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "center",
    });
  }, [recipeFieldError]);

  useEffect(() => {
    if (!recipeFieldError) return;

    const corrected =
      (recipeFieldError.field === "product" && Boolean(formData.productId)) ||
      (recipeFieldError.field === "yield" &&
        Boolean(formData.yield) &&
        !(Number(formData.yield) <= 0)) ||
      (recipeFieldError.field === "ingredients" && ingredients.length > 0);

    if (corrected) setRecipeFieldError(null);
  }, [recipeFieldError, formData.productId, formData.yield, ingredients]);


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
    const params = new URLSearchParams(location.search);
    const searchValue =
      params.get("search") ||
      "";

    const statusValue = params.get("status");
    const status = [...tabs, "Under Review"].find(
      (tab) => tab.toLowerCase().replaceAll(" ", "-") === statusValue
    );
    if (status) {
      setActiveTab(status);
    }

    const type = params.get("type");
    if (productTypes.some((item) => item.type_key === type)) {
      setTypeFilter(type);
    }

    setSearch(
      searchValue
    );

    setCurrentPage(
      1
    );
  }, [
    location.search,
    productTypes,
  ]);



  useEffect(() => {
    const handleHeaderSearch =
      (event) => {
        if (
          event.detail?.path !==
          "/recipes"
        ) {
          return;
        }

        setSearch(
          event.detail?.value ||
          ""
        );

        setCurrentPage(
          1
        );
      };

    window.addEventListener(
      "header-page-search",
      handleHeaderSearch
    );

    return () => {
      window.removeEventListener(
        "header-page-search",
        handleHeaderSearch
      );
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
              REVIEW_RECIPE_STATUSES.includes(recipe.status)
          ).length,
      }),
      [
        recipes,
      ]
    );


  const recipeProducts =
    useMemo(
      () => {
        const usedProductIds =
          new Set(
            recipes
              .filter(
                (recipe) =>
                  !isEditMode ||
                  recipe.id !==
                    currentRecipe?.id
              )
              .map(
                (recipe) =>
                  recipe.productId
              )
              .filter(Boolean)
          );

        return products.filter(
          (product) =>
            allowsRecipes(product.type) &&
            !usedProductIds.has(
              product.id
            )
        );
      },
      [
        products,
        recipes,
        isEditMode,
        currentRecipe?.id,
        allowsRecipes,
      ]
    );


  const ingredientProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.id !==
              formData.productId &&
            allowsIngredient(product.type)
        ),
      [
        products,
        formData.productId,
        allowsIngredient,
      ]
    );


  const filteredIngredientProducts = ingredientProducts.filter((product) => {
    const search = ingredientSearch.trim().toLocaleLowerCase();
    return (
      product.name.toLocaleLowerCase().includes(search) ||
      (product.code || "").toLocaleLowerCase().includes(search)
    );
  });

  const selectIngredientSearchResult = (product) => {
    handleIngredientProduct({ target: { value: product.id } });
    setIngredientSearch(`${product.code} - ${product.name}`);
    setIngredientSearchOpen(false);
    setActiveIngredientIndex(-1);
  };

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
      if (!typesAreReady()) return;
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
      if (!typesAreReady()) return;
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

      setEditingIngredientId(null);
      setIngredientSearch("");
      setIngredientSearchOpen(false);
      setActiveIngredientIndex(-1);

      setShowIngredientModal(
        true
      );
    };


  const handleEditIngredient = (ingredient) => {
      if (!typesAreReady()) return;
    if (
      saving ||
      (isEditMode && (!canEdit || !isRecipeEditable(currentRecipe))) ||
      (isCreateMode && !canAdd)
    ) {
      return;
    }

    const product = products.find((item) => item.id === ingredient.productId);
    setEditingIngredientId(ingredient.id);
    setIngredientForm({
      productId: ingredient.productId,
      productName: ingredient.name,
      type: product?.type ?? ingredient.type,
      unit: product?.unit ?? ingredient.unit,
      quantity: String(ingredient.quantity),
    });
    setIngredientSearch(
      product ? `${product.code} - ${product.name}` : ingredient.name
    );
    setIngredientSearchOpen(false);
    setActiveIngredientIndex(-1);
    setShowIngredientModal(true);
  };

  const handleIngredientProduct =
    (event) => {
      if (!typesAreReady()) return;
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
      if (!typesAreReady()) return;

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
            ingredient.id !== editingIngredientId &&
            ingredient.productId ===
            ingredientForm.productId
        );

      if (exists) {
        alert(
          t("recipesPage.errors.ingredientAlreadyAdded")
        );

        return;
      }

      if (editingIngredientId !== null) {
        setIngredients((previous) =>
          previous.map((ingredient) =>
            ingredient.id === editingIngredientId
              ? {
                  ...ingredient,
                  productId: ingredientForm.productId,
                  name: ingredientForm.productName,
                  type: ingredientForm.type,
                  quantity,
                  unit: ingredientForm.unit,
                }
              : ingredient
          )
        );
        setEditingIngredientId(null);
        setShowIngredientModal(false);
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


  const showRecipeValidationError = (saveError) => {
    const field = {
      "Please select a product.": "product",
      "Please enter a valid yield.": "yield",
      "Please add at least one ingredient.": "ingredients",
    }[saveError?.message];

    if (!field) return false;

    setError("");
    setRecipeFieldError({ field });
    return true;
  };

  const saveRecipe =
    async (status) => {
      if (!typesAreReady()) return;
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

        if (!showRecipeValidationError(saveError)) {
          setError(
            saveError?.message ||
              t("recipesPage.errors.couldNotSave")
          );
        }
      } finally {
        setSaving(false);
      }
    };


  const saveRecipeChanges =
    async (
      newStatus = null
    ) => {
      if (!typesAreReady()) return;
      if (
        saving ||
        !canEdit ||
        !isRecipeEditable(currentRecipe) ||
        (currentRecipe.status === "Approved" && newStatus !== "Submitted")
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

        if (!showRecipeValidationError(saveError)) {
          setError(
            saveError?.message ||
              t("recipesPage.errors.couldNotUpdate")
          );
        }
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


      setActionMenuAnchor(clickEvent.currentTarget);


      setOpenActionMenu(
        recipeId
      );
    };


  const deleteRecipe =
    (recipe) => {
      if (!canDelete || !isRecipeDeletable(recipe)) {
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
        !canDelete ||
        !isRecipeDeletable(recipes.find((recipe) => recipe.id === recipeToDelete.id)) ||
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
        !canApprove ||
        !REVIEW_RECIPE_STATUSES.includes(recipe?.status)
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
        !canApprove ||
        !REVIEW_RECIPE_STATUSES.includes(recipe?.status)
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
        !canApprove ||
        !REVIEW_RECIPE_STATUSES.includes(
          recipes.find((recipe) => recipe.id === recipeToReject.id)?.status
        ) ||
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


  const confirmWithdrawRecipe = async () => {
    if (saving || !canEdit || recipeToWithdraw?.status !== "Submitted") {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const withdrawnRecipe = await withdrawSubmittedRecipe({
        recipeId: recipeToWithdraw.id,
        expectedUpdatedAt: recipeToWithdraw.updatedAt,
      });

      setRecipes((previousRecipes) =>
        previousRecipes.map((recipe) =>
          recipe.id === withdrawnRecipe.id
            ? {
                ...recipe,
                status: withdrawnRecipe.status,
                updatedAt: withdrawnRecipe.updated_at,
              }
            : recipe
        )
      );
      setRecipeToWithdraw(null);
      navigate(`/recipes/${withdrawnRecipe.id}?edit=true`);
    } catch (error) {
      setError(error.message || "Unable to reopen this recipe.");
    } finally {
      setSaving(false);
    }
  };

  if (!typesReady || typesLoading || typesError) return <ProductTypesReadiness />;

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


  if (isEditMode && (!canEdit || !isRecipeEditable(currentRecipe))) {
    return <Navigate to={currentRecipe ? `/recipes/${id}` : "/recipes"} replace />;
  }

  if (isCreateMode && !canAdd) {
    return <Navigate to="/recipes" replace />;
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


            <div className="create-recipe-grid recipe-information-grid">

              <div className="create-recipe-field">

                <label>
                  {t("recipesPage.form.product")}
                  {" "}<span className="recipe-required-marker" aria-hidden="true">*</span>
                </label>

                <select
                  ref={recipeProductRef}
                  aria-required="true"
                  aria-invalid={recipeFieldError?.field === "product"}
                  aria-describedby={
                    recipeFieldError?.field === "product"
                      ? "recipe-product-error"
                      : undefined
                  }
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

                {recipeFieldError?.field === "product" && (
                  <p id="recipe-product-error" className="recipe-field-error" role="alert">
                    {t("recipesPage.validation.product")}
                  </p>
                )}

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
                  {" "}<span className="recipe-required-marker" aria-hidden="true">*</span>
                </label>

                <input
                  ref={recipeYieldRef}
                  aria-required="true"
                  aria-invalid={recipeFieldError?.field === "yield"}
                  aria-describedby={
                    recipeFieldError?.field === "yield"
                      ? "recipe-yield-error"
                      : undefined
                  }
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

                {recipeFieldError?.field === "yield" && (
                  <p id="recipe-yield-error" className="recipe-field-error" role="alert">
                    {t("recipesPage.validation.yield")}
                  </p>
                )}

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


          <div
            className="create-recipe-card"
            ref={recipeIngredientsRef}
            tabIndex={-1}
            data-recipe-invalid={recipeFieldError?.field === "ingredients"}
            aria-describedby={
              recipeFieldError?.field === "ingredients"
                ? "recipe-ingredients-error"
                : undefined
            }
          >

            <div className="ingredients-section-header">

              <div>

                <h2>
                  {t("recipesPage.ingredients.title")}
                  {" "}
                  <span
                    className="recipe-required-marker"
                    aria-hidden="true"
                    title={t("recipesPage.validation.ingredientsRequiredOnSubmit")}
                  >
                    *
                  </span>
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


            {recipeFieldError?.field === "ingredients" && (
              <p id="recipe-ingredients-error" className="recipe-field-error" role="alert">
                {t("recipesPage.validation.ingredients")}
              </p>
            )}

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

                            <div className="ingredient-row-actions">
                              <button
                                type="button"
                                className="edit-ingredient-button"
                                aria-label={t("recipesPage.ingredients.editIngredient")}
                                title={t("recipesPage.ingredients.editIngredient")}
                                onClick={() => handleEditIngredient(ingredient)}
                              >
                                <Pencil size={16} />
                              </button>
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
                            </div>

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

                {currentRecipe.status !== "Approved" && (
                <button
                  type="button"
                  className="create-draft-button"
                  disabled={
                    saving || currentRecipe.status === "Approved"
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
                )}


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


                {currentRecipe.status !== "Approved" && (
                <button
                  type="button"
                  className="create-submit-button"
                  disabled={
                    saving || currentRecipe.status === "Approved"
                  }
                  onClick={() =>
                    saveRecipeChanges()
                  }
                >
                  <Save size={17} />
                  {t("recipesPage.actions.saveChanges")}
                </button>
                )}

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
                    {t(
                      editingIngredientId !== null
                        ? "recipesPage.ingredients.editIngredient"
                        : "recipesPage.ingredients.addIngredient"
                    )}
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

                  <label htmlFor="ingredient-search">
                    {t("recipesPage.ingredients.ingredient")}
                  </label>

                  <div className="ingredient-search">
                    <input
                      id="ingredient-search"
                      role="combobox"
                      autoComplete="off"
                      aria-autocomplete="list"
                      aria-expanded={ingredientSearchOpen}
                      aria-controls="ingredient-search-results"
                      aria-activedescendant={
                        ingredientSearchOpen && activeIngredientIndex >= 0
                          ? `ingredient-option-${filteredIngredientProducts[activeIngredientIndex]?.id}`
                          : undefined
                      }
                      placeholder={t("recipesPage.ingredients.selectIngredient")}
                      value={ingredientSearch}
                      onFocus={() => {
                        setIngredientSearchOpen(true);
                        setActiveIngredientIndex(-1);
                      }}
                      onBlur={() => setIngredientSearchOpen(false)}
                      onChange={(event) => {
                        setIngredientSearch(event.target.value);
                        setIngredientSearchOpen(true);
                        setActiveIngredientIndex(-1);
                        setIngredientForm((previous) => ({
                          ...previous,
                          productId: "",
                          productName: "",
                          type: "",
                          unit: "",
                        }));
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                          event.preventDefault();
                          setIngredientSearchOpen(true);
                          setActiveIngredientIndex((previous) =>
                            event.key === "ArrowDown"
                              ? Math.min(previous + 1, filteredIngredientProducts.length - 1)
                              : Math.max(previous - 1, -1)
                          );
                        } else if (event.key === "Enter") {
                          event.preventDefault();
                          const product = filteredIngredientProducts[activeIngredientIndex];
                          if (ingredientSearchOpen && product) {
                            selectIngredientSearchResult(product);
                          }
                        } else if (event.key === "Escape") {
                          event.preventDefault();
                          setIngredientSearchOpen(false);
                        }
                      }}
                    />

                    {ingredientSearchOpen && (
                      <div
                        id="ingredient-search-results"
                        role="listbox"
                        aria-label={t("recipesPage.ingredients.ingredient")}
                        className="ingredient-search-results"
                      >
                        {filteredIngredientProducts.length ? (
                          filteredIngredientProducts.map((product, index) => (
                            <button
                              key={product.id}
                              id={`ingredient-option-${product.id}`}
                              type="button"
                              role="option"
                              tabIndex={-1}
                              aria-selected={ingredientForm.productId === product.id}
                              className={
                                index === activeIngredientIndex
                                  ? "ingredient-search-option is-active"
                                  : "ingredient-search-option"
                              }
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => selectIngredientSearchResult(product)}
                            >
                              {product.code} - {product.name}
                            </button>
                          ))
                        ) : (
                          <div className="ingredient-search-empty" role="status">
                            {t("recipesPage.ingredients.noIngredients")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

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
                    {editingIngredientId !== null
                      ? <Save size={16} />
                      : <Plus size={16} />}
                    {t(
                      editingIngredientId !== null
                        ? "recipesPage.ingredients.updateIngredient"
                        : "recipesPage.ingredients.addIngredient"
                    )}
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
              REVIEW_RECIPE_STATUSES.includes(recipe.status) && (

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
                {translateType("Finished Product")}
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
                {translateType("Semi-Finished")}
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

              {productTypes.map((item) => <option key={item.type_key} value={item.type_key}>{translateType(item.type_key)}</option>)}
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


                          {(((isRecipeEditable(recipe) || recipe.status === "Submitted") && canEdit) ||
                            (isRecipeDeletable(recipe) && canDelete)) && (

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

                                <AnchoredActionMenu
                                  anchor={actionMenuAnchor}
                                  onClick={(
                                    event
                                  ) =>
                                    event.stopPropagation()
                                  }
                                  style={{
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
                                      disabled={saving}
                                      onClick={() => {
                                        if (
                                          saving ||
                                          !canEdit ||
                                          (!isRecipeEditable(recipe) && recipe.status !== "Submitted")
                                        ) return;
                                        setOpenActionMenu(
                                          null
                                        );

                                        if (recipe.status === "Submitted") {
                                          setError("");
                                          setRecipeToWithdraw(recipe);
                                          return;
                                        }

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


                                  {canDelete && isRecipeDeletable(recipe) && (
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

                                </AnchoredActionMenu>

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


      {recipeToWithdraw && (
        <div
          className="recipe-delete-overlay"
          onMouseDown={() => !saving && setRecipeToWithdraw(null)}
        >
          <div
            className="recipe-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recipe-withdraw-title"
            aria-describedby="recipe-withdraw-message"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="recipe-delete-close"
              aria-label={t("common.close")}
              disabled={saving}
              onClick={() => setRecipeToWithdraw(null)}
            >
              <X size={20} />
            </button>

            <div className="recipe-delete-icon">
              <AlertTriangle size={32} />
            </div>

            <h2 id="recipe-withdraw-title">Edit submitted recipe?</h2>
            <p id="recipe-withdraw-message">
              This will return the recipe to Draft so you can make changes.
            </p>

            {error && <div className="create-recipe-error">{error}</div>}

            <div className="recipe-delete-actions">
              <button
                type="button"
                className="recipe-delete-cancel"
                disabled={saving}
                onClick={() => setRecipeToWithdraw(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="recipe-delete-confirm"
                disabled={saving}
                onClick={confirmWithdrawRecipe}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

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
                {t("recipesPage.delete.cancel")}
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
import AnchoredActionMenu from "../components/AnchoredActionMenu";
