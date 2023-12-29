const { testInBrowser } = require("./resources/pw-utils");

testInBrowser("nav-spa", "Test SPA navs", {page: "home"});
testInBrowser("list-details", "Test detail params", {page: "home"});
