/**
 * Interface for sensitive data
 */

export interface SensitiveDataMatch {
    text: string;
    type: 'email' | 'phone' | 'name' | 'ssn' | 'creditCard' | 'dob' | 'orderNumber' | 'medicalRecord' | 'address' | 'other';
    startIndex: number;
    endIndex: number;
}

export interface RedactionResult {
    redactedCount: number;
    emailCount: number;
    phoneCount: number;
    ssnCount: number;
    creditCardCount: number;
    nameCount: number;
    dobCount: number;
    orderNumberCount: number;
    medicalRecordCount: number;
    addressCount: number;
    otherCount: number;
}
