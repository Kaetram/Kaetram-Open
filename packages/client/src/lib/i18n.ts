import { changeLanguage, type Locale } from '@kaetram/common/i18n';

let lang = location.pathname.slice(1, 3) as Locale;

if (lang) await changeLanguage(lang);
