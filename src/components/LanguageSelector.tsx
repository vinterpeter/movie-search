import { useI18n, type Language } from '../i18n';
import './LanguageSelector.css';

export function LanguageSelector() {
  const { language, setLanguage, t } = useI18n();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

  return (
    <div className="language-selector">
      <select
        value={language}
        onChange={handleChange}
        className="language-select"
        aria-label={t('language')}
      >
        <option value="hu">🇭🇺 {t('hungarian')}</option>
        <option value="en">🇬🇧 {t('english')}</option>
      </select>
    </div>
  );
}
