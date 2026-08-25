import {
  Plus,
  Trash2,
} from "lucide-react";


function IngredientsTable({
  ingredients,
  onAdd,
  onDelete,
}) {
  return (
    <div className="ingredients-section">

      <div className="ingredients-header">

        <div>
          <h2>
            Ingredients
          </h2>

          <p>
            Add all products required
            for this recipe.
          </p>
        </div>

        <button
          type="button"
          className="add-ingredient-button"
          onClick={onAdd}
        >
          <Plus size={17} />

          Add Ingredient
        </button>

      </div>


      <div className="ingredients-table-wrapper">

        <table className="ingredients-table">

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

            {ingredients.length === 0 ? (

              <tr>
                <td
                  colSpan="5"
                  className="ingredients-empty"
                >
                  No ingredients added yet.
                </td>
              </tr>

            ) : (

              ingredients.map(
                (ingredient) => (

                  <tr
                    key={
                      ingredient.id
                    }
                  >

                    <td>
                      <strong>
                        {
                          ingredient.name
                        }
                      </strong>
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
                        className="delete-ingredient"
                        onClick={() =>
                          onDelete(
                            ingredient.id
                          )
                        }
                      >
                        <Trash2
                          size={17}
                        />
                      </button>

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

export default IngredientsTable;