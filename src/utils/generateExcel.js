import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { groupByDay } from "./groupByDay";
import { Chart } from "chart.js/auto";

export const generateExcel = async (transactions, chartData) => {
  const workbook = new ExcelJS.Workbook();
  const grouped = groupByDay(transactions);
  const sortedDays = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));

  // Generar hojas diarias
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
        fgColor: { argb: "FF00FF00" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    worksheet.getColumn("expense").eachCell((cell, rowNumber) => {
      if (rowNumber > 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFCCCC" },
        };
      }
    });

    let rowCount = 2;
    grouped[day].forEach((tx) => {
      const isDeposit = tx.type === "DEPOSIT";
      const income = isDeposit ? parseFloat(tx.amount) || 0 : 0;
      const expense = !isDeposit ? parseFloat(tx.amount) || 0 : 0;
      const usdt = Number(expense.toFixed(2));

      const row = worksheet.addRow({
        date: day,
        txId: tx.txID || tx.withdrawId || "N/A",
        uid: isDeposit ? "Cuenta Propia/RECIBO" : tx.toAddress || "N/A",
        income: Number(income.toFixed(2)),
        expense: Number(expense.toFixed(2)),
        buyPrice: null, // Will be set dynamically below
        sellPrice: null, // Will be set dynamically below
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
          right: { style: "thin" },
        };
        if (
          ["income", "expense", "buyPrice", "sellPrice", "incomeTotal", "usdt", "mxn"].includes(
            cell.col
          )
        ) {
          cell.numFmt = "#,##0.00";
        }
      });
      rowCount++;
    });

    // Set F (P/C) and G (P/V) dynamically after rows are added
    worksheet.getColumn("F").eachCell((cell, rowNumber) => {
      if (rowNumber > 1) {
        cell.value = { formula: "N9" }; // References COMPRA value
      }
    });

    worksheet.getColumn("G").eachCell((cell, rowNumber) => {
      if (rowNumber > 1) {
        const isDeposit = grouped[day][rowNumber - 2].type === "DEPOSIT";
        cell.value = isDeposit ? 0 : { formula: "N13" }; // 0 for deposits, N13 for withdrawals
      }
    });

    // INVENTARIO
    worksheet.mergeCells("N1:O2");
    const inventoryCell = worksheet.getCell("N1");
    inventoryCell.value = "INVENTARIO";
    inventoryCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0000FF" } };
    inventoryCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    inventoryCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("N3").value = { formula: `SUM(E2:E${rowCount - 1})*F2` };
    worksheet.getCell("N3").numFmt = "#,##0.00";
    worksheet.getCell("N3").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("N3").border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell("O3").value = "MXN";
    worksheet.getCell("O3").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("O3").border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // GANANCIA
    worksheet.mergeCells("N4:O5");
    const gananciaCell = worksheet.getCell("N4");
    gananciaCell.value = "GANANCIA";
    gananciaCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0000FF" } };
    gananciaCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    gananciaCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("N6").value = { formula: `SUM(H2:H${rowCount - 1})` };
    worksheet.getCell("N6").numFmt = "#,##0.00";
    worksheet.getCell("N6").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("N6").border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell("O6").value = "MXN";
    worksheet.getCell("O6").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("O6").border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // COMPRA (N8:O9)
    worksheet.mergeCells("N8:O8");
    const compraCell = worksheet.getCell("N8");
    compraCell.value = "COMPRA";
    compraCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0000FF" } };
    compraCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    compraCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("N9").value = 19;
    worksheet.getCell("N9").numFmt = "#,##0.00";
    worksheet.getCell("N9").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("N9").border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell("O9").value = "MXN";
    worksheet.getCell("O9").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("O9").border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // VENTA (N12:O13)
    worksheet.mergeCells("N12:O12");
    const ventaCell = worksheet.getCell("N12");
    ventaCell.value = "VENTA";
    ventaCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0000FF" } };
    ventaCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    ventaCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("N13").value = 22;
    worksheet.getCell("N13").numFmt = "#,##0.00";
    worksheet.getCell("N13").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("N13").border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell("O13").value = "MXN";
    worksheet.getCell("O13").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("O13").border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Hoja VENTAS
  const ventasSheet = workbook.addWorksheet("VENTAS");
  ventasSheet.columns = [
    { header: "FECHA", key: "fecha", width: 25 },
    { header: "VENTA", key: "venta", width: 25 },
    { header: "GANANCIA INDIVIDUAL", key: "gananciaIndividual", width: 25 },
    { header: "GANANCIA TOTAL", key: "gananciaTotal", width: 25 },
    { header: "% CUENTAS", key: "porcentajeCuentas", width: 25 },
    { header: "MES", key: "mes", width: 25 },
    { header: "VENTAS TOTALES", key: "ventasTotales", width: 25 },
    { header: "GANANCIA TOTAL", key: "gananciaTotalMes", width: 25 },
    { header: "GANANCIA INDIVIDUAL TOTAL", key: "gananciaIndividualTotal", width: 25 },
  ];

  ventasSheet.mergeCells("A1:E1");
  const titleCell = ventasSheet.getCell("A1");
  titleCell.value = "VENTAS";
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00FF00" } };
  titleCell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  ventasSheet.getCell("A2").value = "FECHA";
  ventasSheet.getCell("B2").value = "VENTA";
  ventasSheet.getCell("C2").value = "GANANCIA INDIVIDUAL";
  ventasSheet.getCell("D2").value = "GANANCIA TOTAL";
  ventasSheet.getCell("E2").value = "% CUENTAS";
  ventasSheet.getRow(2).eachCell((cell, colNumber) => {
    if (colNumber <= 5) {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
  });

  let rowIndex = 3;
  sortedDays.forEach((day) => {
    const formattedDate = day.split("-").reverse().join("/");
    ventasSheet.getCell(`A${rowIndex}`).value = formattedDate;
    ventasSheet.getCell(`B${rowIndex}`).value = { formula: `'${day}'!N3` };
    ventasSheet.getCell(`D${rowIndex}`).value = { formula: `'${day}'!N6` };
    ventasSheet.getCell(`E${rowIndex}`).value = { formula: `D${rowIndex}*0.01` };
    ventasSheet.getCell(`C${rowIndex}`).value = { formula: `(D${rowIndex}-E${rowIndex})/3` };

    [
      ventasSheet.getCell(`A${rowIndex}`),
      ventasSheet.getCell(`B${rowIndex}`),
      ventasSheet.getCell(`C${rowIndex}`),
      ventasSheet.getCell(`D${rowIndex}`),
      ventasSheet.getCell(`E${rowIndex}`),
    ].forEach((cell) => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if (["B", "C", "D", "E"].includes(cell.col)) {
        cell.numFmt = "#,##0.00";
      }
    });
    rowIndex++;
  });

  // Resumen mensual
  ventasSheet.mergeCells("F1:I1");
  const monthlyTitleCell = ventasSheet.getCell("F1");
  monthlyTitleCell.value = "RESUMEN MENSUAL";
  monthlyTitleCell.font = { bold: true, size: 16 };
  monthlyTitleCell.alignment = { horizontal: "center", vertical: "middle" };
  monthlyTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00FF00" } };
  monthlyTitleCell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  ventasSheet.getCell("F2").value = "MES";
  ventasSheet.getCell("G2").value = "VENTAS TOTALES";
  ventasSheet.getCell("H2").value = "GANANCIA TOTAL";
  ventasSheet.getCell("I2").value = "GANANCIA INDIVIDUAL TOTAL";
  ventasSheet.getRow(2).eachCell((cell, colNumber) => {
    if (colNumber >= 6) {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
  });

  const monthlyData = sortedDays.reduce((acc, day) => {
    const date = new Date(day);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!acc[monthKey]) {
      acc[monthKey] = { ventas: 0, ganancia: 0 };
    }
    acc[monthKey].ventas += grouped[day].reduce(
      (sum, tx) => sum + (tx.type !== "DEPOSIT" ? parseFloat(tx.amount) || 0 : 0),
      0
    ) * 19;
    acc[monthKey].ganancia += grouped[day].reduce((sum, tx) => {
      const expense = tx.type !== "DEPOSIT" ? parseFloat(tx.amount) || 0 : 0;
      const mxn = expense * 22;
      return sum + (mxn - expense * 19);
    }, 0);
    return acc;
  }, {});

  let monthRowIndex = 3;
  Object.keys(monthlyData).forEach((month) => {
    ventasSheet.getCell(`F${monthRowIndex}`).value = month;
    ventasSheet.getCell(`G${monthRowIndex}`).value = monthlyData[month].ventas;
    ventasSheet.getCell(`H${monthRowIndex}`).value = monthlyData[month].ganancia;

    const daysInMonth = sortedDays.filter((day) => day.startsWith(month));
    if (daysInMonth.length > 0) {
      const startRow = 3;
      const endRow = startRow + daysInMonth.length - 1;
      ventasSheet.getCell(`I${monthRowIndex}`).value = { formula: `SUM(C${startRow}:C${endRow})` };
    }

    [
      ventasSheet.getCell(`F${monthRowIndex}`),
      ventasSheet.getCell(`G${monthRowIndex}`),
      ventasSheet.getCell(`H${monthRowIndex}`),
      ventasSheet.getCell(`I${monthRowIndex}`),
    ].forEach((cell) => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if (["G", "H", "I"].includes(cell.col)) {
        cell.numFmt = "#,##0.00";
      }
    });
    monthRowIndex++;
  });

  // Generar el gráfico como imagen si chartData está disponible
  if (chartData) {
    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");

    new Chart(ctx, {
      type: "bar",
      data: chartData,
      options: {
        plugins: {
          legend: { position: "top" },
          title: { display: true, text: "Ventas y Ganancias por Mes" },
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "Monto (MXN)" } },
          x: { title: { display: true, text: "Mes" } },
        },
      },
    });

    const imageData = canvas.toDataURL("image/png");
    const imageId = workbook.addImage({
      base64: imageData,
      extension: "png",
    });

    ventasSheet.addImage(imageId, {
      tl: { col: 3, row: monthRowIndex + 2 },
      ext: { width: 500, height: 300 },
    });
  }

  try {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "bybit_transactions.xlsx");
  } catch (error) {
    console.error("Error generando Excel:", error);
  }
};