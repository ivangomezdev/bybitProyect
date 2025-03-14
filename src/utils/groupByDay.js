export const groupByDay = (data) => {
    const grouped = {};
    data.forEach((tx) => {
      const date = tx.successAt || tx.createTime
        ? new Date(parseInt(tx.successAt || tx.createTime))
        : new Date();
      const dayKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      if (!grouped[dayKey]) grouped[dayKey] = [];
      grouped[dayKey].push(tx);
    });
    return grouped;
  };