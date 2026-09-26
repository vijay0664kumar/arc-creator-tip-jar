// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ArcTipJar is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error InvalidAmount();
    error MessageTooLong();
    error ZeroAddress();

    struct Tip {
        address sender;
        uint256 amount;
        string message;
        uint256 timestamp;
    }

    address public creator;
    IERC20 public usdcToken;
    uint256 public totalTipsAmount;
    uint256 public totalTipCount;

    Tip[] public tips;

    event TipReceived(
        address indexed sender,
        uint256 amount,
        string message,
        uint256 timestamp,
        uint256 tipIndex
    );

    event CreatorUpdated(address indexed oldCreator, address indexed newCreator);
    event UsdcTokenUpdated(address indexed oldToken, address indexed newToken);

    constructor(address _creator, address _usdcToken) Ownable(msg.sender) {
        if (_creator == address(0) || _usdcToken == address(0)) {
            revert ZeroAddress();
        }

        creator = _creator;
        usdcToken = IERC20(_usdcToken);
    }

    function sendTip(uint256 amount, string calldata message) external nonReentrant {
        if (amount == 0) {
            revert InvalidAmount();
        }
        if (bytes(message).length > 280) {
            revert MessageTooLong();
        }

        usdcToken.safeTransferFrom(msg.sender, creator, amount);

        tips.push(
            Tip({sender: msg.sender, amount: amount, message: message, timestamp: block.timestamp})
        );

        uint256 tipIndex = tips.length - 1;
        totalTipsAmount += amount;
        totalTipCount += 1;

        emit TipReceived(msg.sender, amount, message, block.timestamp, tipIndex);
    }

    function getRecentTips(uint256 count) external view returns (Tip[] memory) {
        uint256 tipsLength = tips.length;
        if (count > tipsLength) {
            count = tipsLength;
        }

        Tip[] memory recentTips = new Tip[](count);
        for (uint256 i = 0; i < count; ) {
            recentTips[i] = tips[tipsLength - 1 - i];
            unchecked {
                ++i;
            }
        }

        return recentTips;
    }

    function getTipsCount() external view returns (uint256) {
        return tips.length;
    }

    function updateCreator(address newCreator) external onlyOwner {
        if (newCreator == address(0)) {
            revert ZeroAddress();
        }

        address oldCreator = creator;
        creator = newCreator;
        emit CreatorUpdated(oldCreator, newCreator);
    }

    function updateUsdcToken(address newToken) external onlyOwner {
        if (newToken == address(0)) {
            revert ZeroAddress();
        }

        address oldToken = address(usdcToken);
        usdcToken = IERC20(newToken);
        emit UsdcTokenUpdated(oldToken, newToken);
    }
}
