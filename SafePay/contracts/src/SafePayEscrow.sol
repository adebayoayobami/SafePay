// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title SafePay — Freelance Escrow with AI Jury + Vault + MEZO stake
/// @notice One job = one escrow. Client locks MUSD. Freelancer delivers. AI jury scores. Release / Auto-claim / Dispute with MEZO bond.
/// @dev Testnet: Mezo 31611, MUSD 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503, MEZO 0x7B7c...000001, Vault placeholder until verified
contract SafePayEscrow is Ownable, ReentrancyGuard {
    IERC20 public musd;
    IERC20 public mezo;
    address public vault; // sMUSD vault — if zero, yield step is skipped (safe for testnet bug)

    uint256 public constant MIN_DEADLINE = 1 days;
    uint256 public constant REVIEW_WINDOW = 4 days;
    uint256 public constant DISPUTE_STAKE = 5e18; // 5 MEZO (18 decimals)
    uint256 public constant MIN_AMOUNT = 1e18; // 1 MUSD
    uint256 public nextEscrowId = 1;

    enum Status { FUNDED, DELIVERED, RELEASED, REFUNDED, DISPUTED, RESOLVED }

    struct Escrow {
        address client;
        address freelancer;
        uint256 amount;
        uint256 deadline;
        uint256 deliveredAt;
        uint256 reviewEndsAt;
        Status status;
        string briefHash; // IPFS / brief text hash
        string proofLink;
        bytes32 aiReviewHash; // hash of AI jury JSON (3 models consensus)
        uint8 aiScore; // 0-100, 0 = not reviewed
        address arbiter;
        bool clientStaked;
        bool freelancerStaked;
    }

    mapping(uint256 => Escrow) public escrows;
    mapping(uint256 => uint256) public vaultShares; // escrowId => shares (if vault used)

    event EscrowCreated(uint256 indexed id, address indexed client, address indexed freelancer, uint256 amount, uint256 deadline);
    event Delivered(uint256 indexed id, string proofLink, uint256 reviewEndsAt);
    event AIReviewed(uint256 indexed id, uint8 score, bytes32 reviewHash);
    event Released(uint256 indexed id, uint256 amountWithYield);
    event Refunded(uint256 indexed id);
    event Disputed(uint256 indexed id, address by);
    event Resolved(uint256 indexed id, address winner, uint256 amount);
    event RevisionRequested(uint256 indexed id);

    error TooShortDeadline();
    error NotClient();
    error NotFreelancer();
    error WrongStatus();
    error PastDeadline();
    error NotExpired();
    error LowAIScore();
    error AlreadyStaked();
    error InsufficientStake();

    constructor(address _musd, address _mezo, address _vault) Ownable(msg.sender) {
        musd = IERC20(_musd);
        mezo = IERC20(_mezo);
        vault = _vault;
    }

    function createEscrow(address freelancer, uint256 amount, uint256 deadline, string calldata briefHash) external nonReentrant returns (uint256 id) {
        if (deadline < block.timestamp + MIN_DEADLINE) revert TooShortDeadline();
        if (amount < MIN_AMOUNT) revert WrongStatus();
        if (freelancer == address(0) || freelancer == msg.sender) revert NotFreelancer();
        musd.transferFrom(msg.sender, address(this), amount);
        // auto-deposit to vault if set
        if (vault != address(0)) {
            musd.approve(vault, amount);
            // call vault.deposit(amount) — vault interface may vary, we try low-level and ignore fail for testnet bug
            (bool ok, ) = vault.call(abi.encodeWithSignature("deposit(uint256)", amount));
            if (ok) vaultShares[nextEscrowId] = amount; // placeholder shares = amount until real vault returns shares
        }
        id = nextEscrowId++;
        escrows[id] = Escrow({
            client: msg.sender,
            freelancer: freelancer,
            amount: amount,
            deadline: deadline,
            deliveredAt: 0,
            reviewEndsAt: 0,
            status: Status.FUNDED,
            briefHash: briefHash,
            proofLink: "",
            aiReviewHash: bytes32(0),
            aiScore: 0,
            arbiter: owner(),
            clientStaked: false,
            freelancerStaked: false
        });
        emit EscrowCreated(id, msg.sender, freelancer, amount, deadline);
    }

    function deliver(uint256 id, string calldata proofLink) external {
        Escrow storage e = escrows[id];
        if (msg.sender != e.freelancer) revert NotFreelancer();
        if (e.status != Status.FUNDED) revert WrongStatus();
        if (block.timestamp > e.deadline) revert PastDeadline();
        e.proofLink = proofLink;
        e.deliveredAt = block.timestamp;
        e.reviewEndsAt = block.timestamp + REVIEW_WINDOW;
        e.status = Status.DELIVERED;
        emit Delivered(id, proofLink, e.reviewEndsAt);
    }

    function postAIReview(uint256 id, uint8 score, bytes32 reviewHash) external {
        Escrow storage e = escrows[id];
        if (e.status != Status.DELIVERED) revert WrongStatus();
        // only escrow parties or owner can post (prevents spam)
        if (msg.sender != e.client && msg.sender != e.freelancer && msg.sender != owner()) revert NotClient();
        e.aiScore = score;
        e.aiReviewHash = reviewHash;
        emit AIReviewed(id, score, reviewHash);
    }

    function requestRevision(uint256 id) external {
        Escrow storage e = escrows[id];
        if (msg.sender != e.client) revert NotClient();
        if (e.status != Status.DELIVERED) revert WrongStatus();
        // reset to allow re-deliver (keeps same review window extension)
        e.status = Status.FUNDED;
        e.deliveredAt = 0;
        e.reviewEndsAt = 0;
        emit RevisionRequested(id);
    }

    function release(uint256 id) external nonReentrant {
        Escrow storage e = escrows[id];
        if (msg.sender != e.client) revert NotClient();
        if (e.status != Status.DELIVERED) revert WrongStatus();
        _payout(id, e.freelancer);
        e.status = Status.RELEASED;
        emit Released(id, e.amount);
    }

    function autoClaim(uint256 id) external nonReentrant {
        Escrow storage e = escrows[id];
        if (msg.sender != e.freelancer) revert NotFreelancer();
        if (e.status != Status.DELIVERED) revert WrongStatus();
        if (block.timestamp < e.reviewEndsAt) revert NotExpired();
        if (e.aiScore != 0 && e.aiScore < 60) revert LowAIScore(); // low score must go to dispute
        _payout(id, e.freelancer);
        e.status = Status.RELEASED;
        emit Released(id, e.amount);
    }

    function refundExpired(uint256 id) external nonReentrant {
        Escrow storage e = escrows[id];
        if (e.status != Status.FUNDED) revert WrongStatus();
        if (block.timestamp <= e.deadline) revert NotExpired();
        _payout(id, e.client);
        e.status = Status.REFUNDED;
        emit Refunded(id);
    }

    // Dispute with MEZO stake — both sides must stake 5 MEZO
    function stakeDispute(uint256 id) external nonReentrant {
        Escrow storage e = escrows[id];
        if (e.status != Status.DELIVERED) revert WrongStatus();
        if (msg.sender == e.client) {
            if (e.clientStaked) revert AlreadyStaked();
            mezo.transferFrom(msg.sender, address(this), DISPUTE_STAKE);
            e.clientStaked = true;
        } else if (msg.sender == e.freelancer) {
            if (e.freelancerStaked) revert AlreadyStaked();
            mezo.transferFrom(msg.sender, address(this), DISPUTE_STAKE);
            e.freelancerStaked = true;
        } else revert NotClient();
        emit Disputed(id, msg.sender);
        if (e.clientStaked && e.freelancerStaked) e.status = Status.DISPUTED;
    }

    function resolveDispute(uint256 id, address winner) external onlyOwner nonReentrant {
        Escrow storage e = escrows[id];
        if (e.status != Status.DISPUTED) revert WrongStatus();
        if (winner != e.client && winner != e.freelancer) revert NotFreelancer();
        _payout(id, winner);
        // winner gets both stakes
        uint256 pot = DISPUTE_STAKE * 2;
        mezo.transfer(winner, pot - (pot / 10)); // 90% to winner, 10% to arbiter
        mezo.transfer(owner(), pot / 10);
        e.status = Status.RESOLVED;
        emit Resolved(id, winner, e.amount);
    }

    function _payout(uint256 id, address to) internal {
        Escrow storage e = escrows[id];
        uint256 amt = e.amount;
        // withdraw from vault if used
        if (vault != address(0) && vaultShares[id] > 0) {
            (bool ok, ) = vault.call(abi.encodeWithSignature("withdraw(uint256)", vaultShares[id]));
            if (!ok) { /* fallback to local balance */ }
            vaultShares[id] = 0;
        }
        musd.transfer(to, amt);
    }

    function setVault(address _vault) external onlyOwner { vault = _vault; }
}
