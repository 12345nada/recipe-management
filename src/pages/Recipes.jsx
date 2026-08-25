import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ChefHat,
  ClipboardList,
  Eye,
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

import StatusBadge
  from "../components/StatusBadge";

import {
  initialRecipes,
  productOptions,
} from "../data/recipesData";

import "../styles/Recipes.css";
const RECIPES_KEY =
  "recipe-management-recipes";

const PRODUCTS_KEY =
  "recipe-management-products";


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


function Recipes() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    id,
  } = useParams();


  const isCreateMode =
    location.pathname ===
    "/recipes/new";

  const isDetailsMode =
    Boolean(id) &&
    id !== "new";


  const [
    recipes,
    setRecipes,
  ] = useState(() => {
    const savedRecipes =
      localStorage.getItem(
        RECIPES_KEY
      );

    if (savedRecipes) {
      try {
        return JSON.parse(
          savedRecipes
        );
      } catch {
        return initialRecipes;
      }
    }

    return initialRecipes;
  });


  const [
    products,
    setProducts,
  ] = useState(() => {
    const savedProducts =
      localStorage.getItem(
        PRODUCTS_KEY
      );

    if (savedProducts) {
      try {
        return JSON.parse(
          savedProducts
        );
      } catch {
        return productOptions;
      }
    }

    return productOptions;
  });


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
    formData,
    setFormData,
  ] = useState({
    productId: "",
    productName: "",
    type: "",
    category: "",
    description: "",
    yield: "",
    yieldUnit: "",
  });


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
  ] = useState({
    productId: "",
    productName: "",
    type: "",
    quantity: "",
    unit: "",
  });


  const [
    error,
    setError,
  ] = useState("");


  const itemsPerPage = 5;


  useEffect(() => {
    localStorage.setItem(
      RECIPES_KEY,
      JSON.stringify(
        recipes
      )
    );
  }, [recipes]);


  useEffect(() => {
    localStorage.setItem(
      PRODUCTS_KEY,
      JSON.stringify(
        products
      )
    );
  }, [products]);


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
              recipe.status ===
                "Pending Approval" ||
              recipe.status ===
                "Submitted" ||
              recipe.status ===
                "Under Review"
          ).length,
      }),
      [recipes]
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
      [products]
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
      [recipes]
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
              recipe.id
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
          recipe.status === tab
      ).length;
    };


  const resetForm = () => {
    setFormData({
      productId: "",
      productName: "",
      type: "",
      category: "",
      description: "",
      yield: "",
      yieldUnit: "",
    });

    setIngredients([]);

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
          product.unit || "",
      });


      setIngredients([]);
      setError("");
    };


  const handleChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;


      setFormData(
        (previous) => ({
          ...previous,

          [name]:
            value,
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
          "Please select a product first."
        );

        return;
      }


      setIngredientForm({
        productId: "",
        productName: "",
        type: "",
        quantity: "",
        unit: "",
      });


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
        setIngredientForm({
          productId: "",
          productName: "",
          type: "",
          quantity: "",
          unit: "",
        });

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
          "Ingredient already added."
        );

        return;
      }


      setIngredients(
        (previous) => [
          ...previous,

          {
            id:
              `${ingredientForm.productId}-${Date.now()}`,

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


  const generateRecipeId =
    () => {
      const year =
        new Date()
          .getFullYear();


      const maxNumber =
        recipes.reduce(
          (
            max,
            recipe
          ) => {
            const number =
              Number(
                recipe.id
                  ?.split("-")
                  .pop()
              ) || 0;


            return Math.max(
              max,
              number
            );
          },
          0
        );


      return `REC-${year}-${String(
        maxNumber + 1
      ).padStart(
        3,
        "0"
      )}`;
    };


  const getDateInfo =
    () => {
      const now =
        new Date();


      return {
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
      };
    };


  const saveRecipe =
    (status) => {
      if (
        !formData.productId
      ) {
        setError(
          "Please select a product."
        );

        return;
      }


      if (
        !formData.yield ||
        Number(
          formData.yield
        ) <= 0
      ) {
        setError(
          "Please enter a valid yield."
        );

        return;
      }


      if (
        status ===
          "Submitted" &&
        ingredients.length ===
          0
      ) {
        setError(
          "Please add at least one ingredient."
        );

        return;
      }


      const newRecipe = {
        id:
          generateRecipeId(),

        productId:
          formData.productId,

        productName:
          formData.productName,

        type:
          formData.type,

        category:
          formData.category,

        description:
          formData.description,

        yield:
          Number(
            formData.yield
          ),

        yieldUnit:
          formData.yieldUnit,

        ingredients,

        status,

        requestedBy: {
          name:
            "Chef Ahmed",

          role:
            "Head Chef",
        },

        assignedTo:
          status ===
          "Submitted"
            ? "Approver"
            : "Head Chef",

        ...getDateInfo(),
      };


      setRecipes(
        (previous) => [
          newRecipe,
          ...previous,
        ]
      );


      setProducts(
        (previous) =>
          previous.map(
            (product) =>
              product.id ===
              formData.productId
                ? {
                    ...product,

                    hasRecipe:
                      "Yes",
                  }
                : product
          )
      );


      resetForm();


      navigate(
        "/recipes"
      );
    };


  if (isCreateMode) {
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
            <ArrowLeft
              size={17}
            />

            Back to Recipes
          </button>


          <div className="create-recipe-heading">

            <h1>
              Create New Recipe
            </h1>

            <p>
              Add recipe information and ingredients.
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
                Recipe Information
              </h2>

              <p>
                Select a product from Product Master.
              </p>

            </div>


            <div className="create-recipe-grid">

              <div className="create-recipe-field">

                <label>
                  Product
                </label>

                <select
                  value={
                    formData.productId
                  }
                  onChange={
                    handleProductChange
                  }
                >
                  <option value="">
                    Select Product
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
                        {product.name}
                      </option>
                    )
                  )}
                </select>

              </div>


              <div className="create-recipe-field">

                <label>
                  Product Type
                </label>

                <input
                  value={
                    formData.type
                  }
                  readOnly
                />

              </div>


              <div className="create-recipe-field">

                <label>
                  Category
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
                  Yield
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
                  placeholder="Example: 40"
                />

              </div>


              <div className="create-recipe-field">

                <label>
                  Yield Unit
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
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter recipe description..."
                />

              </div>

            </div>

          </div>


          <div className="create-recipe-card">

            <div className="ingredients-section-header">

              <div>
                <h2>
                  Ingredients
                </h2>

                <p>
                  Add all products required for this recipe.
                </p>
              </div>


              <button
                type="button"
                className="add-ingredient-button"
                onClick={
                  handleOpenIngredient
                }
              >
                <Plus
                  size={17}
                />

                Add Ingredient
              </button>

            </div>


            <div className="create-ingredients-table-wrapper">

              <table className="create-ingredients-table">

                <thead>
                  <tr>
                    <th>
                      Product
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Quantity
                    </th>

                    <th>
                      Unit
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>


                <tbody>

                  {ingredients.length >
                  0 ? (

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
                            {ingredient.type}
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
                              <Trash2
                                size={16}
                              />
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
                        No ingredients added yet.
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
              onClick={() =>
                navigate(
                  "/recipes"
                )
              }
            >
              Cancel
            </button>


            <button
              type="button"
              className="create-draft-button"
              onClick={() =>
                saveRecipe(
                  "Draft"
                )
              }
            >
              <Save
                size={17}
              />

              Save Draft
            </button>


            <button
              type="button"
              className="create-submit-button"
              onClick={() =>
                saveRecipe(
                  "Submitted"
                )
              }
            >
              <Send
                size={17}
              />

              Submit for Approval
            </button>

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
                    Add Ingredient
                  </h2>

                  <p>
                    Select a product from Product Master.
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
                  <X
                    size={19}
                  />
                </button>

              </div>


              <form
                onSubmit={
                  addIngredient
                }
              >

                <div className="ingredient-modal-field">

                  <label>
                    Ingredient
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
                      Select Ingredient
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
                          {product.name}
                        </option>

                      )
                    )}

                  </select>

                </div>


                <div className="ingredient-modal-grid">

                  <div className="ingredient-modal-field">

                    <label>
                      Type
                    </label>

                    <input
                      value={
                        ingredientForm.type
                      }
                      readOnly
                    />

                  </div>


                  <div className="ingredient-modal-field">

                    <label>
                      Unit
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
                    Quantity
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
                    Cancel
                  </button>


                  <button
                    type="submit"
                    className="ingredient-save-button"
                  >
                    <Plus
                      size={16}
                    />

                    Add Ingredient
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
      recipes.find(
        (item) =>
          item.id === id
      );


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
            <ArrowLeft
              size={17}
            />

            Back to Recipes
          </button>


          <div className="details-empty-page">
            <h2>
              Recipe not found
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
          <ArrowLeft
            size={17}
          />

          Back to Recipes
        </button>


        <div className="recipe-details-header">

          <div>

            <span className="recipe-details-id">
              {recipe.id}
            </span>

            <h1>
              {recipe.productName}
            </h1>

            <p>
              {recipe.description}
            </p>

          </div>


          <StatusBadge
            status={
              recipe.status
            }
          />

        </div>


        <div className="recipe-details-grid">

          <div>
            <span>
              Product Type
            </span>

            <strong>
              {recipe.type}
            </strong>
          </div>


          <div>
            <span>
              Category
            </span>

            <strong>
              {recipe.category}
            </strong>
          </div>


          <div>
            <span>
              Yield
            </span>

            <strong>
              {recipe.yield}{" "}
              {recipe.yieldUnit}
            </strong>
          </div>


          <div>
            <span>
              Created By
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
            Ingredients
          </h2>


          <table>

            <thead>

              <tr>
                <th>
                  Ingredient
                </th>

                <th>
                  Type
                </th>

                <th>
                  Quantity
                </th>

                <th>
                  Unit
                </th>
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
                        {ingredient.type}
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
                    No ingredients.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>
    );
  }


  return (
    <div className="recipes-page">

      <div className="recipe-stat-grid">

        <div className="recipe-stat-card">

          <div className="recipe-stat-icon">
            <ChefHat />
          </div>

          <div>
            <span>
              Finished Products
            </span>

            <strong>
              {stats.finished}
            </strong>

            <small>
              Recipe products
            </small>
          </div>

        </div>


        <div className="recipe-stat-card">

          <div className="recipe-stat-icon">
            <Soup />
          </div>

          <div>
            <span>
              Semi-Finished
            </span>

            <strong>
              {stats.semiFinished}
            </strong>

            <small>
              Recipe products
            </small>
          </div>

        </div>


        <div className="recipe-stat-card">

          <div className="recipe-stat-icon">
            <Leaf />
          </div>

          <div>
            <span>
              Raw Materials
            </span>

            <strong>
              {stats.rawMaterials}
            </strong>

            <small>
              Recipe products
            </small>
          </div>

        </div>


        <div className="recipe-stat-card">

          <div className="recipe-stat-icon">
            <ClipboardList />
          </div>

          <div>
            <span>
              Pending Approval
            </span>

            <strong>
              {stats.pendingApproval}
            </strong>

            <small>
              Requires review
            </small>
          </div>

        </div>

      </div>


      <div className="recipes-content-card">

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
                {tab}

                <span>
                  {countTab(tab)}
                </span>
              </button>

            )
          )}

        </div>


        <div className="recipes-filters">

          <div className="recipes-search">

            <Search
              size={17}
            />

            <input
              type="text"
              placeholder="Search recipes..."
              value={search}
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

        </div>


        <div className="recipes-table-wrapper">

          <table className="recipes-table">

            <thead>

              <tr>
                <th>ID</th>

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
                  Status
                </th>

                <th>
                  Requested By
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

              {visibleRecipes.map(
                (recipe) => (

                  <tr
                    key={
                      recipe.id
                    }
                  >

                    <td className="recipe-id">
                      {recipe.id}
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
                            {recipe.productName}
                          </strong>

                          <span>
                            {
                              recipe.description ||
                              "No description"
                            }
                          </span>

                        </div>

                      </div>

                    </td>


                    <td>

                      <span className="recipe-type">
                        {recipe.type}
                      </span>

                    </td>


                    <td>
                      {recipe.category}
                    </td>


                    <td>

                      <StatusBadge
                        status={
                          recipe.status
                        }
                      />

                    </td>


                    <td>

                      <div className="requested-by">

                        <strong>
                          {
                            recipe.requestedBy
                              ?.name ||
                            recipe.requestedBy ||
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
                          <Eye
                            size={16}
                          />
                        </button>


                        <button
                          type="button"
                        >
                          <MoreVertical
                            size={16}
                          />
                        </button>

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
            No recipes found.
          </div>

        )}


        {filteredRecipes.length >
          0 && (

          <div className="recipes-pagination-footer">

            <span>
              Showing{" "}
              {startIndex + 1}{" "}
              to{" "}
              {Math.min(
                startIndex +
                  itemsPerPage,
                filteredRecipes.length
              )}{" "}
              of{" "}
              {filteredRecipes.length}{" "}
              recipes
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
                    (
                      previous
                    ) =>
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
                (
                  page
                ) => (

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
                    (
                      previous
                    ) =>
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
  );
}


export default Recipes;