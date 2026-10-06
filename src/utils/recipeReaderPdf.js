import autoTable from "jspdf-autotable";
import { createReportPDF, prepareReportPDFCell } from "./reportPdf";

export async function printReaderRecipe(recipe, t, language) {
  const document = await createReportPDF();
  const arabic = language.startsWith("ar");
  document.setFont("Amiri", "bold");
  document.setFontSize(18);
  document.text(t("recipeReaders.recipe"), 14, 18);
  autoTable(document, {
    startY: 26,
    head: [[t("recipeReaders.field"), t("recipeReaders.value")]],
    body: [
      [t("recipeReaders.code"), recipe.recipe_code],
      [t("recipeReaders.name"), recipe.name],
      [t("recipeReaders.description"), recipe.description || "-"],
      [t("recipeReaders.category"), recipe.category],
      [t("recipeReaders.type"), (arabic ? recipe.type_arabic_name : recipe.type_name) || recipe.product_type],
      [t("recipeReaders.yield"), `${recipe.yield_quantity} ${recipe.yield_unit}`],
    ],
    styles: { font: "Amiri", fontSize: 10 },
    headStyles: { fillColor: [94, 65, 44] },
    didParseCell: prepareReportPDFCell,
  });
  autoTable(document, {
    startY: document.lastAutoTable.finalY + 10,
    head: [[t("recipeReaders.ingredient"), t("recipeReaders.type"), t("recipeReaders.quantity"), t("recipeReaders.unit"), t("recipeReaders.notes")]],
    body: recipe.ingredients.map((item) => [item.name,
      (arabic ? item.type_arabic_name : item.type_name) || "-", item.quantity, item.unit, item.notes || "-"]),
    styles: { font: "Amiri", fontSize: 10 },
    headStyles: { fillColor: [94, 65, 44] },
    didParseCell: prepareReportPDFCell,
  });
  // Downloading the printable PDF avoids browser popup blocking and uploads no data.
  document.save(`${recipe.recipe_code || "recipe"}.pdf`);
}
