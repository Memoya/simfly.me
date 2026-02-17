import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';
import MainPage from '@/components/MainPage';

export default async function Page(props: { params: Promise<{ lang: string }> }) {
    const params = await props.params;
    const lang = params.lang as Locale;
    const dictionary = await getDictionary(lang);

    return <MainPage dictionary={dictionary} lang={lang} />;
}
