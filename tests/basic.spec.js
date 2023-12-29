const { testInBrowser } = require("./resources/pw-utils");

testInBrowser("observe", "View transitions are observable");
testInBrowser("classify", ".classify adds classes for the duration of the view transition");
testInBrowser("extend", ".extend without anything adds vt-new and vt-old classes");
testInBrowser("sort", "# should be substituted with element's ID");
testInBrowser("common-style", "Allow declaring common styles for transitions");