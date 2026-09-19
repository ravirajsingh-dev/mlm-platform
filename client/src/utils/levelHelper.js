import { LEVEL_LIST_NAME } from "@src/constants/LevelsConstants";
import store from "@src/store";

export const getDetailByLevel = (level) => {
  const levelsListGlobal = store.getState().upgrade.levelsList;

  const findLevel = levelsListGlobal.find((each) => each.level == level);

  if (!findLevel) {
    return {};
  }

  return findLevel;
};

export const getLevelTitle = (level) => {
  // const levelsListGlobal = store.getState().upgrade.levelsList;

  const findLevel = LEVEL_LIST_NAME.find((each) => each.value == level);

  if (!findLevel) {
    return level;
  }

  return findLevel.label;
};
