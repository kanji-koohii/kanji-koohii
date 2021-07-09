/**
 * Format the highlighted kanji reading from a DictEntry / VocabPick
 * 
 *   Surrounds the kanji reading with <em> tag.
 *   (cf. data/scripts/dict/dict_gen_cache.php where syntax originates)
 *
 * @param kana   compound's reading
 */
export function kkFormatReading(kana: string): string {
  return kana.replace("(", "<em>").replace(")", "</em>");
}
