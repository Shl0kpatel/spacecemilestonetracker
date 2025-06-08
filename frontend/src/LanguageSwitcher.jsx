import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 rounded ${i18n.language === 'en' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
      >
        English
      </button>
      <button
        onClick={() => changeLanguage('hi')}
        className={`px-2 py-1 rounded ${i18n.language === 'hi' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
      >
        हिन्दी
      </button>
    </div>
  );
};

export default LanguageSwitcher;
