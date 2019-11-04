
export const EncodeStd = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
export const EncodeURL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export type EncodeCharacterStandard = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/" |
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export class Base64Encoder {

    private encodec: EncodeCharacterStandard;

    constructor(ctype: EncodeCharacterStandard) {
        this.encodec = ctype;
    }

    public encodeToString(bytes: Uint8Array): string {
        const array = new Array<string>(this.encodedLength(bytes.length));
        this.encode(array, bytes);
        return array.join("");
    }

    private encode(a: string[], s: Uint8Array) {
        if (s.length === 0) {
            return;
        }
        const uint = (uin: number) => uin >>> 0;

        let di = 0;
        let si = 0;
        const n = Math.floor(s.length / 3) * 3;
        for (; si < n;) {
            // Convert 3x 8bit source bytes into 4 bytes
            const v = uint(s[si]) << 16 | uint(s[si + 1]) << 8 | uint(s[si + 2]);

            a[di + 0] = this.encodec[v >> 18 & 0x3F];
            a[di + 1] = this.encodec[v >> 12 & 0x3F];
            a[di + 2] = this.encodec[v >> 6 & 0x3F];
            a[di + 3] = this.encodec[v & 0x3F];

            si += 3;
            di += 4;
        }

        const remain = s.length - si;

        if (remain === 0) {
            return;
        }

        // Add the remaining small block
        let val = uint(s[si + 0]) << 16;
        if (remain === 2) {
            val |= uint(s[si + 1]) << 8;
        }

        a[di + 0] = this.encodec[val >> 18 & 0x3F];
        a[di + 1] = this.encodec[val >> 12 & 0x3F];

        switch (remain) {
            case 2:
                a[di + 2] = this.encodec[val >> 6 & 0x3F];
        }
    }

    private encodedLength(n: number) {
        return Math.floor((n * 8 + 5) / 6);
    }

}
