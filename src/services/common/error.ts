
export class ServiceError extends Error {

    private static ErrorMesage = (dex: DOMException | null, msg: string): string => {
        if (msg && msg.length > 0) {
            msg = ` on ${msg}`;
        }
        return dex ? `Service Exception: ${dex.name}, code: ${dex.code}, detail: ${dex.message}${msg}` : msg;
    }

    public readonly domException?: DOMException;

    constructor(dex: DOMException | null, additional: string = "") {
        super(ServiceError.ErrorMesage(dex, additional));
        if (dex) {
            this.domException = dex;
        }
    }

}
