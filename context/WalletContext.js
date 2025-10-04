// context/WalletContext.js
import React, { createContext, useState, useContext } from "react";

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [coins, setCoins] = useState(120); 
  const [plan, setPlan] = useState("Free"); 

  const deductCoins = (amount) => {
    if (coins >= amount) {
      setCoins((prev) => prev - amount);
      return true;
    }
    return false;
  };

  const addCoins = (amount) => {
    setCoins((prev) => prev + amount);
  };

  return (
    <WalletContext.Provider
      value={{ coins, plan, deductCoins, addCoins, setPlan }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
