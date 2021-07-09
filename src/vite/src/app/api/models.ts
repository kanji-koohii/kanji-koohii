/**
 * Models for the legacy ajax endpoints.
 *
 * Someday with a proper API, we may have:
 *
 *   ./api/models/user.ts
 *   ./api/models/story.ts
 *   etc.
 *
 */

export type DictId = number;

export type DictListEntry = {
  id: DictId; // jdict.id
  c: string; // compound
  r: string; // reading
  g: string; // glossary
  pri: number; // jdict.pri (bitfield)

  // FIXME? refactor to use a separate hash for DictList templating
  known?: boolean; // (client side) true if user knows all kanji in this compound
  fr?: string; // formatted reading
  pick?: boolean; // selected state
};

// cf. KanjisPeer::getKanjiByUCS()
export type KanjiData = {
  framenum: number;
  kanji: string;
  ucs_id: number;
  keyword: string;
  onyomi: string;
  strokecount: number;
};

export type GetDictListForUCS = {
  //
  items: DictListEntry[];
  // array of user's selected vocab ([dictid, ...])
  picks: DictId[];
  // string of known kanji (if "reqKnownKanji" is true)
  knownKanji?: string;
};

export type PostVoteStoryRequest = {
  request: "star" | "report" | "copy";
  uid: number;
  sid: number;
};

export type PostVoteStoryResponse = {
  storyText?: string; // for copy
  uid: number; // userId -- for vote & report
  sid: number; // ucsId -- for vote & report
  vote: number;
  lastvote: number;
  stars: number;
  kicks: number;
};

export type GetUserStoryResponse = {
  initStoryEdit?: string;
  initStoryPublic?: boolean;
  initFavoriteStory?: boolean; // if true, postStoryView is a "starred" story
};

export type PostUserStoryResponse = {
  // story formatted for display (non-edit mode)
  initStoryView: string;
  // story is currently shared
  isStoryShared: boolean;
  // unique id for the "shared story" added to the page `story-${userId}-${ucsId}`
  sharedStoryId: string;
  // author link in the "shared story" template
  sharedStoryAuthor: string; // html link
};
