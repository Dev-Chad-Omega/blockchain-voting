// Configuration
const CANDIDATES = ['Alice', 'Bob', 'Charlie'];
let isProcessing = false;

// Initialize elements after DOM is fully loaded
let voteForm, voterIdInput, candidatesList, resultsTable, verificationResult, notificationToast, toast;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing application...');
    try {
        // Initialize DOM elements
        voteForm = document.getElementById('voteForm');
        if (!voteForm) throw new Error('Vote form not found');
        
        voterIdInput = document.getElementById('voterId');
        if (!voterIdInput) throw new Error('Voter ID input not found');
        
        candidatesList = document.querySelector('.candidates-list');
        if (!candidatesList) throw new Error('Candidates list not found');
        
        resultsTable = document.getElementById('resultsTable');
        if (!resultsTable) throw new Error('Results table not found');
        
        verificationResult = document.getElementById('verificationResult');
        if (!verificationResult) throw new Error('Verification result not found');
        
        notificationToast = document.getElementById('notificationToast');
        if (!notificationToast) throw new Error('Notification toast not found');
        
        toast = new bootstrap.Toast(notificationToast);
        console.log('All DOM elements initialized successfully');

        // Initialize the application
        initializeCandidates();
        
        // Add single form submit handler
        voteForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const rect = submitButton.getBoundingClientRect();
            console.log('Form submitted:', JSON.stringify({
                buttonRect: {
                    top: Math.round(rect.top),
                    bottom: Math.round(rect.bottom),
                    left: Math.round(rect.left),
                    right: Math.round(rect.right)
                },
                target: {
                    tag: event.target.tagName,
                    id: event.target.id,
                    class: event.target.className
                }
            }, null, 2));
            await handleVoteSubmission(event);
        });
        
        updateResults();
        console.log('Application initialized successfully');
        
        // Add tab change handlers
        document.querySelectorAll('a[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (event) => {
                console.log('Tab changed:', event.target.getAttribute('href'));
                if (event.target.getAttribute('href') === '#results') {
                    updateResults();
                }
            });
        });
    } catch (error) {
        console.error('Error initializing application:', error);
        showNotification('Error initializing application. Please refresh the page.', true);
    }
});

// Initialize candidate options
function initializeCandidates() {
    console.log('Initializing candidates...');
    CANDIDATES.forEach((candidate, index) => {
        const div = document.createElement('div');
        div.className = 'candidate-option';
        div.innerHTML = `
            <div class="form-check">
                <input class="form-check-input" type="radio" name="candidate" 
                       id="candidate${index}" value="${candidate}" required>
                <label class="form-check-label" for="candidate${index}">
                    ${candidate}
                </label>
            </div>
        `;
        candidatesList.appendChild(div);

        // Add click handler for the entire option div
        div.addEventListener('click', () => {
            const radio = div.querySelector('input[type="radio"]');
            radio.checked = true;
            document.querySelectorAll('.candidate-option').forEach(opt => 
                opt.classList.remove('selected'));
            div.classList.add('selected');
        });
    });
}

// Show notification with optional auto-hide
function showNotification(message, isError = false) {
    console.log(`Notification: ${message} (${isError ? 'error' : 'success'})`);
    try {
        const toastBody = notificationToast.querySelector('.toast-body');
        toastBody.textContent = message;
        notificationToast.classList.toggle('bg-danger', isError);
        notificationToast.classList.toggle('text-white', isError);
        toast.show();
    } catch (error) {
        console.error('Error showing notification:', error);
        alert(message); // Fallback to alert if toast fails
    }
}

// Handle vote submission with loading state and error handling
async function handleVoteSubmission(event) {
    event.preventDefault();
    console.log('Processing vote submission...');
    
    try {
        if (isProcessing) {
            console.log('Already processing a vote');
            return;
        }

        const voterId = voterIdInput.value.trim();
        const candidateInput = document.querySelector('input[name="candidate"]:checked');
        
        console.log('Form data:', { 
            voterId, 
            candidateSelected: candidateInput?.value || 'none' 
        });

        if (!voterId) {
            console.log('No voter ID provided');
            showNotification('Please enter your Voter ID', true);
            return;
        }

        if (!candidateInput) {
            console.log('No candidate selected');
            showNotification('Please select a candidate', true);
            return;
        }

        isProcessing = true;
        const submitButton = voteForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        submitButton.disabled = true;

        try {
            showLoading('Processing vote...');
            console.log('Adding vote to blockchain...');

            // Simulate network delay for demonstration
            await new Promise(resolve => setTimeout(resolve, 1000));

            const result = votingSystem.addVote(voterId, candidateInput.value);
            console.log('Vote result:', result);
            
            if (result.success) {
                console.log('Vote successful, updating UI...');
                showNotification(result.message);
                voteForm.reset();
                document.querySelectorAll('.candidate-option').forEach(opt => 
                    opt.classList.remove('selected'));
                await updateResults();
            } else {
                console.log('Vote failed:', result.message);
                showNotification(result.message, true);
            }
        } catch (error) {
            console.error('Vote submission error:', error);
            showNotification('An error occurred while processing your vote', true);
        } finally {
            console.log('Vote processing completed');
            hideLoading();
            isProcessing = false;
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    } catch (error) {
        console.error('Unexpected error in vote submission:', error);
        showNotification('An unexpected error occurred', true);
    }
}

// Update results table with loading state
async function updateResults() {
    console.log('Updating results...');
    showLoading('Updating results...');
    try {
        resultsTable.innerHTML = '';
        const results = votingSystem.getResults();
        console.log('Current results:', results);
        
        results.forEach(result => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${result.candidate}</td>
                <td>${result.votes}</td>
                <td>${result.percentage}%</td>
            `;
            resultsTable.appendChild(row);
        });

        // Add total votes row
        const totalVotes = votingSystem.getTotalVotes();
        if (totalVotes > 0) {
            const totalRow = document.createElement('tr');
            totalRow.className = 'table-secondary';
            totalRow.innerHTML = `
                <td><strong>Total</strong></td>
                <td><strong>${totalVotes}</strong></td>
                <td><strong>100.0%</strong></td>
            `;
            resultsTable.appendChild(totalRow);
        }
    } catch (error) {
        console.error('Error updating results:', error);
        showNotification('Error updating results', true);
    } finally {
        hideLoading();
    }
}

// Verify blockchain with loading state and detailed feedback
async function verifyBlockchain() {
    console.log('Starting blockchain verification...');
    if (isProcessing) return;
    isProcessing = true;

    const verifyButton = document.querySelector('#verify button');
    const originalText = verifyButton.textContent;
    verifyButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verifying...';
    verifyButton.disabled = true;

    try {
        showLoading('Verifying blockchain integrity...');
        console.log('Current chain length:', votingSystem.chain.length);

        // Simulate verification delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const result = votingSystem.isChainValid();
        console.log('Verification result:', result);
        
        const verificationStatus = document.querySelector('.verification-status');
        verificationStatus.classList.remove('valid', 'invalid');
        verificationStatus.classList.add(result.valid ? 'valid' : 'invalid');

        let message = `<div class="p-3">
            <h5 class="mb-3">${result.valid ? '✓ Verification Successful' : '⚠ Verification Failed'}</h5>
            <p class="mb-2">${result.message}</p>
            <div class="mt-3 text-muted">
                <small>Last verified: ${new Date().toLocaleString()}</small><br>
                <small>Total blocks: ${votingSystem.chain.length}</small><br>
                <small>Total votes: ${votingSystem.getTotalVotes()}</small>
                <small>Chain hash: ${votingSystem.getLatestBlock().hash.substring(0, 16)}...</small>
            </div>
        </div>`;

        verificationResult.innerHTML = message;
        
        if (!result.valid) {
            showNotification('Blockchain verification failed!', true);
        }
    } catch (error) {
        console.error('Verification error:', error);
        showNotification('An error occurred during verification', true);
    } finally {
        hideLoading();
        isProcessing = false;
        verifyButton.innerHTML = originalText;
        verifyButton.disabled = false;
    }
}

// Loading overlay functions
function showLoading(text = 'Processing...') {
    console.log('Show loading:', text);
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    if (loadingText) loadingText.textContent = text;
    if (loadingOverlay) loadingOverlay.classList.remove('d-none');
}

function hideLoading() {
    console.log('Hide loading');
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) loadingOverlay.classList.add('d-none');
}
