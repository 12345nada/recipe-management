import {
  useState,
} from "react";

import {
  Save,
  Send,
} from "lucide-react";

import {
  productOptions,
} from "../data/recipesData";

import IngredientsTable
  from "./IngredientsTable";

import AddIngredientModal
  from "./AddIngredientModal";


function RecipeForm({
  onSaveDraft,
  onSubmitRecipe,
  onCancel,
}) {
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


  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previousData) => ({
        ...previousData,
        [name]: value,
      })
    );
  };


  const handleProductChange = (
    event
  ) => {
    const product =
      productOptions.find(
        (item) =>
          item.id ===
          event.target.value
      );

    if (!product) {
      setFormData(
        (previousData) => ({
          ...previousData,
          productId: "",
          productName: "",
          type: "",
          category: "",
          yieldUnit: "",
        })
      );

      return;
    }

    setFormData(
      (previousData) => ({
        ...previousData,

        productId:
          product.id,

        productName:
          product.name,

        type:
          product.type,

        category:
          product.category,

        yieldUnit:
          product.unit,
      })
    );
  };


  const addIngredient = (
    ingredient
  ) => {
    setIngredients(
      (previousIngredients) => [
        ...previousIngredients,
        ingredient,
      ]
    );
  };


  const removeIngredient = (
    ingredientId
  ) => {
    setIngredients(
      (previousIngredients) =>
        previousIngredients.filter(
          (ingredient) =>
            ingredient.id !==
            ingredientId
        )
    );
  };


  const getRecipeData = () => ({
    ...formData,

    yield:
      Number(
        formData.yield
      ),

    ingredients,

    requestedBy: {
      name: "Chef Ahmed",
      role: "Head Chef",
    },
  });


  return (
    <>

      <div className="recipe-form-card">

        <div className="recipe-form-section-title">
          <h2>
            Recipe Information
          </h2>

          <p>
            Enter the main information
            for the recipe.
          </p>
        </div>


        <div className="recipe-form-grid">

          <div className="recipe-field">

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

              {productOptions.map(
                (product) => (
                  <option
                    key={
                      product.id
                    }
                    value={
                      product.id
                    }
                  >
                    {
                      product.name
                    }
                  </option>
                )
              )}

            </select>

          </div>


          <div className="recipe-field">

            <label>
              Product Type
            </label>

            <input
              value={
                formData.type
              }
              placeholder="Product type"
              disabled
            />

          </div>


          <div className="recipe-field">

            <label>
              Category
            </label>

            <input
              value={
                formData.category
              }
              placeholder="Category"
              disabled
            />

          </div>


          <div className="recipe-field">

            <label>
              Yield
            </label>

            <input
              type="number"
              name="yield"
              min="0"
              step="0.01"
              placeholder="Example: 40"
              value={
                formData.yield
              }
              onChange={
                handleChange
              }
            />

          </div>


          <div className="recipe-field">

            <label>
              Yield Unit
            </label>

            <select
              name="yieldUnit"
              value={
                formData.yieldUnit
              }
              onChange={
                handleChange
              }
            >
              <option value="">
                Select Unit
              </option>

              <option value="Pieces">
                Pieces
              </option>

              <option value="Kg">
                Kg
              </option>

              <option value="Gram">
                Gram
              </option>

              <option value="Liter">
                Liter
              </option>

              <option value="ml">
                ml
              </option>
            </select>

          </div>


          <div className="recipe-field recipe-description-field">

            <label>
              Description
            </label>

            <textarea
              name="description"
              rows="4"
              placeholder="Enter recipe description..."
              value={
                formData.description
              }
              onChange={
                handleChange
              }
            />

          </div>

        </div>

      </div>


      <IngredientsTable
        ingredients={
          ingredients
        }
        onAdd={() =>
          setShowIngredientModal(
            true
          )
        }
        onDelete={
          removeIngredient
        }
      />


      <div className="create-recipe-actions">

        <button
          type="button"
          className="cancel-recipe-button"
          onClick={onCancel}
        >
          Cancel
        </button>


        <button
          type="button"
          className="draft-recipe-button"
          onClick={() =>
            onSaveDraft(
              getRecipeData()
            )
          }
        >
          <Save size={17} />

          Save Draft
        </button>


        <button
          type="button"
          className="submit-recipe-button"
          onClick={() =>
            onSubmitRecipe(
              getRecipeData()
            )
          }
        >
          <Send size={17} />

          Submit for Approval
        </button>

      </div>


      <AddIngredientModal
        isOpen={
          showIngredientModal
        }
        onClose={() =>
          setShowIngredientModal(
            false
          )
        }
        onAdd={
          addIngredient
        }
      />

    </>
  );
}

export default RecipeForm;