import React from "react";

function TransactionsList({ transactions }) {
  if (transactions.length === 0) return null;

  return (
    <div style={{ marginTop: "20px" }}>
      <h2>Transacciones</h2>
      <ul>
        {transactions.map((tx, index) => (
          <li key={index}>
            {tx.successAt || tx.createTime} - {tx.type} - {tx.amount} -{" "}
            {tx.txID || tx.withdrawId || "N/A"} - {tx.toAddress || "N/A"} -{" "}
            {tx.bank || "N/A"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TransactionsList;