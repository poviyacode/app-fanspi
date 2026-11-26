import { Validators } from '@angular/forms';

export interface FieldConfig {
    key: string;          // Ej: 'email', 'holderName', 'payId', 'paymentLink'
    label: string;        // Texto de la etiqueta (soporta traducción)
    type: string;         // 'text', 'email', 'url', etc.
    validators?: any[];   // Validadores de Angular
    placeholder?: string;
}

export interface MethodUIConfig {
    title: string;
    themeClass: string;   // Clases de Tailwind específicas para el diseño de este método
    fields: FieldConfig[];
}

export const PAYMENT_METHOD_CONFIGS: Record<string, MethodUIConfig> = {
    BINANCE: {
        title: 'Binance Pay',
        themeClass: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
        fields: [
            { key: 'holderName', label: 'alias', type: 'text', validators: [Validators.required] },
            { key: 'payId', label: 'binanceId', type: 'text', validators: [Validators.required] }
        ]
    },
    PAYPAL: {
        title: 'PayPal Wallet',
        themeClass: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20',
        fields: [
            { key: 'email', label: 'paypalEmail', type: 'email', validators: [Validators.required, Validators.email] },
            { key: 'holderName', label: 'alias', type: 'text', validators: [Validators.required] },
            { key: 'paymentLink', label: 'paypalMeLink', type: 'text', validators: [] }
        ]
    },
    STRIPE: {
        title: 'Stripe Connect',
        themeClass: 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20',
        fields: [
            { key: 'email', label: 'stripeEmail', type: 'email', validators: [Validators.required, Validators.email] },
            { key: 'holderName', label: 'alias', type: 'text', validators: [Validators.required] },
            { key: 'payId', label: 'stripeAccountId', type: 'text', validators: [Validators.required] },
            { key: 'paymentLink', label: 'paymentLink', type: 'text', validators: [] }
        ]
    },
    AIRTM: {
        title: 'AirTM Wallet',
        themeClass: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20',
        fields: [
            { key: 'email', label: 'airtmEmail', type: 'email', validators: [Validators.required, Validators.email] },
            { key: 'holderName', label: 'alias', type: 'text', validators: [Validators.required] },
            { key: 'paymentLink', label: 'airtmMeLink', type: 'text', validators: [] }
        ]
    },
    // Mañana puedes agregar AIRTM o ZELLE aquí sin tocar el componente visual
};