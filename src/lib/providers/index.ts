
import { EsimProvider } from './types';
import { EsimAccessProvider } from './esim-access';

const registry: Record<string, EsimProvider> = {
    'esim-access': new EsimAccessProvider(),
};

export function getProvider(slug: string): EsimProvider | undefined {
    return registry[slug];
}

export function getAllProviders(): EsimProvider[] {
    return Object.values(registry);
}
