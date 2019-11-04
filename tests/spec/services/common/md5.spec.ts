import { MD5 } from "@db-diagram/services/common/md5";

describe("MD5", () => {

    it("hex", () => {
        const md5 = new MD5();
        expect(md5.sum("123456", false).hex()).toEqual("e10adc3949ba59abbe56e057f20f883e");
        expect(md5.sum("abcdef", false).hex()).toEqual("e80b5017098950fc58aad83c8c14978e");
        expect(md5.sum("md5 hash with hex", false).hex()).toEqual("79fc9fbdadcdd44af6ed51976dd75100");
    });

    it("base64", () => {
        const md5 = new MD5();
        expect(md5.sum("123456", false).base64()).toEqual("4QrcOUm6Wau-VuBX8g-IPg");
        expect(md5.sum("abcdef", false).base64()).toEqual("6AtQFwmJUPxYqtg8jBSXjg");
        expect(md5.sum("md5 hash with hex", false).base64()).toEqual("efyfva3N1Er27VGXbddRAA");
    });

});
