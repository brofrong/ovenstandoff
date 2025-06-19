import { expect, test } from "bun:test";
import { findAnchor } from "./img-proccesing";
import type { AnchorKey } from "./img.type";

test("Find start game", async () => {
  const ret = await findAnchor("./test-img/imt-1745439699229.png", "play");
  expect(ret).toBe(true);
});

test("Find menu group", async () => {
  const ret = await findAnchor(
    "./test-img/imt-1745439699229.png",
    "menu_group"
  );
  expect(ret).toBe(true);
});

test("Find shareRoom in main menu", async () => {
  const ret = await findAnchor(
    "./test-img/imt-1745439699229.png",
    "share_room_code"
  );
  expect(ret).toBe(false);
});

test("timing", async () => {
  //preload img;
  await findAnchor("./test-img/imt-1745439699229.png", "share_room_code");
  const anchors = [
    "share_room_code",
    "competitive_mode",
    "apply_setting",
    "lobby_rounds_count_setting",
    "menu_group",
  ] as const;

  const anchorsToProcess: AnchorKey[] = [];

  for (let i = 0; i < 10; i++) {
    for (const anchor of anchors) {
      anchorsToProcess.push(anchor);
    }
  }

  const start = Date.now();

  await Promise.all(
    anchorsToProcess.map((anchor) =>
      findAnchor("./test-img/imt-1745439699229.png", anchor)
    )
  );

  const end = Date.now();
  const timeToCalculate = end - start;
  console.log({ timeToCalculate });
  expect(timeToCalculate).toBeLessThan(200);
});
