// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title EvidenceRegistry — Territorio 360
/// @notice Ancla huellas SHA-256 de evidencias territoriales. Los documentos nunca se guardan on-chain.
/// @dev Registrar una huella prueba existencia e integridad, no veracidad. La validación requiere
///      una atestación de un verificador distinto de quien presentó la evidencia.
contract EvidenceRegistry {
    enum Verdict {
        None,
        Contrasted,
        Rejected
    }

    struct Evidence {
        bytes32 projectId;
        bytes32 commitmentId;
        address submitter;
        uint64 timestamp;
        uint64 blockNumber;
        string offchainRef;
    }

    struct Attestation {
        address verifier;
        Verdict verdict;
        uint64 timestamp;
    }

    address public owner;
    mapping(address => bool) public isVerifier;
    mapping(bytes32 => Evidence) private _evidences;
    mapping(bytes32 => Attestation[]) private _attestations;
    mapping(bytes32 => mapping(address => bool)) public hasAttested;
    uint256 public evidenceCount;

    uint256 public constant MAX_REF_LENGTH = 200;

    event EvidenceRegistered(
        bytes32 indexed evidenceHash,
        bytes32 indexed projectId,
        bytes32 indexed commitmentId,
        address submitter,
        uint256 timestamp,
        string offchainRef
    );
    event EvidenceAttested(bytes32 indexed evidenceHash, address indexed verifier, Verdict verdict, uint256 timestamp);
    event VerifierUpdated(address indexed verifier, bool enabled);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error NotVerifier();
    error ZeroHash();
    error AlreadyRegistered(bytes32 evidenceHash);
    error UnknownEvidence(bytes32 evidenceHash);
    error SelfAttestation();
    error AlreadyAttested();
    error InvalidVerdict();
    error RefTooLong();
    error ZeroAddress();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setVerifier(address verifier, bool enabled) external onlyOwner {
        if (verifier == address(0)) revert ZeroAddress();
        isVerifier[verifier] = enabled;
        emit VerifierUpdated(verifier, enabled);
    }

    /// @param offchainRef Referencia opaca al archivo (p. ej. id de objeto en OCI). No incluir datos personales.
    function registerEvidence(bytes32 projectId, bytes32 commitmentId, bytes32 evidenceHash, string calldata offchainRef)
        external
    {
        if (evidenceHash == bytes32(0)) revert ZeroHash();
        if (_evidences[evidenceHash].submitter != address(0)) revert AlreadyRegistered(evidenceHash);
        if (bytes(offchainRef).length > MAX_REF_LENGTH) revert RefTooLong();

        _evidences[evidenceHash] = Evidence({
            projectId: projectId,
            commitmentId: commitmentId,
            submitter: msg.sender,
            timestamp: uint64(block.timestamp),
            blockNumber: uint64(block.number),
            offchainRef: offchainRef
        });
        unchecked {
            evidenceCount++;
        }
        emit EvidenceRegistered(evidenceHash, projectId, commitmentId, msg.sender, block.timestamp, offchainRef);
    }

    function attestEvidence(bytes32 evidenceHash, Verdict verdict) external {
        if (!isVerifier[msg.sender]) revert NotVerifier();
        Evidence storage ev = _evidences[evidenceHash];
        if (ev.submitter == address(0)) revert UnknownEvidence(evidenceHash);
        if (ev.submitter == msg.sender) revert SelfAttestation();
        if (verdict == Verdict.None) revert InvalidVerdict();
        if (hasAttested[evidenceHash][msg.sender]) revert AlreadyAttested();

        hasAttested[evidenceHash][msg.sender] = true;
        _attestations[evidenceHash].push(Attestation(msg.sender, verdict, uint64(block.timestamp)));
        emit EvidenceAttested(evidenceHash, msg.sender, verdict, block.timestamp);
    }

    function isRegistered(bytes32 evidenceHash) external view returns (bool) {
        return _evidences[evidenceHash].submitter != address(0);
    }

    function getEvidence(bytes32 evidenceHash) external view returns (Evidence memory) {
        return _evidences[evidenceHash];
    }

    function getAttestations(bytes32 evidenceHash) external view returns (Attestation[] memory) {
        return _attestations[evidenceHash];
    }
}
