// Wallet Compatibility Script
// This script helps manage conflicts between multiple Solana wallet extensions

(function() {
  'use strict';
  
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Filter out known wallet extension conflicts
  const walletErrorPatterns = [
    /Cannot redefine property.*ethereum/,
    /Cannot redefine property.*solana/,
    /Cannot redefine property.*phantom/,
    /Failed to define property/,
    /error inject ethereum/,
    /Could not assign.*provider/
  ];
  
  // Override console.error to filter wallet conflicts
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Check if this is a wallet extension error
    const isWalletError = walletErrorPatterns.some(pattern => 
      pattern.test(message)
    );
    
    // Only log non-wallet errors or in development mode
    if (!isWalletError || window.location.hostname === 'localhost') {
      originalError.apply(console, args);
    }
  };
  
  // Override console.warn for wallet warnings
  console.warn = function(...args) {
    const message = args.join(' ');
    
    // Filter out wallet-related warnings
    const isWalletWarning = walletErrorPatterns.some(pattern => 
      pattern.test(message)
    );
    
    if (!isWalletWarning || window.location.hostname === 'localhost') {
      originalWarn.apply(console, args);
    }
  };
  
  // Prevent wallet extension conflicts
  let solanaProviders = [];
  let ethereumProviders = [];
  
  // Intercept wallet injections
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    if (obj === window) {
      if (prop === 'solana' && obj.solana) {
        // Store multiple Solana providers
        if (!solanaProviders.includes(obj.solana)) {
          solanaProviders.push(obj.solana);
        }
        return obj; // Don't redefine
      }
      
      if (prop === 'ethereum' && obj.ethereum) {
        // Store multiple Ethereum providers
        if (!ethereumProviders.includes(obj.ethereum)) {
          ethereumProviders.push(obj.ethereum);
        }
        return obj; // Don't redefine
      }
    }
    
    try {
      return originalDefineProperty.call(this, obj, prop, descriptor);
    } catch (error) {
      // Silently fail for wallet conflicts
      if (walletErrorPatterns.some(pattern => pattern.test(error.message))) {
        return obj;
      }
      throw error;
    }
  };
  
  // Provide access to all wallet providers
  window.getAllSolanaProviders = () => solanaProviders;
  window.getAllEthereumProviders = () => ethereumProviders;
  
  console.log('🔗 Wallet compatibility script loaded');
})();
