
import { EsimProvider } from './types';
import { EsimGoProvider } from './esim-go';
import { AiraloProvider } from './airalo';
import { EsimAccessProvider } from './esim-access';

const registry: Record<string, EsimProvider> = {
    'esim-go': new EsimGoProvider(),
    'airalo': new AiraloProvider(),
    'esim-access': new EsimAccessProvider(),
};

export function getProvider(slug: string): EsimProvider | undefined {
    return registry[slug];
}

export function getAllProviders(): EsimProvider[] {
    return Object.values(registry);
}
