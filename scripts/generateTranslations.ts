import fs from "fs";
import path from "path";
import axios from "axios";

const GOOGLE_TRANSLATE_API_KEY = process.env.TRANSLATE_API_KEY;
const LOCALES_DIR = path.resolve(process.cwd(), "src/i18n/locales");

// Supported languages
const languages = [
  "es", "fr", "pt", "de", "ar", "hi", "bn", "zh", "ja",
  "id", "tr", "vi", "ko", "ru", "it", "pl", "th", "tl"
];

const translateText = async (text: string, targetLang: string) => {
  if (!GOOGLE_TRANSLATE_API_KEY) {
    console.warn("No translation API key provided. Skipping.");
    return text; // fallback
  }

  try {
    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`,
      {
        q: text,
        target: targetLang,
        format: "text"
      }
    );
    return response.data.data.translations[0].translatedText;
  } catch (error) {
    console.error(`Translation error for ${targetLang}:`, error);
    return text;
  }
};

const generateTranslations = async () => {
  console.log("Starting translation generation...");
  
  // Read base english file
  const enFilePath = path.join(LOCALES_DIR, "en.json");
  if (!fs.existsSync(enFilePath)) {
    console.error("Base English file (en.json) not found.");
    return;
  }

  const enData = JSON.parse(fs.readFileSync(enFilePath, "utf8"));
  
  if (Object.keys(enData).length === 0) {
    console.log("No keys found in en.json to translate. Exiting.");
    return;
  }

  for (const lang of languages) {
    const targetFilePath = path.join(LOCALES_DIR, `${lang}.json`);
    let targetData = {};
    if (fs.existsSync(targetFilePath)) {
      targetData = JSON.parse(fs.readFileSync(targetFilePath, "utf8"));
    }

    let modified = false;

    for (const key of Object.keys(enData)) {
      if (!targetData[key]) {
        console.log(`Translating [${key}] to ${lang}...`);
        targetData[key] = await translateText(enData[key], lang);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(targetFilePath, JSON.stringify(targetData, null, 2), "utf8");
      console.log(`Updated ${lang}.json`);
    } else {
      console.log(`${lang}.json is up to date.`);
    }
  }

  console.log("Translation generation complete.");
};

// Only run explicitly, never in runtime. Un-comment to run:
// generateTranslations();
