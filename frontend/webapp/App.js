sap.ui.define(
  [
    "sap/m/App",
    "sap/m/Page",
    "sap/m/VBox",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Title",
    "sap/m/Text",
    "sap/m/IconTabBar",
    "sap/m/IconTabFilter",
    "sap/m/Toolbar",
    "sap/m/ToolbarSpacer",
    "sap/m/SearchField",
    "sap/m/Select",
    "sap/ui/core/Item",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/ObjectIdentifier",
    "sap/m/ObjectNumber",
    "sap/m/BusyDialog",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/DateFormat",
  ],
  function (
    App,
    Page,
    VBox,
    Label,
    Input,
    Button,
    MessageToast,
    MessageBox,
    Title,
    Text,
    IconTabBar,
    IconTabFilter,
    Toolbar,
    ToolbarSpacer,
    SearchField,
    Select,
    Item,
    Table,
    Column,
    ColumnListItem,
    ObjectIdentifier,
    ObjectNumber,
    BusyDialog,
    JSONModel,
    Filter,
    FilterOperator,
    DateFormat
  ) {
    "use strict";

    const API_BASE = "/api/sap";
    const STORAGE_KEY = "sfPortalUserId";
    const dateFormat = DateFormat.getDateInstance({ pattern: "dd MMM yyyy" });
    const busyDialog = new BusyDialog({ title: "Loading", text: "Please wait..." });

    const model = new JSONModel({
      userId: localStorage.getItem(STORAGE_KEY) || "",
      login: {
        userid: localStorage.getItem(STORAGE_KEY) || "",
        password: "",
        busy: false,
      },
      planned: {
        rows: [],
        count: 0,
        search: "",
        month: "",
        year: new Date().getFullYear().toString(),
        updated: "",
      },
      production: {
        rows: [],
        count: 0,
        search: "",
        month: "",
        year: new Date().getFullYear().toString(),
        updated: "",
      },
    });

    function request(path, options) {
      return fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
      }).then(async (response) => {
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.message || "The backend request failed.");
        }

        return payload;
      });
    }

    function formatDate(value) {
      if (!value) {
        return "-";
      }

      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : dateFormat.format(date);
    }

    function buildQuery(section) {
      const month = model.getProperty(`/${section}/month`);
      const year = model.getProperty(`/${section}/year`);
      const params = new URLSearchParams();

      if (month) {
        params.set("month", month);
      }

      if (year) {
        params.set("year", year);
      }

      return params.toString() ? `?${params.toString()}` : "";
    }

    function applyTableFilters(table, section, searchableFields) {
      const searchValue = (model.getProperty(`/${section}/search`) || "").trim();
      const binding = table.getBinding("items");

      if (!binding) {
        return;
      }

      if (!searchValue) {
        binding.filter([]);
        return;
      }

      binding.filter([
        new Filter({
          filters: searchableFields.map((field) => new Filter(field, FilterOperator.Contains, searchValue)),
          and: false,
        }),
      ]);
    }

    function createMonthSelect(section, onLoad) {
      return new Select({
        selectedKey: `{/${section}/month}`,
        width: "10rem",
        items: [
          new Item({ key: "", text: "All months" }),
          new Item({ key: "01", text: "January" }),
          new Item({ key: "02", text: "February" }),
          new Item({ key: "03", text: "March" }),
          new Item({ key: "04", text: "April" }),
          new Item({ key: "05", text: "May" }),
          new Item({ key: "06", text: "June" }),
          new Item({ key: "07", text: "July" }),
          new Item({ key: "08", text: "August" }),
          new Item({ key: "09", text: "September" }),
          new Item({ key: "10", text: "October" }),
          new Item({ key: "11", text: "November" }),
          new Item({ key: "12", text: "December" }),
        ],
        change: onLoad,
      });
    }

    function createYearInput(section, onLoad) {
      return new Input({
        value: `{/${section}/year}`,
        width: "7rem",
        placeholder: "Year",
        type: "Number",
        submit: onLoad,
      });
    }

    function createOrdersTable(section, idField) {
      return new Table(`${section}Table`, {
        growing: true,
        growingThreshold: 20,
        sticky: ["ColumnHeaders"],
        noDataText: "No orders found",
        columns: [
          new Column({ header: new Text({ text: section === "planned" ? "Planned Order" : "Production Order" }) }),
          new Column({ header: new Text({ text: "Material" }) }),
          new Column({ hAlign: "End", header: new Text({ text: "Quantity" }) }),
          new Column({ header: new Text({ text: "Start Date" }) }),
          new Column({ header: new Text({ text: "End Date" }) }),
          new Column({ header: new Text({ text: "Period" }) }),
        ],
        items: {
          path: `/${section}/rows`,
          template: new ColumnListItem({
            cells: [
              new ObjectIdentifier({ title: `{${idField}}` }),
              new Text({ text: "{Material}" }),
              new ObjectNumber({ number: "{Quantity}", unit: "{Unit}" }),
              new Text({ text: { path: "StartDate", formatter: formatDate } }),
              new Text({ text: { path: "EndDate", formatter: formatDate } }),
              new Text({ text: "{MonthFilter}/{YearFilter}" }),
            ],
          }),
        },
      });
    }

    function createDashboardTab(section, idField, loadData) {
      const table = createOrdersTable(section, idField);
      const searchableFields = [idField, "Material", "Quantity", "Unit", "MonthFilter", "YearFilter"];

      const search = new SearchField({
        width: "18rem",
        placeholder: "Search orders",
        value: `{/${section}/search}`,
        liveChange: () => applyTableFilters(table, section, searchableFields),
        search: () => applyTableFilters(table, section, searchableFields),
      });

      return {
        table,
        content: new VBox({
          width: "100%",
          items: [
            new Toolbar({
              design: "Transparent",
              content: [
                search,
                createMonthSelect(section, loadData),
                createYearInput(section, loadData),
                new Button({
                  icon: "sap-icon://refresh",
                  text: "Refresh",
                  type: "Transparent",
                  press: loadData,
                }),
                new ToolbarSpacer(),
                new Text({
                  text: {
                    parts: [`/${section}/count`, `/${section}/updated`],
                    formatter: (count, updated) => `${count || 0} orders${updated ? ` - Updated ${formatDate(updated)}` : ""}`,
                  },
                }),
              ],
            }).addStyleClass("sfFilterToolbar"),
            table,
          ],
        }),
      };
    }

    function createLoginPage(app) {
      const userInput = new Input({
        value: "{/login/userid}",
        placeholder: "User ID",
        width: "100%",
      });
      const passwordInput = new Input({
        value: "{/login/password}",
        placeholder: "Password",
        type: "Password",
        width: "100%",
        submit: () => login(app),
      });

      return new Page("loginPage", {
        showHeader: false,
        content: [
          new VBox({
            alignItems: "Center",
            justifyContent: "Center",
            height: "100vh",
            items: [
              new VBox({
                width: "26rem",
                items: [
                  new Title({ text: "Shop Floor Portal", level: "H1" }),
                  new Text({ text: "Sign in with your SAP shop floor credentials." }).addStyleClass("sfLoginSubtext"),
                  new Label({ text: "User ID", labelFor: userInput }),
                  userInput,
                  new Label({ text: "Password", labelFor: passwordInput }).addStyleClass("sfFieldLabel"),
                  passwordInput,
                  new Button({
                    text: "Sign In",
                    icon: "sap-icon://log",
                    type: "Emphasized",
                    width: "100%",
                    press: () => login(app),
                  }).addStyleClass("sfLoginButton"),
                ],
              }).addStyleClass("sfLoginPanel"),
            ],
          }).addStyleClass("sfLoginShell"),
        ],
      });
    }

    function createDashboardPage(app) {
      let plannedTab;
      let productionTab;

      async function loadSection(section) {
        busyDialog.open();

        try {
          const payload = await request(`/${section}${buildQuery(section)}`);
          model.setProperty(`/${section}/rows`, payload.results || []);
          model.setProperty(`/${section}/count`, payload.count || 0);
          model.setProperty(`/${section}/updated`, payload.updated || "");
        } catch (error) {
          MessageBox.error(error.message);
        } finally {
          busyDialog.close();
        }
      }

      plannedTab = createDashboardTab("planned", "PlannedOrder", () => loadSection("planned"));
      productionTab = createDashboardTab("production", "ProductionOrder", () => loadSection("production"));

      const tabs = new IconTabBar({
        expandable: false,
        items: [
          new IconTabFilter({
            key: "planned",
            text: "Planned",
            icon: "sap-icon://order-status",
            content: [plannedTab.content],
          }),
          new IconTabFilter({
            key: "production",
            text: "Production",
            icon: "sap-icon://factory",
            content: [productionTab.content],
          }),
        ],
        select: (event) => loadSection(event.getParameter("key")),
      }).addStyleClass("sapUiResponsiveContentPadding");

      const page = new Page("dashboardPage", {
        title: "Shop Floor Portal",
        customHeader: new Toolbar({
          content: [
            new Title({ text: "Shop Floor Portal", level: "H2" }),
            new ToolbarSpacer(),
            new Text({ text: "{/userId}" }).addStyleClass("sfUserId"),
            new Button({
              icon: "sap-icon://log",
              text: "Sign Out",
              type: "Transparent",
              press: () => {
                localStorage.removeItem(STORAGE_KEY);
                model.setProperty("/userId", "");
                model.setProperty("/login/password", "");
                app.to("loginPage");
              },
            }),
          ],
        }),
        content: [tabs],
      });

      page.addEventDelegate({
        onBeforeShow: () => {
          loadSection("planned");
          loadSection("production");
        },
      });

      return page;
    }

    async function login(app) {
      const userid = (model.getProperty("/login/userid") || "").trim();
      const password = model.getProperty("/login/password") || "";

      if (!userid || !password) {
        MessageBox.warning("Enter both user ID and password.");
        return;
      }

      busyDialog.open();

      try {
        const payload = await request("/login", {
          method: "POST",
          body: JSON.stringify({ userid, password }),
        });
        const result = payload.results && payload.results[0];

        if (!result || result.Status !== "SUCCESS") {
          throw new Error((result && result.Message) || "Login failed.");
        }

        localStorage.setItem(STORAGE_KEY, result.Userid || userid);
        model.setProperty("/userId", result.Userid || userid);
        model.setProperty("/login/password", "");
        MessageToast.show(result.Message || "Login successful");
        app.to("dashboardPage");
      } catch (error) {
        MessageBox.error(error.message);
      } finally {
        busyDialog.close();
      }
    }

    const app = new App("sfPortalApp");
    app.setModel(model);
    app.addPage(createLoginPage(app));
    app.addPage(createDashboardPage(app));
    app.placeAt("content");
    app.to(model.getProperty("/userId") ? "dashboardPage" : "loginPage");
  }
);
