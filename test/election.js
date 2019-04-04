var Election = artifacts.require('./Election.sol');

// contract('Election', (accounts) => {
//     it('initializes with tow candidates', () => {
//         return Election.deployed().then((instance) => {
//             return instance.candidatesCount();
//         }).then((count) => {
//             assert.equal(2, count);
//         });
//     });
// });

let instance;
beforeEach(async () => {
    instance = await Election.deployed();
});

contract('Election', (accounts) => {
    // console.log(accounts);
    it('deploys contract', () => {
        assert.ok(instance.address);
    });

    it('initializes with two candidates', async () => {
        candidatesCount = await instance.candidatesCount();
        assert.equal(2, candidatesCount);
    });

    it('candidates has correct values', async () => {
        candidate = await instance.candidates(1);
        assert.equal(1, candidate.id);
        assert.equal('Candidate 1', candidate.name);
        assert.equal(0, candidate.voteCount);
        candidate = await instance.candidates(2);
        assert.equal(2, candidate.id);
        assert.equal('Candidate 2', candidate.name);
        assert.equal(0, candidate.voteCount);
    });

    it('allows a voter to cast vote', async () => {
        const candidateId = 1;
        const account = accounts[0];
        const txReceipt = await instance.vote(candidateId, { from: account });
        // assert.equal(1, txReceipt.logs.length);
        // assert.equal('votedEvent', txReceipt.logs[0].event);
        // assert.equal(candidateId, txReceipt.logs[0].args._candidateId.toNumber());
        const voted = await instance.voters(account);
        assert(voted);
        candidate = await instance.candidates(1);
        assert.equal(1, candidate.voteCount);
    });

    it('throws exception for invalid candidates', async () => {
        const candidateId = 99;
        const account = accounts[1];
        try {
            const txReceipt = await instance.vote(candidateId, { from: account });
            assert(!txReceipt.tx);
        } catch (err) {
            assert(err.message.includes('revert'));
        }
        candidate1 = await instance.candidates(1);
        candidate2 = await instance.candidates(2);
        assert.equal(1, candidate1.voteCount);
        assert.equal(0, candidate2.voteCount);
    });

    it('throws exception for double voting', async () => {
        const candidateId = 1;
        const account = accounts[0];
        try {
            const txReceipt = await instance.vote(candidateId, { from: account });
            assert(!txReceipt.tx);
        } catch (err) {
            assert(err.message.includes('revert'));
        }
        candidate1 = await instance.candidates(1);
        candidate2 = await instance.candidates(2);
        assert.equal(1, candidate1.voteCount);
        assert.equal(0, candidate2.voteCount);
    });

    it('emits votedEvent event', async () => {
        const candidateId = 2;
        const account = accounts[1];
        const txReceipt = await instance.vote(candidateId, { from: account });
        assert.equal(1, txReceipt.logs.length);
        assert.equal('votedEvent', txReceipt.logs[0].event);
        assert.equal(candidateId, txReceipt.logs[0].args._candidateId.toNumber());
    });
});