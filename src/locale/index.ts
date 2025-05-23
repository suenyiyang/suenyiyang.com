import i18next from "i18next";
import enUS from "./en-US.json";

export const initLocale = () => {
  i18next.init({
    resources: {
      en: { translation: enUS },
    },
    fallbackLng: "en",
    lng: navigator.language.includes("zh") ? "zh" : "en",
  });
};

export { t } from "i18next";
