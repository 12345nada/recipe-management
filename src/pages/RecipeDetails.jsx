import {
  ArrowLeft,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useRecipes,
} from "../context/RecipesContext";

import StatusBadge
  from "../components/StatusBadge";

import "../styles/RecipeDetails.css";


function RecipeDetails() {
  const {
    id,
  } = useParams();

  const navigate =
    useNavigate();

  const {
    getRecipeById,
  } = useRecipes();


  const recipe =
    getRecipeById(id);


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

          <p>
            The requested recipe does not exist.
          </p>

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
              ?.length === 0 ||
            !recipe.ingredients ? (

              <tr>

                <td
                  colSpan="4"
                  className="details-empty"
                >
                  No ingredients.
                </td>

              </tr>

            ) : (

              recipe.ingredients.map(
                (ingredient) => (

                  <tr
                    key={
                      ingredient.id
                    }
                  >

                    <td>
                      {
                        ingredient.name
                      }
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

                  </tr>

                )
              )

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default RecipeDetails;