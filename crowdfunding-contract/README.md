# 🎯 Crowdfunding Escrow Smart Contract

Inteligentny kontrakt dla crowdfundingu na sieci Base z wykorzystaniem USDC jako waluty płatności.

## 📋 Funkcjonalności

- **Wpłaty (Pledge)**: Użytkownicy mogą wpłacać USDC na kampanię
- **Zwroty (Refund)**: Automatyczne zwroty jeśli cel nie zostanie osiągnięty
- **Wypłaty (Claim)**: Twórca może wypłacić środki po osiągnięciu celu
- **Zabezpieczenia**: Ochrona przed reentrancy i innymi atakami
- **Kompatybilność z BasePay**: Możliwość płatności przez system Coinbase

## 🚀 Szybki start

### 1. Instalacja

```bash
cd crowdfunding-contract
npm install
```

### 2. Konfiguracja

Skopiuj plik `.env.example` do `.env` i wypełnij zmienne:

```bash
cp .env.example .env
```

Edytuj `.env` i dodaj:
- `PRIVATE_KEY` - klucz prywatny portfela (bez prefiksu 0x)
- `BASESCAN_API_KEY` - klucz API z Basescan.org

### 3. Kompilacja

```bash
npm run compile
```

### 4. Deployment

#### Na testnet Base Sepolia:
```bash
npm run deploy:baseSepolia
```

#### Na mainnet Base:
```bash
npm run deploy:base
```

## 🛠️ Struktura projektu

```
crowdfunding-contract/
├── contracts/
│   └── CrowdfundingEscrow.sol    # Główny kontrakt
├── scripts/
│   └── deploy.js                 # Skrypt deploymentu
├── hardhat.config.js             # Konfiguracja Hardhat
├── package.json                  # Zależności projektu
├── .env.example                  # Przykład zmiennych środowiskowych
└── README.md                     # Ta dokumentacja
```

## 📜 Opis kontraktu

### Główne funkcje:

#### `pledge(uint256 _amount)`
- Wpłata USDC na kampanię
- Wymaga wcześniejszego `approve` na kontrakcie USDC
- Automatycznie sprawdza czy cel został osiągnięty

#### `refund()`
- Zwrot wpłaconych środków
- Dostępne tylko po zakończeniu kampanii
- Tylko jeśli cel nie został osiągnięty

#### `claim()`
- Wypłata środków dla twórcy kampanii
- Tylko po zakończeniu kampanii
- Tylko jeśli cel został osiągnięty

#### `getCampaignStatus()`
- Zwraca status kampanii: zebrane środki, cel, czy osiągnięty, deadline

### Parametry kampanii:

- **Goal**: Cel finansowania w USDC (z uwzględnieniem 6 miejsc po przecinku)
- **Duration**: Czas trwania kampanii w sekundach
- **USDC Token**: Adres kontraktu USDC na sieci Base

## 🔒 Bezpieczeństwo

Kontrakt wykorzystuje sprawdzone biblioteki OpenZeppelin:

- `ReentrancyGuard` - ochrona przed atakami reentrancy
- `Ownable` - kontrola dostępu do funkcji administratora
- `IERC20` - standardowy interfejs tokenów ERC-20

## 🌐 Adresy USDC na Base

- **Base Mainnet**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Base Sepolia**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## 💳 Integracja z BasePay

Kontrakt jest w pełni kompatybilny z BasePay (system płatności Coinbase):

1. Użytkownicy mogą płacić przez portfele kompatybilne z Base
2. Obsługa MetaMask, Coinbase Wallet i innych
3. Niskie opłaty dzięki sieci Base
4. Natywna obsługa USDC

### Przykład integracji frontend:

```javascript
// 1. Zatwierdzenie USDC
const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, signer);
await usdcContract.approve(crowdfundingAddress, amount);

// 2. Wpłata na kampanię
const crowdfunding = new ethers.Contract(crowdfundingAddress, crowdfundingAbi, signer);
await crowdfunding.pledge(amount);
```

## 🧪 Testowanie

```bash
# Uruchom lokalna sieć blockchain
npm run node

# W drugim terminalu - deploy na localhost
npm run deploy:local
```

## 📊 Monitoring i weryfikacja

Po deploymencie możesz:

1. **Zweryfikować kontrakt** na Basescan.org
2. **Monitorować transakcje** przez eventi emitowane przez kontrakt
3. **Sprawdzać status** kampanii przez funkcje `view`

## 🤝 Współpraca

1. Fork projekt
2. Stwórz branch dla swojej funkcjonalności
3. Commit zmiany
4. Pushuj do branch
5. Otwórz Pull Request

## 📄 Licencja

MIT License - zobacz szczegóły w pliku LICENSE.

## ⚠️ Ważne uwagi

- **Testuj zawsze na testnecie** przed deploymentem na mainnet
- **Nie commituj kluczy prywatnych** do repozytorium
- **Przeprowadź audyt** przed użyciem w produkcji
- **Zweryfikuj adresy USDC** przed deploymentem 