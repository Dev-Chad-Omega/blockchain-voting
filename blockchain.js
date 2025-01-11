class Block {
    constructor(voterId, vote, timestamp, previousHash = '') {
        this.voterId = voterId;
        this.vote = vote;
        this.timestamp = timestamp;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = this.calculateHash();
        console.log('New block created:', {
            voterId,
            vote,
            timestamp: new Date(timestamp).toISOString(),
            hash: this.hash.substring(0, 16) + '...'
        });
    }

    calculateHash() {
        return CryptoJS.SHA256(
            this.voterId +
            this.vote +
            this.timestamp +
            this.previousHash +
            this.nonce
        ).toString();
    }

    mineBlock(difficulty) {
        console.log(`Mining block with difficulty ${difficulty}...`);
        const startTime = Date.now();
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        const endTime = Date.now();
        console.log(`Block mined in ${endTime - startTime}ms. Hash: ${this.hash.substring(0, 16)}...`);
    }
}

class Blockchain {
    constructor() {
        console.log('Initializing blockchain...');
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.voters = new Set();
        this.candidates = new Map();
        console.log('Blockchain initialized with genesis block');
    }

    createGenesisBlock() {
        return new Block("0", "Genesis Block", Date.now(), "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addVote(voterId, candidate) {
        console.log('Processing vote:', { voterId, candidate });
        
        try {
            // Check if voter has already voted
            if (this.voters.has(voterId)) {
                console.log('Duplicate vote attempt:', voterId);
                return {
                    success: false,
                    message: "Error: You have already voted!"
                };
            }

            // Create and mine new block
            console.log('Creating new block for vote...');
            const block = new Block(
                voterId,
                candidate,
                Date.now(),
                this.getLatestBlock().hash
            );
            
            block.mineBlock(this.difficulty);

            // Add block to chain
            this.chain.push(block);
            console.log('Block added to chain. Chain length:', this.chain.length);

            // Record voter and update candidate votes
            this.voters.add(voterId);
            this.candidates.set(
                candidate,
                (this.candidates.get(candidate) || 0) + 1
            );

            console.log('Vote recorded successfully:', {
                candidate,
                totalVotes: this.getTotalVotes(),
                candidateVotes: this.candidates.get(candidate)
            });

            return {
                success: true,
                message: `Vote successfully cast for ${candidate}!`
            };
        } catch (error) {
            console.error('Error processing vote:', error);
            return {
                success: false,
                message: "Error: Failed to process vote. Please try again."
            };
        }
    }

    isChainValid() {
        console.log('Verifying blockchain integrity...');
        try {
            for (let i = 1; i < this.chain.length; i++) {
                const currentBlock = this.chain[i];
                const previousBlock = this.chain[i - 1];

                console.log(`Verifying block ${i}:`, {
                    currentHash: currentBlock.hash.substring(0, 16) + '...',
                    previousHash: currentBlock.previousHash.substring(0, 16) + '...'
                });

                // Verify current block's hash
                if (currentBlock.hash !== currentBlock.calculateHash()) {
                    console.error('Invalid block hash detected:', {
                        blockIndex: i,
                        storedHash: currentBlock.hash,
                        calculatedHash: currentBlock.calculateHash()
                    });
                    return {
                        valid: false,
                        message: "Error: Current hash is invalid!"
                    };
                }

                // Verify chain linkage
                if (currentBlock.previousHash !== previousBlock.hash) {
                    console.error('Chain linkage broken:', {
                        blockIndex: i,
                        previousBlockHash: previousBlock.hash,
                        currentBlockPreviousHash: currentBlock.previousHash
                    });
                    return {
                        valid: false,
                        message: "Error: Chain linkage is broken!"
                    };
                }
            }

            console.log('Blockchain verification completed successfully');
            return {
                valid: true,
                message: "Blockchain is valid! No tampering detected."
            };
        } catch (error) {
            console.error('Error during blockchain verification:', error);
            return {
                valid: false,
                message: "Error: Verification process failed!"
            };
        }
    }

    getResults() {
        console.log('Retrieving voting results...');
        const results = [];
        const totalVotes = Array.from(this.candidates.values()).reduce((a, b) => a + b, 0);

        for (const [candidate, votes] of this.candidates) {
            const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
            results.push({ candidate, votes, percentage });
            console.log('Candidate results:', { candidate, votes, percentage });
        }

        return results.sort((a, b) => b.votes - a.votes);
    }

    getTotalVotes() {
        return this.voters.size;
    }

    getVoterIds() {
        return Array.from(this.voters);
    }

    // Debug methods
    debug = {
        getChainState: () => ({
            chainLength: this.chain.length,
            lastBlock: this.getLatestBlock(),
            totalVoters: this.voters.size,
            candidateVotes: Object.fromEntries(this.candidates)
        }),
        validateBlock: (block) => ({
            hash: block.hash,
            previousHash: block.previousHash,
            timestamp: new Date(block.timestamp).toISOString(),
            isValid: block.hash === block.calculateHash()
        })
    };
}

// Initialize blockchain with error handling
let votingSystem;
try {
    console.log('Creating new blockchain instance...');
    votingSystem = new Blockchain();
    window.votingSystem = votingSystem;
    console.log('Blockchain system ready:', votingSystem.debug.getChainState());
} catch (error) {
    console.error('Failed to initialize blockchain:', error);
    throw new Error('Blockchain initialization failed');
}
