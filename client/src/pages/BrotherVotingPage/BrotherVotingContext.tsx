import React, { createContext, useContext, useState } from "react";
import { BrotherVotingContextType, Rushee } from "./types";

const BrotherVotingContext = createContext<BrotherVotingContextType | null>(null);

export const useBrotherVotingContext = () => {

    const context = useContext(BrotherVotingContext);
    if (!context) {
        throw new Error("MUST use context within some provider");
    }
    return context;

}

export const BrotherVotingContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rushee, setRushee] = useState<Rushee | null>(null);
  const [question, setQuestion] = useState<string | null>(null);

  return (
    <BrotherVotingContext.Provider value={{ rushee, question, setRushee, setQuestion }}>
      {children}
    </BrotherVotingContext.Provider>
  );
};