import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';
import CheckPage from '@/components/CheckPage';

export default async function Page(props: { params: Promise<{ lang: string }> }) {
    const params = await props.params;
    const lang = params.lang as Locale;
    const dictionary = await getDictionary(lang);

    return <CheckPage dictionary={dictionary} />;
}
