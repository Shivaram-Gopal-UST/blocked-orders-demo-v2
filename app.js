sap.ui.getCore().attachInit(function () {
  const oModel = new sap.ui.model.json.JSONModel({
    blockedOrders: []
  });

  const reasonItems = [
    new sap.ui.core.Item({ key: "All", text: "All reasons" })
  ];

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

  function updateReasonItems(orders) {
    reasonFilter.removeAllItems();
    reasonFilter.addItem(new sap.ui.core.Item({ key: "All", text: "All reasons" }));
    [...new Set(orders.map((order) => order.reason))].forEach((reason) => {
      reasonFilter.addItem(new sap.ui.core.Item({ key: reason, text: reason }));
    });
    reasonFilter.setSelectedKey("All");
  }

  async function loadOrders() {
    countStatus.setText("Loading blocked orders...");
    try {
      let response = await fetch("/api/orders");
      let responseText = await response.text();
      let payload;
      let loadedFromSnapshot = false;

      try {
        payload = JSON.parse(responseText);
      } catch (parseError) {
        if (!window.__BLOCKED_ORDERS__) {
          throw new Error("No SAP snapshot is available on the deployed site.");
        }
        payload = window.__BLOCKED_ORDERS__;
        loadedFromSnapshot = true;
      }

      if (!response.ok && !loadedFromSnapshot) {
        throw new Error(payload.error || "The SAP request failed.");
      }
      oModel.setProperty("/blockedOrders", payload.blockedOrders);
      updateReasonItems(payload.blockedOrders);
      filterByReason("All");
      updateSummary();
    } catch (error) {
      oModel.setProperty("/blockedOrders", []);
      countStatus.setText("SAP connection failed");
      oTable.setNoDataText(error.message);
    }
  }

  const countStatus = new sap.m.ObjectStatus({
    text: "Loading blocked orders...",
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
                            icon: "sap-icon://refresh",
                            press: loadOrders
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
  app.placeAt("content");
  loadOrders();
});
