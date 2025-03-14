import React, { useState, useEffect } from "react";
import { fetchTransactions } from "./utils/api";
import DownloadButton from "./components/DownloadButton";
import TransactionsList from "./components/TransactionsList";


function App() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    async function loadTransactions() {
      try {
        const deposits = (await fetchTransactions("/v5/asset/deposit/query-record")) || [];
        const internalWithdrawals = (await fetchTransactions("/v5/asset/withdraw/query-record", { withdrawType: 1 })) || [];
        
        const depositArray = Array.isArray(deposits) ? deposits : [];
        const withdrawalArray = Array.isArray(internalWithdrawals) ? internalWithdrawals : [];

        const allTransactions = [
          ...depositArray.map((tx) => ({ ...tx, type: "DEPOSIT" })),
          ...withdrawalArray.map((tx) => ({ ...tx, type: "INTERNAL_WITHDRAWAL" })),
        ];
        console.log("Transactions fetched:", allTransactions);
        setTransactions(allTransactions);
      } catch (error) {
        console.error("Error cargando transacciones:", error.message);
        setTransactions([]);
      }
    }
    loadTransactions();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Transacciones Bybit</h1>
      <p>Transacciones cargadas: {transactions.length}</p>
      <DownloadButton transactions={transactions} />
   
      <TransactionsList transactions={transactions} />
    </div>
  );
}

export default App;