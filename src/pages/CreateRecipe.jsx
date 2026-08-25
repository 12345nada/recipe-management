import {
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useProducts,
} from "../context/ProductsContext";

import {
  useRecipes,
} from "../context/RecipesContext";

import "../styles/CreateRecipe.css";


function CreateRecipe() {
  const navigate =
    useNavigate();


  const {
    products,
    markProductHasRecipe,
  } = useProducts();


  const {
    addRecipe,
  } = useRecipes();


  /* =========================================
     RECIPE FORM
  ========================================= */

  const [
    formData,
    setFormData,
  ] = useState({
    productId: "",
    productName: "",
    type: "",
    category: "",
    yield: "",
    yieldUnit: "",
    description: "",
  });


  /* =========================================
     INGREDIENTS
  ========================================= */

  const [
    ingredients,
    setIngredients,
  ] = useState([]);


  /* =========================================
     INGREDIENT MODAL
  ========================================= */

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


  /* =========================================
     VALIDATION
  ========================================= */

  const [
    error,
    setError,
  ] = useState("");


  /* =========================================
     PRODUCTS THAT CAN HAVE RECIPES
  ========================================= */

  const recipeProducts =
    useMemo(() => {
      return products.filter(
        (product) =>
          product.type ===
            "Finished Product" ||
          product.type ===
            "Semi-Finished"
      );
    }, [
      products,
    ]);


  /* =========================================
     PRODUCTS THAT CAN BE INGREDIENTS
  ========================================= */

  const ingredientProducts =
    useMemo(() => {
      return products.filter(
        (product) => {

          /* DON'T ALLOW PRODUCT
             TO CONTAIN ITSELF */

          if (
            product.id ===
            formData.productId
          ) {
            return false;
          }


          return (
            product.type ===
              "Raw Material" ||
            product.type ===
              "Semi-Finished" ||
            product.type ===
              "Packaging"
          );
        }
      );
    }, [
      products,
      formData.productId,
    ]);


  /* =========================================
     SELECT MAIN PRODUCT
  ========================================= */

  const handleProductChange =
    (event) => {

      const productId =
        event.target.value;


      const selectedProduct =
        products.find(
          (product) =>
            product.id ===
            productId
        );


      if (
        !selectedProduct
      ) {
        setFormData({
          productId: "",
          productName: "",
          type: "",
          category: "",
          yield: "",
          yieldUnit: "",
          description: "",
        });

        setIngredients([]);

        return;
      }


      setFormData(
        (previous) => ({
          ...previous,

          productId:
            selectedProduct.id,

          productName:
            selectedProduct.name,

          type:
            selectedProduct.type,

          category:
            selectedProduct.category,

          yieldUnit:
            selectedProduct.unit,

          description:
            selectedProduct.description ||
            previous.description,
        })
      );


      /*
        لو غيرنا المنتج الرئيسي
        نمسح ingredients القديمة
        حتى مايبقاش recipe غلط.
      */

      setIngredients([]);

      setError("");
    };


  /* =========================================
     NORMAL FORM CHANGE
  ========================================= */

  const handleFormChange =
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


  /* =========================================
     OPEN INGREDIENT MODAL
  ========================================= */

  const handleOpenIngredientModal =
    () => {

      if (
        !formData.productId
      ) {
        setError(
          "Please select the recipe product first."
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

      setError("");
    };


  /* =========================================
     SELECT INGREDIENT
  ========================================= */

  const handleIngredientProductChange =
    (event) => {

      const productId =
        event.target.value;


      const product =
        products.find(
          (item) =>
            item.id ===
            productId
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


  /* =========================================
     INGREDIENT QUANTITY
  ========================================= */

  const handleIngredientQuantityChange =
    (event) => {

      setIngredientForm(
        (previous) => ({
          ...previous,

          quantity:
            event.target.value,
        })
      );
    };


  /* =========================================
     ADD INGREDIENT
  ========================================= */

  const handleAddIngredient =
    (event) => {

      event.preventDefault();


      if (
        !ingredientForm.productId
      ) {
        return;
      }


      const quantity =
        Number(
          ingredientForm.quantity
        );


      if (
        !quantity ||
        quantity <= 0
      ) {
        return;
      }


      /*
        نفس ingredient مايتضافش
        مرتين بالغلط.
      */

      const alreadyExists =
        ingredients.some(
          (ingredient) =>
            ingredient.productId ===
            ingredientForm.productId
        );


      if (alreadyExists) {

        alert(
          "This ingredient has already been added."
        );

        return;
      }


      const newIngredient = {
        id:
          `${ingredientForm.productId}-${Date.now()}`,

        productId:
          ingredientForm.productId,

        productName:
          ingredientForm.productName,

        type:
          ingredientForm.type,

        quantity,

        unit:
          ingredientForm.unit,
      };


      setIngredients(
        (previous) => [
          ...previous,
          newIngredient,
        ]
      );


      setShowIngredientModal(
        false
      );


      setIngredientForm({
        productId: "",
        productName: "",
        type: "",
        quantity: "",
        unit: "",
      });
    };


  /* =========================================
     DELETE INGREDIENT
  ========================================= */

  const handleDeleteIngredient =
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


  /* =========================================
     GENERATE RECIPE ID
  ========================================= */

  const generateRecipeId =
    () => {

      return `REC-${new Date().getFullYear()}-${String(
        Date.now()
      ).slice(-6)}`;
    };


  /* =========================================
     VALIDATE RECIPE
  ========================================= */

  const validateRecipe =
    (
      submitting
    ) => {

      if (
        !formData.productId
      ) {
        setError(
          "Please select a product."
        );

        return false;
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

        return false;
      }


      /*
        Draft ينفع يتسجل
        قبل إضافة ingredients.

        Submit لازم يكون فيه
        ingredient واحد على الأقل.
      */

      if (
        submitting &&
        ingredients.length === 0
      ) {
        setError(
          "Add at least one ingredient before submitting for approval."
        );

        return false;
      }


      setError("");

      return true;
    };


  /* =========================================
     BUILD RECIPE
  ========================================= */

  const buildRecipe =
    (
      status
    ) => {

      const now =
        new Date();


      return {
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
          formData.description.trim(),

        yield:
          Number(
            formData.yield
          ),

        yieldUnit:
          formData.yieldUnit,

        ingredients:
          ingredients.map(
            (ingredient) => ({
              ...ingredient,
            })
          ),

        status,

        requestedBy:
          "Chef Ahmed",

        assignedTo:
          status ===
          "Submitted"
            ? "Approver"
            : "Head Chef",

        createdBy:
          "Chef Ahmed",

        createdAt:
          now.toISOString(),

        createdDate:
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

        submittedAt:
          status ===
          "Submitted"
            ? now.toISOString()
            : null,

        approvalComment:
          "",

        erpReference:
          "",

        erpEntryDate:
          null,
      };
    };


  /* =========================================
     SAVE DRAFT
  ========================================= */

  const handleSaveDraft =
    () => {

      if (
        !validateRecipe(
          false
        )
      ) {
        return;
      }


      const recipe =
        buildRecipe(
          "Draft"
        );


      addRecipe(
        recipe
      );


      /*
        بمجرد إنشاء Recipe
        المنتج بقى عنده Recipe.
      */

      markProductHasRecipe(
        formData.productId
      );


      navigate(
        "/recipes"
      );
    };


  /* =========================================
     SUBMIT
  ========================================= */

  const handleSubmit =
    () => {

      if (
        !validateRecipe(
          true
        )
      ) {
        return;
      }


      const recipe =
        buildRecipe(
          "Submitted"
        );


      addRecipe(
        recipe
      );


      markProductHasRecipe(
        formData.productId
      );


      navigate(
        "/recipes"
      );
    };


  return (
    <>
      <div className="create-recipe-page">


        {/* BACK */}

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


        {/* TITLE */}

        <div className="create-recipe-heading">

          <h1>
            Create New Recipe
          </h1>

          <p>
            Add recipe information and ingredients.
          </p>

        </div>


        {/* ERROR */}

        {error && (

          <div className="create-recipe-error">
            {error}
          </div>

        )}


        {/* =====================================
            RECIPE INFORMATION
        ===================================== */}

        <section className="create-recipe-card">

          <div className="create-recipe-section-heading">

            <h2>
              Recipe Information
            </h2>

            <p>
              Select a product from Product Master.
              Product information will be filled automatically.
            </p>

          </div>


          <div className="create-recipe-grid">


            {/* PRODUCT */}

            <div className="create-recipe-field">

              <label>
                Product
                <span>*</span>
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
                      {product.id} - {product.name}
                    </option>

                  )
                )}

              </select>

            </div>


            {/* PRODUCT TYPE */}

            <div className="create-recipe-field">

              <label>
                Product Type
              </label>

              <input
                type="text"
                value={
                  formData.type
                }
                placeholder="Product type"
                readOnly
              />

            </div>


            {/* CATEGORY */}

            <div className="create-recipe-field">

              <label>
                Category
              </label>

              <input
                type="text"
                value={
                  formData.category
                }
                placeholder="Category"
                readOnly
              />

            </div>


            {/* YIELD */}

            <div className="create-recipe-field">

              <label>
                Yield
                <span>*</span>
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                name="yield"
                value={
                  formData.yield
                }
                onChange={
                  handleFormChange
                }
                placeholder="Example: 40"
              />

            </div>


            {/* YIELD UNIT */}

            <div className="create-recipe-field">

              <label>
                Yield Unit
              </label>

              <input
                type="text"
                value={
                  formData.yieldUnit
                }
                placeholder="Unit"
                readOnly
              />

            </div>


            {/* DESCRIPTION */}

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
                  handleFormChange
                }
                placeholder="Enter recipe description..."
              />

            </div>

          </div>

        </section>


        {/* =====================================
            INGREDIENTS
        ===================================== */}

        <section className="create-recipe-card">

          <div className="ingredients-section-header">

            <div>

              <h2>
                Ingredients
              </h2>

              <p>
                Select ingredients directly from Product Master.
              </p>

            </div>


            <button
              type="button"
              className="add-ingredient-button"
              onClick={
                handleOpenIngredientModal
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

                          <div className="ingredient-product-name">

                            <strong>
                              {
                                ingredient.productName
                              }
                            </strong>

                            <small>
                              {
                                ingredient.productId
                              }
                            </small>

                          </div>

                        </td>


                        <td>
                          {
                            ingredient.type
                          }
                        </td>


                        <td>
                          {
                            ingredient.quantity
                          }
                        </td>


                        <td>
                          {
                            ingredient.unit
                          }
                        </td>


                        <td>

                          <button
                            type="button"
                            className="delete-ingredient-button"
                            onClick={() =>
                              handleDeleteIngredient(
                                ingredient.id
                              )
                            }
                            title="Remove ingredient"
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

        </section>


        {/* =====================================
            ACTIONS
        ===================================== */}

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
            onClick={
              handleSaveDraft
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
            onClick={
              handleSubmit
            }
          >
            <Send
              size={17}
            />

            Submit for Approval
          </button>

        </div>

      </div>


      {/* =====================================
          ADD INGREDIENT MODAL
      ===================================== */}

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
                handleAddIngredient
              }
            >

              <div className="ingredient-modal-field">

                <label>
                  Product
                  <span>*</span>
                </label>


                <select
                  value={
                    ingredientForm.productId
                  }
                  onChange={
                    handleIngredientProductChange
                  }
                  required
                >

                  <option value="">
                    Select ingredient
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
                        {product.id} - {product.name}
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
                    placeholder="Product type"
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
                    placeholder="Unit"
                    readOnly
                  />

                </div>

              </div>


              <div className="ingredient-modal-field">

                <label>
                  Quantity
                  <span>*</span>
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    ingredientForm.quantity
                  }
                  onChange={
                    handleIngredientQuantityChange
                  }
                  placeholder="Enter quantity"
                  required
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


export default CreateRecipe;