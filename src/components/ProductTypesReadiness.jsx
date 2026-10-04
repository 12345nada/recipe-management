import { useTranslation } from "react-i18next";
import { useProductTypes } from "../context/ProductTypesContext";

export default function ProductTypesReadiness() {
  const { t } = useTranslation();
  const { ready, loading, error, refresh } = useProductTypes();
  if (ready) return null;
  return <div role={error ? "alert" : "status"} aria-busy={loading}>
    <p className={error ? "product-values-error" : undefined}>{loading ? t("common.loading") : t("settingsPage.productTypeManagement.loadFailed")}</p>
    {error && <button type="button" className="product-cancel-button" onClick={() => refresh()}>{t("common.tryAgain")}</button>}
  </div>;
}
