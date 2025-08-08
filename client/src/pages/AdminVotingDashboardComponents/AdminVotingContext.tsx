import React, { createContext, useContext, useState, useEffect } from "react";
import { Vote, AdminVotingContextType, Rushee, Brother } from "./types";
import axios from "axios";

const loginAPIEndpoint = import.meta.env.VITE_LOGIN_API_PREFIX;
const AdminVotingContext = createContext<AdminVotingContextType | null>(null);

/**
 * 
 * @returns 
 */
export const useAdminVotingContext = () => {

  const context = useContext(AdminVotingContext);
  if (!context) {
    throw new Error("MUST use context within some provider");
  }
  return context;

}

/**
 * Make a request to login service to fetch all users
 */
export const getBrothers = async (): Promise<Brother[]> => {

  try {
    const res = await axios.get(`${loginAPIEndpoint}/admin/getallusers`);
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    return (data ?? []) as Brother[];
  } catch (err) {
    console.log("failed to fetch brothers")
    throw err;
  }

}

export const AdminVotingContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [rushee, setRushee] = useState<Rushee | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [brothers, setBrothers] = useState<Brother[]>([]);

  useEffect(() => {
    getBrothers()
    .then(data => {
      setBrothers(data)
    })
  }, []);

  return (
    <AdminVotingContext.Provider value={{ votes, rushee, question, brothers, setVotes, setRushee, setQuestion }}>
      {children}
    </AdminVotingContext.Provider>
  );
};