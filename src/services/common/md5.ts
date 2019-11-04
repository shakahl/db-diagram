import { Base64Encoder, EncodeURL } from "@db-diagram/services/common/base64";

type a32 = (a: number, b: number) => number;

let add32: a32 = (a: number, b: number) => {
    return (a + b) & 0xFFFFFFFF;
};

export class MD5 {

    public static StringToUint8Array(txt: string): Uint8Array {
        const utf8: number[] = [];
        let i = 0;

        while (i < txt.length) {
            let codePoint: number;

            // Decode UTF-16
            const a = txt.charCodeAt(i++);
            if (a < 0xD800 || a >= 0xDC00) {
                codePoint = a;
            } else {
                const b = txt.charCodeAt(i++);
                codePoint = (a << 10) + b + (0x10000 - (0xD800 << 10) - 0xDC00);
            }

            // Encode UTF-8
            if (codePoint < 0x80) {
                utf8.push(codePoint);
            } else {
                if (codePoint < 0x800) {
                    utf8.push(((codePoint >> 6) & 0x1F) | 0xC0);
                } else {
                    if (codePoint < 0x10000) {
                        utf8.push(((codePoint >> 12) & 0x0F) | 0xE0);
                    } else {
                        utf8.push(
                            ((codePoint >> 18) & 0x07) | 0xF0,
                            ((codePoint >> 12) & 0x3F) | 0x80);
                    }
                    utf8.push(((codePoint >> 6) & 0x3F) | 0x80);
                }
                utf8.push((codePoint & 0x3F) | 0x80);
            }
        }
        return new Uint8Array(utf8);
    }

    private static readonly hexCharacter = "0123456789abcdef".split("");

    private digest?: Int32Array;
    private base64Encoder?: Base64Encoder;

    public sum(s: string, random?: boolean): this {
        this.reset();

        let utf8 = MD5.StringToUint8Array(s);
        if (random) {
            const timeBytes = new Uint8Array(new Uint32Array([new Date().getTime()]).buffer);
            const array = new Uint8Array(20 + utf8.length + timeBytes.length);
            window.crypto.getRandomValues(array);
            array.set(utf8);
            array.set(timeBytes, utf8.length);
            utf8 = array;
        }

        const n = utf8.length;
        let i = 0;
        for (i = 64; i <= utf8.length; i += 64) {
            this.blockGeneric(this.digest!, this.md5block(utf8.slice(i - 64, i)));
        }
        utf8 = utf8.slice(i - 64);
        const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < utf8.length; i++) {
            tail[i >> 2] |= utf8[i] << ((i % 4) << 3);
        }
        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            this.blockGeneric(this.digest!, tail);
            for (i = 0; i < 16; i++) {
                tail[i] = 0;
            }
        }
        tail[14] = n * 8;
        this.blockGeneric(this.digest!, tail);
        return this;
    }

    public bytes(): Uint8Array {
        return new Uint8Array(this.digest!.buffer);
    }

    public base64(): string {
        if (!this.base64Encoder) {
            this.base64Encoder = new Base64Encoder(EncodeURL);
        }
        return this.base64Encoder.encodeToString(this.bytes());
    }

    public hex() {
        const rhex = (n: number): string => {
            let s = "";
            for (let j = 0; j < 4; j++) {
                s += MD5.hexCharacter[(n >> (j * 8 + 4)) & 0x0F]
                    + MD5.hexCharacter[(n >> (j * 8)) & 0x0F];
            }
            return s;
        };
        const xs = new Array<string>(this.digest!.length);
        for (let i = 0; i < this.digest!.length; i++) {
            xs[i] = rhex(this.digest![i]);
        }
        return xs.join("");
    }

    private reset() {
        if (!this.digest) {
            this.digest = new Int32Array(4);
        }
        this.digest[0] = 1732584193;
        this.digest[1] = -271733879;
        this.digest[2] = -1732584194;
        this.digest[3] = 271733878;
    }

    private blockGeneric(x: Int32Array, k: number[]) {
        let a = x[0];
        let b = x[1];
        let c = x[2];
        let d = x[3];

        a = this.ff(a, b, c, d, k[0], 7, -680876936);
        d = this.ff(d, a, b, c, k[1], 12, -389564586);
        c = this.ff(c, d, a, b, k[2], 17, 606105819);
        b = this.ff(b, c, d, a, k[3], 22, -1044525330);
        a = this.ff(a, b, c, d, k[4], 7, -176418897);
        d = this.ff(d, a, b, c, k[5], 12, 1200080426);
        c = this.ff(c, d, a, b, k[6], 17, -1473231341);
        b = this.ff(b, c, d, a, k[7], 22, -45705983);
        a = this.ff(a, b, c, d, k[8], 7, 1770035416);
        d = this.ff(d, a, b, c, k[9], 12, -1958414417);
        c = this.ff(c, d, a, b, k[10], 17, -42063);
        b = this.ff(b, c, d, a, k[11], 22, -1990404162);
        a = this.ff(a, b, c, d, k[12], 7, 1804603682);
        d = this.ff(d, a, b, c, k[13], 12, -40341101);
        c = this.ff(c, d, a, b, k[14], 17, -1502002290);
        b = this.ff(b, c, d, a, k[15], 22, 1236535329);

        a = this.gg(a, b, c, d, k[1], 5, -165796510);
        d = this.gg(d, a, b, c, k[6], 9, -1069501632);
        c = this.gg(c, d, a, b, k[11], 14, 643717713);
        b = this.gg(b, c, d, a, k[0], 20, -373897302);
        a = this.gg(a, b, c, d, k[5], 5, -701558691);
        d = this.gg(d, a, b, c, k[10], 9, 38016083);
        c = this.gg(c, d, a, b, k[15], 14, -660478335);
        b = this.gg(b, c, d, a, k[4], 20, -405537848);
        a = this.gg(a, b, c, d, k[9], 5, 568446438);
        d = this.gg(d, a, b, c, k[14], 9, -1019803690);
        c = this.gg(c, d, a, b, k[3], 14, -187363961);
        b = this.gg(b, c, d, a, k[8], 20, 1163531501);
        a = this.gg(a, b, c, d, k[13], 5, -1444681467);
        d = this.gg(d, a, b, c, k[2], 9, -51403784);
        c = this.gg(c, d, a, b, k[7], 14, 1735328473);
        b = this.gg(b, c, d, a, k[12], 20, -1926607734);

        a = this.hh(a, b, c, d, k[5], 4, -378558);
        d = this.hh(d, a, b, c, k[8], 11, -2022574463);
        c = this.hh(c, d, a, b, k[11], 16, 1839030562);
        b = this.hh(b, c, d, a, k[14], 23, -35309556);
        a = this.hh(a, b, c, d, k[1], 4, -1530992060);
        d = this.hh(d, a, b, c, k[4], 11, 1272893353);
        c = this.hh(c, d, a, b, k[7], 16, -155497632);
        b = this.hh(b, c, d, a, k[10], 23, -1094730640);
        a = this.hh(a, b, c, d, k[13], 4, 681279174);
        d = this.hh(d, a, b, c, k[0], 11, -358537222);
        c = this.hh(c, d, a, b, k[3], 16, -722521979);
        b = this.hh(b, c, d, a, k[6], 23, 76029189);
        a = this.hh(a, b, c, d, k[9], 4, -640364487);
        d = this.hh(d, a, b, c, k[12], 11, -421815835);
        c = this.hh(c, d, a, b, k[15], 16, 530742520);
        b = this.hh(b, c, d, a, k[2], 23, -995338651);

        a = this.ii(a, b, c, d, k[0], 6, -198630844);
        d = this.ii(d, a, b, c, k[7], 10, 1126891415);
        c = this.ii(c, d, a, b, k[14], 15, -1416354905);
        b = this.ii(b, c, d, a, k[5], 21, -57434055);
        a = this.ii(a, b, c, d, k[12], 6, 1700485571);
        d = this.ii(d, a, b, c, k[3], 10, -1894986606);
        c = this.ii(c, d, a, b, k[10], 15, -1051523);
        b = this.ii(b, c, d, a, k[1], 21, -2054922799);
        a = this.ii(a, b, c, d, k[8], 6, 1873313359);
        d = this.ii(d, a, b, c, k[15], 10, -30611744);
        c = this.ii(c, d, a, b, k[6], 15, -1560198380);
        b = this.ii(b, c, d, a, k[13], 21, 1309151649);
        a = this.ii(a, b, c, d, k[4], 6, -145523070);
        d = this.ii(d, a, b, c, k[11], 10, -1120210379);
        c = this.ii(c, d, a, b, k[2], 15, 718787259);
        b = this.ii(b, c, d, a, k[9], 21, -343485551);

        x[0] = add32(a, x[0]);
        x[1] = add32(b, x[1]);
        x[2] = add32(c, x[2]);
        x[3] = add32(d, x[3]);
    }

    private cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
        a = add32(add32(a, q), add32(x, t));
        return add32((a << s) | (a >>> (32 - s)), b);
    }

    private ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
        return this.cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }

    private gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
        return this.cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }

    private hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
        return this.cmn(b ^ c ^ d, a, b, x, s, t);
    }

    private ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
        return this.cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    private md5block(s: Uint8Array): number[] {
        let md5ArrBlock: number[] = [];
        for (let i = 0; i < 64; i += 4) {
            md5ArrBlock[i >> 2] = s[i]
                + (s[i + 1] << 8)
                + (s[i + 2] << 16)
                + (s[i + 3] << 24);
        }
        return md5ArrBlock;
    }

}

if (new MD5().sum("123456").hex() !== "e10adc3949ba59abbe56e057f20f883e") {
    add32 = (x, y) => {
        const lsw = (x & 0xFFFF) + (y & 0xFFFF);
        const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    };
}
