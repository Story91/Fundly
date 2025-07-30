// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CrowdfundingPlatform is ReentrancyGuard, Ownable {
    // Interfejs USDC (ERC-20)
    IERC20 public usdcToken;
    
    // Struktura kampanii
    struct Campaign {
        address creator;           // Twórca kampanii
        string name;              // Nazwa kampanii
        string description;       // Opis kampanii
        uint256 goal;            // Cel finansowania w USDC
        uint256 deadline;        // Czas zakończenia (timestamp)
        uint256 totalPledged;    // Zebrane środki
        bool goalReached;        // Czy cel został osiągnięty
        bool claimed;            // Czy środki zostały wypłacone
        bool cancelled;          // Czy kampania została anulowana
        uint256 createdAt;       // Kiedy utworzono kampanię
    }
    
    // Dane platformy
    uint256 public campaignCount;                                    // Liczba kampanii
    uint256 public platformFeePercent = 250;                        // 2.5% opłata platformy (250/10000)
    address public feeRecipient;                                     // Odbiorca opłat platformy
    uint256 public constant MAX_CAMPAIGN_DURATION = 365 days;       // Maksymalny czas kampanii
    uint256 public constant MIN_CAMPAIGN_GOAL = 100 * 10**6;        // Minimalny cel: 100 USDC
    
    // Mapowania
    mapping(uint256 => Campaign) public campaigns;                                    // ID kampanii => kampania
    mapping(uint256 => mapping(address => uint256)) public pledges;                  // ID kampanii => użytkownik => wpłata
    mapping(address => uint256[]) public userCampaigns;                             // Twórca => lista ID kampanii
    mapping(address => uint256[]) public userPledges;                               // Użytkownik => lista ID kampanii gdzie wpłacił
    
    // Wydarzenia
    event CampaignCreated(uint256 indexed campaignId, address indexed creator, string name, uint256 goal, uint256 deadline);
    event Pledged(uint256 indexed campaignId, address indexed backer, uint256 amount);
    event Refunded(uint256 indexed campaignId, address indexed backer, uint256 amount);
    event Claimed(uint256 indexed campaignId, address indexed creator, uint256 amount, uint256 platformFee);
    event CampaignCancelled(uint256 indexed campaignId, address indexed creator);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);

    // Konstruktor
    constructor(address _usdcToken) Ownable(msg.sender) {
        usdcToken = IERC20(_usdcToken);
        feeRecipient = msg.sender; // Właściciel platformy domyślnie otrzymuje opłaty
    }

    // ==================== FUNKCJE DLA WŁAŚCICIELA PLATFORMY ====================
    
    // Zmiana opłaty platformy (maksymalnie 10%)
    function setPlatformFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 1000, "Fee cannot exceed 10%"); // 1000/10000 = 10%
        uint256 oldFee = platformFeePercent;
        platformFeePercent = _feePercent;
        emit PlatformFeeUpdated(oldFee, _feePercent);
    }
    
    // Zmiana odbiorcy opłat platformy
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        address oldRecipient = feeRecipient;
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(oldRecipient, _feeRecipient);
    }

    // ==================== FUNKCJE DLA TWÓRCÓW KAMPANII ====================
    
    // Tworzenie nowej kampanii
    function createCampaign(
        string memory _name,
        string memory _description,
        uint256 _goal,
        uint256 _duration
    ) external returns (uint256) {
        require(bytes(_name).length > 0, "Campaign name required");
        require(bytes(_description).length > 0, "Campaign description required");
        require(_goal >= MIN_CAMPAIGN_GOAL, "Goal too low");
        require(_duration > 0 && _duration <= MAX_CAMPAIGN_DURATION, "Invalid duration");
        
        campaignCount++;
        uint256 deadline = block.timestamp + _duration;
        
        campaigns[campaignCount] = Campaign({
            creator: msg.sender,
            name: _name,
            description: _description,
            goal: _goal,
            deadline: deadline,
            totalPledged: 0,
            goalReached: false,
            claimed: false,
            cancelled: false,
            createdAt: block.timestamp
        });
        
        userCampaigns[msg.sender].push(campaignCount);
        
        emit CampaignCreated(campaignCount, msg.sender, _name, _goal, deadline);
        return campaignCount;
    }
    
    // Anulowanie kampanii przez twórcę (tylko jeśli brak wpłat)
    function cancelCampaign(uint256 _campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.creator == msg.sender, "Not campaign creator");
        require(!campaign.cancelled, "Already cancelled");
        require(!campaign.claimed, "Already claimed");
        require(campaign.totalPledged == 0, "Campaign has pledges");
        require(block.timestamp < campaign.deadline, "Campaign ended");
        
        campaign.cancelled = true;
        emit CampaignCancelled(_campaignId, msg.sender);
    }
    
    // Wypłata środków przez twórcę kampanii
    function claimFunds(uint256 _campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.creator == msg.sender, "Not campaign creator");
        require(block.timestamp >= campaign.deadline, "Campaign still active");
        require(campaign.goalReached, "Goal not reached");
        require(!campaign.claimed, "Already claimed");
        require(!campaign.cancelled, "Campaign cancelled");
        
        campaign.claimed = true;
        
        uint256 totalAmount = campaign.totalPledged;
        uint256 platformFee = (totalAmount * platformFeePercent) / 10000;
        uint256 creatorAmount = totalAmount - platformFee;
        
        // Transfer środków
        if (platformFee > 0) {
            usdcToken.transfer(feeRecipient, platformFee);
        }
        usdcToken.transfer(msg.sender, creatorAmount);
        
        emit Claimed(_campaignId, msg.sender, creatorAmount, platformFee);
    }

    // ==================== FUNKCJE DLA WSPIERAJĄCYCH ====================
    
    // Wpłata na kampanię
    function pledge(uint256 _campaignId, uint256 _amount) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(!campaign.cancelled, "Campaign cancelled");
        require(block.timestamp < campaign.deadline, "Campaign ended");
        require(_amount > 0, "Amount must be greater than 0");
        
        // Transfer USDC od użytkownika do kontraktu
        usdcToken.transferFrom(msg.sender, address(this), _amount);
        
        pledges[_campaignId][msg.sender] += _amount;
        campaign.totalPledged += _amount;
        
        // Dodaj do listy kampanii użytkownika jeśli pierwsza wpłata
        if (pledges[_campaignId][msg.sender] == _amount) {
            userPledges[msg.sender].push(_campaignId);
        }
        
        // Sprawdź czy cel został osiągnięty
        if (campaign.totalPledged >= campaign.goal) {
            campaign.goalReached = true;
        }
        
        emit Pledged(_campaignId, msg.sender, _amount);
    }
    
    // Zwrot środków dla wspierającego
    function refund(uint256 _campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp >= campaign.deadline, "Campaign still active");
        require(!campaign.goalReached || campaign.cancelled, "Goal reached, no refunds");
        require(pledges[_campaignId][msg.sender] > 0, "No pledge to refund");
        
        uint256 amount = pledges[_campaignId][msg.sender];
        pledges[_campaignId][msg.sender] = 0;
        
        // Zwrot USDC użytkownikowi
        usdcToken.transfer(msg.sender, amount);
        
        emit Refunded(_campaignId, msg.sender, amount);
    }

    // ==================== FUNKCJE WIDOKU (VIEW) ====================
    
    // Szczegóły kampanii
    function getCampaign(uint256 _campaignId) external view returns (Campaign memory) {
        return campaigns[_campaignId];
    }
    
    // Status kampanii
    function getCampaignStatus(uint256 _campaignId) external view returns (
        uint256 totalPledged,
        uint256 goal,
        bool goalReached,
        uint256 deadline,
        bool claimed,
        bool cancelled
    ) {
        Campaign storage campaign = campaigns[_campaignId];
        return (
            campaign.totalPledged,
            campaign.goal,
            campaign.goalReached,
            campaign.deadline,
            campaign.claimed,
            campaign.cancelled
        );
    }
    
    // Wpłata użytkownika na kampanię
    function getUserPledge(uint256 _campaignId, address _user) external view returns (uint256) {
        return pledges[_campaignId][_user];
    }
    
    // Lista kampanii użytkownika
    function getUserCampaigns(address _user) external view returns (uint256[] memory) {
        return userCampaigns[_user];
    }
    
    // Lista kampanii gdzie użytkownik wpłacił
    function getUserPledges(address _user) external view returns (uint256[] memory) {
        return userPledges[_user];
    }
    
    // Pozostały czas kampanii
    function getTimeRemaining(uint256 _campaignId) external view returns (uint256) {
        Campaign storage campaign = campaigns[_campaignId];
        if (block.timestamp >= campaign.deadline) {
            return 0;
        }
        return campaign.deadline - block.timestamp;
    }
    
    // Informacje o platformie
    function getPlatformInfo() external view returns (
        uint256 totalCampaigns,
        uint256 feePercent,
        address feeRecipientAddr,
        uint256 minGoal,
        uint256 maxDuration
    ) {
        return (
            campaignCount,
            platformFeePercent,
            feeRecipient,
            MIN_CAMPAIGN_GOAL,
            MAX_CAMPAIGN_DURATION
        );
    }
} 