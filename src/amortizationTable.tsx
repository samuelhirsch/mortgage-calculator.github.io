
import { useState, useMemo } from "react";
import useDebounce from "./useDebounce";
import "./amorTable.css"
const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});


type amorRow = {
  month?: number
  year?: number
  principal: number
  interest: number
  extraPayment: number
  remainingBalance: number
}
type AmortResult = { rows: amorRow[]; intrestPaid?: number; intrestSaved?: number; error?: string };


type mortgageInfo = {
  loanAmt: number;
  rateNum: number;
  yearsNum: number;
  baseMonthlyPmt: number
}
export default function AmortizationTable(props: mortgageInfo) {
  const { loanAmt, rateNum, yearsNum, baseMonthlyPmt } = props;
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [extraYearlyPayment, setExtraYearlyPayment] = useState<string>("0");
  const dextraYearlyPayment = useDebounce(extraYearlyPayment);
  const tableData: AmortResult = useMemo(() => {
    const schedule: amorRow[] = [];
    if (loanAmt <= 0 || yearsNum <= 0 || rateNum < 0 || baseMonthlyPmt <= 0) { return { rows: schedule, error: "Invalid loan inputs" }; }
    const annualRate = rateNum / 100 / 12;
    const totalMonths = yearsNum * 12;
    const monthlyPmtCents = Math.round(baseMonthlyPmt * 100);
    //CALCULATE BASELINE INTEREST (Without Extras)
    let baselineBalance = Math.round(loanAmt * 100);
    let totalInterestBaselineCents = 0;

    for (let m = 1; m <= totalMonths; m++) {
      const interest = Math.round(baselineBalance * annualRate);
      totalInterestBaselineCents += interest;
      const principal = Math.min(monthlyPmtCents - interest, baselineBalance);
      baselineBalance -= principal;
      if (baselineBalance <= 0) break;
    }
    let remainingBalanceInCents = Math.round(loanAmt * 100);
    const monthlyPaymentInCents = Math.round(baseMonthlyPmt * 100);
    const extraYearlyPaymentInCents = Math.round(Number(dextraYearlyPayment) * 100);


    let cumulativeInterestInCents = 0;

    for (let i = 1; i <= totalMonths; i++) {
      const interestForMonthInCents = Math.round(remainingBalanceInCents * annualRate);
      cumulativeInterestInCents += interestForMonthInCents;
      const regularPrincipalInCents = monthlyPaymentInCents - interestForMonthInCents;
      if (regularPrincipalInCents <= 0) {
        return { rows: schedule, error: "Payment too low to amortize this loan." };
      }

      const extraForThisMonthInCents = (i % 12 === 1) ? extraYearlyPaymentInCents : 0;
      const totalPrincipalInCents = regularPrincipalInCents + extraForThisMonthInCents;
      const actualPrincipalPaidInCents = Math.min(totalPrincipalInCents, remainingBalanceInCents);


      const extraActuallyApplied = Math.max(0, actualPrincipalPaidInCents - regularPrincipalInCents);
      remainingBalanceInCents -= actualPrincipalPaidInCents;


      schedule.push({
        month: i,
        principal: actualPrincipalPaidInCents / 100 - extraActuallyApplied / 100,
        interest: interestForMonthInCents / 100,
        extraPayment: extraActuallyApplied / 100,
        remainingBalance: Math.max(0, remainingBalanceInCents / 100),
      });
      if (remainingBalanceInCents <= 0) break;
    }

    const intrestSavedInCents = totalInterestBaselineCents - cumulativeInterestInCents;

    return { rows: schedule, intrestPaid: cumulativeInterestInCents / 100, intrestSaved: intrestSavedInCents / 100 };
  }, [loanAmt, rateNum, yearsNum, baseMonthlyPmt, dextraYearlyPayment]);

  const displayRows: amorRow[] = useMemo(() => {
    if (tableData.error || tableData.rows.length === 0) return []

    if (viewMode === "monthly") return tableData.rows
    const yearlySchedule: amorRow[] = [];
    for (let i = 0; i < tableData.rows.length; i += 12) {
      const yearSlice = tableData.rows.slice(i, i + 12);
      if (yearSlice.length === 0) break;
      const lastMonthInSlice = yearSlice[yearSlice.length - 1];

      const yearNumber = Math.floor(i / 12) + 1;
      const yearlyPrincipal = yearSlice.reduce((sum, row) => sum + row.principal, 0);
      const yearlyInterest = yearSlice.reduce((sum, row) => sum + row.interest, 0);
      const yearlyBalance = lastMonthInSlice.remainingBalance;
      yearlySchedule.push({
        year: yearNumber,
        principal: yearlyPrincipal,
        interest: yearlyInterest,
        extraPayment: yearSlice[0].extraPayment,
        remainingBalance: yearlyBalance
      });
    }
    return yearlySchedule;
  }, [viewMode, tableData.rows, tableData.error]);


  return (

    <div className="amortization-card">
      <div className="amortization-header amortization-header-flex">
        <h3>Amortization Schedule in {viewMode === "monthly" ? "months" : "years"}</h3>

        <div className="toggle">
          <button className={viewMode === "monthly" ? "active" : ""} onClick={() => setViewMode("monthly")}>
            Monthly
          </button>

          <button className={viewMode === "yearly" ? "active" : ""} onClick={() => setViewMode("yearly")} >
            Yearly
          </button>
        </div>
      </div>
      <div className="extra-payment-bar">

        <span className="extra-payment-label">Extra payment (yearly)</span>
        <div className="extra-payment-input-wrap">
          <span >$</span>
          <input
            className="extra-payment-input"
            type="number"
            min={0}
            step="50"
            value={extraYearlyPayment}
            onChange={(e) => setExtraYearlyPayment(e.target.value)}
          />
        </div>

        <span className="extra-payment-help">Applied once per year</span>
      </div>
      {!tableData.error && (
        <div className="intrest-summary-grid">
          <div className="intrest-summary-info"><span>Total Interest</span><strong>{fmt.format(tableData.intrestPaid ?? 0)}</strong></div>
          {<div className="intrest-summary-info intrest-saved"><span>Interest Saved (with extra payment)</span><strong>{fmt.format(tableData.intrestSaved ?? 0)}</strong></div>}

        </div>
      )}
      <div className="table-viewport">
        <table className="amort-table">
          <thead>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th>{viewMode === "monthly" ? "Month" : "Year"}</th>
              <th>Principal</th>
              <th>Interest</th>
              <th>Remaining Balance</th>
            </tr>
          </thead>
          <tbody>
            {tableData.error && (
              <tr>
                <td className="row-error" colSpan={4} style={{ textAlign: "center" }}>
                  {tableData.error}
                </td>
              </tr>
            )}

            {!tableData.error && displayRows.length === 0 && (
              <tr>
                <td className="row-error" colSpan={4} style={{ textAlign: "center" }}>
                  No amortization data.
                </td>
              </tr>
            )}
            {displayRows.map((row) => (
              <tr key={viewMode === "monthly" ? "m" + row.month : "y" + row.year} style={{ textAlign: 'center' }}>
                <td>{viewMode === "monthly" ? row.month : row.year}</td>
                <td> <div >{fmt.format(row.principal)}</div>
                  {row.extraPayment > 0 && (
                    <small className="extra-payment-data" >
                      +{fmt.format(row.extraPayment)} extra
                    </small>
                  )}</td>
                <td>{fmt.format(row.interest)}</td>
                <td className="balance-cell">{fmt.format(row.remainingBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

  );
}

