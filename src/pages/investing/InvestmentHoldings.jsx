const HOLDING_SECTIONS = [
  {
    title: "Cash",
    columns: ["Account", "Currency", "Balance"],
  },
  {
    title: "Deposits",
    columns: ["Description", "Principal", "Rate", "Maturity"],
  },
  {
    title: "Securities",
    columns: ["Instrument", "Quantity", "Units", "Market value"],
  },
  {
    title: "Insurance",
    columns: ["Policy", "Details"],
  },
];

export default function InvestmentHoldings() {
  return (
    <>
      <div className="row g-3 mb-3 align-items-end">
        <div className="col-sm-4 col-md-3">
          <label className="form-label" htmlFor="investment-holdings-as-of">
            As of
          </label>
          <input
            id="investment-holdings-as-of"
            type="date"
            className="form-control"
            disabled
          />
        </div>
      </div>

      {HOLDING_SECTIONS.map((section) => (
        <section key={section.title} className="card mb-4 investment-section-card">
          <div className="card-header">
            <h5 className="mb-0">{section.title}</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table mb-0 investment-section-table">
                <thead>
                  <tr>
                    {section.columns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      colSpan={section.columns.length}
                      className="text-center text-muted py-4"
                    >
                      Coming soon.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
