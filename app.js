sap.ui.getCore().attachInit(function () {
  const blockedOrders = [
    {
      id: 101,
      customer: "Contoso Retail",
      amount: 15420.75,
      currency: "USD",
      reason: "Credit limit exceeded"
    },
    {
      id: 102,
      customer: "Northwind Traders",
      amount: 8935.4,
      currency: "USD",
      reason: "Missing VAT confirmation"
    },
    {
      id: 103,
      customer: "Bluebird Logistics",
      amount: 22250.0,
      currency: "USD",
      reason: "Duplicate delivery address"
    },
    {
      id: 104,
      customer: "Fabrikam Health",
      amount: 6780.95,
      currency: "USD",
      reason: "Payment terms review required"
    },
    {
      id: 105,
      customer: "Adventure Works",
      amount: 13499.99,
      currency: "USD",
      reason: "Blocked by compliance review"
    }
  ];

  const oModel = new sap.ui.model.json.JSONModel({
    blockedOrders: blockedOrders
  });

  const reasonItems = [
    new sap.ui.core.Item({ key: "All", text: "All reasons" })
  ];

  const uniqueReasons = [...new Set(blockedOrders.map((order) => order.reason))];
  uniqueReasons.forEach((reason) => {
    reasonItems.push(new sap.ui.core.Item({ key: reason, text: reason }));
  });

  const reasonFilter = new sap.m.Select({
    width: "17rem",
    selectedKey: "All",
    items: reasonItems,
    change: function (e) {
      filterByReason(e.getSource().getSelectedKey());
      updateSummary();
    }
  });

  function updateSummary() {
    const activeOrders = oModel.getData().blockedOrders;
    const selectedReason = reasonFilter.getSelectedKey();
    const visibleCount = selectedReason === "All"
      ? activeOrders.length
      : activeOrders.filter((order) => order.reason === selectedReason).length;

    countStatus.setText(visibleCount + " blocked orders");
  }

  function filterByReason(selectedReason) {
    const filters = [];
    if (selectedReason && selectedReason !== "All") {
      filters.push(new sap.ui.model.Filter("reason", sap.ui.model.FilterOperator.EQ, selectedReason));
    }
    oTable.getBinding("items").filter(filters);
  }

  const countStatus = new sap.m.ObjectStatus({
    text: blockedOrders.length + " blocked orders",
    state: sap.ui.core.ValueState.Error
  });

  const template = new sap.m.ColumnListItem({
    type: "Active",
    cells: [
      new sap.m.Text({ text: "{customer}" }),
      new sap.m.ObjectNumber({
        number: "{amount}",
        unit: "{currency}",
        emphasized: false
      }),
      new sap.m.ObjectStatus({
        text: "Blocked",
        state: sap.ui.core.ValueState.Error
      }),
      new sap.m.Text({ text: "{reason}" }),
      new sap.m.Button({
        text: "Mark resolved",
        type: "Accept",
        press: function (oEvent) {
          const context = oEvent.getSource().getBindingContext();
          const order = context.getObject();
          const updatedOrders = oModel.getData().blockedOrders.filter((item) => item.id !== order.id);
          oModel.setProperty("/blockedOrders", updatedOrders);
          filterByReason(reasonFilter.getSelectedKey());
          updateSummary();
        }
      })
    ]
  });

  const oTable = new sap.m.Table({
    inset: false,
    noDataText: "No blocked orders found for the selected reason",
    items: {
      path: "/blockedOrders",
      template: template
    },
    columns: [
      new sap.m.Column({
        header: new sap.m.Label({ text: "Customer" })
      }),
      new sap.m.Column({
        hAlign: "End",
        header: new sap.m.Label({ text: "Amount" })
      }),
      new sap.m.Column({
        width: "12rem",
        header: new sap.m.Label({ text: "Status" })
      }),
      new sap.m.Column({
        header: new sap.m.Label({ text: "Blocked Reason" })
      }),
      new sap.m.Column({
        width: "12rem",
        hAlign: "Center",
        header: new sap.m.Label({ text: "Action" })
      })
    ]
  });

  const app = new sap.m.App({
    pages: [
      new sap.m.Page({
        title: "Blocked Orders",
        content: [
          new sap.m.VBox({
            width: "100%",
            items: [
              new sap.m.Toolbar({
                design: "Transparent",
                content: [
                  new sap.m.Title({ text: "Open order blocks" }),
                  new sap.m.ToolbarSpacer(),
                  new sap.m.Label({ text: "Filter by reason" }),
                  reasonFilter,
                  countStatus
                ]
              }),
              new sap.m.Panel({
                content: [
                  new sap.m.VBox({
                    width: "100%",
                    items: [
                      new sap.m.HBox({
                        alignItems: "Center",
                        justifyContent: "SpaceBetween",
                        wrap: "Wrap",
                        items: [
                          new sap.m.Text({ text: "Review blocked sales orders before they move to finance approval." }),
                          new sap.m.Button({
                            text: "Refresh",
                            type: "Transparent",
                            icon: "sap-icon://refresh"
                          })
                        ]
                      })
                    ]
                  })
                ]
              }),
              oTable
            ]
          })
        ]
      })
    ]
  });

  oTable.setModel(oModel);
  filterByReason("All");
  updateSummary();
  app.placeAt("content");
});
