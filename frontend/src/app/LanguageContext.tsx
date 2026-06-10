import { createContext, useContext, useState, ReactNode } from "react";
import translations, { LangCode, Translation } from "./translations";

interface LanguageContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: Translation;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: translations["en"],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  function setLang(newLang: LangCode) {
    setLangState(newLang);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
