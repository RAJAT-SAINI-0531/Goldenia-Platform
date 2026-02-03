// Manual Test Script for Milestone 2
// This shows you how to test the wallet features manually

/*
  STEP-BY-STEP TESTING GUIDE
  ==========================

  1. SIGNUP/LOGIN:
     - Go to http://localhost:3000
     - Click "Get Started" or go to /signup
     - Create account: test@example.com / password123 / password123
     - You'll be redirected to dashboard
  
  2. VIEW WALLETS:
     - On dashboard, you should see 4 wallet cards:
       * FIAT Wallet ($ symbol) - Balance: 0.00 USD
       * GOLD Wallet (Au symbol) - Balance: 0.00 grams
       * SILVER Wallet (Ag symbol) - Balance: 0.00 grams
       * BPC Wallet (BPC symbol) - Balance: 0.00 BPC
     
     ✅ If you see all 4 wallets → Milestone 2 Part 1 WORKS!

  3. ADD MONEY (Using API):
     - Open a new terminal
     - Run these commands to add money to your FIAT wallet:
     
     First, login and get your token:
     ```powershell
     $response = Invoke-RestMethod -Uri "http://localhost:4000/api/v1/auth/login" `
       -Method POST `
       -Headers @{"Content-Type"="application/json"} `
       -Body '{"email":"test@example.com","password":"password123"}'
     
     $token = $response.accessToken
     echo "Token: $token"
     ```
     
     Then, get your wallets:
     ```powershell
     $wallets = Invoke-RestMethod -Uri "http://localhost:4000/api/v1/wallet/my-wallets" `
       -Headers @{"Authorization"="Bearer $token"}
     
     $fiatWallet = $wallets.wallets | Where-Object { $_.type -eq "fiat" }
     $fiatWalletId = $fiatWallet.id
     echo "FIAT Wallet ID: $fiatWalletId"
     ```
     
     Finally, deposit $1000:
     ```powershell
     Invoke-RestMethod -Uri "http://localhost:4000/api/v1/wallet/$fiatWalletId/deposit" `
       -Method POST `
       -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
       -Body '{"amount":1000}'
     ```
     
     ✅ If deposit succeeds → Refresh your dashboard → You should see FIAT: 1000.00 USD

  4. TRANSFER MONEY:
     - On dashboard, click "Transfer Money" button
     - From Wallet: Select "FIAT - Balance: 1000.00 USD"
     - To Wallet: Select "BPC - Balance: 0.00 BPC"
     - Amount: Enter 500
     - Description: Enter "Test transfer"
     - Click "Transfer"
     
     ✅ If you see "Transfer successful!" → Check dashboard:
        - FIAT Wallet should show: 500.00 USD
        - BPC Wallet should show: 500.00 BPC
     
     ✅ If balances updated → Milestone 2 Part 2 WORKS!

  5. VIEW TRANSACTIONS:
     - On dashboard, click "View Transactions" on FIAT wallet card
     - You should see 2 transactions:
       * Deposit to wallet: +1000.00
       * Test transfer: -500.00
     
     ✅ If you see transaction history → Milestone 2 Part 3 WORKS!

  6. TEST VALIDATION:
     - Try to transfer more money than you have (e.g., 10000)
     - You should see error: "Insufficient balance"
     
     ✅ If error shows → Validation WORKS!

  WHAT TO LOOK FOR:
  =================
  ✅ All 4 wallets visible on dashboard
  ✅ Balances display correctly
  ✅ Transfer form works
  ✅ Balances update after transfer
  ✅ Transaction history shows all movements
  ✅ Insufficient balance error works
  ✅ Cannot transfer to same wallet

  IF EVERYTHING ABOVE WORKS → MILESTONE 2 IS COMPLETE! 🎉
*/

console.log('See comments above for testing instructions');
