import { afterEach, describe, expect, it } from "vitest";
import { aircraftByFlight, formatFlightCode } from "./aircraft";

// aircraftByFlight 目前是空的（使用者自己維護的航迷小筆記，還沒有任何真實資料，
// 見 CLAUDE.md）。這裡直接借用它是可變物件這件事，暫時塞一筆測試資料再清掉，
// 不用 mock 整個 module——formatFlightCode 內部讀的就是這個 module-scope 變數，
// mock export 反而測不到真的邏輯。
describe("formatFlightCode", () => {
  afterEach(() => {
    delete aircraftByFlight.BR112;
  });

  it("查得到機型時回傳「代碼(機型)」", () => {
    aircraftByFlight.BR112 = "A330-300";
    expect(formatFlightCode("BR112")).toBe("BR112(A330-300)");
  });

  it("查不到機型（還沒填或打錯字）時照原樣回傳代碼，不噴錯", () => {
    expect(formatFlightCode("XX999")).toBe("XX999");
  });
});
