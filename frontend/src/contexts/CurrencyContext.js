import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

const currencies = {
  USD: { symbol: '$', name: 'US Dollar', rate: 1 },
  EUR: { symbol: '€', name: 'Euro', rate: 0.85 },
  INR: { symbol: '₹', name: 'Indian Rupee', rate: 83 }
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    // Get currency from localStorage or default to USD
    const savedCurrency = localStorage.getItem('currency');
    return savedCurrency && currencies[savedCurrency] ? savedCurrency : 'USD';
  });

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('currency', currency);
  }, [currency]);

  const formatPrice = (amount, fromCurrency = 'USD') => {
    if (!amount) return '0';
    
    let convertedAmount = amount;
    
    // Convert from source currency to target currency
    if (fromCurrency !== currency) {
      // First convert to USD base
      const usdAmount = amount / currencies[fromCurrency].rate;
      // Then convert to target currency
      convertedAmount = usdAmount * currencies[currency].rate;
    }
    
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(convertedAmount);
    
    return `${currencies[currency].symbol}${formatted}`;
  };

  const convertPrice = (amount, fromCurrency = 'USD') => {
    if (!amount) return 0;
    
    if (fromCurrency === currency) return amount;
    
    // Convert to USD first, then to target currency
    const usdAmount = amount / currencies[fromCurrency].rate;
    return usdAmount * currencies[currency].rate;
  };

  const value = {
    currency,
    setCurrency,
    currencies,
    currentCurrency: currencies[currency],
    formatPrice,
    convertPrice
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};