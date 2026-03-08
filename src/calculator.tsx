import { useState } from 'react'
import AmortizationTable from './amortizationTable';
import "./calculator.css";
import useDebounce from "./useDebounce";

function monthlyPayment(P: number, annualRate: number, years: number) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (!P || !n) return 0;
  if (r === 0) return P / n;
  return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}
const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function MortgageCalculator() {
  const [price, setPrice] = useState("500000");
  const [downPmt, setDownPmt] = useState("20");
  const [rate, setRate] = useState("6.5");
  const [years, setYears] = useState("30");
  const [tax, setTax] = useState("6000");
  const [showTable, setShowTable] = useState(false);
  const [TypeForDpmt, setTypeForDpmt] = useState("%");

  const dPrice = useDebounce(price);
  const dDownPmt = useDebounce(downPmt);
  const dRate = useDebounce(rate);
  const dTax = useDebounce(tax);

  const priceNum = Number(dPrice);
  const downPmtNum = Number(dDownPmt);
  const rateNum = Number(dRate);
  const yearsNum = Number(years);

  const finalDownPmt = TypeForDpmt === "%" ? (priceNum * downPmtNum) / 100 : downPmtNum

  const loanAmt = priceNum - finalDownPmt > 0 ? priceNum - finalDownPmt : 0;
  const baseMonthlyPmt = monthlyPayment(loanAmt, rateNum, yearsNum);
  const monthlyTax = Number(dTax) / 12;
  const totalMonthlyPmt = baseMonthlyPmt + monthlyTax;


  return (
    <div className='main-wrapper'>
      <div className="calculator">
        <h1>Mortgage Calculator</h1>
        <div id="input-div">
          <label>
            Home Price
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} />
          </label>

          <label>
            <span>Down Payment</span>
            <div className='dp-input-row'>
              <input type="number" value={downPmt} onChange={e => setDownPmt(e.target.value)} />

              <div className="toggle dp-toggle">
                <button
                  className={TypeForDpmt === "%" ? "active" : ""} onClick={() => setTypeForDpmt("%")}
                  type="button" > % </button>
                <button className={TypeForDpmt === "$" ? "active" : ""} onClick={() => setTypeForDpmt("$")}
                  type="button">$</button>

              </div>
            </div>

          </label>
          <label>
            Annual Property Tax ($)
            <input type="number" value={tax} onChange={e => setTax(e.target.value)} />
          </label>
          <label>
            Interest Rate (%)
            <input type="number" value={rate} onChange={e => setRate(e.target.value)} />
          </label>

          <label>
            <span>Term (Years)</span>


            <div className="toggle term-toggle">
              <button
                className={years === "10" ? "active" : ""}
                onClick={() => setYears("10")}
                type="button"> 10 </button>
              <button
                className={years === "15" ? "active" : ""}
                onClick={() => setYears("15")}
                type="button" > 15</button>
              <button
                className={years === "30" ? "active" : ""}
                onClick={() => setYears("30")}
                type="button" > 30 </button>
            </div>

          </label>

        </div>
        <div className="result">
          <p>Down Payment: <strong>{fmt.format(finalDownPmt)}</strong></p>
          <p>Loan Amount: <strong>{fmt.format(loanAmt)}</strong></p>
          <p>Monthly Mortgage Payment: <strong>{fmt.format(baseMonthlyPmt)}</strong></p>
          <p>Monthly Property Tax: <strong>{fmt.format(monthlyTax)}</strong></p>
          <p id='total'>Total Payment: <strong>{fmt.format(totalMonthlyPmt)}</strong></p>
          <button className="show-hide-amor" onClick={() => setShowTable(!showTable)}>
            {showTable ? "Hide Amortization Table" : "Show Amortization Table"}
          </button>
        </div>
      </div>

      {showTable && <AmortizationTable loanAmt={loanAmt} rateNum={rateNum} yearsNum={yearsNum} baseMonthlyPmt={baseMonthlyPmt} />}
    </div>
  )

}
