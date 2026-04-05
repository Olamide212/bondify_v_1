import { createContext, useContext, useState } from "react";

const VerificationStepContext = createContext({
  verificationStep: null,
  setVerificationStep: () => {},
});

export function VerificationStepProvider({ children }) {
  const [verificationStep, setVerificationStep] = useState(null);
  return (
    <VerificationStepContext.Provider value={{ verificationStep, setVerificationStep }}>
      {children}
    </VerificationStepContext.Provider>
  );
}

export const useVerificationStep = () => useContext(VerificationStepContext);
