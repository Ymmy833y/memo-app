/**
 * An upsert process that verifies all records in IndexedDB, and if there is a record with an exact text match, it updates the timestamp,
 * and saves it as a new record if there is no match.
 * This can be used for auto-save, manual save, and the save process when "display" is pressed.
 * @param {object} textDB - The TextDB instance.
 * @param {string} text - Saved text.
 * @returns {Promise<object>} - An object containing the results and IDs of the target records.
 */
export async function upsertText(textDB, text) {
  if (text.trim().length === 0) return;
  try {
    const allRecords = await textDB.selectAllTexts();
    const duplicate = allRecords.find((record) => record.text === text);
    if (duplicate) {
      duplicate.create_at = new Date().toISOString();
      await textDB.updateText(duplicate);
      console.log('Upsert: Duplicate record updated.');
      return { message: 'updated', id: duplicate.id };
    } else {
      const result = await textDB.saveText(text);
      console.log('Upsert: New record saved.');
      return { message: 'saved', id: result.id };
    }
  } catch (err) {
    console.error('Upsert failed:', err);
    throw err;
  }
}
