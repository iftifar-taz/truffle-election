App = {
	web3Provider: null,
	contracts: {},
	account: '0x0',
	hasVoted: false,

	init: () => {
		return App.initWeb3();
	},

	initWeb3: () => {
		// TODO: refactor conditional
		if (typeof web3 !== 'undefined') {
			// If a web3 instance is already provided by Meta Mask.
			App.web3Provider = web3.currentProvider;
			web3 = new Web3(web3.currentProvider);
		} else {
			// Specify default instance if no web3 instance provided
			App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
			web3 = new Web3(App.web3Provider);
		}
		console.log("1. web3Object.version = ", web3.version.api);
		return App.initContract();
	},

	initContract: () => {
		$.getJSON("Election.json", (election) => {
			// Instantiate a new truffle contract from the artifact
			App.contracts.Election = TruffleContract(election);
			// Connect provider to interact with contract
			App.contracts.Election.setProvider(App.web3Provider);

			App.listenForEvents();

			return App.render();
		});
	},

	//Listen for events emitted from the contract
	listenForEvents: () => {
		App.contracts.Election.deployed().then((instance) => {
			// Restart Chrome if you are unable to receive this event
			// This is a known issue with Metamask
			// https://github.com/MetaMask/metamask-extension/issues/2393
			instance.votedEvent({}, {
				fromBlock: 0,
				toBlock: 'latest'
			}).watch((error, event) => {
				console.log("event triggered", event)
				// Reload when a new vote is recorded
				App.render();
			});
		});
	},

	render: () => {
		var electionInstance;
		var loader = $("#loader");
		var content = $("#content");

		loader.show();
		content.hide();

		// Load account data
		web3.eth.getCoinbase((err, account) => {
			if (err === null) {
				App.account = account;
				$("#accountAddress").html("Your Account: " + account);
			}
		});

		// Load contract data
		App.contracts.Election.deployed().then((instance) => {
			electionInstance = instance;
			return electionInstance.candidatesCount();
		}).then((candidatesCount) => {
			var candidatesResults = $("#candidatesResults");
			candidatesResults.empty();

			var candidatesSelect = $('#candidatesSelect');
			candidatesSelect.empty();

			for (var i = 1; i <= candidatesCount; i++) {
				electionInstance.candidates(i).then((candidate) => {
					var id = candidate[0];
					var name = candidate[1];
					var voteCount = candidate[2];

					// Render candidate Result
					var candidateTemplate = `
					<tr>
						<td>${id}</td>
						<td>${name}</td>
						<td>${voteCount}</td>
					</tr>`;
					candidatesResults.append(candidateTemplate);

					// Render candidate ballot option
					var candidateOption = `<option value='${id}' >${name}</ option>`;
					candidatesSelect.append(candidateOption);
				});
			}
			return electionInstance.voters(App.account);
		}).then((hasVoted) => {
			// Do not allow a user to vote
			if (hasVoted) {
				$('form').hide();
			}
			loader.hide();
			content.show();
		}).catch((error) => {
			console.warn(error);
		});
	},

	castVote: () => {
		var candidateId = $('#candidatesSelect').val();
		App.contracts.Election.deployed().then((instance) => {
			return instance.vote(candidateId, { from: App.account });
		}).then((result) => {
			// Wait for votes to update
			$("#content").hide();
			$("#loader").show();
		}).catch((err) => {
			console.error(err);
		});
	}
};

$(() => {
	$(window).load(() => {
		App.init();
	});
});