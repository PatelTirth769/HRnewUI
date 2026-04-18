/**
 * Centralized helper for system-aware Firebase collection routing.
 *
 * For the standalone Schooler instance, ALL data is routed to the "schooler" collection.
 */

const SCHOOLER_SYSTEM_CODE = 'schooler';
const SCHOOLER_ROOT_COLLECTION = 'schooler_system';
const SCHOOLER_DATA_DOC = 'data';

/**
 * Return the appropriate Firestore CollectionReference.
 * Hardcoded for Schooler Standalone.
 */
function getCollection(db, systemCode, collectionName) {
    return db
        .collection(SCHOOLER_ROOT_COLLECTION)
        .doc(SCHOOLER_DATA_DOC)
        .collection(collectionName);
}

/**
 * Check whether a system code represents the Schooler system.
 * Always true for standalone.
 */
function isSchooler(systemCode) {
    return true;
}

module.exports = { getCollection, isSchooler, SCHOOLER_SYSTEM_CODE };
