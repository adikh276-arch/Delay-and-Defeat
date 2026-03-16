import React from "react";
import { useTranslation } from "react-i18next";

const languages = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "tr", label: "Türkçe" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "ko", label: "한국어" },
  { code: "ru", label: "Русский" },
  { code: "it", label: "Italiano" },
  { code: "pl", label: "Polski" },
  { code: "th", label: "ไทย" },
  { code: "tl", label: "Tagalog" },
  { code: "pt", label: "Português" },
];

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
  };

  return (
    <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 50 }}>
      <select
        value={i18n.resolvedLanguage || "en"}
        onChange={handleLanguageChange}
        style={{
          padding: "0.5rem",
          borderRadius: "0.375rem",
          border: "1px solid #ccc",
          backgroundColor: "white",
          color: "#333",
          cursor: "pointer",
          fontSize: "14px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
        }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
