/* eslint-disable @typescript-eslint/naming-convention */
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
  // @ts-ignore
  const vscode = acquireVsCodeApi();

  // @ts-ignore
  let React = window.React;
  // @ts-ignore
  let ReactDOM = window.ReactDOM;
  const h = React.createElement;
  // @ts-ignore
  let cx = window.classNames;

  function PageGet(props) {
    const selectedKey = props.selectedKey;
    const eventRef = React.useRef(null);
    const eventUpdateRef = React.useRef(null);
    const [value, setValue] = React.useState(null);
    const [versionstamp, setVersionstamp] = React.useState(null);
    const [message, setMessage] = React.useState(null);

    React.useEffect(() => {
      eventUpdateRef.current = (event) => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
          case "setResult": {
            console.log("message", message);
            if (message.result === "OK") {
              setMessage("The item set successfully : " + new Date());
              vscode.postMessage({ type: "get", key: selectedKey });
            }
            break;
          }
        }
      };
      window.addEventListener("message", eventUpdateRef.current);

      return () => {
        window.removeEventListener("message", eventUpdateRef.current);
      };
    }, []);

    React.useEffect(() => {
      if (selectedKey) {
        vscode.postMessage({ type: "get", key: selectedKey });
      }
      eventRef.current = (event) => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
          case "getResult": {
            setValue(message.result.value);
            setVersionstamp(message.result.versionstamp);
            break;
          }
        }
      };
      window.addEventListener("message", eventRef.current);
    }, []);

    return h("div", {
      className: "get__wrapper",
    }, [
      h("div", {
        className: "label",
      }, "Key"),
      h("div", {
        className: "get__key",
      }, selectedKey),
      h("div", {
        className: "label",
      }, "Value"),
      h(
        "div",
        {
          className: "get__value__wrapper",
        },
        h("textarea", {
          className: "get__value",
          value,
          onChange: (e) => {
            setValue(e.target.value);
          },
        }),
      ),
      h("button", {
        className: "get__update",
        onClick: () => {
          vscode.postMessage({ type: "set", key: selectedKey, value });
        },
      }, "Update"),
      h("div", {
        className: "label",
      }, message),
      h("div", {
        className: "label",
      }, "VersionStamp"),
      h("div", {
        className: "get__versionstamp",
      }, versionstamp),
    ]);
  }

  function PageNew() {
    const eventRef = React.useRef(null);
    const [message, setMessage] = React.useState(null);

    React.useEffect(() => {
      eventRef.current = (event) => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
          case "setResult": {
            console.log("message", message);
            if (message.result === "OK") {
              setMessage("The item set successfully : " + new Date());
            }
            break;
          }
        }
      };
      window.addEventListener("message", eventRef.current);

      return () => {
        window.removeEventListener("message", eventRef.current);
      };
    }, []);

    return h("div", {
      className: "new__wrapper",
    }, [
      PageNewForm(),
      message && h("div", {
        className: "message",
      }, message),
    ]);
  }

  function PageNewForm(props) {
    const keyRef = React.useRef(null);
    const valueRef = React.useRef(null);

    return h("form", {
      className: "newform__wrapper",
      onSubmit: (e) => {
        e.preventDefault();
        const key = keyRef.current.value;
        const value = valueRef.current.value;
        vscode.postMessage({ type: "set", key, value });
      },
    }, [
      h("input", {
        className: "newform__key",
        name: "key",
        ref: keyRef,
        type: "text",
        placeholder: "Key",
      }),
      h("input", {
        className: "newform__value",
        ref: valueRef,
        type: "text",
        placeholder: "Value",
      }),
      h("button", {
        className: "newform__submit",
        type: "submit",
      }, "Set"),
    ]);
  }

  function PageListForm(props) {
    const searchKeyRef = React.useRef(null);

    return h("form", {
      className: "form__wrapper",
      onSubmit: (e) => {
        e.preventDefault();
        const searchKey = searchKeyRef.current.value;
        props.onSubmit(searchKey);
      },
    }, [
      h("input", {
        className: "form__query",
        ref: searchKeyRef,
        type: "text",
        placeholder: "Search",
      }),
      h("button", {
        className: "form__submit",
        type: "submit",
      }, props.isBusy ? "Searching..." : "Search"),
    ]);
  }

  function PageListResultItem(props) {
    const item = props.item;
    return h("div", {
      className: "result__item",
      onClick: () => {
        props.onChangeSelectedKey(item.key.join(","));
      },
    }, [
      h("div", {
        className: "result__item__key",
      }, item.key.join(",")),
      h("div", {
        className: "result__item__value",
      }, item.value),
    ]);
  }

  function PageListResult(props) {
    const items = props.items;
    return h(
      "div",
      {
        className: "result",
      },
      items.length === 0 && h("div", {
        className: "result__empty",
      }, "No items found"),
      items.map(
        (item) =>
          h(PageListResultItem, {
            item,
            onChangeSelectedKey: (key) => {
              props.onChangeSelectedKey(key);
            },
          }),
      ),
    );
  }

  function PageList(props) {
    const eventRef = React.useRef(null);
    const [items, setItems] = React.useState([]);
    const [isBusy, setIsBusy] = React.useState(false);

    React.useEffect(() => {
      eventRef.current = (event) => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
          case "listResult": {
            setItems(message.result);
            setIsBusy(false);
            break;
          }
        }
      };
      window.addEventListener("message", eventRef.current);

      // inital load
      vscode.postMessage({ type: "list", key: "" });
      setIsBusy(true);

      return () => {
        window.removeEventListener("message", eventRef.current);
      };
    }, []);

    React.useEffect(() => {
      vscode.postMessage({ type: "list", key: "" });
    }, [props.database]);

    return h("div", {
      className: "result__wrapper",
    }, [
      h(PageListForm, {
        onSubmit: (key) => {
          vscode.postMessage({ type: "list", key });
        },
        isBusy,
      }),
      PageListResult({
        items,
        onChangeSelectedKey: (key) => {
          props.onChangeSelectedKey(key);
        },
      }),
    ]);
  }

  function NavItem(props) {
    return h("button", {
      className: cx("nav__item", props.selected && "nav__item--selected"),
      onClick: props.onClick,
    }, props.children);
  }

  function Nav(props) {
    const { page } = props;
    return h("div", {
      className: "nav",
    }, [
      h(NavItem, {
        selected: page === "list",
        onClick: () => {
          props.onChangePage("list");
        },
      }, "List"),
      h(NavItem, {
        selected: page === "new",
        onClick: () => {
          props.onChangePage("new");
        },
      }, "New"),
    ]);
  }

  function Database(props) {
    const database = props.database;
    return h("div", {
      className: "database__wrapper",
    }, [
      h("svg", {
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        strokeWidth: 2,
        fill: "transparent",
        stroke: "#a074c4",
      }, [
        h("use", {
          href: "#icon-database",
        }),
      ]),

      h("div", {
        className: "database",
        onClick: () => {
          vscode.postMessage({ type: "changeDatabase", database });
        },
      }, database || "Default database"),
    ]);
  }

  function Page() {
    const [page, setPage] = React.useState("list");
    const [selectedKey, setSelectedKey] = React.useState(null);
    const [database, setDatabase] = React.useState(null);
    const eventRef = React.useRef(null);
    React.useEffect(() => {
      eventRef.current = (event) => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
          case "changeDatabaseResult": {
            setDatabase(message.database);
            break;
          }
        }
      };
      window.addEventListener("message", eventRef.current);

      return () => {
        window.removeEventListener("message", eventRef.current);
      };
    }, []);

    return h("div", {
      className: "page",
    }, [
      h(Nav, {
        page,
        onChangePage: (page) => {
          setPage(page);
        },
      }),
      page === "list" && h(PageList, {
        selectedKey,
        database,
        onChangeSelectedKey: (key) => {
          setSelectedKey(key);
          setPage("get");
        },
      }),
      page === "new" && h(PageNew, {}),
      page === "get" && h(PageGet, {
        selectedKey,
        onChangeSelectedKey: (key) => {
          setSelectedKey(key);
        },
      }),
      Database({
        database,
      }),
    ]);
  }

  ReactDOM.render(
    h(Page, {}),
    document.getElementById("app"),
  );
})();
