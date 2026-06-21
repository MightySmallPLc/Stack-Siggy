// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Coin Merge — gSiggy NFT + on-chain achievement & score recorder
/// @notice One contract backing the Coin Merge dApp on Ritual testnet (chain 1979).
///         - ERC-721 "gSiggy" collection, one mint per eligible wallet
///         - Records LEGENDARY achievement (eligibility for gSiggy)
///         - Records best score per wallet (only increases)
contract CoinMergeRitual {
    // ============ ERC-721 minimal ============
    string public constant name = "gSiggy";
    string public constant symbol = "GSIG";

    uint256 public totalSupply;
    mapping(uint256 => address) private _ownerOf;
    mapping(address => uint256) private _balanceOf;
    mapping(uint256 => address) private _tokenApproval;
    mapping(address => mapping(address => bool)) private _operatorApproval;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    // ============ Game state ============
    mapping(address => bool) public hasAchievement;
    mapping(address => bool) public hasMinted;
    mapping(address => uint256) public bestScore;
    mapping(address => uint256) public bestTier;
    mapping(address => uint256) public gsiggyTokenId; // 0 if not minted

    event AchievementRecorded(address indexed wallet, uint256 bestScore, uint256 bestTier, uint256 timestamp);
    event ScoreRecorded(address indexed wallet, uint256 score, uint256 tier, uint256 timestamp);
    event GsiggyMinted(address indexed wallet, uint256 indexed tokenId, uint256 timestamp);

    // ============ Achievement / Score ============

    /// @notice Record a LEGENDARY achievement. Idempotent (only first call sets it).
    /// @dev Eligibility for gSiggy mint requires this flag to be true.
    function recordAchievement(uint256 _bestScore, uint256 _bestTier) external {
        if (!hasAchievement[msg.sender]) {
            hasAchievement[msg.sender] = true;
        }
        if (_bestScore > bestScore[msg.sender]) {
            bestScore[msg.sender] = _bestScore;
        }
        if (_bestTier > bestTier[msg.sender]) {
            bestTier[msg.sender] = _bestTier;
        }
        emit AchievementRecorded(msg.sender, bestScore[msg.sender], bestTier[msg.sender], block.timestamp);
    }

    /// @notice Record a best score. Only updates if strictly greater than current best.
    function recordScore(uint256 _score, uint256 _tier) external {
        require(_score > bestScore[msg.sender], "score not improved");
        bestScore[msg.sender] = _score;
        if (_tier > bestTier[msg.sender]) {
            bestTier[msg.sender] = _tier;
        }
        emit ScoreRecorded(msg.sender, _score, _tier, block.timestamp);
    }

    // ============ gSiggy mint ============

    /// @notice Mint the gSiggy NFT. One per wallet, eligibility = recorded achievement.
    function mintGsiggy() external returns (uint256 tokenId) {
        require(hasAchievement[msg.sender], "not eligible");
        require(!hasMinted[msg.sender], "already minted");

        hasMinted[msg.sender] = true;
        totalSupply += 1;
        tokenId = totalSupply;

        _ownerOf[tokenId] = msg.sender;
        _balanceOf[msg.sender] += 1;
        gsiggyTokenId[msg.sender] = tokenId;

        emit Transfer(address(0), msg.sender, tokenId);
        emit GsiggyMinted(msg.sender, tokenId, block.timestamp);
    }

    // ============ ERC-721 views ============

    function balanceOf(address owner) external view returns (uint256) {
        require(owner != address(0), "zero");
        return _balanceOf[owner];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address o = _ownerOf[tokenId];
        require(o != address(0), "no token");
        return o;
    }

    function approve(address to, uint256 tokenId) external {
        address o = _ownerOf[tokenId];
        require(msg.sender == o || _operatorApproval[o][msg.sender], "not authorized");
        _tokenApproval[tokenId] = to;
        emit Approval(o, to, tokenId);
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        require(_ownerOf[tokenId] != address(0), "no token");
        return _tokenApproval[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        _operatorApproval[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) external view returns (bool) {
        return _operatorApproval[owner][operator];
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        require(_ownerOf[tokenId] == from, "wrong owner");
        require(to != address(0), "zero to");
        address sender = msg.sender;
        require(
            sender == from ||
            _tokenApproval[tokenId] == sender ||
            _operatorApproval[from][sender],
            "not authorized"
        );
        delete _tokenApproval[tokenId];
        _balanceOf[from] -= 1;
        _balanceOf[to] += 1;
        _ownerOf[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata) external {
        _transfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == 0x80ac58cd /* ERC721 */ || id == 0x5b5e139f /* metadata */ || id == 0x01ffc9a7 /* ERC165 */;
    }

    // ============ Metadata (on-chain data URI) ============

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_ownerOf[tokenId] != address(0), "no token");
        address holder = _ownerOf[tokenId];
        string memory tierStr = _toString(bestTier[holder]);
        string memory scoreStr = _toString(bestScore[holder]);
        string memory idStr = _toString(tokenId);

        bytes memory svg = abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
            '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
            '<stop offset="0" stop-color="#facc15"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs>',
            '<rect width="400" height="400" fill="#0f0d1a"/>',
            '<circle cx="200" cy="170" r="100" fill="url(#g)"/>',
            '<text x="200" y="185" font-family="monospace" font-size="48" font-weight="bold" text-anchor="middle" fill="#1a1330">gS</text>',
            '<text x="200" y="310" font-family="monospace" font-size="22" text-anchor="middle" fill="#facc15">gSiggy #', idStr, '</text>',
            '<text x="200" y="345" font-family="monospace" font-size="14" text-anchor="middle" fill="#a78bfa">LEGENDARY HOLDER</text>',
            '<text x="200" y="375" font-family="monospace" font-size="12" text-anchor="middle" fill="#6b7280">Score ', scoreStr, ' / Tier ', tierStr, '</text>',
            '</svg>'
        );

        bytes memory json = abi.encodePacked(
            '{"name":"gSiggy #', idStr,
            '","description":"Coin Merge LEGENDARY holder. Minted on Ritual testnet.",',
            '"image":"data:image/svg+xml;base64,', _b64(svg), '",',
            '"attributes":[',
              '{"trait_type":"Best Score","value":', scoreStr, '},',
              '{"trait_type":"Best Tier","value":', tierStr, '},',
              '{"trait_type":"Collection","value":"gSiggy"}',
            ']}'
        );
        return string(abi.encodePacked("data:application/json;base64,", _b64(json)));
    }

    function _toString(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint256 t = v;
        uint256 d;
        while (t != 0) { d++; t /= 10; }
        bytes memory b = new bytes(d);
        while (v != 0) { d--; b[d] = bytes1(uint8(48 + v % 10)); v /= 10; }
        return string(b);
    }

    // Base64 encoding (Brecht Devos, MIT)
    bytes internal constant _B64_TBL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    function _b64(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        uint256 enclen = 4 * ((data.length + 2) / 3);
        bytes memory result = new bytes(enclen);
        bytes memory table = _B64_TBL;
        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)
            for { let i := 0 } lt(i, mload(data)) { } {
                i := add(i, 3)
                let input := and(mload(add(add(data, 32), sub(i, 3))), 0xffffff)
                let out := mload(add(tablePtr, and(shr(18, input), 0x3F)))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(12, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr( 6, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(        input , 0x3F))), 0xFF))
                out := shl(224, out)
                mstore(resultPtr, out)
                resultPtr := add(resultPtr, 4)
            }
            switch mod(mload(data), 3)
            case 1 { mstore(sub(resultPtr, 2), shl(240, 0x3d3d)) }
            case 2 { mstore(sub(resultPtr, 1), shl(248, 0x3d)) }
        }
        return string(result);
    }
}
