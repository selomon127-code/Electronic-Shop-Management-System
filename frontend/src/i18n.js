// frontend/src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import am from "./locales/am.json";
import om from "./locales/om.json";
import ti from "./locales/ti.json";

i18n
  .use(LanguageDetector) // Automatically detects user's browser language
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources: {
      en: { translation: en },
      am: { translation: am },
      om: { translation: om },
      ti: { translation: ti },
    },
    fallbackLng: "en", // Default language if detection fails
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"], // Remembers user's choice
    },
  });

export default i18n;
