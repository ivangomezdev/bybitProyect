import React from "react";
import { generateExcel } from "../utils/generateExcel";

function DownloadButton({ transactions }) {
  const handleDownload = () => {
    generateExcel(transactions);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={transactions.length === 0}
      style={{
        padding: "10px 20px",
        backgroundColor: transactions.length === 0 ? "#ccc" : "#28a745",
        color: "#fff",
        border: "none",
        cursor: transactions.length === 0 ? "not-allowed" : "pointer",
        marginTop: "10px",
      }}
    >
      Descargar Excel
    </button>
  );
}

export default DownloadButton;