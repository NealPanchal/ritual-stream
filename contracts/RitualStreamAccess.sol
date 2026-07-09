// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RitualStreamAccess
 * @dev Audited, production-safe paywall contract for RitualStream on Ritual Chain Testnet.
 * Optimized for minimum gas using zero-calldata receive() and packed storage slots.
 * Deployed on Ritual Chain Testnet (Chain ID: 1979).
 *
 * Network Details:
 *   Chain ID:    1979
 *   Currency:    RITUAL (18 decimals, testnet)
 *   Block Time:  ~350ms
 *   RPC:         https://rpc.ritualfoundation.org
 *   Explorer:    https://explorer.ritualfoundation.org
 *   Faucet:      https://faucet.ritualfoundation.org
 *
 * TX Types supported: EIP-1559 + 0x10, 0x11, 0x12, 0x77
 */
contract RitualStreamAccess {

    // Constant streaming pass cost (0.001 RITUAL)
    uint256 public constant PASS_COST = 0.001 ether;

    // Access duration (24 hours)
    uint256 public constant PASS_DURATION = 24 hours;

    // Packed Storage Slot 1
    address public owner;
    bool public paused;
    uint8 private _unlocked = 1;

    // Storage Slot 2
    address public pendingOwner;

    // Maps user addresses to their access expiry timestamp
    mapping(address => uint64) public accessExpiry;

    // Maps user addresses to custom lifetime access overrides (Admin set)
    mapping(address => bool) public isLifetimeUser;

    // Events
    event PassUnlocked(address indexed user, uint64 expiresAt);
    event LifetimeAccessGranted(address indexed user);
    event LifetimeAccessRevoked(address indexed user);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused();
    event Unpaused();

    // Custom Errors (Cheaper than revert strings)
    error NotOwner();
    error ReentrantCall();
    error ContractPaused();
    error ContractNotPaused();
    error InvalidPayment();
    error InvalidAddress();
    error NoFundsToWithdraw();
    error WithdrawalFailed();

    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier nonReentrant() {
        if (_unlocked == 0) revert ReentrantCall();
        _unlocked = 0;
        _;
        _unlocked = 1;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier whenPaused() {
        if (!paused) revert ContractNotPaused();
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /**
     * @notice Zero-calldata payment handler
     * @dev Send exactly 0.001 RITUAL here to unlock 24-hour streaming access.
     * Payments from addresses with existing unexpired access extend their pass.
     */
    receive() external payable whenNotPaused {
        if (msg.value != PASS_COST) revert InvalidPayment();

        uint64 currentExpiry = accessExpiry[msg.sender];
        uint64 newExpiry;

        if (currentExpiry > block.timestamp) {
            newExpiry = currentExpiry + uint64(PASS_DURATION);
        } else {
            newExpiry = uint64(block.timestamp + PASS_DURATION);
        }

        accessExpiry[msg.sender] = newExpiry;
        emit PassUnlocked(msg.sender, newExpiry);
    }

    /**
     * @notice Checks if an address has valid unexpired or lifetime access
     * @param user The address to check
     * @return bool True if the user has valid streaming access
     */
    function hasAccess(address user) external view returns (bool) {
        if (isLifetimeUser[user]) return true;
        return accessExpiry[user] > block.timestamp;
    }

    /**
     * @notice Admin function to grant direct lifetime access overrides
     * @param user The address to grant lifetime access to
     */
    function grantLifetimeAccess(address user) external onlyOwner {
        if (user == address(0)) revert InvalidAddress();
        isLifetimeUser[user] = true;
        emit LifetimeAccessGranted(user);
    }

    /**
     * @notice Admin function to revoke lifetime access overrides
     * @param user The address to revoke lifetime access from
     */
    function revokeLifetimeAccess(address user) external onlyOwner {
        if (user == address(0)) revert InvalidAddress();
        isLifetimeUser[user] = false;
        emit LifetimeAccessRevoked(user);
    }

    /**
     * @notice Secure owner withdrawal function with Reentrancy Guard
     * @dev Transfers entire contract balance to owner
     */
    function withdrawFunds() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoFundsToWithdraw();

        (bool success, ) = payable(owner).call{value: balance}("");
        if (!success) revert WithdrawalFailed();

        emit FundsWithdrawn(owner, balance);
    }

    /**
     * @notice Initiates a 2-step transfer of contract ownership to a new account
     * @param newOwner The address of the proposed new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /**
     * @notice Accepts the ownership transfer (step 2 of ownership change)
     * @dev Must be called by the pending owner to complete the transfer
     */
    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotOwner();
        address oldOwner = owner;
        owner = pendingOwner;
        pendingOwner = address(0);
        emit OwnershipTransferred(oldOwner, owner);
    }

    /**
     * @notice Emergency circuit breaker - pauses all incoming payments
     */
    function pausePayments() external onlyOwner whenNotPaused {
        paused = true;
        emit Paused();
    }

    /**
     * @notice Unpauses payment operations after emergency is resolved
     */
    function resumePayments() external onlyOwner whenPaused {
        paused = false;
        emit Unpaused();
    }
}
