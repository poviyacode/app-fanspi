export interface QrSimple {
    success?: boolean,
    message?: string,
    data?: {
        numeroReferencia?: string,
        estado?: string,
        fechaExpiracion?: any,
        moneda: string,
        monto?: number,
        numeroReferenciaOriginante?: string,
        qr?: string;
    }
}