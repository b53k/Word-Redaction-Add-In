import { SensitiveDataMatch, RedactionResult } from './types.js';
/**
 * Regular expressions for detecting sensitive information in the word document
 */

// Cases to consider: 
// email, phone, ssn, 
// 4 digit ssn, credit card #, insurance policy number, medical record number, 
// DOB, employee ID, Address, order number???, Names???

const PATTERNS = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-za-z]{2,}\b/g,
    phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
    ssn: /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g,
    creditCard: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, // credit card number
    name: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}\b/g,
    dob: /\b((0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}|\d{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01]))\b/g,
    orderNumber: /#\d+/g,
    medicalRecord: /\b(MRN|INS)-\d+\b/g,
    address: /\b\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Place|Pl|Way|Circle|Cir)\b[^.]*/gi,
    other: /\b\d{4}\b/g // partial identifier
};


/**
 * Helper function to check if a position in the text is already covered by an existing match
 */
function isAlreadyMatched(matchIndex: number, matchLength: number, existingMatches: SensitiveDataMatch[]): boolean {
    const matchEnd = matchIndex + matchLength;
    
    // Check if any part of this match overlaps with an existing match
    return existingMatches.some(existing => {
        // Check if the new match overlaps with or is contained within an existing match
        return (matchIndex >= existing.startIndex && matchIndex < existing.endIndex) ||
               (matchEnd > existing.startIndex && matchEnd <= existing.endIndex) ||
               (matchIndex < existing.startIndex && matchEnd > existing.endIndex);
    });
}



/**
 * Detect all sensitive information in a text string
 */
export function detectSensitiveData(text: string): SensitiveDataMatch[] {
    const matches: SensitiveDataMatch[] = [];
    let match: RegExpExecArray | null;

    // Detect emails
    const emailRegex: RegExp = new RegExp(PATTERNS.email);
    while ((match = emailRegex.exec(text)) !== null) {
        matches.push({
            text: match[0],
            type: 'email',
            startIndex: match.index,
            endIndex: match.index + match[0].length
        });
    }


    // Detect phone numbers
    const phoneRegex: RegExp = new RegExp(PATTERNS.phone);
    while ((match = phoneRegex.exec(text)) !== null) {
        matches.push({
            text: match[0],
            type: 'phone',
            startIndex: match.index,
            endIndex: match.index + match[0].length
        });
    }


    // Detect social security numbers
    const ssnRegex: RegExp = new RegExp(PATTERNS.ssn);
    while ((match = ssnRegex.exec(text)) !== null) {
        matches.push({
            text: match[0],
            type: 'ssn',
            startIndex: match.index,
            endIndex: match.index + match[0].length
        });
    }

    // Add other patterns here...once basic ones are working
    // -----------------------------------------------------

    // Detect credit cards
    const creditCardRegex: RegExp = new RegExp(PATTERNS.creditCard);
    while ((match = creditCardRegex.exec(text)) !== null) {
        matches.push({
            text: match[0],
            type: 'creditCard',
            startIndex: match.index,
            endIndex: match.index + match[0].length
        });
    }

    // Detect full names
    const fullnameRegex: RegExp = new RegExp(PATTERNS.name);
    while ((match = fullnameRegex.exec(text)) !== null) {
        matches.push({
            text: match[0],
            type: 'name',
            startIndex: match.index,
            endIndex: match.index + match[0].length
        });
    }

    // Detect DOB
    const dobRegex: RegExp = new RegExp(PATTERNS.dob);
    while ((match = dobRegex.exec(text)) !== null) {
        matches.push({
            text: match[0],
            type: 'dob',
            startIndex: match.index,
            endIndex: match.index + match[0].length
        });
    }

    // Detect order numbers
    const orderNumberRegex: RegExp = new RegExp(PATTERNS.orderNumber);
    while ((match = orderNumberRegex.exec(text)) !== null) {
        matches.push({
            text: match[0],
            type: 'orderNumber',
            startIndex: match.index,
            endIndex: match.index + match[0].length
        });
    }

    // Detect medical record numbers
    const medicalRecordRegex: RegExp = new RegExp(PATTERNS.medicalRecord);
    while ((match = medicalRecordRegex.exec(text)) !== null) {
        matches.push({
            text: match[0],
            type: 'medicalRecord',
            startIndex: match.index,
            endIndex: match.index + match[0].length
        });
    }

    // Detect addresses
    const addressRegex: RegExp = new RegExp(PATTERNS.address);
    while ((match = addressRegex.exec(text)) !== null) {
        const matchIndex = match.index;
        const matchText = match[0];
        const matchLength = matchText.length;

        // Skip if this name is already a part of another detected pattern
        if (isAlreadyMatched(matchIndex, matchLength, matches)) {
            continue;
        }

        matches.push({
            text: matchText,
            type: 'address',
            startIndex: matchIndex,
            endIndex: matchIndex + matchLength
        });
    }

    // Detect other types of sensitive data
    // But only if it's not already covered by another match
    const otherRegex: RegExp = new RegExp(PATTERNS.other);
    while ((match = otherRegex.exec(text)) !== null) {
        const matchIndex = match.index;
        const matchText = match[0];
        const matchLength = matchText.length;

        // Skip if this 4-digit number is already a part of another detected pattern
        if (isAlreadyMatched(matchIndex, matchLength, matches)) {
            continue;
        }

        matches.push({
            text: matchText,
            type: 'other',
            startIndex: matchIndex,
            endIndex: matchIndex + matchLength
        });
    }
    // -----------------------------------------------------


    // Need to sort matches by start index (descending) to process from end to start. 
    // This is because indices are relative to the entire text, and we need to process from the end to the start.
    // So need to preserve the original order of matches for the redaction process.
    return matches.sort((a, b) => b.startIndex - a.startIndex);

}

/**
 * Get a redaction marker based on the type of sensitive data
 */
export function getRedactionMarker(type: SensitiveDataMatch['type']): string {
    switch (type) {
        case 'email':
            return '[REDACTED EMAIL]';
        case 'phone':
            return '[REDACTED PHONE]';
        case 'ssn':
            return '[REDACTED SSN]';
        case 'creditCard':
            return '[REDACTED CREDIT CARD]';
        case 'name':
            return '[REDACTED NAME]';
        case 'dob':
            return '[REDACTED DOB]';
        case 'orderNumber':
            return '[REDACTED ORDER NUMBER]';
        case 'medicalRecord':
            return '[REDACTED MEDICAL RECORD]';
        case 'address':
            return '[REDACTED ADDRESS]';
        case 'other':
            return '[REDACTED]';
        default:
            return '[REDACTED]';
    }
}


/**
 * Count different types of sensitive data in matches
 */
export function countRedactions(matches: SensitiveDataMatch[]): RedactionResult {
    return {
        redactedCount: matches.length,
        emailCount: matches.filter(m => m.type === 'email').length,
        phoneCount: matches.filter(m => m.type === 'phone').length,
        ssnCount: matches.filter(m => m.type === 'ssn').length,
        creditCardCount: matches.filter(m => m.type === 'creditCard').length,
        nameCount: matches.filter(m => m.type === 'name').length,
        dobCount: matches.filter(m => m.type === 'dob').length,
        orderNumberCount: matches.filter(m => m.type === 'orderNumber').length,
        medicalRecordCount: matches.filter(m => m.type === 'medicalRecord').length,
        addressCount: matches.filter(m => m.type === 'address').length,
        otherCount: matches.filter(m => m.type === 'other').length,
    };
}

/**
 * Output the redacted text with redaction markers --> For testing purposes only.
 */
export  function redactText(text: string, matches: SensitiveDataMatch[]): string {
    let redactedText: string = text;
    
    for (const match of matches) {
        const marker = getRedactionMarker(match.type);

        redactedText = redactedText.slice(0, match.startIndex) + marker + redactedText.slice(match.endIndex);
    }

    return redactedText;
}


// const text: string = `
// Hello John Doe,

// You can reach me at bipin.koirala.bk@gmail.com or bkoirala3@gatech.edu.
// My cell phone number is (662) 380-0332. My SSN number is 123-45-6789.

// Thanks!
// Bipin
// `


// const matches = detectSensitiveData(text);
// console.log("Raw matches:", matches);

// // View Counts
// const stats = countRedactionMatches(matches);
// console.log("\nStats:", stats);

// // View redacted text
// const redactedText = redactText(text, matches);
// console.log("\nRedacted text:", redactedText);