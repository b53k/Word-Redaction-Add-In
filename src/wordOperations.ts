import { detectSensitiveData, getRedactionMarker, countRedactions } from './redaction.js';
import { SensitiveDataMatch, RedactionResult } from './types.js';

/**
 * Check if the word API requirement set 1.5 is supported
 */

// Does the current Word host support the API features required for tracking changes?
export function isTrackingChangesSupported(): boolean {
  try {
    return Office.context.requirements.isSetSupported('WordApi', '1.5');
  } catch (error) {
    console.log('Error checking if tracking changes are supported:', error);
    return false;
  }
}

//console.log(isTrackingChangesSupported());

/**
 * Enable tracking changes in the document
 */
export async function enableTrackingChanges(): Promise<void> {
  return Word.run(async (context) => {
    if (isTrackingChangesSupported()) {
      context.document.changeTrackingMode = Word.ChangeTrackingMode.trackAll;
      await context.sync();
    }
  });
}

/**
 * Add a confidentiality header to the document
 */
export async function addConfidentialityHeader(): Promise<void> {
  return Word.run(async (context) => {
    const body: Word.Body = context.document.body;
    const header: Word.Paragraph =  body.insertParagraph("CONFIDENTIAL", Word.InsertLocation.start);
    header.font.size = 14;
    header.font.bold = true;
    header.font.color = "red";
    header.alignment = Word.Alignment.centered;
    header.spaceAfter = 12;

    // Insert a line break after the header
    body.insertParagraph(" ", Word.InsertLocation.start);

    await context.sync();
  });
}

/**
 * Retrieve the full text content of the document
 */
// TODO: Add support for other document types like tables, and lists.
export async function getDocumentText(): Promise<string> {
  return Word.run(async (context) => {
    const body: Word.Body = context.document.body;
    body.load('text');
    await context.sync();
    return body.text;
  });
}

/**
 * Redact sensitive information from the document
 */
export async function redactSensitiveInformation(): Promise<RedactionResult> {
  return Word.run(async (context) => {
    // Get the document content
    const fullText: string = await getDocumentText();

    // Detect sensitive data
    const matches: SensitiveDataMatch[] = detectSensitiveData(fullText);

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
    await context.sync();

    let redactedCount = 0;

    // Process each paragraph
    for (let i = 0; i < paragraphs.items.length; i++) {
      const paragraph = paragraphs.items[i];
      paragraph.load('text');
      await context.sync();

      const paragraphText = paragraph.text;
      const paragraphMatches = detectSensitiveData(paragraphText);

      if (paragraphMatches.length > 0) {
        // Process matches in reverse order to maintain original text order & indices
        for (const match of paragraphMatches) {
          // find the match in the paragraph text
          const searchResults = paragraph.search(match.text, {matchCase: false});
          searchResults.load('items');
          await context.sync();

          // Replace each occurence of the match with the redaction marker
          for (const result of searchResults.items) {
            result.insertText(getRedactionMarker(match.type), Word.InsertLocation.replace);
            redactedCount++;
          }
        }
      }
    }

    await context.sync();

    await context.sync(); // additional sync to ensure Word refreshed the document structure

    return countRedactions(matches);
  });
}


/**
 * Main function to perform all redaction operations
 */
export async function performRedaction(): Promise<RedactionResult> {
  try {
    // Enable tracking changes if supported
    if (isTrackingChangesSupported()) {
      await enableTrackingChanges();
    }

    // Add confidentiality header
    await addConfidentialityHeader();

    // Redact sensitive information
    const result = await redactSensitiveInformation();

    return result;
  } catch (error) {
    console.error('Error performing redaction:', error);
    throw error;
  }
}


