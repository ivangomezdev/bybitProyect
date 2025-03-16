import React, { useState, useEffect } from "react";
import { fetchTransactions } from "./utils/api";
import DownloadButton from "./components/DownloadButton";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [monthlyFiles, setMonthlyFiles] = useState([]);

  // Usar import.meta.env para acceder a las variables de entorno en Vite
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

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

    async function fetchMonthlyFiles() {
      try {
        const response = await fetch(`${API_URL}/api/downloads`);
        if (!response.ok) throw new Error("Error al obtener archivos");
        const files = await response.json();
        setMonthlyFiles(files);
      } catch (error) {
        console.error("Error obteniendo archivos mensuales:", error.message);
        setMonthlyFiles([]);
      }
    }

    loadTransactions();
    fetchMonthlyFiles();
    const interval = setInterval(fetchMonthlyFiles, 300000); // Actualizar cada 5 minutos
    return () => clearInterval(interval);
  }, [API_URL]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Transacciones Bybit</h1>
      <div className="app__divCont">
      <DownloadButton transactions={transactions} />
      <p>Transacciones cargadas: {transactions.length}</p>
      <div style={{ marginTop: "20px" }}>
        <h2>Descargas Mensuales</h2>
        </div>
        {monthlyFiles.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {monthlyFiles.map((file) => (
              <li key={file} style={{ margin: "10px 0" }}>
                <a
                  href={`${API_URL}/api/downloads/${file}`}
                  download={file}
                  style={{ textDecoration: "none", color: "#007BFF" }}
                >
                  {file}
                </a>
              </li>
              
            ))}
          </ul>
          
        ) : (
          <p>No hay archivos mensuales disponibles aún.</p>
        )}
      </div>
      
    </div>
  );
}

export default App;