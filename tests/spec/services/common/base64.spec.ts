import { Base64Encoder, EncodeURL } from "@db-diagram/services/common/base64";
import { MD5 } from "@db-diagram/services/common/md5";

describe("Base64", () => {

    it("verify", () => {
        const base64 = new Base64Encoder(EncodeURL);
        expect(base64.encodeToString(MD5.StringToUint8Array("123456"))).toEqual("MTIzNDU2");
        expect(base64.encodeToString(MD5.StringToUint8Array("base64 encoding"))).toEqual("YmFzZTY0IGVuY29kaW5n");
        expect(base64.encodeToString(new Uint8Array([1, 2, 3, 4, 5, 6]))).toEqual("AQIDBAUG");
        expect(base64.encodeToString(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])))
            .toEqual("AQIDBAUGBwgJCgsMDQ4PEA");
    });

});
