const downloadExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const grouped = groupByDay(transactions);
    const sortedDays = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
  
    sortedDays.forEach((day) => {
      const worksheet = workbook.addWorksheet(day);
      worksheet.columns = [
        { header: "FECHA", key: "date", width: 15 },
        { header: "NÚMERO DE TRANSACCIÓN", key: "txId", width: 20 },
        { header: "NÚMERO DE UID", key: "uid", width: 15 },
        { header: "ENTRADA", key: "income", width: 15 },
        { header: "SALIDA", key: "expense", width: 15 },
        { header: "P/C", key: "buyPrice", width: 10 },
        { header: "P/V", key: "sellPrice", width: 10 },
        { header: "INGRESO TOTAL", key: "incomeTotal", width: 15 },
        { header: "EGRESO TOTAL", key: "expenseTotal", width: 15 },
        { header: "USDT", key: "usdt", width: 10 },
        { header: "MXN", key: "mxn", width: 10 },
        { header: "BANCO", key: "bank", width: 20 },
      ];
  
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF00FF00" }
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      });
  
      worksheet.getColumn('expense').eachCell((cell, rowNumber) => {
        if (rowNumber > 1) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFCCCC" }
          };
        }
      });
  
      let rowCount = 2;
      grouped[day].forEach((tx) => {
        const isDeposit = tx.type === "DEPOSIT";
        const income = isDeposit ? parseFloat(tx.amount) || 0 : 0;
        const expense = !isDeposit ? parseFloat(tx.amount) || 0 : 0;
        const buyPrice = 19;
        const sellPrice = !isDeposit ? 22 : 0;
        const usdt = Number(expense.toFixed(2));
  
        const row = worksheet.addRow({
          date: day,
          txId: tx.txID || tx.withdrawId || "N/A",
          uid: isDeposit ? "Cuenta Propia/RECIBO" : tx.toAddress || "N/A",
          income: Number(income.toFixed(2)),
          expense: Number(expense.toFixed(2)),
          buyPrice: Number(buyPrice.toFixed(2)),
          sellPrice: Number(sellPrice.toFixed(2)),
          incomeTotal: { formula: `K${rowCount}-E${rowCount}*F${rowCount}` },
          expenseTotal: "",
          usdt: usdt,
          mxn: { formula: `E${rowCount}*G${rowCount}` },
          bank: tx.bank || "N/A",
        });
  
        row.eachCell((cell) => {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
          };
          if (['income', 'expense', 'buyPrice', 'sellPrice', 'incomeTotal', 'usdt', 'mxn'].includes(cell.col)) {
            cell.numFmt = '#,##0.00';
          }
        });
        rowCount++;
      });
  
      worksheet.mergeCells("N1:O2");
      const inventoryCell = worksheet.getCell("N1");
      inventoryCell.value = "INVENTARIO";
      inventoryCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0000FF" } };
      inventoryCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      inventoryCell.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getCell("N3").value = { formula: `SUM(E2:E${rowCount - 1})*F2` };
      worksheet.getCell("N3").numFmt = '#,##0.00';
      worksheet.getCell("N3").alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getCell("N3").border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      worksheet.getCell("O3").value = "MXN";
      worksheet.getCell("O3").alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getCell("O3").border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  
      worksheet.mergeCells("N4:O5");
      const gananciaCell = worksheet.getCell("N4");
      gananciaCell.value = "GANANCIA";
      gananciaCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0000FF" } };
      gananciaCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      gananciaCell.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getCell("N6").value = { formula: `SUM(H2:H${rowCount - 1})` };
      worksheet.getCell("N6").numFmt = '#,##0.00';
      worksheet.getCell("N6").alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getCell("N6").border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      worksheet.getCell("O6").value = "MXN";
      worksheet.getCell("O6").alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getCell("O6").border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });
  
    // Add VENTAS sheet
    const ventasSheet = workbook.addWorksheet("VENTAS");
  
    // Define column widths for A:C
    ventasSheet.columns = [
      { header: "FECHA", key: "fecha", width: 25 },
      { header: "VENTA", key: "venta", width: 25 },
      { header: "GANANCIA TOTAL", key: "gananciaTotal", width: 25 },
      { header: "MES", key: "mes", width: 25 }, // D column
      { header: "VENTAS TOTALES", key: "ventasTotales", width: 25 }, // E column
      { header: "GANANCIA TOTAL", key: "gananciaTotalMes", width: 25 }, // F column
    ];
  
    // Title: VENTAS (A1:C1)
    ventasSheet.mergeCells("A1:C1");
    const titleCell = ventasSheet.getCell("A1");
    titleCell.value = "VENTAS";
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00FF00" } };
    titleCell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  
    // Headers for daily data (A2:C2)
    ventasSheet.getCell("A2").value = "FECHA";
    ventasSheet.getCell("B2").value = "VENTA";
    ventasSheet.getCell("C2").value = "GANANCIA TOTAL";
    ventasSheet.getRow(2).eachCell((cell, colNumber) => {
      if (colNumber <= 3) { // Apply to A, B, C only
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      }
    });
  
    // Fill daily data starting from row 3
    let rowIndex = 3;
    sortedDays.forEach((day) => {
      const formattedDate = day.split('-').reverse().join('/'); // Convert YYYY-MM-DD to DD/MM/YYYY
      ventasSheet.getCell(`A${rowIndex}`).value = formattedDate;
      ventasSheet.getCell(`B${rowIndex}`).value = { formula: `'${day}'!N3` }; // INVENTARIO (N3)
      ventasSheet.getCell(`C${rowIndex}`).value = { formula: `'${day}'!N6` }; // GANANCIA (N6)
  
      [ventasSheet.getCell(`A${rowIndex}`), ventasSheet.getCell(`B${rowIndex}`), ventasSheet.getCell(`C${rowIndex}`)].forEach((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      });
      ventasSheet.getCell(`B${rowIndex}`).numFmt = '#,##0.00';
      ventasSheet.getCell(`C${rowIndex}`).numFmt = '#,##0.00';
      rowIndex++;
    });
  
    // Monthly data next to daily data (starting at D1)
    ventasSheet.mergeCells("D1:F1");
    const monthlyTitleCell = ventasSheet.getCell("D1");
    monthlyTitleCell.value = "RESUMEN MENSUAL";
    monthlyTitleCell.font = { bold: true, size: 16 };
    monthlyTitleCell.alignment = { horizontal: "center", vertical: "middle" };
    monthlyTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00FF00" } };
    monthlyTitleCell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  
    // Headers for monthly data (D2:F2)
    ventasSheet.getCell("D2").value = "MES";
    ventasSheet.getCell("E2").value = "VENTAS TOTALES";
    ventasSheet.getCell("F2").value = "GANANCIA TOTAL";
    ventasSheet.getRow(2).eachCell((cell, colNumber) => {
      if (colNumber >= 4) { // Apply to D, E, F only
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      }
    });
}