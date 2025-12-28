var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { detectSensitiveData, getRedactionMarker, countRedactions } from './redaction.js';
/**
 * Check if the word API requirement set 1.5 is supported
 */
// Does the current Word host support the API features required for tracking changes?
export function isTrackingChangesSupported() {
    try {
        return Office.context.requirements.isSetSupported('WordApi', '1.5');
    }
    catch (error) {
        console.log('Error checking if tracking changes are supported:', error);
        return false;
    }
}
//console.log(isTrackingChangesSupported());
/**
 * Enable tracking changes in the document
 */
export function enableTrackingChanges() {
    return __awaiter(this, void 0, void 0, function* () {
        return Word.run((context) => __awaiter(this, void 0, void 0, function* () {
            if (isTrackingChangesSupported()) {
                context.document.changeTrackingMode = Word.ChangeTrackingMode.trackAll;
                yield context.sync();
            }
        }));
    });
}
/**
 * Add a confidentiality header to the document
 */
export function addConfidentialityHeader() {
    return __awaiter(this, void 0, void 0, function* () {
        return Word.run((context) => __awaiter(this, void 0, void 0, function* () {
            const body = context.document.body;
            const header = body.insertParagraph("CONFIDENTIAL", Word.InsertLocation.start);
            header.font.size = 14;
            header.font.bold = true;
            header.font.color = "red";
            header.alignment = Word.Alignment.centered;
            header.spaceAfter = 12;
            // Insert a line break after the header
            body.insertParagraph(" ", Word.InsertLocation.start);
            yield context.sync();
        }));
    });
}
/**
 * Retrieve the full text content of the document
 */
// TODO: Add support for other document types like tables, and lists.
export function getDocumentText() {
    return __awaiter(this, void 0, void 0, function* () {
        return Word.run((context) => __awaiter(this, void 0, void 0, function* () {
            const body = context.document.body;
            body.load('text');
            yield context.sync();
            return body.text;
        }));
    });
}
/**
 * Redact sensitive information from the document
 */
export function redactSensitiveInformation() {
    return __awaiter(this, void 0, void 0, function* () {
        return Word.run((context) => __awaiter(this, void 0, void 0, function* () {
            // Get the document content
            const fullText = yield getDocumentText();
            // Detect sensitive data
            const matches = detectSensitiveData(fullText);
            if (matches.length === 0) {
                return {
                    redactedCount: 0,
                    emailCount: 0,
                    phoneCount: 0,
                    ssnCount: 0,
                    creditCardCount: 0,
                    nameCount: 0,
                    dobCount: 0,
                    orderNumberCount: 0,
                    medicalRecordCount: 0,
                    addressCount: 0,
                    otherCount: 0
                };
            }
            // Search through all paragraphs
            const paragraphs = context.document.body.paragraphs;
            paragraphs.load('items');
            yield context.sync();
            let redactedCount = 0;
            // Process each paragraph
            for (let i = 0; i < paragraphs.items.length; i++) {
                const paragraph = paragraphs.items[i];
                paragraph.load('text');
                yield context.sync();
                const paragraphText = paragraph.text;
                const paragraphMatches = detectSensitiveData(paragraphText);
                if (paragraphMatches.length > 0) {
                    // Process matches in reverse order to maintain original text order & indices
                    for (const match of paragraphMatches) {
                        // find the match in the paragraph text
                        const searchResults = paragraph.search(match.text, { matchCase: false });
                        searchResults.load('items');
                        yield context.sync();
                        // Replace each occurence of the match with the redaction marker
                        for (const result of searchResults.items) {
                            result.insertText(getRedactionMarker(match.type), Word.InsertLocation.replace);
                            redactedCount++;
                        }
                    }
                }
            }
            yield context.sync();
            yield context.sync(); // additional sync to ensure Word refreshed the document structure
            return countRedactions(matches);
        }));
    });
}
/**
 * Main function to perform all redaction operations
 */
export function performRedaction() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Enable tracking changes if supported
            if (isTrackingChangesSupported()) {
                yield enableTrackingChanges();
            }
            // Add confidentiality header
            yield addConfidentialityHeader();
            // Redact sensitive information
            const result = yield redactSensitiveInformation();
            return result;
        }
        catch (error) {
            console.error('Error performing redaction:', error);
            throw error;
        }
    });
}
//# sourceMappingURL=wordOperations.js.map