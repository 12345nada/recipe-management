import {
  useEffect,
  useState,
} from "react";

import {
  X,
} from "lucide-react";

import {
  productOptions,
} from "../data/recipesData";


function AddIngredientModal({
  isOpen,
  onClose,
  onAdd,
}) {
  const [
    selectedProductId,
    setSelectedProductId,
  ] = useState("");

  const [
    quantity,
    setQuantity,
  ] = useState("");

  const [
    unit,
    setUnit,
  ] = useState("");


  useEffect(() => {
    if (!isOpen) {
      setSelectedProductId("");
      setQuantity("");
      setUnit("");
    }
  }, [isOpen]);


  if (!isOpen) {
    return null;
  }


  const selectedProduct =
    productOptions.find(
      (product) =>
        product.id ===
        selectedProductId
    );


  const handleProductChange = (
    event
  ) => {
    const product =
      productOptions.find(
        (item) =>
          item.id ===
          event.target.value
      );

    setSelectedProductId(
      event.target.value
    );

    setUnit(
      product?.unit || ""
    );
  };


  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    if (
      !selectedProduct ||
      !quantity ||
      !unit
    ) {
      return;
    }

    onAdd({
      id: Date.now(),

      productId:
        selectedProduct.id,

      name:
        selectedProduct.name,

      type:
        selectedProduct.type,

      quantity:
        Number(quantity),

      unit,
    });

    onClose();
  };


  return (
    <div className="ingredient-modal-overlay">

      <div className="ingredient-modal">

        <div className="ingredient-modal-header">

          <div>
            <h2>
              Add Ingredient
            </h2>

            <p>
              Select a product from
              Product Master.
            </p>
          </div>

          <button
            type="button"
            className="ingredient-modal-close"
            onClick={onClose}
          >
            <X size={20} />
          </button>

        </div>


        <form
          onSubmit={handleSubmit}
        >

          <div className="recipe-field">

            <label>
              Ingredient
            </label>

            <select
              value={
                selectedProductId
              }
              onChange={
                handleProductChange
              }
              required
            >
              <option value="">
                Select Ingredient
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


          <div className="ingredient-modal-grid">

            <div className="recipe-field">

              <label>
                Type
              </label>

              <input
                value={
                  selectedProduct
                    ?.type || ""
                }
                disabled
              />

            </div>


            <div className="recipe-field">

              <label>
                Quantity
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={quantity}
                onChange={(
                  event
                ) =>
                  setQuantity(
                    event.target
                      .value
                  )
                }
                required
              />

            </div>


            <div className="recipe-field">

              <label>
                Unit
              </label>

              <select
                value={unit}
                onChange={(
                  event
                ) =>
                  setUnit(
                    event.target
                      .value
                  )
                }
                required
              >
                <option value="">
                  Select Unit
                </option>

                <option value="Pieces">
                  Pieces
                </option>

                <option value="Piece">
                  Piece
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

          </div>


          <div className="ingredient-modal-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
            >
              Add Ingredient
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default AddIngredientModal;