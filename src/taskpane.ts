// This is the main entry point for the doco challenge add-in.


import { performRedaction, isTrackingChangesSupported } from './wordOperations.js';


/**
* Initialize the Office.js add-in
**/
Office.onReady((info) => {
    console.log(`Office.js add-in initialized: ${info.host} - ${info.platform}`);
    if (info.host == Office.HostType.Word) {
        initializeUI();
    } else {
    }
});

/**
 * Setup the User Interface
 */
function initializeUI(): void {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c1f303d6-7056-462d-80d5-e2ed6a2e63aa',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'taskpane.ts:24',message:'initializeUI called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    const appBody = document.getElementById('app-body'); // DOM element for the task pane content
    if (!appBody) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/c1f303d6-7056-462d-80d5-e2ed6a2e63aa',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'taskpane.ts:27',message:'App body element not found',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
        console.error('App body element not found');
        return;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c1f303d6-7056-462d-80d5-e2ed6a2e63aa',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'taskpane.ts:31',message:'About to set innerHTML',data:{currentInnerHTML:appBody.innerHTML.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion

    // Create UI elements
    appBody.innerHTML = `
        <div class="container">
            <h1><center>Auto Redactor</center></h1>
            <p class="description">
                <i>Easiest way to redact sensitive information from documents.</i>
            </p>
            
            <div class="status" id="status"></div>
            <br>
            <button id="redactButton" class="redact-button">Redact</button>

            <div class="result" id="result"></div>
        </div>

        <div class="footer-container">
            <div class="footer-logos">
                <img src="https://localhost:3000/assets/word.png" alt="Icon" class="footer-icon" />
                <img src="https://localhost:3000/assets/text.svg" alt="Company Logo" class="footer-logo" />
            </div>

            <div class="credits">
                <p>Source code: <a href="https://github.com/b53k/Word-Redaction-Add-In" target="_blank">Repository</a></p>
            </div>

            <div class="footer-credits">
                <p>Bipin Koirala</p>
            </div>
        </div>
    `;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c1f303d6-7056-462d-80d5-e2ed6a2e63aa',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'taskpane.ts:46',message:'innerHTML set, looking for button',data:{newInnerHTML:appBody.innerHTML.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion

    // Add event listener to the redact button
    const redactButton = document.getElementById('redactButton');
    if (redactButton) {
        redactButton.addEventListener('click', handleRedactClick);
    }

    // Check and display tracking changes support
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
        if (isTrackingChangesSupported()) {
            statusDiv.textContent = 'Tracking changes supported';
            statusDiv.className = 'status: success';
        } else {
            statusDiv.textContent = 'Tracking changes not supported';
            statusDiv.className = 'status: warning';
        }
    }
}

/**
 * Handle the redact button click event
 */
async function handleRedactClick(): Promise<void> {
    const button = document.getElementById('redactButton') as HTMLButtonElement;
    const resultsDiv = document.getElementById('result');

    if (!button || !resultsDiv) {
        return;
    }

    // Disable button and show loading state
    button.disabled = true;
    button.textContent = 'Processing...';
    resultsDiv.innerHTML = '';

    try {
        const result = await performRedaction();

        // Display results
        resultsDiv.innerHTML = `
            <div class="result-success">
                <h3>Done!</h3>
                <ul>
                <li><b>Total redactions:</b> ${result.redactedCount}</li>
                <li>Name: ${result.nameCount}</li>
                <li>Email: ${result.emailCount}</li>
                <li>Phone: ${result.phoneCount}</li>
                <li>SSN: ${result.ssnCount}</li>
                <li>Credit Card: ${result.creditCardCount}</li>
                <li>Misc: ${result.dobCount +result.orderNumberCount + result.medicalRecordCount + result.addressCount + result.otherCount}</li>
                </ul>
            </div>
        `;

        button.textContent = 'Redact Document';
    } catch (error) {
        console.error('Error performing redaction:', error);
        resultsDiv.innerHTML = `
            <div class="result-error">
                <h3>Error</h3>
                <p>An error occurred while redaction the document. Please check the console for details andtry again.</p>
            </div>
        `;
        button.textContent = 'Redact Document';
    } finally {
        button.disabled = false;
    }
}

